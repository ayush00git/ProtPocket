package services

import (
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"
)

var chemblClient = &http.Client{Timeout: 10 * time.Second}

const (
	chemblBaseURL = "https://www.ebi.ac.uk/chembl/api/data"
	chemblOrigin  = "https://www.ebi.ac.uk"
	// Safety cap: mechanism pagination (limit 500 per page).
	maxMechanismPages = 40
	mechanismPageSize = 500
)

// chemblTargetRow is one element of /target/search.json "targets".
type chemblTargetRow struct {
	TargetChEMBLID   string `json:"target_chembl_id"`
	TargetComponents []struct {
		Accession string `json:"accession"`
	} `json:"target_components"`
}

// ChEMBLTargetSearchResponse matches /target/search.json response shape.
type ChEMBLTargetSearchResponse struct {
	Targets  []chemblTargetRow `json:"targets"`
	PageMeta struct {
		TotalCount int `json:"total_count"`
	} `json:"page_meta"`
}

// ChEMBLMechanismResponse matches /mechanism.json (paginated).
type ChEMBLMechanismResponse struct {
	Mechanisms []struct {
		MaxPhase               int    `json:"max_phase"`
		MoleculeChEMBLID       string `json:"molecule_chembl_id"`
		ParentMoleculeChEMBLID string `json:"parent_molecule_chembl_id"`
	} `json:"mechanisms"`
	PageMeta struct {
		TotalCount int    `json:"total_count"`
		Next       string `json:"next"`
	} `json:"page_meta"`
}

// chemblGET performs a GET and returns the response body (handling gzip if present).
func chemblGET(rawURL string) ([]byte, error) {
	resp, err := chemblClient.Get(rawURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("chembl HTTP %d", resp.StatusCode)
	}

	var reader io.Reader = resp.Body
	if resp.Header.Get("Content-Encoding") == "gzip" {
		gr, err := gzip.NewReader(resp.Body)
		if err != nil {
			return nil, err
		}
		defer gr.Close()
		reader = gr
	}

	return io.ReadAll(reader)
}

func chemblNextURL(next string) string {
	if next == "" {
		return ""
	}
	if strings.HasPrefix(next, "http://") || strings.HasPrefix(next, "https://") {
		return next
	}
	return chemblOrigin + next
}

// pickTargetChEMBLID returns the ChEMBL target id for this UniProt accession.
// Prefers a target whose protein component accession matches uniprotID exactly.
func pickTargetChEMBLID(targets []chemblTargetRow, uniprotID string) string {
	for _, t := range targets {
		for _, c := range t.TargetComponents {
			if c.Accession == uniprotID {
				return t.TargetChEMBLID
			}
		}
	}
	if len(targets) > 0 {
		return targets[0].TargetChEMBLID
	}
	return ""
}

// FetchDrugCoverage queries ChEMBL for approved drugs (max clinical phase 4) with a
// documented mechanism on this UniProt protein.
//
// drugCount = -1 means ChEMBL is unreachable (unknown coverage).
// drugCount = 0 means none found.
//
// Note: ChEMBL's drug_indication API does not filter by target; passing target_chembl_id
// there is ignored and total_count reflects the whole database (~59k). We use
// mechanism.json instead, which correctly scopes to the target.
func FetchDrugCoverage(uniprotID string) (int, []string, error) {
	targetURL := fmt.Sprintf("%s/target/search.json?q=%s", chemblBaseURL, uniprotID)
	body, err := chemblGET(targetURL)
	if err != nil {
		return -1, []string{}, nil
	}

	var targetResp ChEMBLTargetSearchResponse
	if err := json.Unmarshal(body, &targetResp); err != nil {
		return -1, []string{}, nil
	}

	if len(targetResp.Targets) == 0 {
		return 0, []string{}, nil
	}

	chemblTargetID := pickTargetChEMBLID(targetResp.Targets, uniprotID)
	if chemblTargetID == "" {
		return 0, []string{}, nil
	}

	// Approved drugs: documented mechanisms at clinical phase 4 for this target.
	apvdMolecules := make(map[string]struct{})
	pageURL := fmt.Sprintf("%s/mechanism.json?target_chembl_id=%s&max_phase=4&limit=%d",
		chemblBaseURL, chemblTargetID, mechanismPageSize)

	for page := 0; page < maxMechanismPages && pageURL != ""; page++ {
		b, err := chemblGET(pageURL)
		if err != nil {
			return -1, []string{}, nil
		}

		var mechResp ChEMBLMechanismResponse
		if err := json.Unmarshal(b, &mechResp); err != nil {
			return -1, []string{}, nil
		}

		for _, m := range mechResp.Mechanisms {
			if m.MaxPhase != 4 {
				continue
			}
			id := m.ParentMoleculeChEMBLID
			if id == "" {
				id = m.MoleculeChEMBLID
			}
			if id != "" {
				apvdMolecules[id] = struct{}{}
			}
		}

		pageURL = chemblNextURL(mechResp.PageMeta.Next)
	}

	ids := make([]string, 0, len(apvdMolecules))
	for id := range apvdMolecules {
		ids = append(ids, id)
	}
	sort.Strings(ids)

	drugNames := make([]string, 0, 5)
	for _, mid := range ids {
		if len(drugNames) >= 5 {
			break
		}
		name, err := fetchMoleculePrefName(mid)
		if err != nil || name == "" {
			continue
		}
		drugNames = append(drugNames, name)
	}

	return len(apvdMolecules), drugNames, nil
}

func fetchMoleculePrefName(moleculeChEMBLID string) (string, error) {
	url := fmt.Sprintf("%s/molecule/%s.json", chemblBaseURL, moleculeChEMBLID)
	body, err := chemblGET(url)
	if err != nil {
		return "", err
	}
	var mol struct {
		PrefName string `json:"pref_name"`
	}
	if err := json.Unmarshal(body, &mol); err != nil {
		return "", err
	}
	return mol.PrefName, nil
}
