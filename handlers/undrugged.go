package handlers

import (
    "fmt"
    "strconv"

    "gofr.dev/pkg/gofr"

    "github.com/ProtPocket/data"
    "github.com/ProtPocket/models"
)

// UndruggedHandler handles GET /undrugged?limit={n}&filter={category}
//
// Query params:
//   limit  - number of results to return (default: 25, max: 50)
//   filter - one of: "all", "who_pathogen", "human_disease" (default: "all")
//
// Always uses hero_complexes.json — this endpoint never makes live API calls.
// It is a pre-computed research prioritization tool.
func UndruggedHandler(ctx *gofr.Context) (interface{}, error) {
    limitStr := ctx.Param("limit")
    filter := ctx.Param("filter")

    limit := 25
    if limitStr != "" {
        parsed, err := strconv.Atoi(limitStr)
        if err == nil && parsed > 0 && parsed <= 50 {
            limit = parsed
        }
    }
    if filter == "" {
        filter = "all"
    }

    heroComplexes, err := data.LoadHeroComplexes()
    if err != nil {
        return nil, fmt.Errorf("failed to load hero complexes: %w", err)
    }

    // Filter by category
    var filtered []models.Complex
    for _, c := range heroComplexes {
        if filter == "all" || c.Category == filter {
            filtered = append(filtered, c)
        }
    }

    // Sort by gap score descending
    sortByGapScore(filtered)

    // Cap at limit
    if len(filtered) > limit {
        filtered = filtered[:limit]
    }

    return map[string]interface{}{
        "filter":  filter,
        "count":   len(filtered),
        "results": filtered,
    }, nil
}
