package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"

	"github.com/ProtPocket/data"
	"github.com/ProtPocket/models"
	"github.com/ProtPocket/scoring"
	"github.com/ProtPocket/services"
)

// SearchHandler streams search results via Server-Sent Events.
// Hero matches are sent immediately; live UniProt results are streamed
// as each protein is enriched concurrently.
func SearchHandler(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming unsupported"})
		return
	}

	ctx := c.Request.Context()

	heroComplexes, err := data.LoadHeroComplexes()
	if err != nil {
		sseError(c.Writer, flusher, "failed to load hero complexes")
		return
	}

	// Stream hero matches immediately — zero latency for known proteins
	heroMatches := data.FindHeroByGeneOrProtein(query, heroComplexes)
	for _, h := range heroMatches {
		if ctx.Err() != nil {
			return
		}
		sseResult(c.Writer, flusher, h)
	}

	uniprotIDs, err := services.SearchUniProt(query, 50)
	if err != nil || len(uniprotIDs) == 0 {
		sseDone(c.Writer, flusher, "fallback")
		return
	}

	// Deduplicate against already-streamed hero results
	seen := make(map[string]bool)
	for _, h := range heroMatches {
		seen[h.UniprotID] = true
	}

	resultCh := make(chan models.Complex, len(uniprotIDs))
	var wg sync.WaitGroup

	for _, uid := range uniprotIDs {
		if seen[uid] {
			continue
		}
		seen[uid] = true
		wg.Add(1)
		go func(id string) {
			defer wg.Done()
			if ctx.Err() != nil {
				return
			}
			complex, err := buildComplexForSearch(id)
			if err != nil {
				return
			}
			complex.GapScore = scoring.ComputeGapScore(
				complex.DimerPLDDTAvg,
				complex.DrugCount,
				1,
				complex.IsWHOPathogen,
				complex.DisorderDelta,
			)
			resultCh <- *complex
		}(uid)
	}

	go func() {
		wg.Wait()
		close(resultCh)
	}()

	for result := range resultCh {
		if ctx.Err() != nil {
			return
		}
		sseResult(c.Writer, flusher, result)
	}

	sseDone(c.Writer, flusher, "live")
}

func sseResult(w http.ResponseWriter, f http.Flusher, c models.Complex) {
	data, err := json.Marshal(c)
	if err != nil {
		return
	}
	fmt.Fprintf(w, "event: result\ndata: %s\n\n", data)
	f.Flush()
}

func sseDone(w http.ResponseWriter, f http.Flusher, source string) {
	fmt.Fprintf(w, "event: done\ndata: {\"source\":\"%s\"}\n\n", source)
	f.Flush()
}

func sseError(w http.ResponseWriter, f http.Flusher, msg string) {
	fmt.Fprintf(w, "event: error\ndata: {\"error\":\"%s\"}\n\n", msg)
	f.Flush()
}

