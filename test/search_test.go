// Package test contains integration and regression tests for the search pipeline.
// Unit tests run always. Integration tests hit real external APIs and are skipped
// under `go test -short`.
package test

import (
	"bufio"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/ProtPocket/data"
	"github.com/ProtPocket/models"
	"github.com/ProtPocket/routes"
	"github.com/ProtPocket/services"
)

// --- Unit tests (no network) -------------------------------------------

func TestHeroSearchByGeneName(t *testing.T) {
	heroes := []models.Complex{
		{UniprotID: "P04637", GeneName: "TP53", ProteinName: "Cellular tumor antigen p53"},
	}
	got := data.FindHeroByGeneOrProtein("TP53", heroes)
	if len(got) == 0 {
		t.Fatal("expected match on GeneName=TP53, got none")
	}
}

func TestHeroSearchByProteinName(t *testing.T) {
	heroes := []models.Complex{
		{UniprotID: "P04637", GeneName: "TP53", ProteinName: "Cellular tumor antigen p53"},
	}
	got := data.FindHeroByGeneOrProtein("tumor antigen", heroes)
	if len(got) == 0 {
		t.Fatal("expected match on ProteinName substring, got none")
	}
}

func TestHeroSearchByDiseaseAssoc(t *testing.T) {
	heroes := []models.Complex{
		{UniprotID: "P04637", GeneName: "TP53", DiseaseAssoc: []string{"Li-Fraumeni syndrome", "Lung cancer"}},
	}
	got := data.FindHeroByGeneOrProtein("cancer", heroes)
	if len(got) == 0 {
		t.Fatal("expected match on DiseaseAssoc containing 'cancer', got none")
	}
}

func TestHeroSearchByCategory(t *testing.T) {
	heroes := []models.Complex{
		{UniprotID: "P9WIU3", GeneName: "FtsZ", Category: "who_pathogen"},
	}
	got := data.FindHeroByGeneOrProtein("who_pathogen", heroes)
	if len(got) == 0 {
		t.Fatal("expected match on Category=who_pathogen, got none")
	}
}

func TestHeroSearchCaseInsensitive(t *testing.T) {
	heroes := []models.Complex{
		{UniprotID: "P04637", GeneName: "TP53", ProteinName: "Cellular tumor antigen p53"},
	}
	for _, q := range []string{"tp53", "TP53", "Tp53"} {
		if got := data.FindHeroByGeneOrProtein(q, heroes); len(got) == 0 {
			t.Fatalf("expected case-insensitive match for query %q, got none", q)
		}
	}
}

// --- Integration tests (hit real APIs) ---------------------------------

// sseCollect opens an SSE stream against serverURL/search?q=query,
// collects all "result" events, and returns them once "done" arrives.
func sseCollect(t *testing.T, serverURL, query string) []models.Complex {
	t.Helper()
	resp, err := http.Get(serverURL + "/search?q=" + url.QueryEscape(query))
	if err != nil {
		t.Fatalf("GET /search failed: %v", err)
	}
	defer resp.Body.Close()

	if ct := resp.Header.Get("Content-Type"); ct != "text/event-stream" {
		t.Fatalf("expected Content-Type text/event-stream, got %q", ct)
	}

	var results []models.Complex
	var eventType string
	scanner := bufio.NewScanner(resp.Body)

	for scanner.Scan() {
		line := scanner.Text()
		switch {
		case strings.HasPrefix(line, "event: "):
			eventType = strings.TrimPrefix(line, "event: ")
		case strings.HasPrefix(line, "data: "):
			payload := strings.TrimPrefix(line, "data: ")
			if eventType == "result" {
				var c models.Complex
				if err := json.Unmarshal([]byte(payload), &c); err == nil {
					results = append(results, c)
				}
			}
			if eventType == "done" || eventType == "error" {
				return results
			}
		}
	}
	return results
}

func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	routes.Register(r)
	return httptest.NewServer(r)
}

func TestSearchByGeneReturnsResults(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	srv := newTestServer(t)
	defer srv.Close()

	results := sseCollect(t, srv.URL, "TP53")
	if len(results) == 0 {
		t.Fatal("expected results for gene query 'TP53', got none")
	}
}

func TestSearchByDiseaseReturnsResults(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	srv := newTestServer(t)
	defer srv.Close()

	results := sseCollect(t, srv.URL, "cancer")
	if len(results) == 0 {
		t.Fatal("expected results for disease query 'cancer', got none")
	}
}

func TestSearchByProteinNameReturnsResults(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	srv := newTestServer(t)
	defer srv.Close()

	results := sseCollect(t, srv.URL, "tumor suppressor")
	if len(results) == 0 {
		t.Fatal("expected results for protein name query 'tumor suppressor', got none")
	}
}

func TestSearchOnlySwissProtResults(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	srv := newTestServer(t)
	defer srv.Close()

	results := sseCollect(t, srv.URL, "BRCA2")
	for _, r := range results {
		if r.ReviewStatus != "reviewed" {
			t.Errorf("got unreviewed (TrEMBL) entry %s in results — TrEMBL must be filtered out", r.UniprotID)
		}
	}
}

func TestUniProtQueryReturnsOnlySwissProt(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	ids, err := services.SearchUniProt("cancer", 10)
	if err != nil {
		t.Fatalf("SearchUniProt failed: %v", err)
	}
	if len(ids) == 0 {
		t.Fatal("expected UniProt IDs for 'cancer', got none")
	}
	// Spot-check: fetch one entry and verify it's Swiss-Prot
	entry, err := services.FetchUniProtEntry(ids[0])
	if err != nil {
		t.Fatalf("FetchUniProtEntry failed for %s: %v", ids[0], err)
	}
	if !strings.Contains(entry.EntryType, "Swiss-Prot") {
		t.Errorf("entry %s is not Swiss-Prot (entryType=%q) — reviewed:true filter is broken", ids[0], entry.EntryType)
	}
}
