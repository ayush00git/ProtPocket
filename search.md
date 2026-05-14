# Search Pipeline — Bug Report & Fixes

## What Was Wrong

1. **Hard cap of 10 results** (`handlers/search.go`) — `SearchUniProt` was called with `limit=10`, so the pipeline never fetched more than 10 UniProt IDs regardless of query size.

2. **Silent AlphaFold attrition** (`handlers/search.go`) — proteins without an AlphaFold monomer prediction were silently dropped in `buildComplexFromUniProt`. With a cap of 10 and ~70% drop rate on generic queries, only 2–3 results were returned.

3. **No Swiss-Prot filter** (`services/uniprot.go`) — unreviewed TrEMBL entries were included in search results. TrEMBL has very low AlphaFold coverage and is being deprecated by UniProt.

4. **No relevance sorting** (`services/uniprot.go`) — UniProt was queried without `sort=score`, so the most relevant proteins were not prioritised.

5. **Narrow hero search** (`data/loader.go`) — `FindHeroByGeneOrProtein` only matched on gene name, protein name, and organism — missing disease associations and category.

## What Was Fixed

- `services/uniprot.go` — query now appends `AND (reviewed:true)` and `sort=score`; Swiss-Prot only, best matches first.
- `handlers/search.go` — limit raised from `10` → `50` to survive AlphaFold attrition; added a hard guard to discard any non-Swiss-Prot entry that slips through.
- `data/loader.go` — hero search now also matches on `DiseaseAssoc` and `Category` fields.
