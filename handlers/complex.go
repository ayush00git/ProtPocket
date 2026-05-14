package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/ProtPocket/data"
	"github.com/ProtPocket/scoring"
)

// ComplexDetailHandler handles GET /complex/:id
// :id can be either a UniProt ID (e.g. P04637) or an AlphaFold ID (e.g. AF-P04637-F1)
//
// First looks in hero_complexes.json for instant response.
// Falls back to live API fetch if not found in hero data.
func ComplexDetailHandler(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path parameter 'id' is required"})
		return
	}

	uniprotID := normalizeToUniProtID(id)

	heroComplexes, err := data.LoadHeroComplexes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("critical: failed to load hero complexes: %v", err)})
		return
	}

	for _, hero := range heroComplexes {
		if hero.UniprotID == uniprotID || hero.AlphafoldID == id {
			c.JSON(http.StatusOK, hero)
			return
		}
	}

	complex, err := buildComplexFromUniProt(uniprotID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("complex not found in hero list and live fetch failed for %s: %v", uniprotID, err)})
		return
	}
	complex.GapScore = scoring.ComputeGapScore(
		complex.DimerPLDDTAvg,
		complex.DrugCount,
		30,
		complex.IsWHOPathogen,
		complex.DisorderDelta,
	)
	c.JSON(http.StatusOK, complex)
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
