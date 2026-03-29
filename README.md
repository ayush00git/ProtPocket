<<<<<<< Updated upstream
# ProtPocket
### Theme Alignment: MedTech / Healthcare + AI & Machine Learning

---

## 🚀 Current Implementation Status

**Phases 1-3 Completed.**

- **Backend (Phase 2):** Fully running Go/GoFr API mapped at the repository root containing endpoints for search, complex details, undrugged targets dashboard, and newly added **binding site prediction** capabilities.
- **Frontend (Phase 3):** Fully active in the `/app` directory. Built with **Vite, React 19, and Tailwind CSS** (shifted from Next.js for a more lightweight SPA architecture). Includes Mol* 3D viewer and structure reveal animations.
- **Data (Phase 1):** 30 curated hero complexes synthesized and stored in `data/hero_complexes.json`.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [The Innovation — What We're Actually Building](#2-the-innovation)
3. [Solution Architecture](#3-solution-architecture)
4. [Tech Stack (Aligned to Sponsors)](#4-tech-stack)
5. [System Design](#5-system-design)
6. [Feature Breakdown](#6-feature-breakdown)
7. [Implementation Plan — Hour by Hour](#7-implementation-plan)
8. [API & Data Sources](#8-api--data-sources)
9. [Demo Day Script](#9-demo-day-script)
10. [Why This Wins](#10-why-this-wins)
11. [Team Role Split](#11-team-role-split)
12. [Risk Register](#12-risk-register)

---

## 1. Problem Statement

### The Biological Context

Proteins are the machinery of life. But they rarely work alone — they bind to each other, forming **protein complexes** that carry out almost every function in the human body: switching genes on and off, fighting pathogens, building tissue, signalling between cells.

For decades, scientists could only study proteins in isolation. On March 16, 2026 — **less than two weeks before this hackathon** — EMBL-EBI, Google DeepMind, NVIDIA, and Seoul National University released the largest dataset of AI-predicted protein complex structures ever assembled: **1.7 million high-confidence homodimer structures** added to the AlphaFold Database, with 18 million more available for bulk download.

### The Problem No One Has Solved Yet

This dataset is enormous, raw, and completely unexplored. Right now:

- **Researchers** have to manually query individual proteins through the AlphaFold Database — there is no discovery layer, no ranking, no disease context.
- **The "disordered → ordered" phenomenon** is buried in the data. Many proteins appear structurally disordered as a monomer but snap into a stable, functional shape only when paired with their partner — revealing biology that single-chain models miss entirely. There is no tool that surfaces these dramatic structural transitions.
- **The drug target gap is invisible.** Among the WHO's priority pathogens — the deadliest bacteria and viruses on Earth — we now have predicted complex structures. But nobody has mapped which of these complexes represent undrugged interactions: proteins that are biologically critical but have no existing approved drug targeting them.

### The Core Problem Statement

> *Scientists and drug discovery teams cannot efficiently identify which newly predicted protein complexes represent the highest-priority, undrugged targets for disease intervention — and there is no tool that makes the structural story of these complexes visually and narratively accessible.*

---

## 2. The Innovation

This is not a pretty frontend over an API. Here is what we are actually building that doesn't exist yet:

### Innovation 1: Automated Drug Target Gap Finder

We cross-reference three independent data sources in real time:

1. **AlphaFold Database** — structure + confidence score of a complex
2. **ChEMBL / DrugBank** — known drugs and their protein targets
3. **WHO Priority Pathogen List** — the 19 pathogens WHO has designated as critical

Our pipeline flags complexes where:
- Confidence score is high (> 70 pLDDT)
- The protein is from a WHO priority pathogen OR a human cancer/disease gene
- No approved drug currently targets this interaction

**Output:** A ranked "Undrugged Targets" list — a research prioritization tool that would take a scientist weeks to compile manually, delivered in seconds.

### Innovation 2: The Structural Reveal Engine

We surface the "disordered → ordered" transition that is the defining scientific insight of the new dataset. For each complex, we compute and display:

- **Monomer disorder score** — using pLDDT per-residue scores from the single-chain AlphaFold model
- **Dimer order gain** — the delta in structural confidence when the complex is formed
- **Visual side-by-side** — 3D viewer showing the floppy monomer next to the locked dimer

Complexes with the highest disorder-to-order delta are surfaced as "Hidden Structure" cases — the ones where the biology was completely invisible until the partner was added. This is a metric no existing tool computes or ranks by.

### Innovation 3: AI Narrative Synthesis

The AlphaFold Database gives you coordinates and confidence numbers. It gives you no meaning. We use the Claude API to synthesize a plain-English research brief per complex, pulling context from the protein's known biology, its disease associations, and its structural novelty score. This turns a structure file into an insight.

### Innovation 4: The Interface Pocket Engine (fpocket + ZINC)

Identifying an undrugged protein is only step one; knowing *where* to drug it is the actual bottleneck. ProtPocket integrates `fpocket` to dynamically scan the complex's 3D geometry for cavities. By cross-referencing geometric pockets with our thermodynamic **Disorder Delta**, we flag pockets that sit on residues gaining immediate stability upon dimerization (Δ pLDDT ≥ 5.0) as **Interface Pockets**—the "Holy Grail" of Protein-Protein Interaction (PPI) inhibitors. ProtPocket then queries the ZINC database to automatically suggest physical fragment compounds (leads), transforming ProtPocket from a search engine into an **end-to-end drug lead generation platform**.

---

## 3. Solution Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     ProtPocket UI                      │
│       (Vite + React + Mol* 3D Viewer + Tailwind)        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    GoFr Backend (Go)                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Search Engine  │  │  Gap Finder  │  │ AI Synth  │  │
│  │  (protein/dis-  │  │  Pipeline    │  │ (Claude   │  │
│  │   ease lookup)  │  │              │  │  API)     │  │
│  └────────┬────────┘  └──────┬───────┘  └─────┬─────┘  │
└───────────┼───────────────────┼────────────────┼────────┘
            │                   │                │
   ┌────────▼──────┐  ┌────────▼──────┐  ┌──────▼──────┐
   │ AlphaFold DB  │  │ ChEMBL & ZINC │  │ PubMed API  │
   │ REST API      │  │ (drugs/leads) │  │ (literature)│
   └───────────────┘  └───────────────┘  └─────────────┘
```

### Data Flow

1. User searches a protein name, disease, or organism
2. GoFr backend queries AlphaFold API for matching complexes + confidence data
3. Gap Finder pipeline checks ChEMBL for known drugs targeting those proteins
4. Disorder delta is computed from per-residue pLDDT scores
5. Claude API synthesizes a research brief combining all signals
6. Frontend renders search results ranked by "gap score" (high confidence + undrugged)
7. User clicks a complex → 3D Mol* viewer loads monomer + dimer side by side
8. Structural reveal animation plays; AI brief displayed below
9. User runs Pocket Analysis → `fpocket` finds cavities and backend flags **Interface Pockets** (Δ pLDDT ≥ 5.0)
10. Backend fetches fragment suggestions from ZINC; natively highlights the drug binding pocket in 3D

---

## 4. Tech Stack

Every major technology choice is deliberately aligned to HackMol 7.0's sponsors and judging criteria.

### Frontend

| Technology | Reason |
|---|---|
| **Vite + React 19** | Fast, modern client-side React rendering; straightforward deployment (Moved from Next.js for a simpler SPA approach). |
| **V0 by Vercel** *(Gold Sponsor)* | Used V0 to rapidly prototype and generate the initial UI components — explicitly leverages the sponsor's tool, which judges will notice and appreciate |
| **Tailwind CSS** | Utility-first, fast to build with, works seamlessly with V0 output |
| **Mol* Viewer** | The industry-standard open-source 3D protein structure viewer used by PDB and AlphaFold Database itself. Embeddable as a React component. Handles PDB/mmCIF files natively. |
| **Framer Motion** | Smooth animations for the monomer → dimer structural reveal transition |

### Backend

| Technology | Reason |
|---|---|
| **GoFr** *(Gold Sponsor)* | GoFr is a Go microservice framework — explicitly a HackMol sponsor. Using it as our backend framework directly supports the sponsor relationship and demonstrates awareness. Fast, structured, production-ready. |
| **Go** | Excellent for concurrent API calls (fetching AlphaFold + ChEMBL + PubMed simultaneously with goroutines) |

### AI & Intelligence Layer

| Technology | Reason |
|---|---|
| **Claude API (Anthropic)** | Powers the narrative synthesis layer — given a protein complex's metadata, generates a plain-English research brief explaining the biology, disease relevance, and drug target status |
| **fpocket (Structural Chemistry)** | Open-source protein cavity detection algorithm based on Voronoi tessellation and alpha spheres, mathematically scanning for druggable interfaces on predicted complexes |
| **Custom Gap Scoring Algorithm** | Our own logic: `gap_score = confidence_pLDDT × (1 - drug_coverage) × who_priority_multiplier` |
| **Disorder Delta Computation** | Computed from per-residue pLDDT from monomer vs. complex predictions |

### Deployment & Infrastructure

| Technology | Reason |
|---|---|
| **Vercel** *(V0 is Vercel's product — Gold Sponsor)* | Deploy Vite frontend to Vercel for zero-config deployment with a live URL ready for demo day |
| **Railway / Render** | Deploy GoFr backend as a containerized service |
| **Devfolio** *(Silver Sponsor)* | Project submission platform — ensures visibility to sponsor judges |

### Data Sources (All Free / Open)

| Source | What We Use |
|---|---|
| **AlphaFold Database REST API** | Protein structure data, pLDDT scores, complex predictions |
| **ZINC Database API** | Chemical properties computation and fragment/lead molecule suggestions for discovered pockets |
| **ChEMBL REST API** | Drug-target associations, approved drug coverage per protein |
| **UniProt API** | Protein metadata, gene names, organism, disease associations |
| **WHO Priority Pathogen List** | Hardcoded list of 19 pathogens; used as a filter multiplier |

---

## 5. System Design

### The Gap Score Algorithm

This is the core innovation of ProtPocket. Every complex in our results is ranked by a Gap Score:

```
Gap Score = pLDDT_confidence × (1 - drug_coverage) × who_multiplier × disorder_delta_bonus

Where:
- pLDDT_confidence    = AlphaFold confidence score normalized 0–1 (from 0–100)
- drug_coverage       = 0 if no drugs target this protein, 1 if fully covered
- who_multiplier      = 2.0 if organism is on WHO priority pathogen list, else 1.0
- disorder_delta_bonus= (dimer_avg_pLDDT - monomer_avg_pLDDT) / 100, bonus for dramatic reveals
```

A perfect gap score target: a high-confidence complex (0.9) in a WHO pathogen (×2.0) with no drugs (×1.0) and a dramatic structural reveal (+0.3 bonus) → score of ~2.1. These are the entries we surface at the top.

### Database Schema (in-memory / cached)

```
Complex {
  alphafold_id        string
  protein_name        string
  uniprot_id          string
  organism            string
  is_who_pathogen     bool
  disease_associations []string
  monomer_plddt_avg   float
  dimer_plddt_avg     float
  disorder_delta      float
  drug_count          int
  known_drug_names    []string
  gap_score           float
  ai_brief            string  // generated by Claude, cached
  structure_url       string  // mmCIF file URL for Mol* viewer
}
```

### Caching Strategy

Claude API calls are expensive per-request. We pre-generate AI briefs for our 30 curated "hero" complexes at startup and cache them. For live searches, briefs are generated on first query and cached in memory for the session.

---

## 6. Feature Breakdown

### Feature 1: Smart Search

- Input: protein name (e.g. "TP53"), disease (e.g. "tuberculosis"), or organism (e.g. "M. tuberculosis")
- Output: ranked list of protein complexes sorted by Gap Score
- Each card shows: protein name, organism, confidence badge (color-coded), WHO pathogen flag, drug count chip, disorder delta indicator

### Feature 2: The Undrugged Targets Dashboard

- A pre-computed leaderboard of the highest Gap Score complexes across all 20 studied species
- Filterable by: WHO pathogen only | Human disease only | High disorder delta only
- This is the research tool that justifies the project's existence beyond a pretty UI

### Feature 3: The Structural Reveal

- Click any complex → detail page opens
- Two Mol* viewers side by side: Monomer (left) vs. Dimer (right)
- Both colored by pLDDT score (blue = confident, red = disordered)
- "Reveal" button triggers an animation: the monomer view transitions to the dimer with a smooth morph effect
- Below: disorder delta metric displayed as a visual bar — "this protein gained X% structural confidence when paired"

### Feature 4: AI Research Brief

- Rendered below the 3D viewer
- Covers: what this protein does, what goes wrong in disease, why the interaction matters, current drug landscape, why this is a priority target
- Tone: written for a researcher, not a student — precise, citable, useful
- Generated by Claude API with a structured prompt including pLDDT, disease associations, drug count, and organism context

### Feature 5: Automated Binding Site & Fragment Suggestion

- "Run Pocket Analysis" scans the complex for cavities using `fpocket`.
- Flags "Interface Pockets" where geometric cavities intersect with high Disorder Delta (Δ pLDDT ≥ 5.0).
- Queries ZINC database to automatically suggest physical fragment hit compounds.
- Mol* 3D viewer instantly centers and highlights the optimal binding pocket natively.

### Feature 6: Export & Share

- "Copy cite-ready summary" button — outputs a structured summary of the complex with AlphaFold ID, gap score, and AI brief
- Shareable URL per complex (e.g. ProtPocket.app/complex/AF-0000000066503175)

---

## 7. Implementation Plan — Hour by Hour

### Pre-Hackathon (Before March 28)

- [ ] Read AlphaFold API docs thoroughly; test endpoints for pLDDT data
- [ ] Test ChEMBL API for drug-target queries
- [x] Identify and manually curate 30 "hero" complexes (10 human disease, 10 WHO pathogens, 10 high disorder delta) — this is your demo safety net
- [x] Set up GitHub repo with monorepo structure: `/app` (Vite/React) and root directory (Go/GoFr)
- [ ] Get Claude API key ready; test a brief generation prompt
- [ ] Use V0 by Vercel to generate initial UI wireframe/components (this is fast and leverages the sponsor tool)

---

### Hour 0–2: Kickoff & Setup

**All team members**
- Finalize repo structure, agree on API contracts between frontend and backend
- Set up Vercel project linked to GitHub (auto-deploy on push)
- Set up Railway project for GoFr backend
- Load the 30 hero complexes into a JSON file as a hardcoded fallback — this is your insurance policy if APIs fail during demo

**GoFr Backend skeleton:**
```go
// main.go
package main

import "gofr.dev/pkg/gofr"

func main() {
    app := gofr.New()
    app.GET("/search", SearchHandler)
    app.GET("/complex/:id", ComplexDetailHandler)
    app.GET("/undrugged", UndruggedTargetsHandler)
    app.Run()
}
=======
<div align="center">
  <img src="./app/public/logo.png" width="120" alt="ProtPocket Logo" />
  <h1>ProtPocket : Protein Complex Intelligence</h1>
  <p><strong>A Comprehensive Computational Framework for Early-Stage Drug Discovery</strong></p>

  [Introduction & Problem](#-1-introduction--the-undruggable-problem) • [Glossary](#-2-glossary-for-non-experts) • [The Discovery Pipeline](#-3-the-discovery-pipeline) • [Formulas Explained](#-4-mathematical-formulas-explained) • [System Architecture](#-5-system-architecture-the-brain-and-the-face) • [End-to-End Case Study](#-6-end-to-end-case-study) • [Setup](#-7-setup--installation)
</div>

---

## 🔬 1. Introduction & The "Undruggable" Problem

Welcome to **ProtPocket**, a unified, automated computational pipeline designed to accelerate the earliest phases of drug discovery.

### The Challenge of Modern Medicine
Our bodies are driven by **Proteins**—nature's tiny, complex biological machines. These proteins govern all aspects of human biology, from cellular respiration to immune responses. When they malfunction, mutate, or interact improperly, they cause severe human diseases such as cancer, neurodegenerative disorders like Alzheimer's, or dangerous infectious diseases like tuberculosis. 

To fix a malfunctioning protein, doctors prescribe a **Drug**. Chemically, a drug is usually a very small molecule designed to physically latch onto the large protein and alter its behavior—much like throwing a wrench into a spinning gear, effectively grinding the disease process to a halt.

However, historically, the worldwide pharmaceutical industry has faced a massive, almost insurmountable hurdle: the **"Undruggable" Proteome**. 

An estimated 80% to 85% of all disease-causing human proteins are currently considered "undruggable." Why is this the case? The answer lies in structural biology. For a small drug molecule to latch onto a protein, the protein must have a stable, rigid structural shape (a lock) for the drug (the key) to fit into. Unfortunately, many crucial proteins are physically "floppy." They have no stable shape when observed alone. If a protein is constantly wiggling like a loose piece of string in the cellular environment, a rigid drug molecule cannot grab onto it. 

Even more complex is the fact that many diseases are caused not by single proteins acting alone, but by two different proteins temporarily sticking together to form a larger **Complex**. Breaking this connection is notoriously difficult because the areas where they connect are often flat, lacking obvious "keyholes" for drugs.

### The ProtPocket Solution
**ProtPocket** is a software platform built to solve this exact, multi-billion-dollar problem. By leveraging recent, revolutionary breakthroughs in Artificial Intelligence—specifically structural predictions derived from Google DeepMind's AlphaFold database—ProtPocket automatically discovers hidden "grabbing points" (called Pockets) on protein complexes. 

Crucially, ProtPocket focuses entirely on pockets that *only physically exist* when the disease-causing proteins join together. 

This repository documents the entire codebase, the newly developed mathematical formulas we utilize, and the complete system architecture that takes a researcher from a simple textual protein name all the way to a fully mapped, 3D drug target with suggested chemical starting points—all running entirely locally or self-hosted.

---

## 📖 2. Glossary (For Non-Experts)

To ensure this documentation is fully accessible to software engineers, product designers, and judges from non-biological backgrounds, please review the following core scientific concepts before diving into the system architecture.

*   **Amino Acid / Residue**: The basic building blocks of a protein. A protein is essentially a tremendously long chain of amino acids naturally folded into a 3D shape, similar to a tangled telephone cord. In this document, we often refer to them individually as "residues."
*   **Monomer**: A single, solitary protein chain floating by itself in an environment.
*   **Complex (or Dimer / Homodimer)**: Two or more unique protein chains that have naturally joined together to perform a specific biological task. If the two assembled chains are perfectly identical, the overall structure is called a "Homodimer."
*   **Interface**: The exact, physical connecting boundary where two unique protein chains actually touch each other in a complex.
*   **Intrinsically Disordered Region (IDR) / Disorder**: An area on a protein (or an entire protein itself) that is physically "floppy" and completely lacks a fixed, rigid 3D shape when it is alone. 
*   **pLDDT (predicted Local Distance Difference Test)**: A sophisticated confidence score ranging from 0 to 100 generated by the AlphaFold AI system. It mathematically predicts how stable a specific region of a protein is. 
    *   A **low pLDDT score** (less than 50) means the AI concludes that region is a "floppy" string. 
    *   A **high pLDDT score** (greater than 70) means the AI is confident that the specific region forms a stable, solid, and reliable structure. 
*   **Pocket (or Cavity / Void)**: A tiny cleft, hole, indentation, or cavern on the 3D surface of a protein. A pocket is exactly where a small drug molecule can physically "fit," acting precisely like a key entering a lock.
*   **Molecular Docking**: A complex computer simulation used by scientists that tries to mathematically deduce whether a specific chemical molecule can geometrically and chemically fit inside a specific protein pocket.
*   **Fragment**: A very small, simple chemical molecule (usually under 300 Daltons in mass). It is not a finished drug you would take from a pharmacy, but it might lightly fit into a pocket. Chemists use fragments as a starting foundation (often called a "Lead") to build larger, complete drugs iteratively.

---

## 🧬 3. The Discovery Pipeline

Developing a brand-new medicine from scratch can take between 10 to 15 years and easily cost over two billion dollars. The journey is broken into several distinct, rigorous "Stages" of research and development. ProtPocket completely and flawlessly automates the **First Four Stages** of this massive pipeline, reducing what normally requires months of manual database searching and computational biology down to mere seconds.

### Stage 1: Target Identification (Finding the Target)
**The Goal:** Find the right "villain." We need to locate a specific disease-causing protein that desperately needs a new therapeutic solution and has not been solved yet.

**How we solve it:** ProtPocket automatically queries three major, independent biological API databases simultaneously via its highly optimized Go backend:
1.  **UniProt (Universal Protein Resource):** Providing the true identity, the official gene name, and the documented disease associations of the queried protein.
2.  **AlphaFold Database:** Providing the raw 3D coordinate files (mmCIF format) for the exact atoms of the protein's predicted structure.
3.  **ChEMBL:** A massive pharmaceutical database providing the total number of approved drugs currently targeting this specific protein globally.

**The Output:** The pipeline continuously gathers this data and strictly filters for proteins linked to high-priority diseases. Crucially, the system checks the ChEMBL response payload to ensure that the protein **does not yet have any known approved drugs**. Finding a protein with zero known drugs proves it is a novel and urgent target for research.

### Stage 2: Target Validation (Proving It's a Good Target)
**The Goal:** Prove mathematically and physically that aiming a new, expensive drug at this specific protein will actually result in a stable binding event, rather than the drug simply slipping off a "floppy" string.

**How we solve it:** ProtPocket introduces a custom computational calculation built directly upon AlphaFold confidence data, called the **Disorder Delta**. The Go backend fetches the AlphaFold pLDDT (stability) score for the solitary Monomer, and directly compares it to the AlphaFold pLDDT score for the joint Complex variant of the same protein. We are actively hunting for proteins that are completely disordered (unstable) when alone, but become rigid and stable when they physically stick to their partner complex.

**The Output:** A high positive Disorder Delta acts as irrefutable mathematical proof. It validates that the protein *only* holds a functional, stable, and targetable structural shape when it is actively engaged in its disease-causing complex. It validates that the structural change is directly and inextricably tied to the biological function of the disease.

### Stage 3: Pocket Mapping (Finding the Keyhole)
**The Goal:** Now that we have validated a stable target, we need to find the exact physical volumetric space (the 3D coordinates) on the protein where a human chemist can design a drug to bind and interrupt the process.

**How we solve it:** The backend system safely and securely downloads the raw 3D structural file (`.cif`) of the complex into an isolated local temporary directory. It then spawns a secure sub-process running an established scientific algorithm called `fpocket`. `fpocket` uses a geometrical mathematics technique called Voronoi tessellation to systematically scan the entire microscopic surface of the 3D protein, searching for spheres of empty space (cavities).

**The Output:** `fpocket` may find 50 or more different cavities scattered randomly across the massive protein structure. ProtPocket computationally parses this raw output data and specifically filters for the highly-coveted **Interface Pockets**. These are very specific cavities that sit exactly on the physical boundary where the two distinct proteins touch *and* whose atoms directly align with the regions that gained stability (derived from the Disorder Delta in Stage 2). Jamming a small molecule into an Interface Pocket acts precisely like throwing a metal wedge between two moving gears, powerfully forcing the biological complex to break apart and stop the disease.

### Stage 4: Lead Generation (Suggesting the Key)
**The Goal:** Suggest a real, physical chemical starting point that structurally, geometrically, and chemically matches the keyhole found in Stage 3.

**How we solve it:** Once an Interface Pocket has been geographically mapped, the backend algorithm calculates the pocket's strict physical constraints: How physically large is it (its Volume)? Is it highly watery or oily (its Hydrophobicity)? Is it electrically charged (its Polarity)? Armed with these precise constraints, ProtPocket automatically packages an HTTP request out to the **ChEMBL API**, a massive public catalogue containing millions of bioactive chemical compounds.

**The Output:** The system queries ChEMBL and automatically suggests small molecules (Fragments) that physically and chemically match the pocket's geometry. These compounds serve as computational "Leads"—starting scaffolds that a human medicinal chemist can academically test in a laboratory, and systematically expand block-by-block into a final, FDA-approved medicine.

---

## 🧮 4. Mathematical Formulas Explained

ProtPocket does not just act as an aggregator of existing data; it computes entirely new insights using a suite of specific, proprietary mathematical formulas developed specifically for this architectural project.

### 4.1. The Disorder Delta (Δ pLDDT) Formula
The most critical thermodynamic observation made by the system is tracking how a protein's stability shifts dynamically. As defined previously in the glossary, AlphaFold provides a pLDDT score (ranging from 0.0 to 100.0) measuring absolute confidence in the structure. 

The Go backend (specifically located in the file `services/plddt.go`) programmatically aligns the sequence of the solitary Monomer and the paired Dimer (Complex) and calculates the delta:

`Disorder Delta = (pLDDT of Dimer) - (pLDDT of Monomer)`

*   **If Disorder Delta ≈ 0:** The protein is a rigid rock whether it is alone or grouped. It is a traditional target, but inherently not a novel "folding-upon-binding" target.
*   **If Disorder Delta < 0:** The protein ironically loses structure upon binding (which is scientifically rare but possible).
*   **If Disorder Delta >= 15 to 30:** This is classified as the "Golden Target." It proves that the protein chain is highly disordered as a monomer (for example, with a low pLDDT ~45), but upon binding its partner, it locks into a perfectly rigid structure (shooting up to a pLDDT ~85). The massive 40-point gain represents a profound thermodynamic stabilization force that a drug could interrupt.

### 4.2. Dimerization Druggability Gain Index (DDGI)
When the system is traversing multiple pockets found by fpocket, we calculate a compound score that merges geometrical viability mathematically with the thermodynamic stability gain:

`DDGI = (fpocket Druggability Score) × (Average Local Interface Disorder Delta)`

The `fpocket` Druggability Score evaluates the pocket's shape, while the Disorder Delta evaluates the pocket's biological relevance entirely. By multiplying them together, the DDGI heavily penalizes geometrically perfect pockets that sit on completely irrelevant parts of the protein, while massively boosting pockets that sit directly on the critical interface. 

### 4.3. The Urgency Gap Score
To rank multiple protein targets intelligently on the frontend UI dashboard, the system computes an overarching urgency metric.

`Gap Score = [ (Base Score) + (Disorder Delta Bonus) ] × (WHO Pathogen Multiplier) - (Drug Coverage Penalty)`

*   **Base Score:** This represents the baseline AlphaFold confidence of the overall complex. 
*   **WHO Pathogen Multiplier:** The World Health Organization maintains an official list of the 19 most dangerous global pathogens (like Mycobacterium tuberculosis or Staphylococcus aureus). In the code file `handlers/search.go`, if the protein's organism NCBI taxonomy ID matches this hard-coded list, the protein receives a strict mathematical parameter of `× 2.0` multiplier, immediately catapulting it to the very top of the urgency rankings.
*   **Drug Coverage Penalty:** If the ChEMBL database reports that 5 approved drugs already target this protein, the score is mathematically slashed toward zero. The platform fundamentally only cares about prioritizing the *undrugged* proteome to maximize pharmaceutical impact.

---

## ⚙️ 5. System Architecture: The Brain and the Face

ProtPocket is beautifully structured as a "Monorepo." It contains a robust, highly parallel backend server (The Brain) and an analytical, interactive frontend dashboard (The Face). Both systems operate entirely independently but communicate seamlessly.

### 5.1. The Backend (The Brain) - Built with Go
The backend is written entirely in **Go (Golang)**. This language choice was made to ensure extreme computational speed, native concurrency handling, and the ability to safely manage complex external biological subprocesses without blocking the server.

#### Concurrent Data Aggregation
When a user initiates a search for a protein, `handlers/search.go` spins up high-speed **goroutines** to execute network API calls concurrently across the internet. Instead of waiting for UniProt to finish loading before deciding to call AlphaFold, the Go backend queries `rest.uniprot.org`, `alphafold.ebi.ac.uk`, and `ebi.ac.uk/chembl` at the exact same time. The assorted JSON payloads are rapidly parsed, sanitized, and merged simultaneously into a single cohesive `models.Complex` struct in memory.

#### Safe Subprocessing for Algorithm Execution
Because Google DeepMind provides AlphaFold files simply as enormous lists of raw 3D coordinates (mmCIF format) without explicitly highlighting cavities or bindings, we must compute the exact cavities ourselves natively. 
1. The user requests a localized pocket analysis for a specific protein.
2. `services/alphafold.go` dynamically downloads the latest `.cif` asset file from DeepMind servers securely, storing it directly into a localized `./tmp` directory mapped effectively safely relative to the application's environment.
3. `services/fpocket.go` utilizes Go's native `os/exec` package to carefully spawn an isolated `fpocket` subprocess entirely detached from the main application thread.
4. The spawned subprocess rapidly runs Voronoi tessellation analysis over the immense asset file.
5. Once complete, the backend natively intercepts and parses the massive output text `structure_info.txt` alongside individual chunked `.pdb` atomic files representing the cavities, extracting the exact B-factor columns (specifically residue columns 61-66) to pull AlphaFold's structural translation out of the void mapping!

#### Chemical Networking
Following positive structural pocket discovery, `services/fragments.go` spins up a designated `sync.WaitGroup` that batches HTTP requests out to the ChEMBL API, forcing it to filter its internal database for molecules mapping strictly to the volume constraints of the newly-discovered Interface Pocket.

### 5.2. The Frontend (The Face) - Built with React & JavaScript
The frontend serves purely to translate raw chemical arrays and intensive floating-point math into highly intuitive, actionable user interfaces for biological researchers who may not be completely familiar with coding.

#### Dashboard and Data Visualization
The platform is built on modern **React**, specifically styled and themed without using bland default frameworks to maintain a premium, custom scientific aesthetic across the entire viewport. Mathematical data, such as the comparative Disorder Delta metrics, are mapped cleanly into interactive structural charts (utilizing customized visualization libraries like Recharts) to visually represent what we call the "Golden Quadrant" of druggable anomalies.

#### Deep Integration with the Mol* 3D Engine
The absolute crown jewel of the ProtPocket frontend is its deep, seamless integration with **Mol*** (MolStar), the industry-leading, high-performance WebGL framework designed for real-time 3D macromolecular rendering. 
*   The raw `.cif` coordinate URL fetched securely by the Go backend is piped entirely natively into the `useMolstar.js` React hook.
*   Mol* immediately parses this and renders the full structural 3D protein directly in the browser window asynchronously, allowing for real-time zooming, infinite panning, and responsive rotation without ever requiring the user to install heavy desktop visualization software.
*   **The Connection Mechanics:** The frontend component ecosystem is remarkably interconnected. When the backend successfully finds an Interface Pocket and sends the JSON blob to the frontend, an interactive "Pocket Card" is rendered in a React-driven sidebar sidebar. The moment a researcher clicks the "Highlight in Viewer" button on that specific card, React dynamically unpacks the exact atomic `residueIndices` for that specific pocket. It instantly passes those geometric indices as a standard `forwardRef` up into the native Mol* `lociSelects` API. The 3D engine immediately intercepts the command, identically forcing the virtual camera to fly spatially to those exact coordinates, and crucially, it paints those specific targeted amino acids in a bright, glowing green color, clearly illuminating the exact real-world site where a future drug should be engineered to bind.

---

## 🧪 6. End-to-End Case Study: Q55DI5

To fully grasp the magnitude of the automated pipeline, let us trace exactly, step-by-step, what physically transpires when a medical researcher searches for the biological protein **Q55DI5**:

1.  **The User Initiates Search**: The researcher enters `Q55DI5` into the frontend interactive search bar and submits the query.
2.  **API Resolution**: The Go backend intercepts the HTTP request and looks up `Q55DI5` against the UniProt REST API. It resolves that this is an essential transcription elongation protein found entirely in a dangerous human pathogen. 
3.  **AlphaFold Discovery**: Concurrently alongside the first request, the backend aggressively queries the AlphaFold metadata API. It makes a stunning discovery: AlphaFold has successfully predicted *both* a solitary Monomer form and a functional Dimer form of this exact protein. 
4.  **Math in Motion**: The backend ingests and parses the associated confidence JSON data. The Monomer's average recorded pLDDT is `50.56` (indicating it is highly disordered and floppy). The Dimer's average recorded pLDDT is `86.06` (indicating the structure is phenomenally stable). The backend rapidly computes a final Disorder Delta of `+35.50`. This proves computationally that the protein stabilizes massively upon binding to a secondary agent!
5.  **ChEMBL Verification**: The backend simultaneously queries the ChEMBL pharmaceutical database and determines definitively that exactly `0` approved human drugs currently exist that target this pathogen protein. 
6.  **Dashboard Render**: Q55DI5 is computationally assigned an incredibly high Gap Score due to its novelty, and it is presented instantly to the user securely perched at the absolute top of the "Undrugged Targets Dashboard." 
7.  **Hunting the Pocket**: Driven by the massive Gap Score, the user clicks "Find Binding Pockets." The Go backend spins up its temporary `fpocket` isolated container, meticulously analyzes the 3D coordinate file, and officially flags "Pocket 3" specifically because it geometrically spans across the two distinct protein chains (it's exactly an interface pocket!).
8.  **Chemical Leads**: The backend automatically formulates an outbound query toward the ChEMBL database and flawlessly retrieves 3 highly viable chemical fragments (weighing strictly under 500 Daltons) that would physically fit perfectly inside the designated Pocket 3.
9.  **Visual Proof**: Concluding the pipeline, the user clicks Pocket 3 directly in the React UI sidebar. The Mol* WebGL viewer instantly rotates the protein automatically, zooming in profoundly and glowing a radiant green exactly over Pocket 3, while cleanly displaying the 3 chemical fragments directly below it in the UI mapping.

In mere seconds, the overarching ProtPocket framework has taken a completely seemingly random alphanumeric protein string (`Q55DI5`) and mathematically proven it is an urgent, undrugged, structurally validated drug target, located its exact physical vulnerable attack point, and provided the chemical component blueprints necessary to attack and disable it. This fundamentally revolutionizes the speed of early-stage discovery.

---

## 🚀 7. Setup & Installation

The repository is elegantly divided into two distinct processing environments. Both environments must be running concurrently independently for the full application pipeline to function as intended.

### Setting Up the Go Backend (The Brain)
Requirements: **Go 1.20+** formally installed on your local host system.
```bash
# 1. Open your terminal emulator and navigate to the root directory where the main.go file resides.
cd /path/to/ProtPocket

# 2. Command the Go modular ecosystem to securely download all required modules and dependencies.
go mod download

# 3. Boot up the high-performance local server instance natively.
go run main.go

# 4. The backend API will now be actively listening locally on your host environment.
# Note: It typically binds natively and starts listening on http://localhost:8000
```

### Setting Up the React Frontend (The Face)
Requirements: **Node.js (v16+)** and **npm** formally installed.
```bash
# 1. Open an entirely new, separate terminal window separate from your backend.
# 2. Navigate explicitly deeper into the 'app' directory containing the isolated React codebase.
cd /path/to/ProtPocket/app

# 3. Instruct npm to install all required Javascript dependencies, which significantly includes the Vite build tool and the massive Mol* client libraries.
npm install

# 4. Spin up the Vite-powered High-Speed Replacement development server cleanly.
npm run dev

# 5. The command line process will eventually output a secure local network address for you.
# Finally, open your preferred modern web browser and manually navigate to http://localhost:5173 to view the dashboard live and interactively!
>>>>>>> Stashed changes
```

---

<<<<<<< Updated upstream
### Hour 2–8: Backend Core

**Backend developer (primary)**

Build the three core handlers:

**SearchHandler** — queries AlphaFold API by protein name → fetches pLDDT → queries ChEMBL for drug coverage → computes gap score → returns ranked list

```go
func SearchHandler(ctx *gofr.Context) (interface{}, error) {
    query := ctx.Param("q")
    
    // 1. Query AlphaFold API
    complexes := fetchAlphaFoldComplexes(query)
    
    // 2. For each, check ChEMBL drug coverage (concurrent goroutines)
    var wg sync.WaitGroup
    for i := range complexes {
        wg.Add(1)
        go func(c *Complex) {
            defer wg.Done()
            c.DrugCount = fetchChEMBLDrugCount(c.UniprotID)
            c.IsWHOPathogen = checkWHOList(c.Organism)
            c.GapScore = computeGapScore(c)
        }(&complexes[i])
    }
    wg.Wait()
    
    // 3. Sort by gap score descending
    sort.Slice(complexes, func(i, j int) bool {
        return complexes[i].GapScore > complexes[j].GapScore
    })
    
    return complexes, nil
}
```

**ComplexDetailHandler** — fetches full pLDDT per-residue data, computes disorder delta, triggers Claude brief generation

**UndruggedTargetsHandler** — returns pre-computed top 20 gap score complexes from hero list

---

### Hour 8–16: Frontend Core

**Frontend developer (primary)**

Use V0 by Vercel to generate the base component set: search bar, result card, detail page layout. Then customize heavily.

**Search Results Page:**
- Dark background (scientific tool aesthetic — dark navy, not black)
- Result cards with: protein name, organism chip, confidence badge (green/yellow/red), WHO flag (red badge), drug count chip, gap score as a horizontal bar
- Sorted by gap score by default; toggle filters on the right

**Detail Page — the money shot:**
- Two-panel layout, 50/50
- Left: Mol* viewer initialized with monomer mmCIF URL (colored by pLDDT)
- Right: Mol* viewer initialized with complex mmCIF URL
- Below viewers: disorder delta bar visualization
- Below that: AI research brief (streamed in typewriter effect for drama)

**Mol* React integration:**
```jsx
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';

export function ProteinViewer({ structureUrl, label }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const plugin = createPluginUI(containerRef.current, {
      layoutIsExpanded: false,
      layoutShowControls: false,
    });
    plugin.loadStructureFromUrl(structureUrl, 'mmcif');
    plugin.representation.structure.themes.colorTheme = 'plddt-confidence';
    return () => plugin.dispose();
  }, [structureUrl]);

  return <div ref={containerRef} style={{ height: '400px' }} />;
}
```

---

### Hour 16–22: The Structural Reveal Animation + AI Brief

**Full team**

**Reveal Animation:**
- Both viewers load simultaneously on page open
- "Reveal the Complex" button triggers: left panel fades out, right panel expands full-width, then a Framer Motion transition overlays a brief "assembly" animation (two chains appearing and rotating into locked position)
- This is the emotional high point of the demo

**Claude API Integration:**
```javascript
// /api/brief/route.js (Next.js API route)
export async function POST(req) {
  const { complex } = await req.json();
  
  const prompt = `You are a structural biologist writing a research brief.
  
  Protein: ${complex.protein_name}
  Organism: ${complex.organism}  
  WHO Priority Pathogen: ${complex.is_who_pathogen}
  AlphaFold Confidence (monomer): ${complex.monomer_plddt_avg}%
  AlphaFold Confidence (complex): ${complex.dimer_plddt_avg}%
  Structural disorder gain: ${complex.disorder_delta}% improvement in complex form
  Approved drugs targeting this protein: ${complex.drug_count}
  Known disease associations: ${complex.disease_associations.join(', ')}
  
  Write a 4-sentence research brief covering:
  1. What this protein complex does biologically
  2. What goes wrong in disease when this interaction is disrupted
  3. Why the structural reveal (monomer disorder → dimer order) matters
  4. The drug discovery opportunity — specifically if this is undrugged
  
  Write for an expert audience. Be precise and specific. Do not be generic.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  });
  
  return Response.json({ brief: response.content[0].text });
}
```

---

### Hour 22–26: Undrugged Targets Dashboard

**Backend + Frontend together**

Build the dashboard view — this is the second major feature after search:

- Full-page table/grid of top 25 highest gap-score complexes
- Columns: Rank | Protein | Organism | WHO Pathogen | Confidence | Drugs Known | Disorder Delta | Gap Score
- Color-coded rows: red = WHO pathogen + undrugged, orange = human disease + undrugged, yellow = moderate gap
- Clicking any row → goes to detail page

This is what gives the project its "research tool" credibility beyond a visualization demo.

---

### Hour 26–28: Polish, Edge Cases, Demo Path

**All team members**

- Hardcode the 3 demo paths into a "Featured" section on the homepage:
  - **TP53** — human cancer, disordered monomer, dramatic reveal
  - **Mycobacterium tuberculosis FtsZ** — WHO pathogen, undrugged, high gap score
  - One more high disorder-delta complex for pure visual impact
- Test search with edge cases: misspelled proteins, unknown proteins, empty results — handle gracefully
- Ensure Mol* viewers load within 3 seconds (preload hero structures)
- Mobile-responsive check (judges may demo on phones)
- Set up a custom domain if possible via Vercel (ProtPocket.vercel.app at minimum)

---

### Hour 28–30: Buffer, Rehearsal, Submission

- Freeze code at Hour 28 — no new features, only bug fixes
- Submit to Devfolio with: project title, 2-minute demo video, GitHub link, tech stack list (mention GoFr and V0 explicitly)
- Rehearse the demo script (see Section 9) twice as a team
- Prepare 3 "deep technical questions" answers: the gap score formula, the disorder delta computation, the Claude prompt structure

---

## 8. API & Data Sources

### AlphaFold Database REST API

Base URL: `https://alphafold.ebi.ac.uk/api`

Key endpoints:
- `GET /prediction/{qualifier}` — fetch prediction by UniProt ID, returns pLDDT, structure URLs
- `GET /search?q={query}&type=complex` — search for complexes (new endpoint added with the March 2026 update)
- Structure files: `https://alphafold.ebi.ac.uk/files/AF-{id}-F1-model_v4.cif`

### ChEMBL REST API

Base URL: `https://www.ebi.ac.uk/chembl/api/data`

Key endpoints:
- `GET /target/search?q={uniprot_id}` — find ChEMBL target ID from UniProt
- `GET /activity?target_chembl_id={id}&type=IC50` — get drug activity data
- Drug count = number of unique approved molecules with activity against this target

### UniProt REST API

Base URL: `https://rest.uniprot.org/uniprotkb`

Key endpoints:
- `GET /search?query={name}&format=json` — protein metadata, disease associations, organism
- `GET /{uniprot_id}` — full protein record

### Claude API (Anthropic)

- Model: `claude-sonnet-4-20250514`
- Used for: research brief generation (400 tokens max per brief)
- Rate: cached for hero complexes, generated on-demand for live searches

---

## 9. Demo Day Script

**Time budget: 90 seconds max before judges ask questions**

---

**[0:00]** Open ProtPocket homepage. No slides. Live site.

*"Proteins don't work alone. They form complexes — and two weeks ago, the AlphaFold Database released 1.7 million of them for the first time. The problem? Nobody can easily find which ones matter most for disease. ProtPocket fixes that."*

**[0:15]** Type "tuberculosis" in the search bar. Results appear ranked by Gap Score.

*"We built a Gap Score — it ranks complexes by how confident the prediction is, how critical the pathogen is, and crucially — whether any drug exists for this target. Red badges mean WHO priority pathogens. Zero here means zero approved drugs."*

**[0:30]** Click the top result — an M. tuberculosis complex with gap score ~1.8.

*"Now here's the science that makes this dataset special."*

Two panels load — disordered monomer on the left, stable dimer on the right, both colored by pLDDT (blue = confident, red = disordered).

*"This protein alone looks like spaghetti — 40% structural confidence. But when it meets its partner, it snaps into a precise, functional shape — 82% confidence. That structure was completely invisible before this dataset existed. And no drug targets it."*

**[0:55]** Point at the AI brief below the viewer.

*"ProtPocket synthesizes a plain-English research brief for every complex — combining the structural data, disease context, and drug landscape. A scientist would spend days pulling this together. We do it in seconds."*

**[1:10]** Switch to the Undrugged Targets dashboard.

*"And here's the dashboard — a ranked leaderboard of the highest-priority undrugged complexes across all 20 species in the dataset. This is a research prioritization tool that didn't exist before this hackathon."*

**[1:25]** Land the conclusion.

*"ProtPocket turns the world's largest protein complex dataset into actionable drug discovery intelligence. Built in 30 hours on top of data released 12 days ago."*

---

## 10. Why This Wins

### Against the Judging Criteria

| Criterion | How ProtPocket Scores |
|---|---|
| **Innovation** | Gap Score algorithm, disorder delta surfacing, and narrative synthesis are all novel. The dataset itself is 12 days old — we are among the first builders in the world to work with it. |
| **Technical Depth** | Concurrent multi-API pipeline in Go, custom scoring algorithm, Mol* 3D viewer integration, Claude API synthesis, full-stack deployment |
| **Scalability** | GoFr backend is built for microservice scale. AlphaFold Database has 30M complexes; our architecture handles it via pagination and caching |
| **Design** | Dark, scientific aesthetic. Mol* viewer is the same tool used by PDB and EMBL-EBI. Framer Motion reveals. Not a generic dashboard. |
| **Real-World Impact** | Drug discovery impact is concrete. WHO pathogens + undrugged targets = lives saved if even one lead comes from this tool |

### Sponsor Alignment

| Sponsor | How We Use Them |
|---|---|
| **V0 by Vercel** (Gold) | UI component generation — explicitly mentioned in demo |
| **GoFr** (Gold) | Entire backend framework — explicitly named in tech stack |
| **Devfolio** (Silver) | Project submitted through platform |
| **HackerRank** (Gold) | Team members can demonstrate coding profiles if asked |

### The Unfair Advantage

The AlphaFold protein complex dataset was released **March 16, 2026 — 12 days before this hackathon**. No existing tool has built on top of it. The narrative practically writes itself: *"We built in 30 hours what didn't exist two weeks ago."* That's a story no other team at HackMol 7.0 can tell about their dataset.

---

## 11. Team Role Split

### Recommended for a 4-person team

**Person 1 — Backend Lead**
- GoFr API setup and all three route handlers
- AlphaFold + ChEMBL + UniProt API integration
- Gap Score algorithm implementation
- Concurrent goroutine management

**Person 2 — Frontend Lead**
- Next.js setup, V0 component generation and customization
- Search results page and card components
- Undrugged Targets dashboard
- Vercel deployment

**Person 3 — 3D & Animation**
- Mol* viewer React integration (monomer + dimer panels)
- Framer Motion structural reveal animation
- pLDDT color theme configuration
- Detail page layout

**Person 4 — AI & Data**
- Claude API integration and prompt engineering
- Hero complex curation (30 manually selected complexes)
- Disorder delta computation logic
- Demo prep and fallback JSON data

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AlphaFold API is slow or rate-limited | Medium | High | Pre-fetch and cache 30 hero complexes in JSON at startup. Demo always uses these. |
| ChEMBL API returns incomplete drug data | Medium | Medium | Default drug_count to -1 (unknown) rather than 0; display as "Coverage Unknown" |
| Mol* viewer fails to load in demo browser | Low | High | Pre-load structure files as local static assets for the 3 demo complexes |
| Claude API rate limit during demo | Low | Medium | Cache all AI briefs for hero complexes at startup; demo never hits live generation |
| Complex AlphaFold search API doesn't return expected fields | Medium | High | Build a scraper fallback using the bulk download manifest + static JSON |
| GoFr deployment fails | Low | High | Backend can be replaced with Next.js API routes as an emergency fallback |
| 30-hour time overrun | High | Medium | Feature priority: Gap Score + Search (must) → Detail View + Mol* (must) → AI Brief (should) → Dashboard (nice to have) |

---

## Appendix: Key Resources

- AlphaFold Database: https://alphafold.ebi.ac.uk
- AlphaFold API Docs: https://alphafold.ebi.ac.uk/api-docs
- Mol* Viewer: https://molstar.org
- GoFr Framework: https://gofr.dev
- V0 by Vercel: https://v0.dev
- ChEMBL API: https://www.ebi.ac.uk/chembl/api/data/docs
- WHO Priority Pathogens: https://www.who.int/publications/i/item/9789240093461
- Original EMBL-EBI Announcement: https://www.embl.org/news/science-technology/first-complexes-alphafold-database/
- NVIDIA Preprint on methodology: https://research.nvidia.com/labs/dbr/assets/data/manuscripts/afdb.html

---
=======
## 👥 8. Creators & Contributors

This comprehensive structural biology analytical tool was systematically designed, meticulously scientifically conceptualized, and fully engineered from scratch by:
- **Arshita Jaryal** - Bioinformatics Analysis, System Architectural Direction, Scientific Theory - [GitHub](https://github.com/jaryalarshita)
- **Ayush Kumar** - Scalable Backend Infrastructure, REST API Aggregation, Concurrency Modeling - [GitHub](https://github.com/ayush00git)
- **Divyansh Singh** - Frontend State Management, Complex Data Visualization, Mol* 3D WebGL Integration - [GitHub](https://github.com/divyansh0x0)

---

## 📚 9. Scientific References & Acknowledgments

This monumental platform fundamentally stands proudly on the shoulders of absolute giants within the open-source software and open-science community organizations.

1.  **AlphaFold Protein Structure Database**: For providing the unprecedented 1.7 million structural homodimer complex predictions freely that completely make the novel Disorder Delta computation practically possible at scale. Developed by EMBL-EBI and Google DeepMind. [Website](https://alphafold.ebi.ac.uk/)
2.  **UniProt (Universal Protein Resource)**: Serving as the absolute, definitive central hub for systematically identifying protein naming sequences, ontology mapping, and documented biological functions globally. [Website](https://www.uniprot.org/)
3.  **ChEMBL**: An impressively massive, manually curated pharmaceutical database tracking millions of bioactive molecules, their known documented drug targets, and current pharmaceutical trial phases. [Website](https://www.ebi.ac.uk/chembl/)
4.  **fpocket**: The foundational, robust open-source pocket detection software utilizing complex Voronoi mathematical calculations natively, written entirely in C for velocity. Developed gracefully by Discngine, without which geometrical protein mapping would require severely intensive thermodynamic molecular dynamic simulations. [GitHub](https://github.com/Discngine/fpocket)
5.  **Mol***: The truly revolutionary web-based 3D macromolecular visualization toolkit structure that effortlessly allows standard React environments to render extraordinarily complex `.cif` coordinate configurations perfectly and instantaneously using standard WebGL. [Website](https://molstar.org/)

---
<div align="center">
  <br>
  <p><em>"The intricate and enigmatic physical shapes of molecular proteins are fundamentally the stubborn locks of structural biology; we are computationally searching endlessly for the specific keys."</em></p>
  <br>
</div>
>>>>>>> Stashed changes
