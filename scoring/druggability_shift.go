package scoring

import "math"

// DSSWeights are the per-metric weights used in the geometry component.
// They sum to 1.0. Druggability score is weighted highest as it is fpocket's
// own composite metric; volume second because pocket size is the strongest
// single predictor of druggability.
const (
	weightDruggability  = 0.50
	weightVolume        = 0.25
	weightSurface       = 0.15
	weightHydrophobicity = 0.10

	// Reference scales used to normalise raw deltas to [-1, +1].
	scaleVolume        = 1000.0 // Å³
	scaleSurface       = 500.0  // Å²
	scaleHydrophobicity = 20.0  // fpocket units

	// AM weight range: [0.7, 1.3]
	// am_weight = amWeightBase + amWeightRange × am_pathogenicity
	amWeightBase  = 0.7
	amWeightRange = 0.6

	// DSS classification thresholds
	thresholdImproved  =  0.15
	thresholdUnchanged = -0.15
	thresholdDegraded  = -0.50

	// New-pocket detection: mutant must have 20% more pockets than wildtype.
	newPocketRatio = 1.20
)

// DSSInput bundles the values required to compute the Druggability Shift Score.
type DSSInput struct {
	// Pocket geometry deltas (mutant − wildtype, from CompareMutationPockets).
	DeltaDruggability  float64
	DeltaVolume        float64
	DeltaSurfaceArea   float64
	DeltaHydrophobicity float64

	// AlphaMissense pathogenicity score [0, 1].
	AMPathogenicity float64

	// IsApprox is true when no real mutant structure was found and the
	// wildtype AlphaFold structure was used as a backbone approximation.
	// In that case geometry deltas are all zero and the score falls back
	// to being AM-only.
	IsApprox bool

	// Pocket counts — used only for "new_pocket_detected" classification.
	WildtypePocketCount int
	MutantPocketCount   int
}

// DSSBreakdown exposes every intermediate value so the caller can render a
// per-metric explanation to the user.
type DSSBreakdown struct {
	NormDruggabilityDelta   float64 `json:"norm_druggability_delta"`
	NormVolumeDelta         float64 `json:"norm_volume_delta"`
	NormSurfaceAreaDelta    float64 `json:"norm_surface_area_delta"`
	NormHydrophobicityDelta float64 `json:"norm_hydrophobicity_delta"`
	GeometryScore           float64 `json:"geometry_score"`
	AMWeight                float64 `json:"am_weight"`
	IsApproximation         bool    `json:"is_approximation"`
}

// DSSResult is the complete output of ComputeDruggabilityShiftScore.
type DSSResult struct {
	// Score is the Druggability Shift Score in [-1, +1].
	// Positive  → mutation improved pocket druggability.
	// Negative  → mutation degraded pocket druggability.
	Score          float64     `json:"score"`
	Classification string      `json:"classification"`
	Confidence     string      `json:"confidence"` // "high" | "low"
	Breakdown      DSSBreakdown `json:"breakdown"`
}

// ComputeDruggabilityShiftScore calculates the DSS from pocket deltas and the
// AlphaMissense pathogenicity score.
//
// Formula (non-approximation):
//
//	geometry = 0.50×ΔD_norm + 0.25×ΔV_norm + 0.15×ΔS_norm + 0.10×ΔH_norm
//	am_weight = 0.7 + 0.6 × am_pathogenicity
//	DSS = clamp(geometry × am_weight, -1, +1)
//
// Formula (approximation — no real mutant structure):
//
//	DSS = clamp(0.5 − am_pathogenicity, −0.5, +0.5)
func ComputeDruggabilityShiftScore(in DSSInput) DSSResult {
	var score float64
	var bd DSSBreakdown
	bd.IsApproximation = in.IsApprox

	if in.IsApprox {
		// No real structure — AM-only path, confidence capped at ±0.5.
		score = clamp(0.5-in.AMPathogenicity, -0.5, +0.5)
		bd.AMWeight = 1.0 // not applicable, set for transparency
	} else {
		bd.NormDruggabilityDelta = clamp(in.DeltaDruggability, -1, +1)
		bd.NormVolumeDelta = clamp(in.DeltaVolume/scaleVolume, -1, +1)
		bd.NormSurfaceAreaDelta = clamp(in.DeltaSurfaceArea/scaleSurface, -1, +1)
		bd.NormHydrophobicityDelta = clamp(in.DeltaHydrophobicity/scaleHydrophobicity, -1, +1)

		bd.GeometryScore = round4(
			weightDruggability*bd.NormDruggabilityDelta +
				weightVolume*bd.NormVolumeDelta +
				weightSurface*bd.NormSurfaceAreaDelta +
				weightHydrophobicity*bd.NormHydrophobicityDelta,
		)

		bd.AMWeight = round4(amWeightBase + amWeightRange*in.AMPathogenicity)
		score = clamp(bd.GeometryScore*bd.AMWeight, -1, +1)
	}

	score = round4(score)
	confidence := "high"
	if in.IsApprox {
		confidence = "low"
	}

	return DSSResult{
		Score:          score,
		Classification: classify(score, in.WildtypePocketCount, in.MutantPocketCount),
		Confidence:     confidence,
		Breakdown:      bd,
	}
}

// classify maps a DSS to a human-readable classification label.
func classify(score float64, wtCount, mutCount int) string {
	switch {
	case score >= thresholdImproved:
		// Detect truly new pocket: mutant has meaningfully more pockets.
		if mutCount > 0 && wtCount > 0 &&
			float64(mutCount) > float64(wtCount)*newPocketRatio {
			return "new_pocket_detected"
		}
		return "pocket_improved"
	case score >= thresholdUnchanged:
		return "pocket_unchanged"
	case score >= thresholdDegraded:
		return "pocket_degraded"
	default:
		return "pocket_collapsed"
	}
}

func clamp(v, lo, hi float64) float64 {
	return math.Min(math.Max(v, lo), hi)
}

func round4(v float64) float64 {
	return math.Round(v*10000) / 10000
}
