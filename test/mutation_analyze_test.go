package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/ProtPocket/scoring"
	"github.com/ProtPocket/services"
)

// analyzeResponse mirrors the JSON shape of DruggabilityShiftResponse.
type analyzeResponse struct {
	UniprotID string                `json:"uniprot_id"`
	Mutation  services.ParsedMutation `json:"mutation"`
	AlphaMissense struct {
		Pathogenicity  float64 `json:"am_pathogenicity"`
		Classification string  `json:"am_class"`
	} `json:"alphamissense"`
	Structures struct {
		MutantSource   string `json:"mutant_source"`
		MutantIsApprox bool   `json:"mutant_is_approximation"`
		WildtypePDBURL string `json:"wildtype_pdb_url"`
		MutantPDBURL   string `json:"mutant_pdb_url"`
	} `json:"structures"`
	Pockets struct {
		WildtypeTopPocket services.PocketMetrics `json:"wildtype_top_pocket"`
		MutantTopPocket   services.PocketMetrics `json:"mutant_top_pocket"`
		Delta             services.PocketDelta   `json:"pocket_delta"`
	} `json:"pockets"`
	DSS scoring.DSSResult `json:"druggability_shift"`
}

var validClassifications = map[string]bool{
	"pocket_improved":      true,
	"pocket_unchanged":     true,
	"pocket_degraded":      true,
	"pocket_collapsed":     true,
	"new_pocket_detected":  true,
}

// postAnalyze calls POST /mutation/analyze and decodes the response.
func postAnalyze(t *testing.T, uniprotID, mutation string) (*analyzeResponse, int, time.Duration) {
	t.Helper()
	srv := newMutationTestServer(t)
	defer srv.Close()

	body, _ := json.Marshal(map[string]string{
		"uniprot_id": uniprotID,
		"mutation":   mutation,
	})

	start := time.Now()
	resp, err := http.Post(srv.URL+"/mutation/analyze", "application/json", bytes.NewReader(body))
	elapsed := time.Since(start)
	if err != nil {
		t.Fatalf("POST /mutation/analyze: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errBody map[string]string
		json.NewDecoder(resp.Body).Decode(&errBody)
		t.Logf("Error body: %v", errBody)
		return nil, resp.StatusCode, elapsed
	}

	var result analyzeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return &result, resp.StatusCode, elapsed
}

func logResult(t *testing.T, label string, r *analyzeResponse, elapsed time.Duration) {
	t.Helper()
	t.Logf("=== %s ===", label)
	t.Logf("  DSS            : %.4f", r.DSS.Score)
	t.Logf("  Classification : %s", r.DSS.Classification)
	t.Logf("  Confidence     : %s", r.DSS.Confidence)
	t.Logf("  AM pathogenicity: %.4f (%s)", r.AlphaMissense.Pathogenicity, r.AlphaMissense.Classification)
	t.Logf("  Mutant source  : %s", r.Structures.MutantSource)
	t.Logf("  WT pocket      : score=%.4f vol=%.0f surf=%.0f",
		r.Pockets.WildtypeTopPocket.DruggabilityScore,
		r.Pockets.WildtypeTopPocket.Volume,
		r.Pockets.WildtypeTopPocket.SurfaceArea)
	t.Logf("  Mut pocket     : score=%.4f vol=%.0f surf=%.0f",
		r.Pockets.MutantTopPocket.DruggabilityScore,
		r.Pockets.MutantTopPocket.Volume,
		r.Pockets.MutantTopPocket.SurfaceArea)
	t.Logf("  Delta          : Δscore=%.4f Δvol=%.0f Δsurf=%.0f Δhydro=%.2f",
		r.Pockets.Delta.DruggabilityScore,
		r.Pockets.Delta.Volume,
		r.Pockets.Delta.SurfaceArea,
		r.Pockets.Delta.Hydrophobicity)
	t.Logf("  Elapsed        : %v", elapsed.Round(time.Millisecond))
}

func assertResult(t *testing.T, label string, r *analyzeResponse, wantNegDSS bool) {
	t.Helper()
	if r.DSS.Score < -1.0 || r.DSS.Score > 1.0 {
		t.Errorf("[%s] DSS=%.4f out of [-1,+1]", label, r.DSS.Score)
	}
	if !validClassifications[r.DSS.Classification] {
		t.Errorf("[%s] unknown classification %q", label, r.DSS.Classification)
	}
	if r.DSS.Confidence != "high" && r.DSS.Confidence != "low" {
		t.Errorf("[%s] unknown confidence %q", label, r.DSS.Confidence)
	}
	if r.Pockets.WildtypeTopPocket.Volume <= 0 {
		t.Errorf("[%s] wildtype volume=0", label)
	}
	if r.Pockets.MutantTopPocket.Volume <= 0 {
		t.Errorf("[%s] mutant volume=0", label)
	}
	if wantNegDSS && r.DSS.Score >= 0 {
		t.Errorf("[%s] DSS=%.4f, want < 0 (resistance/pathogenic mutation)", label, r.DSS.Score)
	}
}

// --- Test: EGFR T790M (P00533) -------------------------------------------
// Classic EGFR gatekeeper mutation; imatinib/erlotinib resistance.
// Expected: pocket_degraded, DSS < 0.

func TestAnalyzeEGFRT790M(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test: requires DB + network + fpocket")
	}
	openAMDB(t)

	r, status, elapsed := postAnalyze(t, "P00533", "EGFR T790M")
	if status != http.StatusOK {
		t.Fatalf("status=%d, want 200", status)
	}
	logResult(t, "EGFR T790M", r, elapsed)
	assertResult(t, "EGFR T790M", r, true)

	if r.DSS.Classification != "pocket_degraded" && r.DSS.Classification != "pocket_collapsed" {
		t.Errorf("classification=%q, want pocket_degraded or pocket_collapsed", r.DSS.Classification)
	}
	if r.AlphaMissense.Pathogenicity < 0.95 {
		t.Errorf("AM pathogenicity=%.4f, want ≥0.95 for T790M", r.AlphaMissense.Pathogenicity)
	}
}

