package services

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// ParsedMutation holds the structured result of parsing a raw mutation string.
type ParsedMutation struct {
	Gene       string `json:"gene"`        // e.g. "EGFR" — empty if not provided
	Position   int    `json:"position"`    // e.g. 790
	WildtypeAA string `json:"wildtype_aa"` // e.g. "T"
	MutantAA   string `json:"mutant_aa"`   // e.g. "M"
	Raw        string `json:"raw"`         // original input, trimmed
}

// variantRe matches an optional HGVS "p." prefix, then a single-letter AA,
// a numeric position, and another single-letter AA.  Examples: T790M, p.T790M.
var variantRe = regexp.MustCompile(`(?i)^(?:p\.)?([A-Z])(\d+)([A-Z])$`)

// validAA is the set of standard single-letter amino acid codes.
var validAA = map[string]bool{
	"A": true, "R": true, "N": true, "D": true, "C": true,
	"Q": true, "E": true, "G": true, "H": true, "I": true,
	"L": true, "K": true, "M": true, "F": true, "P": true,
	"S": true, "T": true, "W": true, "Y": true, "V": true,
}

// ParseMutation parses a raw mutation string into a ParsedMutation.
// Accepted formats (case-insensitive):
//   "EGFR T790M"   — gene name + space + variant
//   "T790M"        — variant only
//   "p.T790M"      — HGVS-style prefix
//   "EGFR p.T790M" — gene + HGVS variant
func ParseMutation(raw string) (*ParsedMutation, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, fmt.Errorf("mutation string is empty")
	}

	var gene, variantStr string

	parts := strings.Fields(trimmed)
	switch len(parts) {
	case 1:
		variantStr = parts[0]
	case 2:
		gene = strings.ToUpper(parts[0])
		variantStr = parts[1]
	default:
		return nil, fmt.Errorf("expected 1 or 2 tokens (e.g. \"T790M\" or \"EGFR T790M\"), got %d", len(parts))
	}

	m := variantRe.FindStringSubmatch(variantStr)
	if m == nil {
		return nil, fmt.Errorf("cannot parse variant %q: expected format [AA][position][AA] (e.g. T790M)", variantStr)
	}

	wt := strings.ToUpper(m[1])
	pos, _ := strconv.Atoi(m[2])
	mut := strings.ToUpper(m[3])

	if !validAA[wt] {
		return nil, fmt.Errorf("invalid wildtype amino acid %q", wt)
	}
	if !validAA[mut] {
		return nil, fmt.Errorf("invalid mutant amino acid %q", mut)
	}
	if pos <= 0 {
		return nil, fmt.Errorf("position must be > 0, got %d", pos)
	}
	if wt == mut {
		return nil, fmt.Errorf("wildtype and mutant amino acids are identical (%s)", wt)
	}

	return &ParsedMutation{
		Gene:       gene,
		Position:   pos,
		WildtypeAA: wt,
		MutantAA:   mut,
		Raw:        trimmed,
	}, nil
}
