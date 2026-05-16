package test

import (
	"math"
	"testing"

	"github.com/ProtPocket/scoring"
	"github.com/ProtPocket/services"
)

// --- Unit tests: formula correctness (no network, no fpocket) ------------

func TestDSSFormulaEGFRT790MExpected(t *testing.T) {
	// Values from Step 5 real run:
	//   ΔDrugg=-0.057, ΔVol=-1252.80, ΔSurf=-521.88, ΔHydro=+7.70
	//   AM pathogenicity=0.966, not approx
	result := scoring.ComputeDruggabilityShiftScore(scoring.DSSInput{
		DeltaDruggability:   -0.057,
		DeltaVolume:         -1252.80,
		DeltaSurfaceArea:    -521.88,
		DeltaHydrophobicity: 7.70,
		AMPathogenicity:     0.966,
		IsApprox:            false,
		WildtypePocketCount: 94,
		MutantPocketCount:   23,
	})

	t.Logf("DSS            : %.4f", result.Score)
	t.Logf("Classification : %s", result.Classification)
	t.Logf("Confidence     : %s", result.Confidence)
	t.Logf("GeometryScore  : %.4f", result.Breakdown.GeometryScore)
	t.Logf("AMWeight       : %.4f", result.Breakdown.AMWeight)
	t.Logf("NormDrugg      : %.4f", result.Breakdown.NormDruggabilityDelta)
	t.Logf("NormVol        : %.4f", result.Breakdown.NormVolumeDelta)
	t.Logf("NormSurf       : %.4f", result.Breakdown.NormSurfaceAreaDelta)
	t.Logf("NormHydro      : %.4f", result.Breakdown.NormHydrophobicityDelta)

	// geometry = 0.50×(-0.057) + 0.25×(-1.0) + 0.15×(-1.0) + 0.10×(0.385) ≈ -0.39
	if math.Abs(result.Breakdown.GeometryScore - (-0.39)) > 0.01 {
		t.Errorf("GeometryScore = %.4f, want ≈ -0.39", result.Breakdown.GeometryScore)
	}
	// am_weight = 0.7 + 0.6×0.966 = 1.28
	if math.Abs(result.Breakdown.AMWeight-1.28) > 0.01 {
		t.Errorf("AMWeight = %.4f, want ≈ 1.28", result.Breakdown.AMWeight)
	}
	// DSS ≈ -0.39 × 1.28 = -0.499
	if result.Score > -0.45 || result.Score < -0.55 {
		t.Errorf("Score = %.4f, want ≈ -0.499", result.Score)
	}
	if result.Classification != "pocket_degraded" {
		t.Errorf("Classification = %q, want pocket_degraded", result.Classification)
	}
	if result.Confidence != "high" {
		t.Errorf("Confidence = %q, want high", result.Confidence)
	}
}

func TestDSSFormulaApproximation(t *testing.T) {
	// When no mutant structure: DSS = clamp(0.5 - am, -0.5, +0.5)
	// am=0.966 → 0.5-0.966 = -0.466 → "pocket_degraded", confidence=low
	result := scoring.ComputeDruggabilityShiftScore(scoring.DSSInput{
		AMPathogenicity:     0.966,
		IsApprox:            true,
		WildtypePocketCount: 10,
		MutantPocketCount:   10,
	})

	t.Logf("DSS (approx) = %.4f  classification=%s  confidence=%s",
		result.Score, result.Classification, result.Confidence)

	want := -0.466
	if math.Abs(result.Score-want) > 0.01 {
		t.Errorf("Score = %.4f, want ≈ %.4f", result.Score, want)
	}
	if result.Classification != "pocket_degraded" {
		t.Errorf("Classification = %q, want pocket_degraded", result.Classification)
	}
	if result.Confidence != "low" {
		t.Errorf("Confidence = %q, want low", result.Confidence)
	}
	if result.Breakdown.IsApproximation != true {
		t.Error("IsApproximation should be true")
	}
}

func TestDSSFormulaBenignMutation(t *testing.T) {
	// Benign mutation: small deltas, low AM pathogenicity → pocket_unchanged
	result := scoring.ComputeDruggabilityShiftScore(scoring.DSSInput{
		DeltaDruggability:   0.01,
		DeltaVolume:         50,
		DeltaSurfaceArea:    20,
		DeltaHydrophobicity: 0.5,
		AMPathogenicity:     0.08,
		IsApprox:            false,
		WildtypePocketCount: 10,
		MutantPocketCount:   10,
	})
	t.Logf("Benign DSS = %.4f  %s", result.Score, result.Classification)
	if result.Score < -0.15 || result.Score > 0.15 {
		t.Errorf("Score = %.4f, want in (-0.15, +0.15) for benign mutation", result.Score)
	}
	if result.Classification != "pocket_unchanged" {
		t.Errorf("Classification = %q, want pocket_unchanged", result.Classification)
	}
}

