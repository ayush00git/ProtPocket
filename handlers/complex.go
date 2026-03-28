package handlers

import (
    "fmt"
    "strings"

    "gofr.dev/pkg/gofr"

    "github.com/ProtPocket/data"
    "github.com/ProtPocket/scoring"
)

// ComplexDetailHandler handles GET /complex/:id
// :id can be either a UniProt ID (e.g. P04637) or an AlphaFold ID (e.g. AF-P04637-F1)
//
// First looks in hero_complexes.json for instant response.
// Falls back to live API fetch if not found in hero data.
func ComplexDetailHandler(ctx *gofr.Context) (interface{}, error) {
    id := ctx.PathParam("id")
    if id == "" {
        return nil, fmt.Errorf("path parameter 'id' is required")
    }

    // Normalize: if it's an AlphaFold ID like AF-P04637-F1, extract the UniProt part
    uniprotID := normalizeToUniProtID(id)

    // Check hero complexes first
    heroComplexes, err := data.LoadHeroComplexes()
    if err != nil {
        return nil, fmt.Errorf("critical: failed to load hero complexes: %w", err)
    }

    for _, c := range heroComplexes {
        if c.UniprotID == uniprotID || c.AlphafoldID == id {
            return c, nil
        }
    }

    // Not in hero list — try live build
    c, err := buildComplexFromUniProt(uniprotID)
    if err != nil {
        return nil, fmt.Errorf("complex not found in hero list and live fetch failed for %s: %w", uniprotID, err)
    }
    c.GapScore = scoring.ComputeGapScore(
        c.DimerPLDDTAvg,
        c.DrugCount,
        30, // Reference max drug count
        c.IsWHOPathogen,
        c.DisorderDelta,
    )
    return c, nil
}

// normalizeToUniProtID extracts the UniProt accession from an AlphaFold ID.
// "AF-P04637-F1" → "P04637"
// "P04637" → "P04637" (unchanged)
func normalizeToUniProtID(id string) string {
    if len(id) > 3 && id[:3] == "AF-" {
        parts := strings.Split(id, "-")
        if len(parts) >= 2 {
            return parts[1]
        }
    }
    return id
}
