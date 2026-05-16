// ── Shared domain types ────────────────────────────────────────────
// Inferred from existing code usage; kept minimal to avoid deep refactors.

export interface DemoProtein {
  id: string;
  label: string;
  description: string;
}

export interface Complex {
  uniprot_id: string;
  alphafold_id: string;
  protein_name: string;
  gene_name: string;
  organism: string;
  disease_associations: string[];
  is_who_pathogen: boolean;
  drug_count: number;
  review_status: string;
  monomer_plddt_avg: number;
  dimer_plddt_avg: number;
  disorder_delta: number;
  gap_score: number;
  category: string;
  known_drug_names: string[];
  monomer_structure_url: string;
  complex_structure_url: string;
}

export interface Pocket {
  pocket_id: number;
  druggability_score: number;
  volume: number;
  hydrophobicity: number;
  polarity: number;
  avg_plddt: number;
  avg_disorder_delta: number;
  center: [number, number, number] | null;
  residue_names: string[];
  residue_indices: number[];
  is_interface_pocket: boolean;
  is_conserved: boolean;
  is_emergent: boolean;
}

export interface Conformation {
  mode: number;
  binding_affinity: number;
  rmsd_lb: number;
  rmsd_ub: number;
  pose_pdb: string;
}

export interface Fragment {
  chembl_id: string;
  zinc_id?: string;
  id?: string;
  name?: string;
  smiles?: string;
  mw?: number;
  mol_weight?: number;
  logp?: number;
}

export interface LeaderboardEntry {
  id: string;
  pocketId: number;
  sourceType: string;
  fragmentId: string;
  fragmentName: string;
  smiles: string;
  bindingAffinity: number;
  conformations: Conformation[];
  timestamp: number;
}

export interface BindingSitesData {
  pockets: Pocket[];
  total_pockets: number;
  monomer_pockets: Pocket[];
  monomer_total_pockets: number;
  interface_pocket_count: number;
  comparison: ComparisonData | null;
}

export interface ComparisonData {
  summary_metrics: {
    total_monomer_pockets: number;
    total_dimer_pockets: number;
    avg_monomer_druggability: number;
    avg_dimer_druggability: number;
  };
  ddgi: number;
  pocket_mapping: {
    conserved_count: number;
    monomer_only_count: number;
    emergent_count: number;
    interface_count: number;
  };
  interface_pockets: Pocket[];
  conserved_pockets: Pocket[];
  emergent_pockets: Pocket[];
  graph_datasets: {
    stabilization_scatter: ScatterDataPoint[];
  };
  property_changes: {
    monomer_avg_volume: number;
    dimer_avg_volume: number;
    monomer_avg_hydrophobicity: number;
    dimer_avg_hydrophobicity: number;
    monomer_avg_polarity: number;
    dimer_avg_polarity: number;
  };
  stabilization_stats: {
    enrichment_score: number;
  };
  fragment_comparison: {
    unique_interface_fragments: Fragment[];
    unique_dimer_fragments: Fragment[];
  } | null;
}

export interface ScatterDataPoint {
  avg_delta: number;
  druggability_score: number;
}

export interface DockingInfo {
  pocket: Pocket;
  sourceType: string;
  proteinPdbId: string;
  activeTab?: string;
}

export interface DockingResult {
  pocketId: number;
  sourceType: string;
  fragmentId: string;
  fragmentName: string;
  smiles: string;
  bindingAffinity: number;
  conformations: Conformation[];
  timestamp: number;
}

// Mol* viewer imperative handle
export interface ProteinViewerHandle {
  highlightPocket: (residueIndices: number[], target?: string) => void;
  clearPocketHighlight: (target?: string) => void;
  setConformations: (confs: Conformation[], mode: number, target?: string) => void;
  clearConformations: (target?: string) => void;
}

export interface MolstarPanelHandle {
  highlightPocket: (residueIndices: number[]) => Promise<void>;
  clearPocketHighlight: () => Promise<void>;
}

// ── Mutation analysis types ─────────────────────────────────────────────────

export interface ParsedMutation {
  gene: string;
  position: number;
  wildtype_aa: string;
  mutant_aa: string;
  raw: string;
}

export interface MutationPocketMetrics {
  pocket_id: number;
  druggability_score: number;
  volume: number;
  surface_area: number;
  depth: number;
  hydrophobicity: number;
  polarity: number;
}

export interface MutationPocketDelta {
  druggability_score: number;
  volume: number;
  surface_area: number;
  depth: number;
  hydrophobicity: number;
  polarity: number;
}

export interface DSSBreakdown {
  geometry_score: number;
  am_weight: number;
  norm_druggability_delta: number;
  norm_volume_delta: number;
  norm_surface_area_delta: number;
  norm_hydrophobicity_delta: number;
  is_approximation: boolean;
}

export interface MutationDSSResult {
  score: number;
  classification: string; // "pocket_improved" | "pocket_unchanged" | "pocket_degraded" | "pocket_collapsed" | "new_pocket_detected"
  confidence: string;     // "high" | "low"
  breakdown: DSSBreakdown;
}

export interface MutationStructuresResult {
  uniprot_id: string;
  mutation: ParsedMutation;
  wildtype_pdb_url: string;
  wildtype_cif_url: string;
  wildtype_entry_id: string;
  wildtype_plddt: number;
  mutant_pdb_url: string;
  mutant_cif_url?: string;
  mutant_pdb_id?: string;
  mutant_source: string;       // "rcsb_experimental" | "alphafold_wildtype_approx"
  mutant_is_approximation: boolean;
  approximation_reason?: string;
}

export interface MutationAnalyzeResult {
  uniprot_id: string;
  mutation: ParsedMutation;
  alphamissense: {
    am_pathogenicity: number;
    am_class: string; // "benign" | "ambiguous" | "pathogenic"
  };
  structures: {
    mutant_source: string;       // "rcsb_experimental" | "alphafold_wildtype_approx"
    mutant_is_approximation: boolean;
    wildtype_pdb_url: string;
    mutant_pdb_url: string;
  };
  pockets: {
    wildtype_top_pocket: MutationPocketMetrics;
    mutant_top_pocket: MutationPocketMetrics;
    pocket_delta: MutationPocketDelta;
  };
  druggability_shift: MutationDSSResult;
}
