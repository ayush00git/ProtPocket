package test

import (
	"errors"
	"os"
	"testing"
	"time"

	"github.com/ProtPocket/services"
)

const amTestDB = "../data/alphamissense.db"

func openAMDB(t *testing.T) {
	t.Helper()
	if _, err := os.Stat(amTestDB); os.IsNotExist(err) {
		t.Skip("alphamissense.db not found — run: go run ./cmd/alphamissense_import/ first")
	}
	if err := services.OpenAlphaMissenseDB(amTestDB); err != nil {
		t.Fatalf("OpenAlphaMissenseDB: %v", err)
	}
}

// TestAlphaMissenseEGFRT790M verifies the canonical drug-resistance mutation.
// Expected: P00533 T790M → 0.966 pathogenic
func TestAlphaMissenseEGFRT790M(t *testing.T) {
	openAMDB(t)

	start := time.Now()
	result, err := services.QueryAlphaMissense("P00533", "T790M")
	elapsed := time.Since(start)

	if err != nil {
		t.Fatalf("QueryAlphaMissense: %v", err)
	}

	t.Logf("Query latency: %v", elapsed)
	if elapsed > 100*time.Millisecond {
		t.Errorf("query took %v, want < 100ms", elapsed)
	}

	if result.UniprotID != "P00533" {
		t.Errorf("UniprotID = %q, want P00533", result.UniprotID)
	}
	if result.Variant != "T790M" {
		t.Errorf("Variant = %q, want T790M", result.Variant)
	}
	// TSV shows 0.966
	if result.Pathogenicity < 0.96 || result.Pathogenicity > 0.97 {
		t.Errorf("Pathogenicity = %.4f, want ~0.966", result.Pathogenicity)
	}
	if result.Classification != "pathogenic" {
		t.Errorf("Classification = %q, want pathogenic", result.Classification)
	}
}

// TestAlphaMissenseNotFound confirms a graceful error for unknown variants.
func TestAlphaMissenseNotFound(t *testing.T) {
	openAMDB(t)

	_, err := services.QueryAlphaMissense("FAKEID", "X999Z")
	if err == nil {
		t.Fatal("expected error for non-existent variant, got nil")
	}
	if !errors.Is(err, services.ErrVariantNotFound) {
		t.Errorf("expected ErrVariantNotFound, got: %v", err)
	}
}
