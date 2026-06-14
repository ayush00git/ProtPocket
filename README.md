# ProtPocket

**From protein name to ranked drug binding sites — in seconds.**

ProtPocket is an open-source tool for finding druggable pockets in proteins using [AlphaFold](https://alphafold.ebi.ac.uk/) structure predictions. Search any protein by name, gene symbol, or accession number, and ProtPocket will automatically compare the single-chain and two-chain (homodimer) structures, detect surface pockets, score them by drug discovery priority, and let you dock molecules directly in the browser.

**Live:** https://protpocket.ayushz.me

---

## Table of Contents

1. [What is ProtPocket](#what-is-protpocket)
2. [Example: PEA15](#example-pea15)
   - [Search](#search)
   - [Result card](#result-card)
   - [Pocket analysis](#pocket-analysis)
   - [Molecular docking](#molecular-docking)
3. [The Gap Score](#the-gap-score)
4. [Data Sources](#data-sources)
5. [Installation](#installation)

---

## What is ProtPocket

Most proteins only become biologically active when two identical copies fold together — a structure called a **homodimer**. The point where those two copies meet creates surface pockets that do not exist in either copy on its own. These interface pockets are among the most valuable targets in drug discovery, but they are invisible to any tool that looks at only a single protein chain.

ProtPocket makes these pockets visible. For every protein you search, it:

- Fetches both the single-chain and two-chain [AlphaFold](https://alphafold.ebi.ac.uk/) predictions
- Runs pocket detection on each structure and highlights pockets that only appear in the homodimer
- Scores every protein by how urgently it needs a drug (see [Gap Score](#the-gap-score))
- Lets you dock small molecules into any pocket and view the result in an interactive 3D viewer

The homodimer structures come from the [March 2026 AlphaFold complex release](https://www.embl.org/news/science-technology/first-complexes-alphafold-database/) — the largest protein complex dataset ever assembled.

---

## Example: PEA15

PEA15 is a small human protein that blocks cell death and is overexpressed in several cancers and type 2 diabetes. It has no approved drugs. As a single chain it is mostly unstructured; as a homodimer it becomes well-ordered, making the interface a clear target. It is a good example for this walkthrough because every ProtPocket feature is relevant to it.

### Search

Go to [protpocket.ayushz.me](https://protpocket.ayushz.me) and type `PEA15` into the search bar.

ProtPocket recognises this as a gene name and queries [UniProt](https://www.uniprot.org/), [AlphaFold](https://alphafold.ebi.ac.uk/), and [ChEMBL](https://www.ebi.ac.uk/chembl/) at the same time. Within a few seconds you see a list of matching proteins with their scores.

![Searching for PEA15 on the platform](./public/img/pea15-search.png)

### Result card

Each card shows three numbers at a glance:

| Field | What it means |
|-------|---------------|
| **Confidence** | [AlphaFold](https://alphafold.ebi.ac.uk/)'s confidence in the predicted structure, averaged across the homodimer. Scores above 70 are considered reliable. |
| **Disorder Δ** | How much more ordered the protein becomes when it dimerizes. A positive number means the functional shape only appears in the two-chain form. PEA15 shows +6.3 here. |
| **Gap Score** | ProtPocket's priority score. Higher means more urgently undrugged. PEA15 scores high because it is well-predicted as a dimer, has zero approved drugs, and its structure is revealed by dimerization. |

![PEA15 result card showing confidence, disorder delta, and Gap Score](./public/img/pea15-card.png)

Click the card to open the full detail page, which shows the monomer and homodimer structures side by side and all the key metrics in one view.

![PEA15 detail page — monomer vs homodimer comparison with metrics](./public/img/pea15-detail.png)

### Pocket analysis

Click **Analyze Pockets** on the PEA15 card. ProtPocket downloads both structure files and scans each one for surface pockets. This runs on the server — nothing is downloaded to your computer.

**Single-chain vs homodimer:** The lone PEA15 chain has only shallow, poorly defined pockets. When both chains are present, the structure locks into shape and new, deeper pockets appear at the interface — pockets that did not exist before. These are flagged as **interface pockets** and sorted to the top of the list.

![Pocket list showing interface pockets on the PEA15 homodimer](./public/img/pea15-comparison.png)

A molecule that binds an interface pocket physically prevents the two chains from coming together, disrupting the protein's function at its source.

**What the disorder delta is telling you:** PEA15's single chain has low structural confidence. The homodimer is much more ordered (+6.3). The residues that become ordered are the ones forming the dimer interface — precisely the ones lining the top-ranked pockets.

The full expanded view shows both structures side by side with pockets highlighted in green. Blue regions mean [AlphaFold](https://alphafold.ebi.ac.uk/) is confident about those positions; orange/red regions are less certain.

![Side-by-side structure comparison with highlighted pockets](./public/img/pea15-pocket-analysis.png)

### Molecular docking

Once pocket analysis is done you can test whether a small molecule fits inside any pocket.

**Select a pocket and molecule.** Choose the top-ranked interface pocket. You will see a list of fragment molecules whose shapes are a geometric match for this cavity, drawn from [ChEMBL](https://www.ebi.ac.uk/chembl/) — a public database of molecules with known biological activity. Select one and click **Run Docking**.

![Docking panel showing fragment selection and leaderboard](./public/img/pea15-dock-lead.png)

Behind the scenes ProtPocket converts the fragment into a 3D shape, prepares the PEA15 homodimer as the docking target, and runs [AutoDock Vina](https://vina.scripps.edu/) to test how and where the fragment fits inside the pocket. Results stream back to the browser automatically.

**View the result.** The [Mol*](https://molstar.org/) 3D viewer loads the top-ranked pose sitting inside the PEA15 structure. You can rotate, zoom, and switch between alternative conformations using the leaderboard. A molecule sitting inside a blue (high-confidence) region is a trustworthy result.

![Docked molecule visualized inside the PEA15 pocket in Mol*](./public/img/pea15-dock.png)

**Reading the scores.** Each conformation is ranked by predicted binding affinity in kcal/mol. More negative = stronger predicted binding. Scores below −7 kcal/mol are considered good starting points for experimental follow-up. These are computational estimates — they guide which fragments are worth testing in the lab, not a guarantee of real-world binding.

---

## The Gap Score

The Gap Score answers one question: *given everything known about this protein, how urgently does the world need a drug for it?*

```
Gap Score = pLDDT_norm × undrugged_factor × WHO_multiplier + disorder_bonus
```

- **pLDDT_norm** — structural confidence, normalized 0–1. Unreliable predictions don't rank highly.
- **undrugged_factor** — how uncovered the target is by existing drugs. Zero approved drugs = 1.0 (maximum urgency). More drugs = lower score.
- **WHO_multiplier** — a 2× boost for proteins from pathogens on the WHO's critical antimicrobial resistance list.
- **disorder_bonus** — a small addition when the protein's structure is significantly more ordered in the dimer than the monomer, rewarding the most scientifically novel entries in the dataset.

Results on the homepage are sorted by Gap Score descending — the most urgently undrugged, well-predicted complex appears first.

---

## Data Sources

| Source | Role |
|--------|------|
| **[AlphaFold Database](https://alphafold.ebi.ac.uk/)** ([EMBL-EBI](https://www.ebi.ac.uk/) / [Google DeepMind](https://deepmind.google/)) | Single-chain and homodimer structure predictions |
| **[UniProt](https://www.uniprot.org/)** | Gene names, organism, disease associations |
| **[ChEMBL](https://www.ebi.ac.uk/chembl/)** ([EMBL-EBI](https://www.ebi.ac.uk/)) | Approved drug counts and fragment suggestions |
| **[fpocket](https://github.com/Discngine/fpocket)** | Pocket detection, runs locally on the server |
| **[AutoDock Vina](https://vina.scripps.edu/)** | Docking engine, runs locally on the server |
| **[Open Babel](https://openbabel.org/)** | Molecular format conversions |
| **[WHO Priority Pathogen List (2024)](https://www.who.int/publications/i/item/9789240093461)** | Powers the 2× Gap Score multiplier for critical pathogens |

ProtPocket does not store or redistribute [AlphaFold](https://alphafold.ebi.ac.uk/) structure files. All structure data is linked directly to [EMBL-EBI](https://www.ebi.ac.uk/)'s servers.

---

## Installation

See [INSTALLATION.md](./INSTALLATION.md) for self-hosting instructions.

---

## Citation

If you use ProtPocket in research, please cite the AlphaFold Database and the March 2026 complex release:

> Fleming J. et al. AlphaFold Protein Structure Database and 3D-Beacons: New Data and Capabilities. *Journal of Molecular Biology* (2025).

> EMBL-EBI, Google DeepMind, NVIDIA, Seoul National University. Millions of protein complexes added to AlphaFold Database. March 16, 2026. https://www.embl.org/news/science-technology/first-complexes-alphafold-database/