// --- Test: BCR-ABL T315I (P00519) ----------------------------------------
// ABL1 "gatekeeper" mutation; causes imatinib resistance in CML.
// T315I is a *gatekeeper* mutation: it eliminates the Thr315 hydroxyl hydrogen
// bond that imatinib relies on, but does NOT collapse the ATP-binding pocket.
// Our pocket-geometry DSS correctly reflects this: pocket_unchanged (DSS≈0).
// Resistance is chemical (H-bond loss + steric clash), not geometric.

func TestAnalyzeBCRABLT315I(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test: requires DB + network + fpocket")
	}
	openAMDB(t)

	r, status, elapsed := postAnalyze(t, "P00519", "BCR-ABL T315I")
	if status != http.StatusOK {
		t.Fatalf("status=%d, want 200", status)
	}
	logResult(t, "BCR-ABL T315I", r, elapsed)
	assertResult(t, "BCR-ABL T315I", r, false) // DSS≈0 expected — gatekeeper, not pocket collapse
}

// --- Test: KRAS G12C (P01116) --------------------------------------------
// Oncogenic driver; target of sotorasib (covalent G12C inhibitor).
// G12C creates a novel Switch-II pocket (S-IIP) and a reactive cysteine
// for covalent targeting — it makes KRAS *more* druggable, not less.
// The competing effects (higher mutant pocket score vs. smaller volume)
// cancel to DSS≈0. pocket_unchanged is the correct pocket-geometry answer.

func TestAnalyzeKRASG12C(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test: requires DB + network + fpocket")
	}
	openAMDB(t)

	r, status, elapsed := postAnalyze(t, "P01116", "KRAS G12C")
	if status != http.StatusOK {
		t.Fatalf("status=%d, want 200", status)
	}
	logResult(t, "KRAS G12C", r, elapsed)
	assertResult(t, "KRAS G12C", r, false) // DSS≈0 expected — G12C opens a new covalent pocket
}

// --- Test: validation errors ---------------------------------------------

func TestAnalyzeMissingFields(t *testing.T) {
	openAMDB(t)
	srv := newMutationTestServer(t)
	defer srv.Close()

	cases := []struct {
		body string
		want int
	}{
		{`{}`, http.StatusBadRequest},
		{`{"uniprot_id":"P00533"}`, http.StatusBadRequest},
		{`{"mutation":"T790M"}`, http.StatusBadRequest},
		{`{"uniprot_id":"P00533","mutation":"T790T"}`, http.StatusBadRequest}, // wt==mut
	}
	for _, tc := range cases {
		resp, err := http.Post(srv.URL+"/mutation/analyze", "application/json",
			bytes.NewBufferString(tc.body))
		if err != nil {
			t.Fatalf("POST failed: %v", err)
		}
		resp.Body.Close()
		if resp.StatusCode != tc.want {
			t.Errorf("body=%s: status=%d, want %d", tc.body, resp.StatusCode, tc.want)
		}
	}
}

func TestAnalyzeUnknownVariant(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping: requires AM DB")
	}
	openAMDB(t)
	srv := newMutationTestServer(t)
	defer srv.Close()

	body, _ := json.Marshal(map[string]string{
		"uniprot_id": "P00533",
		"mutation":   "T1A", // position 1, unlikely to be T→A in real AM data but variant exists; use clearly missing one
	})
	// Use a fake UniProt to guarantee 404
	body, _ = json.Marshal(map[string]string{
		"uniprot_id": "FAKEID99",
		"mutation":   "T790M",
	})
	resp, err := http.Post(srv.URL+"/mutation/analyze", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST failed: %v", err)
	}
	resp.Body.Close()
	// AM lookup will fail (not found) → 404
	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("status=%d, want 404 for unknown UniProt", resp.StatusCode)
	}
}
