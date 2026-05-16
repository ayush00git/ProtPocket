import React from 'react';
import { MolstarPanel } from '../complex/viewer/MolstarPanel';
import type { MutationStructuresResult } from '../../types';

interface Props {
  structures: MutationStructuresResult;
}

export function MutationViewer({ structures }: Props) {
  const mutantLabel = structures.mutant_is_approximation
    ? 'Mutant (AlphaFold approx.)'
    : `Mutant · ${structures.mutant_pdb_id ?? structures.mutant_source}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row w-full border border-border rounded overflow-hidden">
        <div className="flex flex-1 min-w-0">
          <MolstarPanel
            structureUrl={structures.wildtype_pdb_url}
            label="Wildtype (AlphaFold)"
            plddt={structures.wildtype_plddt}
            description="Reference wildtype structure from AlphaFold EBI."
            visible
          />
        </div>
        <div className="w-px bg-border flex-none" />
        <div className="flex flex-1 min-w-0">
          <MolstarPanel
            structureUrl={structures.mutant_pdb_url}
            label={mutantLabel}
            plddt={structures.mutant_is_approximation ? structures.wildtype_plddt : undefined}
            description={
              structures.mutant_is_approximation
                ? structures.approximation_reason ?? 'Using wildtype as backbone approximation.'
                : 'Experimental mutant structure from RCSB PDB.'
            }
            visible
          />
        </div>
      </div>

      {/* Source legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-bg-secondary border border-border rounded">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Structures:</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-text-secondary">Wildtype</span>
          <span className="font-mono text-[10px] text-text-muted">·</span>
          <span className="font-mono text-[10px] text-accent">{structures.wildtype_entry_id || 'AlphaFold'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-text-secondary">Mutant</span>
          <span className="font-mono text-[10px] text-text-muted">·</span>
          <span className={`font-mono text-[10px] ${structures.mutant_is_approximation ? 'text-warning' : 'text-accent'}`}>
            {structures.mutant_is_approximation
              ? 'AlphaFold approx.'
              : structures.mutant_pdb_id ?? 'RCSB Experimental'}
          </span>
        </div>
      </div>
    </div>
  );
}
