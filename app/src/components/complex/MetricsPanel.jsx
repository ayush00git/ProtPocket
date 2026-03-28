import React from 'react';
import { toPercent } from '../common/GapScoreBar';

export function MetricsPanel({ complex }) {
  const { monomer_plddt_avg, dimer_plddt_avg, disorder_delta, gap_score, known_drug_names } = complex;

  const m_plddt = monomer_plddt_avg || 0;
  const d_plddt = dimer_plddt_avg || 0;
  const delta = disorder_delta || 0;
  const gap = gap_score || 0;
  const gapPct = toPercent(gap);

  const isPositiveDelta = delta > 0;

  let gapScoreBgClass = 'bg-bg-primary';
  if (gapPct >= 75) gapScoreBgClass = 'bg-accent-dim';
  else if (gapPct >= 40) gapScoreBgClass = 'bg-warning-dim';

  return (
    <div className="bg-bg-secondary border border-border rounded p-6 flex flex-col gap-6 mt-8 mb-8">
      <div className="flex flex-col gap-1">
        <h3 className="font-display font-bold text-lg text-text-primary">Structural Metrics</h3>
        <p className="font-body text-sm text-text-muted">AlphaFold pLDDT confidence scores</p>
      </div>

      <div className="grid grid-cols-4 border border-border rounded overflow-hidden">
        <div className="flex flex-col items-center justify-center p-4 border-r border-border bg-bg-primary">
          <span className="font-mono text-xl text-text-primary">{m_plddt.toFixed(1)}%</span>
          <span className="font-body text-[11px] uppercase text-text-muted mt-1 whitespace-nowrap">Single chain</span>
        </div>

        <div className="flex flex-col items-center justify-center p-4 border-r border-border bg-bg-tertiary">
          <span className="font-mono text-xl text-accent">{d_plddt.toFixed(1)}%</span>
          <span className="font-body text-[11px] uppercase text-text-muted mt-1 whitespace-nowrap">Complex form</span>
        </div>

        <div className="flex flex-col items-center justify-center p-4 border-r border-border bg-bg-primary">
          <span className={`font-mono text-xl ${isPositiveDelta ? 'text-success' : 'text-text-primary'}`}>
            {isPositiveDelta ? '+' : ''}{delta.toFixed(1)}
          </span>
          <span className="font-body text-[11px] uppercase text-text-muted mt-1 whitespace-nowrap">
            {isPositiveDelta ? 'Structural gain' : 'No gain'}
          </span>
        </div>

        <div className={`flex flex-col items-center justify-center p-4 transition-colors ${gapScoreBgClass}`}>
          <span className="font-mono text-xl text-text-primary">{gapPct.toFixed(1)}%</span>
          <span className="font-body text-[11px] uppercase text-text-muted mt-1 whitespace-nowrap">Gap Score</span>
        </div>
      </div>

      {known_drug_names && known_drug_names.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Known Drugs</span>
          <div className="flex flex-wrap gap-2">
            {known_drug_names.map((drug, idx) => (
              <span key={idx} className="font-mono text-xs text-text-secondary bg-bg-tertiary border border-border-subtle px-2 py-0.5 rounded">
                {drug}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
