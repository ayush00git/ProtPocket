package services

import "github.com/ProtPocket/scoring"

// DruggabilityShiftResponse is the full Step 6 output returned by the endpoint
// and passed to Step 7's /mutation/analyze.
type DruggabilityShiftResponse struct {
	UniprotID      string                    `json:"uniprot_id"`
	Mutation       *ParsedMutation           `json:"mutation"`
	AlphaMissense  *AlphaMissenseResult      `json:"alphamissense"`
	Structures     *MutationStructures       `json:"structures"`
	Pockets        *MutationPocketResult     `json:"pockets"`
	DSSResult      scoring.DSSResult         `json:"druggability_shift"`
}

// ComputeShiftScore assembles the DSSInput from the pipeline outputs and
// returns the complete DruggabilityShiftResponse.
func ComputeShiftScore(
	am *AlphaMissenseResult,
	structures *MutationStructures,
	pockets *MutationPocketResult,
) *DruggabilityShiftResponse {
	d := pockets.Delta
	input := scoring.DSSInput{
		DeltaDruggability:   d.DruggabilityScore,
		DeltaVolume:         d.Volume,
		DeltaSurfaceArea:    d.SurfaceArea,
		DeltaHydrophobicity: d.Hydrophobicity,
		AMPathogenicity:     am.Pathogenicity,
		IsApprox:            pockets.IsApprox,
		WildtypePocketCount: len(pockets.WildtypePockets),
		MutantPocketCount:   len(pockets.MutantPockets),
	}

	return &DruggabilityShiftResponse{
		UniprotID:     am.UniprotID,
		Mutation:      pockets.Mutation,
		AlphaMissense: am,
		Structures:    structures,
		Pockets:       pockets,
		DSSResult:     scoring.ComputeDruggabilityShiftScore(input),
	}
}
