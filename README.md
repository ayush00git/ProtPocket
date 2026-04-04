# ProtPocket

**From protein name to ranked drug binding sites — automated, in seconds.**

ProtPocket is an open-source computational drug discovery tool that takes a protein name, gene symbol, disease, or UniProt accession as input and returns a complete structural analysis: real-time complex data from AlphaFold, drug target prioritization via an original Gap Score algorithm, interactive 3D structure comparison, automated binding site detection using fpocket, and fragment molecule suggestions from ChEMBL — all in one browser-based workflow.

It was built on top of the AlphaFold homodimer dataset released March 16, 2026 by EMBL-EBI, Google DeepMind, NVIDIA, and Seoul National University — the largest protein complex dataset ever assembled. ProtPocket is, to our knowledge, the first tool to make this dataset queryable by drug discovery priority through a live API pipeline.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [How ProtPocket Works](#how-protpocket-works)
3. [Technical Discovery: The AlphaFold Complex API](#technical-discovery)
4. [The Gap Score](#the-gap-score)
5. [Binding Site Detection](#binding-site-detection)
6. [Data Sources](#data-sources)
7. [Architecture](#architecture)
8. [Installation](#installation)
9. [API Reference](#api-reference)
10. [Roadmap](#roadmap)

---

## The Problem

Protein structures have been the foundation of rational drug design for decades. When researchers know the three-dimensional shape of a protein involved in disease, they can in principle design a molecule that fits into a cavity on its surface and disrupts its function. The challenge has always been bridging the gap between having a structure and knowing where and how to target it.

The traditional workflow is brutally fragmented. A researcher investigating a tuberculosis protein today must query AlphaFold manually for the structure, visit UniProt separately for disease context, run ChEMBL queries independently for drug coverage, download structure files locally, run pocket detection software from a command line, and then consult fragment databases with another tool entirely. Each step requires a different interface, produces output in a different format, and demands familiarity with a different tool. Most researchers do not have access to expensive commercial suites — Schrödinger, MOE, Discovery Studio — that partially unify these workflows. Even those who do still face the deeper problem that most of these tools operate on monomer structures.

A monomer is a single protein chain in isolation. A homodimer is two identical chains bound together. The biological reality is that most proteins only execute their functional role as dimers or larger complexes — the monomer form exists as a folding intermediate or transport state, not the active species inside the cell. The interface between two chains when they come together creates surface cavities — pockets — that do not exist in either chain alone. These interface pockets are among the most valuable drug targets in modern pharmacology, the basis of protein-protein interaction (PPI) inhibitor programs. Yet they are invisible to any tool that analyzes monomers only.

The March 2026 AlphaFold homodimer release changed the availability of complex structural data fundamentally. But it provided no tooling to query the data by drug discovery priority, no way to run pocket analysis on the new structures programmatically, and no connection to fragment databases. The dataset existed but was not actionable.

---

## How ProtPocket Works

### Query Classification and Multi-Database Retrieval

When a researcher submits a query — whether it is a gene name like `TP53`, a disease term like `tuberculosis`, a UniProt accession like `P04637`, or an AlphaFold ID like `AF-0000000066503175` — ProtPocket first classifies the query type. A UniProt accession goes directly to AlphaFold without a search step. A gene name hits UniProt with a gene-exact filter. A disease term queries UniProt's disease annotation index. An AlphaFold ID bypasses both and resolves immediately.

For each matching protein, ProtPocket fires three concurrent requests: to AlphaFold for both monomer and homodimer predictions, to ChEMBL for approved drug coverage, and to UniProt for disease associations and organism context. These run in parallel via Go goroutines and merge before the response is returned.

### Disorder Delta and Structural Comparison

For every protein, ProtPocket computes the disorder delta — the difference in average pLDDT confidence between the monomer and homodimer AlphaFold predictions. This single number captures the structural reveal: how much the protein gains in ordered, confident structure when it finds its binding partner. A disorder delta of +36 means the protein went from 50% structural confidence in isolation to 86% confidence in complex form — the functional shape was completely hidden in the monomer and emerged only in the dimer.

The detail page renders both structures in the Mol* 3D viewer, colored by per-residue pLDDT confidence. Blue regions are predicted with high confidence; red and orange regions are disordered.

### Gap Score Ranking

Every protein in the results is ranked by an original Gap Score that answers the question: how urgently does the world need a drug for this target? The score combines structural confidence, drug coverage from ChEMBL, WHO priority pathogen status, and the disorder delta bonus. Results are sorted descending — the most urgently undrugged, high-confidence target appears first. The undrugged targets dashboard provides a pre-ranked leaderboard of the highest Gap Score complexes across the 20 most studied species.

### Binding Site Detection with fpocket

When a researcher requests pocket analysis for a specific complex, ProtPocket runs fpocket on both the monomer and the homodimer structure files. fpocket identifies surface cavities using Voronoi tessellation and alpha sphere algorithms, returning each pocket with a druggability score, volume in cubic Ångströms, and the residues lining it.

By comparing the pocket lists from the monomer and dimer runs, ProtPocket identifies interface pockets — cavities that appear in the dimer but have no corresponding cavity in the monomer. These are pockets formed specifically by the coming together of two chains. They are cross-validated against the per-residue disorder delta: pockets lined by residues that gained structural confidence in the dimer are flagged as high-confidence interface pockets, the primary targets for PPI inhibitor programs.

### Fragment Suggestion from ChEMBL

For each identified pocket, ProtPocket queries ChEMBL for small molecule fragments whose known binding pockets share geometric properties with the identified cavity — similar volume, similar hydrophobicity profile, similar charge distribution. The returned fragments are molecules that have been shown experimentally to bind structurally similar pockets in other proteins, providing a starting point for medicinal chemistry rather than an empty search space.

---

## Technical Discovery

During development, ProtPocket's team discovered an undocumented capability of the AlphaFold REST API that makes real-time complex data retrieval possible without bulk FTP download.

When the project began, no public API endpoint existed to query AlphaFold homodimer predictions by UniProt ID. The team systematically tested every plausible endpoint pattern. The standard prediction endpoint returned monomers only. A dedicated complexes endpoint returned 404. The FTP bulk manifest directory had not yet been published. Direct queries with known numeric complex IDs worked, but obtaining those IDs required knowing them in advance.

The breakthrough came with the AlphaFold search endpoint:

```bash
curl -s "https://alphafold.ebi.ac.uk/api/search?q=Q55DI5&type=complex"
```

This returns a `docs` array containing both the monomer and homodimer predictions for the queried accession in a single response, with an `isComplex` boolean field distinguishing them and `globalMetricValue` giving the average pLDDT for each:

```json
{
  "docs": [
    {
      "entryId": "AF-Q55DI5-F1",
      "isComplex": false,
      "globalMetricValue": 50.56,
      "oligomericState": "monomer"
    },
    {
      "entryId": "AF-0000000066503175",
      "isComplex": true,
      "globalMetricValue": 86.06,
      "oligomericState": "dimer",
      "complexPredictionAccuracy_ipTM": 0.82
    }
  ]
}
```

From this single HTTP call, disorder delta is computed directly: `86.06 - 50.56 = +35.50`. The numeric complex ID (`AF-0000000066503175`) is recovered for further queries. The `ipTM` interface confidence score — available only for complex entries — is surfaced as an additional metric.

This behavior is not documented in the official AlphaFold API documentation. ProtPocket is the first tool to build on it, enabling live disorder delta computation for any protein with a homodimer prediction without downloading or parsing structure files. The full technical record is documented in [COMPLEX.md](./COMPLEX.md).

---

## The Gap Score

The Gap Score is ProtPocket's original drug target prioritization algorithm. It answers one question: given everything known about this protein complex, how urgently does research need a drug for it?

```
Gap Score = pLDDT_norm × undrugged_factor × WHO_multiplier + disorder_bonus
```

**`pLDDT_norm`** is the AlphaFold dimer confidence score normalized to 0–1. A structurally unreliable prediction should not drive expensive drug discovery programs — this term ensures only well-predicted targets rank highly.

**`undrugged_factor`** is `1 - (drug_count / max_drug_count_in_dataset)`. When no approved drug targets the protein, this equals 1.0. As drug coverage increases the factor approaches 0, pushing well-covered targets to the bottom. This is the gap the algorithm is named for.

**`WHO_multiplier`** applies a hard 2.0× boost to proteins from WHO priority pathogens — the 19 bacteria and viruses the World Health Organization has designated as critical antimicrobial resistance threats. This reflects real-world clinical urgency.

**`disorder_bonus`** adds `disorder_delta / 100` when the delta is positive. Proteins that undergo dramatic structural transformation in complex form represent the most scientifically novel entries in the March 2026 dataset. The bonus rewards them proportionally.

A score above 1.5 indicates a high-confidence, undrugged target in a WHO priority pathogen with significant structural gain. The undrugged targets leaderboard routinely shows WHO pathogen proteins — murC from *Staphylococcus aureus*, ftsZ from *Mycobacterium tuberculosis* — scoring between 1.85 and 1.95. TP53, the most studied cancer protein, scores 0.85 because five approved drugs already target it; it is clinically important but not an urgent gap.

---

## Binding Site Detection

ProtPocket's pocket analysis pipeline operates on homodimer structure files and identifies druggable cavities through three stages.

In the first stage, fpocket is invoked as a subprocess on both the monomer and dimer PDB files, converted from AlphaFold's CIF format using Open Babel. fpocket uses a rolling sphere algorithm — a probe sphere of variable radius is rolled across the molecular surface, and positions where the sphere is significantly surrounded by protein atoms are identified as potential pockets. Each pocket is scored for druggability based on its volume, shape, and chemical environment.

In the second stage, the monomer and dimer pocket lists are compared geometrically. A pocket in the dimer that has no corresponding cavity within threshold distance in the monomer is identified as an interface pocket — it was created by the structural change induced by dimerization. Interface pockets are the primary targets of PPI inhibitor programs because a molecule binding there disrupts the protein-protein interaction itself rather than blocking a conventional enzymatic active site.

In the third stage, each interface pocket is cross-referenced with per-residue pLDDT data from AlphaFold's confidence JSON files. Pockets whose lining residues gained the most structural confidence in the dimer — those with per-residue delta above threshold — are flagged as high-confidence interface pockets and sorted to the top of the ranked list.

The Mol* viewer on the detail page highlights the identified pocket residues directly on the structure, allowing the researcher to visually inspect the cavity geometry and its relationship to the structural reveal.

---

## Data Sources

**AlphaFold Database** (EMBL-EBI and Google DeepMind) provides all protein structure predictions. ProtPocket queries the search endpoint live for every request, recovering both monomer and homodimer predictions in a single call. For the two proteins in the curated dataset with confirmed homodimer structure files — EGFR and Q55DI5 — the complex CIF files are fetched directly from AlphaFold's file storage at their v1 versioned URLs. All other proteins use the monomer structure for visualization.

**UniProt** provides protein identity — gene names, organism, taxonomy ID, disease associations, and reviewed annotation status. Every protein in ProtPocket has a UniProt accession as its canonical identifier, and all cross-database lookups originate from it.

**ChEMBL** (EMBL-EBI) provides drug-target association data. ProtPocket queries ChEMBL for approved drugs at Phase 4 clinical status and above targeting each protein. The resulting drug count feeds directly into the undrugged factor of the Gap Score. ChEMBL is also queried for fragment molecule suggestions matched to identified pocket geometries.

**WHO Priority Pathogen List** (2024 edition) is hardcoded as a lookup table keyed by NCBI taxonomy ID. The list covers 19 bacterial and fungal pathogens designated as critical antimicrobial resistance threats and drives the 2× multiplier in the Gap Score.

**fpocket** runs locally as a subprocess. No external API is involved — structure files are downloaded, converted, analyzed, and the temporary files are deleted. fpocket is MIT licensed and freely available.

**Open Babel** handles all molecular format conversions between stages — CIF to PDB for fpocket input, and format interconversion for fragment structures.

ProtPocket does not store or redistribute AlphaFold structure files. All structure data is linked directly to EMBL-EBI's servers. All primary data sources are freely available under open licenses compatible with academic and commercial use.

---

## Architecture

```
app/                        React 19 + Vite frontend
  src/
    components/
      complex/
        viewer/             Mol* 3D viewer components
        BindingSites.jsx    Pocket analysis UI
      search/               Search bar and result cards
      dashboard/            Undrugged targets leaderboard
    pages/
      ComplexDetailPage.jsx
      SearchPage.jsx
      DashboardPage.jsx

handlers/                   GoFr route handlers
  search.go                 GET /search
  complex.go                GET /complex/{id}
  binding_sites.go          GET /complex/{id}/binding-sites
  undrugged.go              GET /undrugged
  chembl.go                 GET /chembl

services/
  alphafold.go              AlphaFold search + complex data
  chembl.go                 Drug coverage + fragment query
  uniprot.go                Protein metadata
  query_classifier.go       Query type detection

scoring/
  gap_score.go              Gap Score algorithm

data/
  hero_complexes.json       30 curated complexes (fallback)
```

**Backend:** Go with GoFr framework. Five HTTP routes. Concurrent goroutines for multi-API enrichment. In-memory caching for binding site results.

**Frontend:** React 19 with Vite. Tailwind CSS. Mol* for 3D structure rendering. Framer Motion for the structural reveal animation.

**Languages:** 59.7% JavaScript, 38.0% Go, 2.1% CSS.

---

## Installation

### Prerequisites

- Go 1.21+
- Node.js 18+
- fpocket (`sudo apt-get install fpocket` on Debian/Ubuntu, or build from [source](https://github.com/Discngine/fpocket))
- Open Babel (`sudo apt-get install openbabel`)

### Backend

```bash
# Clone the repository
git clone https://github.com/ayush00git/ProtPocket.git
cd ProtPocket

# Create environment file
cp .env.example .env
# No API keys required — all data sources are public

# Run the backend (port 8000)
go run main.go
```

### Frontend

```bash
cd app
npm install
npm run dev
# Runs at localhost:5173
# Proxies /api/* to localhost:8000
```

---

## API Reference

All routes are served from the Go backend on port 8000. The frontend proxies `/api/*` → `localhost:8000/*`.

### `GET /search?q={query}`

Returns protein complexes matching the query, ranked by Gap Score.

Query can be: protein name, gene symbol, disease name, organism name, UniProt accession, or AlphaFold ID. The backend classifies the query type and routes it to the appropriate UniProt search filter.

**Response fields of note:**
- `query_type` — how the query was classified (`gene_name`, `uniprot_id`, `disease`, `organism`, `free_text`)
- `source` — `live` (real API calls) or `fallback` (hero JSON)
- `results[].gap_score` — ranking score
- `results[].disorder_delta` — structural gain from monomer to dimer
- `results[].drug_count` — approved drugs from ChEMBL (−1 = unknown, 0 = undrugged)

### `GET /complex/{id}`

Returns full detail for one protein by UniProt ID or AlphaFold entry ID. Checks hero JSON first; falls back to live API enrichment.

### `GET /complex/{id}/binding-sites`

Runs fpocket on both monomer and dimer structures, identifies interface pockets, and returns ranked pockets with druggability scores and residue lists. Computationally intensive — results are cached per UniProt ID for the server session.

### `GET /undrugged?filter={filter}&limit={limit}`

Returns pre-ranked proteins from the hero dataset sorted by Gap Score. Filter options: `all`, `who_pathogen`, `human_disease`. Limit defaults to 25, max 50. Always served from hero JSON — no live API calls.

### `GET /chembl?pocket_id={id}&volume={v}&hydrophobicity={h}&polarity={p}`

Queries ChEMBL for fragment molecules matching the geometric profile of an identified pocket. Requires a prior binding-sites call for the same protein in the current server session.

---

## Roadmap

**Research Notebook** — persistent workspace for saving protein complexes, annotating them with researcher notes, comparing multiple targets side by side in a metric table, and exporting structured PDF reports. Backed by MongoDB. Detailed specification in [RESEARCH-NOTEBOOK.md](./RESEARCH-NOTEBOOK.md).

**Intelligent Search Expansion** — the current query classifier handles gene names, UniProt IDs, disease terms, and organism names. Planned additions include pathway-level search (returning all proteins in a named biological pathway) and sequence similarity search (BLAST-style input of an amino acid sequence returning structurally similar proteins in the dataset).

**Bulk Dataset Coverage** — ProtPocket currently computes Gap Scores and disorder deltas on demand for individual queries. The planned bulk pipeline would pre-compute these across the full 1.7 million homodimer dataset, store results in PostgreSQL, and make the entire collection searchable by any metric — creating a global drug target atlas from the March 2026 release.

**Heterodimer Support** — the March 2026 AlphaFold release included monomer and homodimer predictions. Heterodimer predictions — complexes of two different proteins — are actively being computed by the AlphaFold consortium and will be added to the database in coming months. ProtPocket's architecture is designed to accommodate heterodimers when they become available through the same API pipeline.

**AutoDock Vina Integration** — extending the binding site pipeline with full molecular docking, computing predicted binding energies (kcal/mol) and visualizing docked poses in the Mol* viewer.

---

## Citation

If you use ProtPocket in research, please cite the AlphaFold Database and the March 2026 complex release:

> Fleming J. et al. AlphaFold Protein Structure Database and 3D-Beacons: New Data and Capabilities. *Journal of Molecular Biology* (2025).

> EMBL-EBI, Google DeepMind, NVIDIA, Seoul National University. Millions of protein complexes added to AlphaFold Database. March 16, 2026. https://www.embl.org/news/science-technology/first-complexes-alphafold-database/

The technical discovery of the AlphaFold complex API pipeline is documented in [COMPLEX.md](./COMPLEX.md) and may be cited independently.

---

## License

MIT License. All data sources used by ProtPocket are freely available under open licenses — AlphaFold data under CC BY 4.0, ChEMBL and UniProt under CC BY-SA 4.0.