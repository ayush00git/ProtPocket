package test

import (
	"testing"

	"github.com/ProtPocket/services"
)

// TestCompareMutationPocketsEGFRT790M is the canonical Step 5 integration test.
// Requires fpocket installed and network access — skip with -short.
func TestCompareMutationPocketsEGFRT790M(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test: requires fpocket + network")
	}

	mutation, err := services.ParseMutation("EGFR T790M")
	if err != nil {
		t.Fatalf("ParseMutation: %v", err)
	}

	structures, err := services.FetchMutationStructures("P00533", mutation)
	if err != nil {
		t.Fatalf("FetchMutationStructures: %v", err)
	}
	t.Logf("Wildtype : %s", structures.WildtypePDBURL)
	t.Logf("Mutant   : %s (source=%s)", structures.MutantPDBURL, structures.MutantSource)

	result, err := services.CompareMutationPockets(structures)
	if err != nil {
		t.Fatalf("CompareMutationPockets: %v", err)
	}

	wt := result.WildtypeTopPocket
	mut := result.MutantTopPocket
	d := result.Delta

	t.Logf("--- Wildtype top pocket (pocket %d) ---", wt.PocketID)
	t.Logf("  Druggability : %.4f", wt.DruggabilityScore)
	t.Logf("  Volume       : %.2f Å³", wt.Volume)
	t.Logf("  Surface area : %.2f Å²", wt.SurfaceArea)
	t.Logf("  Depth        : %.2f Å", wt.Depth)
	t.Logf("  Hydrophobic  : %.4f", wt.Hydrophobicity)
	t.Logf("  Polarity     : %.4f", wt.Polarity)

	t.Logf("--- Mutant top pocket (pocket %d) ---", mut.PocketID)
	t.Logf("  Druggability : %.4f", mut.DruggabilityScore)
	t.Logf("  Volume       : %.2f Å³", mut.Volume)
	t.Logf("  Surface area : %.2f Å²", mut.SurfaceArea)
	t.Logf("  Depth        : %.2f Å", mut.Depth)
	t.Logf("  Hydrophobic  : %.4f", mut.Hydrophobicity)
	t.Logf("  Polarity     : %.4f", mut.Polarity)

	t.Logf("--- Delta (mutant − wildtype) ---")
	t.Logf("  ΔDruggability : %.4f", d.DruggabilityScore)
	t.Logf("  ΔVolume       : %.2f Å³", d.Volume)
	t.Logf("  ΔSurface area : %.2f Å²", d.SurfaceArea)
	t.Logf("  ΔDepth        : %.2f Å", d.Depth)
	t.Logf("  ΔHydrophobic  : %.4f", d.Hydrophobicity)
	t.Logf("  ΔPolarity     : %.4f", d.Polarity)

	// Wildtype must have meaningful geometry
	if wt.DruggabilityScore <= 0 {
		t.Errorf("wildtype druggability score = %.4f, want > 0", wt.DruggabilityScore)
	}
	if wt.Volume <= 0 {
		t.Errorf("wildtype volume = %.2f, want > 0", wt.Volume)
	}

	// Mutant must also have geometry
	if mut.DruggabilityScore <= 0 {
		t.Errorf("mutant druggability score = %.4f, want > 0", mut.DruggabilityScore)
	}
	if mut.Volume <= 0 {
		t.Errorf("mutant volume = %.2f, want > 0", mut.Volume)
	}

	// When structures differ, delta should not be exactly all-zero
	if !result.IsApprox {
		allZero := d.DruggabilityScore == 0 && d.Volume == 0 && d.Hydrophobicity == 0
		if allZero {
			t.Log("WARNING: all deltas are 0 despite non-approximated mutant structure — unexpected")
		}
	}

	// Pocket lists must be non-empty
	if len(result.WildtypePockets) == 0 {
		t.Error("WildtypePockets list is empty")
	}
	if len(result.MutantPockets) == 0 {
		t.Error("MutantPockets list is empty")
	}
	t.Logf("Total pockets — wildtype: %d  mutant: %d",
		len(result.WildtypePockets), len(result.MutantPockets))
}
