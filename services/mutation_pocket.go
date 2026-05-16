package services

import (
	"fmt"
	"math"
	"sync"

	"github.com/ProtPocket/models"
)

// PocketMetrics is a flat snapshot of the key geometry metrics for one pocket.
type PocketMetrics struct {
	PocketID          int     `json:"pocket_id"`
	DruggabilityScore float64 `json:"druggability_score"`
	Volume            float64 `json:"volume"`
	SurfaceArea       float64 `json:"surface_area"`
	Depth             float64 `json:"depth"`
	Hydrophobicity    float64 `json:"hydrophobicity"`
	Polarity          float64 `json:"polarity"`
}

// PocketDelta is mutant minus wildtype for every metric.
// Positive delta means the mutant pocket is larger/more hydrophobic/etc.
type PocketDelta struct {
	DruggabilityScore float64 `json:"druggability_score"`
	Volume            float64 `json:"volume"`
	SurfaceArea       float64 `json:"surface_area"`
	Depth             float64 `json:"depth"`
	Hydrophobicity    float64 `json:"hydrophobicity"`
	Polarity          float64 `json:"polarity"`
}

// MutationPocketResult is the output of CompareMutationPockets.
type MutationPocketResult struct {
	UniprotID    string          `json:"uniprot_id"`
	Mutation     *ParsedMutation `json:"mutation"`
	MutantSource string          `json:"mutant_source"`
	IsApprox     bool            `json:"is_approximation"`

	WildtypePockets []PocketMetrics `json:"wildtype_pockets"`
	MutantPockets   []PocketMetrics `json:"mutant_pockets"`

	// Top pocket from each structure (highest druggability score).
	WildtypeTopPocket PocketMetrics `json:"wildtype_top_pocket"`
	MutantTopPocket   PocketMetrics `json:"mutant_top_pocket"`

	// Delta = mutant top pocket − wildtype top pocket.
	Delta PocketDelta `json:"pocket_delta"`
}

// CompareMutationPockets runs fpocket concurrently on the wildtype and mutant
// structures from s, compares the top pocket from each, and returns all deltas.
func CompareMutationPockets(s *MutationStructures) (*MutationPocketResult, error) {
	var (
		wtPockets, mutPockets     []models.Pocket
		wtErr, mutErr             error
		wg                        sync.WaitGroup
	)

	wg.Add(2)
	go func() {
		defer wg.Done()
		wtPockets, wtErr = RunFpocket(s.WildtypePDBURL)
	}()
	go func() {
		defer wg.Done()
		mutPockets, mutErr = RunFpocket(s.MutantPDBURL)
	}()
	wg.Wait()

	if wtErr != nil {
		return nil, fmt.Errorf("fpocket wildtype: %w", wtErr)
	}
	if mutErr != nil {
		return nil, fmt.Errorf("fpocket mutant: %w", mutErr)
	}
	if len(wtPockets) == 0 {
		return nil, fmt.Errorf("fpocket: no pockets found in wildtype structure %s", s.WildtypePDBURL)
	}
	if len(mutPockets) == 0 {
		return nil, fmt.Errorf("fpocket: no pockets found in mutant structure %s", s.MutantPDBURL)
	}

	// RunFpocket returns pockets sorted by score descending — pocket[0] is top.
	wtTop := toPocketMetrics(wtPockets[0])
	mutTop := toPocketMetrics(mutPockets[0])

	result := &MutationPocketResult{
		UniprotID:    s.UniprotID,
		Mutation:     s.Mutation,
		MutantSource: s.MutantSource,
		IsApprox:     s.MutantIsApprox,

		WildtypePockets:   toPocketMetricsList(wtPockets),
		MutantPockets:     toPocketMetricsList(mutPockets),
		WildtypeTopPocket: wtTop,
		MutantTopPocket:   mutTop,
		Delta:             computeDelta(wtTop, mutTop),
	}
	return result, nil
}

// toPocketMetrics converts a models.Pocket into the flat PocketMetrics shape.
func toPocketMetrics(p models.Pocket) PocketMetrics {
	return PocketMetrics{
		PocketID:          p.PocketID,
		DruggabilityScore: round4(p.Score),
		Volume:            round4(p.Volume),
		SurfaceArea:       round4(p.SurfaceArea),
		Depth:             round4(p.Depth),
		Hydrophobicity:    round4(p.Hydrophobicity),
		Polarity:          round4(p.Polarity),
	}
}

func toPocketMetricsList(pockets []models.Pocket) []PocketMetrics {
	out := make([]PocketMetrics, len(pockets))
	for i, p := range pockets {
		out[i] = toPocketMetrics(p)
	}
	return out
}

// computeDelta returns mutant − wildtype for every metric.
func computeDelta(wt, mut PocketMetrics) PocketDelta {
	return PocketDelta{
		DruggabilityScore: round4(mut.DruggabilityScore - wt.DruggabilityScore),
		Volume:            round4(mut.Volume - wt.Volume),
		SurfaceArea:       round4(mut.SurfaceArea - wt.SurfaceArea),
		Depth:             round4(mut.Depth - wt.Depth),
		Hydrophobicity:    round4(mut.Hydrophobicity - wt.Hydrophobicity),
		Polarity:          round4(mut.Polarity - wt.Polarity),
	}
}

func round4(v float64) float64 {
	return math.Round(v*10000) / 10000
}
