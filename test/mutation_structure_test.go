package test

import (
	"strings"
	"testing"

	"github.com/ProtPocket/services"
)

// All tests here hit real external APIs — skip with go test -short.

func TestFetchMutationStructuresEGFRT790M(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test: requires network")
	}

	mutation, err := services.ParseMutation("EGFR T790M")
	if err != nil {
		t.Fatalf("ParseMutation: %v", err)
	}

	result, err := services.FetchMutationStructures("P00533", mutation)
	if err != nil {
		t.Fatalf("FetchMutationStructures: %v", err)
	}

	t.Logf("Wildtype entry ID : %s", result.WildtypeEntryID)
	t.Logf("Wildtype PDB URL  : %s", result.WildtypePDBURL)
	t.Logf("Wildtype pLDDT    : %.2f", result.WildtypePLDDT)
	t.Logf("Mutant source     : %s", result.MutantSource)
	t.Logf("Mutant PDB URL    : %s", result.MutantPDBURL)
	t.Logf("Is approximation  : %v", result.MutantIsApprox)
	if result.MutantPDBID != "" {
		t.Logf("Mutant RCSB ID    : %s", result.MutantPDBID)
	}
	if result.ApproxReason != "" {
		t.Logf("Approx reason     : %s", result.ApproxReason)
	}

	// Wildtype must always be present
	if result.WildtypePDBURL == "" {
		t.Error("WildtypePDBURL is empty")
	}
	if result.WildtypeEntryID == "" {
		t.Error("WildtypeEntryID is empty")
	}
	if result.WildtypePLDDT <= 0 {
		t.Errorf("WildtypePLDDT = %.2f, want > 0", result.WildtypePLDDT)
	}

	// Mutant must have a URL regardless of source
	if result.MutantPDBURL == "" {
		t.Error("MutantPDBURL is empty — should be RCSB or wildtype approx")
	}
	if result.MutantSource == "" {
		t.Error("MutantSource must be set")
	}

	// If RCSB found something, the PDB ID must look like a valid 4-char code
	if result.MutantSource == "rcsb_experimental" {
		if len(result.MutantPDBID) != 4 {
			t.Errorf("MutantPDBID = %q, want a 4-char PDB ID", result.MutantPDBID)
		}
		if !strings.Contains(result.MutantPDBURL, result.MutantPDBID) {
			t.Errorf("MutantPDBURL %q does not contain PDB ID %q", result.MutantPDBURL, result.MutantPDBID)
		}
	}

	// If approximation, reason must be documented
	if result.MutantIsApprox && result.ApproxReason == "" {
		t.Error("MutantIsApprox is true but ApproxReason is empty")
	}
}

// TestFetchMutationStructuresKRASG12C verifies a second well-known cancer mutation.
func TestFetchMutationStructuresKRASG12C(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test: requires network")
	}

	mutation, err := services.ParseMutation("KRAS G12C")
	if err != nil {
		t.Fatalf("ParseMutation: %v", err)
	}

	// KRAS UniProt: P01116
	result, err := services.FetchMutationStructures("P01116", mutation)
	if err != nil {
		t.Fatalf("FetchMutationStructures: %v", err)
	}

	t.Logf("Wildtype entry ID : %s", result.WildtypeEntryID)
	t.Logf("Mutant source     : %s", result.MutantSource)
	t.Logf("Mutant PDB URL    : %s", result.MutantPDBURL)

	if result.WildtypePDBURL == "" {
		t.Error("WildtypePDBURL is empty")
	}
	if result.MutantPDBURL == "" {
		t.Error("MutantPDBURL is empty")
	}
}

// TestFetchMutationStructuresBadUniProt verifies a clean error for unknown UniProt IDs.
func TestFetchMutationStructuresBadUniProt(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test: requires network")
	}

	mutation, _ := services.ParseMutation("T790M")
	_, err := services.FetchMutationStructures("FAKEID999", mutation)
	if err == nil {
		t.Fatal("expected error for non-existent UniProt ID, got nil")
	}
	t.Logf("Error (expected): %v", err)
}
