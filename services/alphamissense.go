package services

import (
	"database/sql"
	"errors"
	"fmt"
	"sync"

	_ "modernc.org/sqlite"
)

// AlphaMissenseResult holds the pathogenicity data for a single amino acid substitution.
type AlphaMissenseResult struct {
	UniprotID      string  `json:"uniprot_id"`
	Variant        string  `json:"protein_variant"`
	Pathogenicity  float64 `json:"am_pathogenicity"`
	Classification string  `json:"am_class"` // "benign" | "ambiguous" | "pathogenic"
}

// ErrAlphaMissenseNotInit is returned when QueryAlphaMissense is called before OpenAlphaMissenseDB.
var ErrAlphaMissenseNotInit = errors.New("alphamissense: DB not initialised — call OpenAlphaMissenseDB first")

// ErrVariantNotFound is returned when the (uniprotID, variant) pair has no entry.
var ErrVariantNotFound = errors.New("alphamissense: variant not found")

var (
	amDB   *sql.DB
	amStmt *sql.Stmt
	amMu   sync.RWMutex
)

// OpenAlphaMissenseDB opens the SQLite DB built by cmd/alphamissense_import.
// Call once at server startup. Thread-safe.
func OpenAlphaMissenseDB(dbPath string) error {
	amMu.Lock()
	defer amMu.Unlock()

	db, err := sql.Open("sqlite", "file:"+dbPath+"?mode=ro")
	if err != nil {
		return fmt.Errorf("alphamissense: open db: %w", err)
	}
	db.SetMaxOpenConns(8)

	if err := db.Ping(); err != nil {
		db.Close()
		return fmt.Errorf("alphamissense: ping db: %w", err)
	}

	stmt, err := db.Prepare(
		`SELECT am_pathogenicity, am_class FROM variants WHERE uniprot_id = ? AND protein_variant = ? LIMIT 1`,
	)
	if err != nil {
		db.Close()
		return fmt.Errorf("alphamissense: prepare stmt: %w", err)
	}

	if amStmt != nil {
		amStmt.Close()
	}
	if amDB != nil {
		amDB.Close()
	}
	amDB = db
	amStmt = stmt
	return nil
}

// IsAlphaMissenseReady reports whether the DB has been successfully opened.
func IsAlphaMissenseReady() bool {
	amMu.RLock()
	defer amMu.RUnlock()
	return amDB != nil
}

// QueryAlphaMissense returns the AlphaMissense score for a (UniProt ID, protein variant) pair.
// proteinVariant must be in the standard format, e.g. "T790M".
// Returns ErrVariantNotFound if the pair is absent from the database.
func QueryAlphaMissense(uniprotID, proteinVariant string) (*AlphaMissenseResult, error) {
	amMu.RLock()
	stmt := amStmt
	amMu.RUnlock()

	if stmt == nil {
		return nil, ErrAlphaMissenseNotInit
	}

	var pathogenicity float64
	var class string
	err := stmt.QueryRow(uniprotID, proteinVariant).Scan(&pathogenicity, &class)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("%w: %s %s", ErrVariantNotFound, uniprotID, proteinVariant)
	}
	if err != nil {
		return nil, fmt.Errorf("alphamissense: query: %w", err)
	}

	return &AlphaMissenseResult{
		UniprotID:      uniprotID,
		Variant:        proteinVariant,
		Pathogenicity:  pathogenicity,
		Classification: class,
	}, nil
}
