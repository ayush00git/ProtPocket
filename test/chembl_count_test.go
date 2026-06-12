package test

import (
	"testing"

	"github.com/ProtPocket/models"
	"github.com/ProtPocket/services"
)

func TestChemblReturnsManyFragments(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping live ChEMBL integration test")
	}
	// A reasonably large pocket so the MW ceiling is generous (~300 Da).
	pocket := models.Pocket{
		PocketID:       9001,
		Volume:         1200,
		Hydrophobicity: 20,
		Polarity:       6,
	}
	frags := services.FetchFragments(pocket)
	t.Logf("FetchFragments returned %d fragments", len(frags))
	if len(frags) < 50 {
		t.Errorf("expected a large candidate set (>=50), got %d", len(frags))
	}
}
