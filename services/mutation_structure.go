package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

var rcsbClient = &http.Client{Timeout: 10 * time.Second}

const rcsbSearchURL = "https://search.rcsb.org/rcsbsearch/v2/query"

// MutationStructures holds the fetched structure URLs for both wildtype and mutant.
type MutationStructures struct {
	UniprotID string          `json:"uniprot_id"`
	Mutation  *ParsedMutation `json:"mutation"`

	// Wildtype: always from AlphaFold monomer prediction.
	WildtypePDBURL  string  `json:"wildtype_pdb_url"`
	WildtypeCifURL  string  `json:"wildtype_cif_url"`
	WildtypeEntryID string  `json:"wildtype_entry_id"`
	WildtypePLDDT   float64 `json:"wildtype_plddt"`

	// Mutant: either an RCSB experimental structure or wildtype used as approximation.
	MutantPDBURL   string `json:"mutant_pdb_url"`
	MutantCifURL   string `json:"mutant_cif_url"`
	MutantPDBID    string `json:"mutant_pdb_id,omitempty"` // set only when source is rcsb_experimental
	MutantSource   string `json:"mutant_source"`           // "rcsb_experimental" | "alphafold_wildtype_approx"
	MutantIsApprox bool   `json:"mutant_is_approximation"`
	ApproxReason   string `json:"approximation_reason,omitempty"`
}

// approxReason is the standard explanation written into MutationStructures when
// no experimental mutant structure exists.
const approxReason = "No experimental mutant structure found in RCSB PDB for this variant. " +
	"Using wildtype AlphaFold structure as backbone approximation — single amino acid " +
	"substitutions rarely alter backbone conformation significantly. " +
	"Pocket geometry deltas will be zero; the Druggability Shift Score will weight " +
	"the AlphaMissense pathogenicity score more heavily in this case."

// FetchMutationStructures retrieves structure URLs for both the wildtype and mutant
// forms of the given protein.
//
//  1. Wildtype: always fetched from the AlphaFold monomer prediction.
//  2. Mutant:   searched in RCSB PDB by UniProt ID + pdbx_mutation annotation.
//     If no hit is found, the wildtype structure is used as an approximation
//     and MutantIsApprox is set to true.
func FetchMutationStructures(uniprotID string, mutation *ParsedMutation) (*MutationStructures, error) {
	wt, err := FetchMonomerPrediction(uniprotID)
	if err != nil {
		return nil, fmt.Errorf("fetch wildtype structure for %s: %w", uniprotID, err)
	}

	result := &MutationStructures{
		UniprotID:       uniprotID,
		Mutation:        mutation,
		WildtypePDBURL:  wt.PdbURL,
		WildtypeCifURL:  wt.CifURL,
		WildtypeEntryID: wt.EntryID,
		WildtypePLDDT:   wt.GlobalMetricValue,
	}

	variantStr := fmt.Sprintf("%s%d%s", mutation.WildtypeAA, mutation.Position, mutation.MutantAA)
	pdbID, rcsbErr := searchRCSBMutant(uniprotID, variantStr)
	if rcsbErr == nil && pdbID != "" {
		result.MutantPDBID = pdbID
		result.MutantPDBURL = fmt.Sprintf("https://files.rcsb.org/download/%s.pdb", pdbID)
		result.MutantCifURL = fmt.Sprintf("https://files.rcsb.org/download/%s.cif", pdbID)
		result.MutantSource = "rcsb_experimental"
		result.MutantIsApprox = false
	} else {
		result.MutantPDBURL = wt.PdbURL
		result.MutantCifURL = wt.CifURL
		result.MutantSource = "alphafold_wildtype_approx"
		result.MutantIsApprox = true
		result.ApproxReason = approxReason
	}

	return result, nil
}

// searchRCSBMutant queries RCSB PDB for an experimental structure that:
//   - is aligned to the given UniProt accession, AND
//   - has the mutation string (e.g. "T790M") anywhere in its full-text record.
//
// Returns the PDB entry ID of the top hit (e.g. "4I23"), or ("", nil) if none.
// Searchable attributes confirmed via RCSB redoc:
//   - reference_sequence_identifiers.database_accession  (text, exact_match)
//   - reference_sequence_identifiers.database_name       (text, exact_match)
//   - full_text service for mutation string
func searchRCSBMutant(uniprotID, variantStr string) (string, error) {
	reqBody := map[string]any{
		"query": map[string]any{
			"type":             "group",
			"logical_operator": "and",
			"nodes": []map[string]any{
				{
					"type":    "terminal",
					"service": "text",
					"parameters": map[string]any{
						"attribute": "rcsb_polymer_entity_container_identifiers.reference_sequence_identifiers.database_accession",
						"operator":  "exact_match",
						"value":     uniprotID,
						"negation":  false,
					},
				},
				{
					"type":    "terminal",
					"service": "text",
					"parameters": map[string]any{
						"attribute": "rcsb_polymer_entity_container_identifiers.reference_sequence_identifiers.database_name",
						"operator":  "exact_match",
						"value":     "UniProt",
						"negation":  false,
					},
				},
				{
					"type":    "terminal",
					"service": "full_text",
					"parameters": map[string]any{
						"value": variantStr,
					},
				},
			},
		},
		"return_type": "entry",
		"request_options": map[string]any{
			"paginate": map[string]any{"start": 0, "rows": 3},
		},
	}

	body, _ := json.Marshal(reqBody)
	resp, err := rcsbClient.Post(rcsbSearchURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("rcsb search: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 204 {
		return "", nil
	}
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("rcsb search: HTTP %d", resp.StatusCode)
	}

	var result struct {
		TotalCount int `json:"total_count"`
		ResultSet  []struct {
			Identifier string `json:"identifier"`
		} `json:"result_set"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("rcsb search decode: %w", err)
	}
	if len(result.ResultSet) == 0 {
		return "", nil
	}

	// return_type=entry gives identifiers like "4I23" directly.
	return result.ResultSet[0].Identifier, nil
}
