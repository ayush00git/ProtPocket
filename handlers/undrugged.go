package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ProtPocket/models"
	"github.com/ProtPocket/services"
)

// UndruggedHandler handles GET /undrugged?limit={n}&filter={category}
//
// Query params:
//
//	limit  - number of results to return (default: 25, max: 50)
//	filter - one of: "all", "who_pathogen", "human_disease" (default: "all")
//
// Fetches live data from ChEMBL, UniProt, and AlphaFold APIs. Results are
// cached server-side for 1 hour to keep latency manageable.
func UndruggedHandler(c *gin.Context) {
	limitStr := c.Query("limit")
	filter := c.Query("filter")

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

	allTargets, err := services.FetchUndrugged()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to fetch undrugged targets: %v", err)})
		return
	}

	var filtered []models.Complex
	for _, target := range allTargets {
		if filter == "all" || target.Category == filter {
			filtered = append(filtered, target)
		}
	}

	if len(filtered) > limit {
		filtered = filtered[:limit]
	}

	c.JSON(http.StatusOK, gin.H{
		"filter":  filter,
		"count":   len(filtered),
		"results": filtered,
	})
}
