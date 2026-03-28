package data

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/ProtPocket/models"
)

// LoadHeroComplexes loads hero complexes from hero_complexes.json when present.
// If the file does not exist the function returns an empty slice so the server
// can start without it; a real error is only returned for malformed JSON.
func LoadHeroComplexes() ([]models.Complex, error) {
	raw, err := os.ReadFile("hero_complexes.json")
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return []models.Complex{}, nil
		}
		return nil, fmt.Errorf("failed to read hero_complexes.json: %w", err)
	}

	var complexes []models.Complex
	if err := json.Unmarshal(raw, &complexes); err != nil {
		return nil, fmt.Errorf("failed to parse hero_complexes.json: %w", err)
	}
	return complexes, nil
}

// FindHeroByGeneOrProtein searches the hero complexes by gene name or protein name (case-insensitive).
// Returns all matching complexes.
func FindHeroByGeneOrProtein(query string, complexes []models.Complex) []models.Complex {
	queryLower := strings.ToLower(query)
	var results []models.Complex
	for _, c := range complexes {
		if strings.Contains(strings.ToLower(c.GeneName), queryLower) ||
			strings.Contains(strings.ToLower(c.ProteinName), queryLower) ||
			strings.Contains(strings.ToLower(c.Organism), queryLower) {
			results = append(results, c)
		}
	}
	return results
}