package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"

	"github.com/ProtPocket/models"
)

const (
	zinc15SubsetBase = "https://zinc15.docking.org/substances/subsets/drug-like.json"
	zincFetchTimeout = 30 * time.Second
	zincRequestCount = 20
	minResults       = 3
)

var (
	zincHTTPClient = &http.Client{Timeout: zincFetchTimeout}

	zincPocketCacheMu sync.RWMutex
	zincPocketCache   = map[int][]models.Fragment{} // keyed by PocketID

	zincFallbackMu      sync.Mutex
	zincFallbackEntries []models.Fragment // union of fragments from successful ZINC responses (deduplicated)
)

type zincAPIResponse struct {
	Results []struct {
		SMILES string  `json:"smiles"`
		MW     float64 `json:"mw"`
		LogP   float64 `json:"logp"`
		ZincID string  `json:"zinc_id"`
		Name   string  `json:"name"`
	} `json:"results"`
}

// pocketParamRanges returns MW and LogP query ranges derived from pocket geometry and fpocket scores.
func pocketParamRanges(p models.Pocket) (mwtGte, mwtLte, logpGte, logpLte float64) {
	v := p.Volume
	switch {
	case v < 300:
		mwtGte, mwtLte = 150, 300
	case v < 800:
		mwtGte, mwtLte = 250, 500
	default:
		mwtGte, mwtLte = 400, 700
	}
	if p.Hydrophobicity >= 0.5 {
		logpGte, logpLte = 2, 5
	} else {
		logpGte, logpLte = -1, 2
	}
	return mwtGte, mwtLte, logpGte, logpLte
}

// filterFragmentsByRanges returns entries whose MW and LogP fall inside the given ranges (inclusive).
func filterFragmentsByRanges(frags []models.Fragment, mwtGte, mwtLte, logpGte, logpLte float64) []models.Fragment {
	var out []models.Fragment
	for _, f := range frags {
		if f.MolWeight >= mwtGte && f.MolWeight <= mwtLte && f.LogP >= logpGte && f.LogP <= logpLte {
			out = append(out, f)
		}
	}
	return out
}

// appendUniqueByZincID appends fragments from add onto dst, deduplicating non-empty zinc_id values.
func appendUniqueByZincID(dst []models.Fragment, add []models.Fragment) []models.Fragment {
	seen := make(map[string]bool, len(dst)+len(add))
	for _, f := range dst {
		if f.ZincID != "" {
			seen[f.ZincID] = true
		}
	}
	for _, f := range add {
		if f.ZincID != "" && seen[f.ZincID] {
			continue
		}
		if f.ZincID != "" {
			seen[f.ZincID] = true
		}
		dst = append(dst, f)
	}
	return dst
}

// buildZINCURL constructs the ZINC15 drug-like subset request URL with filter query parameters.
func buildZINCURL(mwtGte, mwtLte, logpGte, logpLte float64) string {
	q := url.Values{}
	q.Set("mwt__gte", formatZINCFloat(mwtGte))
	q.Set("mwt__lte", formatZINCFloat(mwtLte))
	q.Set("logp__gte", formatZINCFloat(logpGte))
	q.Set("logp__lte", formatZINCFloat(logpLte))
	q.Set("count", strconv.Itoa(zincRequestCount))
	return zinc15SubsetBase + "?" + q.Encode()
}

// formatZINCFloat encodes a float for ZINC query parameters without trailing zeros.
func formatZINCFloat(f float64) string {
	return strconv.FormatFloat(f, 'f', -1, 64)
}

// rowsToFragments maps ZINC API rows into application Fragment models.
func rowsToFragments(rows []struct {
	SMILES string  `json:"smiles"`
	MW     float64 `json:"mw"`
	LogP   float64 `json:"logp"`
	ZincID string  `json:"zinc_id"`
	Name   string  `json:"name"`
}) []models.Fragment {
	out := make([]models.Fragment, 0, len(rows))
	for _, r := range rows {
		out = append(out, models.Fragment{
			ZincID:    r.ZincID,
			Name:      r.Name,
			SMILES:    r.SMILES,
			MolWeight: r.MW,
			LogP:      r.LogP,
		})
	}
	return out
}

// fetchZINC15 performs a GET request to the given ZINC15 URL and parses the results array.
func fetchZINC15(ctx context.Context, u string) ([]models.Fragment, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("fetchZINC15: %w", err)
	}
	resp, err := zincHTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetchZINC15: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("fetchZINC15: read body: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fetchZINC15: HTTP %d: %s", resp.StatusCode, string(body))
	}
	var parsed zincAPIResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("fetchZINC15: decode JSON: %w", err)
	}
	return rowsToFragments(parsed.Results), nil
}

// FetchFragments queries ZINC15 for drug-like molecules matching pocket-derived MW/LogP ranges,
// uses an in-memory cache per PocketID, and falls back to a shared fragment pool when the API
// returns fewer than three hits or fails.
func FetchFragments(pocket models.Pocket) ([]models.Fragment, error) {
	pid := pocket.PocketID

	zincPocketCacheMu.RLock()
	if cached, ok := zincPocketCache[pid]; ok {
		zincPocketCacheMu.RUnlock()
		return cached, nil
	}
	zincPocketCacheMu.RUnlock()

	mwtGte, mwtLte, logpGte, logpLte := pocketParamRanges(pocket)
	u := buildZINCURL(mwtGte, mwtLte, logpGte, logpLte)

	ctx, cancel := context.WithTimeout(context.Background(), zincFetchTimeout)
	defer cancel()

	frags, err := fetchZINC15(ctx, u)
	if err == nil && len(frags) > 0 {
		zincFallbackMu.Lock()
		zincFallbackEntries = appendUniqueByZincID(zincFallbackEntries, frags)
		zincFallbackMu.Unlock()
	}
	if err == nil && len(frags) >= minResults {
		zincPocketCacheMu.Lock()
		zincPocketCache[pid] = frags
		zincPocketCacheMu.Unlock()
		return frags, nil
	}

	zincFallbackMu.Lock()
	fallback := append([]models.Fragment(nil), zincFallbackEntries...)
	zincFallbackMu.Unlock()

	filtered := filterFragmentsByRanges(fallback, mwtGte, mwtLte, logpGte, logpLte)
	if len(filtered) > 0 {
		zincPocketCacheMu.Lock()
		zincPocketCache[pid] = filtered
		zincPocketCacheMu.Unlock()
		return filtered, nil
	}

	if err == nil && len(frags) > 0 {
		zincPocketCacheMu.Lock()
		zincPocketCache[pid] = frags
		zincPocketCacheMu.Unlock()
		return frags, nil
	}

	if err != nil {
		return nil, fmt.Errorf("FetchFragments: %w", err)
	}

	return nil, fmt.Errorf("FetchFragments: ZINC returned no usable results and fallback pool is empty")
}
