package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/ProtPocket/services"
)

// All tests here require alphamissense.db — they skip automatically if absent.

// TestAlphaMissenseEndpointEGFRT790M is the canonical integration test for Step 3.
func TestAlphaMissenseEndpointEGFRT790M(t *testing.T) {
	openAMDB(t) // skips if DB absent

	srv := newMutationTestServer(t)
	defer srv.Close()

	body, _ := json.Marshal(map[string]string{
		"uniprot_id":      "P00533",
		"protein_variant": "T790M",
	})
	resp, err := http.Post(srv.URL+"/mutation/alphamisense", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST /mutation/alphamisense: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}

	var got services.AlphaMissenseResult
	if err := json.NewDecoder(resp.Body).Decode(&got); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	t.Logf("Result: uniprot=%s variant=%s pathogenicity=%.4f class=%s",
		got.UniprotID, got.Variant, got.Pathogenicity, got.Classification)

	if got.UniprotID != "P00533" {
		t.Errorf("UniprotID = %q, want P00533", got.UniprotID)
	}
	if got.Variant != "T790M" {
		t.Errorf("Variant = %q, want T790M", got.Variant)
	}
	if got.Pathogenicity < 0.96 || got.Pathogenicity > 0.97 {
		t.Errorf("Pathogenicity = %.4f, want ~0.966", got.Pathogenicity)
	}
	if got.Classification != "pathogenic" {
		t.Errorf("Classification = %q, want pathogenic", got.Classification)
	}
}

// TestAlphaMissenseEndpointNotFound confirms 404 for unknown variant.
func TestAlphaMissenseEndpointNotFound(t *testing.T) {
	openAMDB(t)

	srv := newMutationTestServer(t)
	defer srv.Close()

	body, _ := json.Marshal(map[string]string{
		"uniprot_id":      "FAKEID",
		"protein_variant": "X999Z",
	})
	resp, err := http.Post(srv.URL+"/mutation/alphamisense", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST /mutation/alphamisense: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("status = %d, want 404", resp.StatusCode)
	}
}

// TestAlphaMissenseEndpointMissingFields confirms 400 when fields are absent.
func TestAlphaMissenseEndpointMissingFields(t *testing.T) {
	openAMDB(t)

	srv := newMutationTestServer(t)
	defer srv.Close()

	body := []byte(`{"uniprot_id": "P00533"}`) // missing protein_variant
	resp, err := http.Post(srv.URL+"/mutation/alphamisense", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST /mutation/alphamisense: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", resp.StatusCode)
	}
}
