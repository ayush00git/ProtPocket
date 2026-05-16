import React from 'react';
import type { MutationAnalyzeResult } from '../../types';
import { DSSScoreBar } from './DSSScoreBar';
import { PocketComparisonPanel } from './PocketComparisonPanel';

const amClassVariant: Record<string, { text: string; bg: string; border: string }> = {
  pathogenic: { text: 'text-danger',  bg: 'bg-danger-dim',  border: 'border-danger' },
  ambiguous:  { text: 'text-warning', bg: 'bg-warning-dim', border: 'border-warning' },
  benign:     { text: 'text-text-muted', bg: 'bg-bg-tertiary', border: 'border-border' },
};

interface Props {
  result: MutationAnalyzeResult;
}

export function MutationResultCard({ result }: Props) {
  const { uniprot_id, mutation, alphamissense, structures, pockets, druggability_shift } = result;
  const amStyle = amClassVariant[alphamissense.am_class] ?? amClassVariant.ambiguous;

  return (
    <div className="bg-bg-secondary border border-border rounded flex flex-col gap-0">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border-subtle">
        <span className="font-mono text-[13px] text-text-primary font-bold">{uniprot_id}</span>
        <span className="font-mono text-[13px] text-text-secondary">
          {mutation.gene && <>{mutation.gene}{' '}</>}
          <span className="text-text-muted">{mutation.wildtype_aa}</span>
          <span className="text-text-primary font-bold">{mutation.position}</span>
          <span className="text-text-muted">{mutation.mutant_aa}</span>
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">AlphaMissense:</span>
          <span className={`font-mono text-[10px] uppercase tracking-[0.06em] rounded px-2 py-0.5 border ${amStyle.text} ${amStyle.bg} ${amStyle.border}`}>
            {alphamissense.am_class}
          </span>
          <span className="font-mono text-[12px] text-text-secondary tabular-nums">{alphamissense.am_pathogenicity.toFixed(4)}</span>
        </div>
      </div>

      {/* DSS */}
      <div className="px-5 py-4 border-b border-border-subtle">
        <DSSScoreBar dss={druggability_shift} />
      </div>

      {/* Approximation warning */}
      {structures.mutant_is_approximation && (
        <div className="mx-5 my-3 px-4 py-3 bg-warning-dim border border-warning rounded flex items-start gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-warning mt-0.5">Note</span>
          <span className="font-body text-[13px] text-text-secondary leading-relaxed">
            No experimental mutant structure found in RCSB PDB. Using wildtype AlphaFold structure as backbone approximation. Pocket geometry deltas are zero; DSS is weighted primarily by AlphaMissense score. Confidence: low.
          </span>
        </div>
      )}

      {/* Pocket comparison */}
      <div className="px-5 py-4">
        <PocketComparisonPanel
          wildtype={pockets.wildtype_top_pocket}
          mutantPocket={pockets.mutant_top_pocket}
          delta={pockets.pocket_delta}
          mutantSource={structures.mutant_source}
          isApprox={structures.mutant_is_approximation}
        />
      </div>
    </div>
  );
}