// buildComplexForSearch builds a Complex without fetching ChEMBL drug coverage.
// DrugCount is set to -1 (unknown) so the gap score uses a neutral 0.5 factor.
// Full drug data is fetched on demand by ComplexDetailHandler.
func buildComplexForSearch(uniprotID string) (*models.Complex, error) {
	uniEntry, err := services.FetchUniProtEntry(uniprotID)
	if err != nil {
		return nil, err
	}

	if !strings.Contains(uniEntry.EntryType, "Swiss-Prot") {
		return nil, fmt.Errorf("skipping unreviewed entry %s", uniprotID)
	}

	afData, err := services.FetchComplexData(uniprotID)
	if err != nil {
		return nil, err
	}

	isWHO := scoring.IsWHOPathogen(uniEntry.Organism.TaxonID)

	var diseases []string
	for _, comment := range uniEntry.Comments {
		if comment.CommentType == "DISEASE" && comment.Disease.DiseaseID != "" {
			diseases = append(diseases, comment.Disease.DiseaseID)
		}
	}

	geneName := ""
	if len(uniEntry.Genes) > 0 {
		geneName = uniEntry.Genes[0].GeneName.Value
	}

	return &models.Complex{
		UniprotID:        uniprotID,
		ProteinName:      uniEntry.ProteinDescription.RecommendedName.FullName.Value,
		GeneName:         geneName,
		Organism:         uniEntry.Organism.ScientificName,
		OrganismID:       uniEntry.Organism.TaxonID,
		IsWHOPathogen:    isWHO,
		DiseaseAssoc:     diseases,
		MonomerPLDDTAvg:  afData.MonomerPLDDT,
		DimerPLDDTAvg:    afData.DimerPLDDT,
		DisorderDelta:    afData.DisorderDelta,
		DrugCount:        -1,
		KnownDrugNames:   nil,
		MonomerStructURL: afData.MonomerCifURL,
		ComplexStructURL: afData.ComplexCifURL,
		Category:         inferCategory(isWHO, diseases, afData.DisorderDelta),
		AlphafoldID:      afData.MonomerEntryID,
		ReviewStatus:     "reviewed",
	}, nil
}

// buildComplexFromUniProt builds a full Complex including ChEMBL drug coverage.
// Used by ComplexDetailHandler where the extra latency is acceptable.
func buildComplexFromUniProt(uniprotID string) (*models.Complex, error) {
	uniEntry, err := services.FetchUniProtEntry(uniprotID)
	if err != nil {
		return nil, err
	}

	if !strings.Contains(uniEntry.EntryType, "Swiss-Prot") {
		return nil, fmt.Errorf("skipping unreviewed entry %s", uniprotID)
	}

	afData, err := services.FetchComplexData(uniprotID)
	if err != nil {
		return nil, err
	}

	drugCount, drugNames, _ := services.FetchDrugCoverage(uniprotID)
	isWHO := scoring.IsWHOPathogen(uniEntry.Organism.TaxonID)

	var diseases []string
	for _, comment := range uniEntry.Comments {
		if comment.CommentType == "DISEASE" && comment.Disease.DiseaseID != "" {
			diseases = append(diseases, comment.Disease.DiseaseID)
		}
	}

	geneName := ""
	if len(uniEntry.Genes) > 0 {
		geneName = uniEntry.Genes[0].GeneName.Value
	}

	reviewStatus := "unreviewed"
	if strings.Contains(uniEntry.EntryType, "Swiss-Prot") {
		reviewStatus = "reviewed"
	}

	return &models.Complex{
		UniprotID:        uniprotID,
		ProteinName:      uniEntry.ProteinDescription.RecommendedName.FullName.Value,
		GeneName:         geneName,
		Organism:         uniEntry.Organism.ScientificName,
		OrganismID:       uniEntry.Organism.TaxonID,
		IsWHOPathogen:    isWHO,
		DiseaseAssoc:     diseases,
		MonomerPLDDTAvg:  afData.MonomerPLDDT,
		DimerPLDDTAvg:    afData.DimerPLDDT,
		DisorderDelta:    afData.DisorderDelta,
		DrugCount:        drugCount,
		KnownDrugNames:   drugNames,
		MonomerStructURL: afData.MonomerCifURL,
		ComplexStructURL: afData.ComplexCifURL,
		Category:         inferCategory(isWHO, diseases, afData.DisorderDelta),
		DemoHighlight:    false,
		AlphafoldID:      afData.MonomerEntryID,
		ReviewStatus:     reviewStatus,
		GapScore:         0.0,
	}, nil
}

func inferCategory(isWHO bool, diseases []string, disorderDelta float64) string {
	if isWHO {
		return "who_pathogen"
	}
	if len(diseases) > 0 {
		return "human_disease"
	}
	if disorderDelta > 0.0 {
		return "high_disorder_delta"
	}
	return "monomer_only"
}

