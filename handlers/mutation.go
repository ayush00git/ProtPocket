package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"sync"

	"github.com/gin-gonic/gin"

	"github.com/ProtPocket/services"
)

// --- POST /mutation/parse ------------------------------------------------

type parseMutationRequest struct {
	Mutation string `json:"mutation" binding:"required"`
}

// MutationParseHandler handles POST /mutation/parse.
// Body: {"mutation": "EGFR T790M"}
func MutationParseHandler(c *gin.Context) {
	var req parseMutationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "field 'mutation' is required"})
		return
	}

	parsed, err := services.ParseMutation(req.Mutation)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, parsed)
}

// --- POST /mutation/alphamisense -----------------------------------------

// amDBOnce ensures OpenAlphaMissenseDB is called at most once per process.
var (
	amDBOnce    sync.Once
	amDBInitErr error
)

func initAMDB() error {
	// If a caller (e.g. test setup) already opened the DB, skip.
	if services.IsAlphaMissenseReady() {
		return nil
	}
	amDBOnce.Do(func() {
		path := os.Getenv("ALPHAMISSENSE_DB")
		if path == "" {
			path = "data/alphamissense.db"
		}
		amDBInitErr = services.OpenAlphaMissenseDB(path)
	})
	return amDBInitErr
}

type alphaMissenseRequest struct {
	UniprotID      string `json:"uniprot_id"      binding:"required"`
	ProteinVariant string `json:"protein_variant" binding:"required"`
}

// MutationAlphaMissenseHandler handles POST /mutation/alphamisense.
// Body: {"uniprot_id": "P00533", "protein_variant": "T790M"}
// Returns the AlphaMissense pathogenicity score and classification.
func MutationAlphaMissenseHandler(c *gin.Context) {
	if err := initAMDB(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "AlphaMissense database unavailable: " + err.Error(),
		})
		return
	}

	var req alphaMissenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fields 'uniprot_id' and 'protein_variant' are required"})
		return
	}

	result, err := services.QueryAlphaMissense(req.UniprotID, req.ProteinVariant)
	if err != nil {
		if errors.Is(err, services.ErrVariantNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// --- POST /mutation/analyze -----------------------------------------------

type analyzeRequest struct {
	UniprotID string `json:"uniprot_id" binding:"required"`
	Mutation  string `json:"mutation"   binding:"required"`
}

// MutationAnalyzeHandler handles POST /mutation/analyze.
// Body: {"uniprot_id": "P00533", "mutation": "EGFR T790M"}
//
// Full pipeline:
//  1. Parse mutation string
//  2. (parallel) AlphaMissense lookup + AlphaFold/RCSB structure fetch
//  3. fpocket on wildtype + mutant structures
//  4. Compute Druggability Shift Score
//
// This endpoint is slow (~30–60s) due to structure download + fpocket.
func MutationAnalyzeHandler(c *gin.Context) {
	if err := initAMDB(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "AlphaMissense database unavailable: " + err.Error(),
		})
		return
	}

	var req analyzeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fields 'uniprot_id' and 'mutation' are required"})
		return
	}

	// Step 1: parse mutation string
	parsed, err := services.ParseMutation(req.Mutation)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mutation parse: " + err.Error()})
		return
	}
	variantStr := fmt.Sprintf("%s%d%s", parsed.WildtypeAA, parsed.Position, parsed.MutantAA)

	// Step 2: AM lookup + structure fetch in parallel
	var (
		am         *services.AlphaMissenseResult
		structures *services.MutationStructures
		amErr      error
		structErr  error
		wg         sync.WaitGroup
	)
	wg.Add(2)
	go func() {
		defer wg.Done()
		am, amErr = services.QueryAlphaMissense(req.UniprotID, variantStr)
	}()
	go func() {
		defer wg.Done()
		structures, structErr = services.FetchMutationStructures(req.UniprotID, parsed)
	}()
	wg.Wait()

	if amErr != nil {
		if errors.Is(amErr, services.ErrVariantNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "alphamissense: " + amErr.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "alphamissense: " + amErr.Error()})
		return
	}
	if structErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "structure fetch: " + structErr.Error()})
		return
	}

	// Step 3: run fpocket on both structures
	pockets, err := services.CompareMutationPockets(structures)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "pocket analysis: " + err.Error()})
		return
	}

	// Step 4: compute Druggability Shift Score
	result := services.ComputeShiftScore(am, structures, pockets)
	c.JSON(http.StatusOK, result)
}