func TestDSSFormulaNewPocketDetected(t *testing.T) {
	// GOF mutation with more pockets + positive score → new_pocket_detected
	result := scoring.ComputeDruggabilityShiftScore(scoring.DSSInput{
		DeltaDruggability:   0.20,
		DeltaVolume:         400,
		DeltaSurfaceArea:    200,
		DeltaHydrophobicity: -5, // less hydrophobic (more polar/better)
		AMPathogenicity:     0.85,
		IsApprox:            false,
		WildtypePocketCount: 5,
		MutantPocketCount:   8, // >1.2× more pockets
	})
	t.Logf("New pocket DSS = %.4f  %s", result.Score, result.Classification)
	if result.Classification != "new_pocket_detected" {
		t.Errorf("Classification = %q, want new_pocket_detected", result.Classification)
	}
}

func TestDSSFormulaCollapsed(t *testing.T) {
	// Severe mutation: pocket completely gone
	result := scoring.ComputeDruggabilityShiftScore(scoring.DSSInput{
		DeltaDruggability:   -0.80,
		DeltaVolume:         -3000,
		DeltaSurfaceArea:    -1500,
		DeltaHydrophobicity: 0,
		AMPathogenicity:     1.0,
		IsApprox:            false,
		WildtypePocketCount: 10,
		MutantPocketCount:   1,
	})
	t.Logf("Collapsed DSS = %.4f  %s", result.Score, result.Classification)
	if result.Score > -0.50 {
		t.Errorf("Score = %.4f, want < -0.50 for pocket_collapsed", result.Score)
	}
	if result.Classification != "pocket_collapsed" {
		t.Errorf("Classification = %q, want pocket_collapsed", result.Classification)
	}
}

func TestDSSScoreAlwaysInRange(t *testing.T) {
	// DSS must always be in [-1, +1] regardless of extreme inputs.
	extremes := []scoring.DSSInput{
		{DeltaDruggability: 1.0, DeltaVolume: 100000, DeltaSurfaceArea: 50000, DeltaHydrophobicity: 500, AMPathogenicity: 1.0},
		{DeltaDruggability: -1.0, DeltaVolume: -100000, DeltaSurfaceArea: -50000, DeltaHydrophobicity: -500, AMPathogenicity: 0.0},
		{AMPathogenicity: 1.0, IsApprox: true},
		{AMPathogenicity: 0.0, IsApprox: true},
	}
	for _, in := range extremes {
		r := scoring.ComputeDruggabilityShiftScore(in)
		if r.Score < -1.0 || r.Score > 1.0 {
			t.Errorf("Score = %.4f out of [-1, +1] for input %+v", r.Score, in)
		}
	}
}

// --- Integration test: real pipeline DSS for EGFR T790M ------------------

func TestFullPipelineDSSEGFRT790M(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test: requires DB + network + fpocket")
	}
	openAMDB(t)

	mutation, _ := services.ParseMutation("EGFR T790M")

	am, err := services.QueryAlphaMissense("P00533", "T790M")
	if err != nil {
		t.Fatalf("QueryAlphaMissense: %v", err)
	}

	structures, err := services.FetchMutationStructures("P00533", mutation)
	if err != nil {
		t.Fatalf("FetchMutationStructures: %v", err)
	}

	pockets, err := services.CompareMutationPockets(structures)
	if err != nil {
		t.Fatalf("CompareMutationPockets: %v", err)
	}

	resp := services.ComputeShiftScore(am, structures, pockets)

	t.Logf("=== Druggability Shift Score — EGFR T790M ===")
	t.Logf("DSS            : %.4f", resp.DSSResult.Score)
	t.Logf("Classification : %s", resp.DSSResult.Classification)
	t.Logf("Confidence     : %s", resp.DSSResult.Confidence)
	t.Logf("AM pathogenicity: %.4f (%s)", am.Pathogenicity, am.Classification)
	t.Logf("GeometryScore  : %.4f", resp.DSSResult.Breakdown.GeometryScore)
	t.Logf("AMWeight       : %.4f", resp.DSSResult.Breakdown.AMWeight)
	t.Logf("Mutant source  : %s", structures.MutantSource)

	if resp.DSSResult.Score >= 0 {
		t.Errorf("DSS = %.4f for EGFR T790M (resistance mutation), want < 0", resp.DSSResult.Score)
	}
	if resp.DSSResult.Classification != "pocket_degraded" && resp.DSSResult.Classification != "pocket_collapsed" {
		t.Errorf("Classification = %q, want pocket_degraded or pocket_collapsed", resp.DSSResult.Classification)
	}
	if resp.UniprotID != "P00533" {
		t.Errorf("UniprotID = %q, want P00533", resp.UniprotID)
	}
}
