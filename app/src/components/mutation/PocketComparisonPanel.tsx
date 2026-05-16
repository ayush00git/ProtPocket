import React from 'react';
import type { MutationPocketMetrics, MutationPocketDelta } from '../../types';

interface Props {
  wildtype: MutationPocketMetrics;
  mutantPocket: MutationPocketMetrics;
  delta: MutationPocketDelta;
  mutantSource: string;
  isApprox: boolean;
}

function deltaColor(value: number, positiveIsGood: boolean): string {
  if (Math.abs(value) < 0.001) return 'text-text-muted';
  const good = positiveIsGood ? value > 0 : value < 0;
  return good ? 'text-accent' : 'text-danger';
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function fmtDelta(n: number, decimals = 2): string {
  return (n >= 0 ? '+' : '') + n.toFixed(decimals);
}

interface RowProps {
  label: string;
  unit?: string;
  wt: number;
  mut: number;
  delta: number;
  decimals?: number;
  positiveIsGood: boolean;
}

function MetricRow({ label, unit, wt, mut, delta, decimals = 2, positiveIsGood }: RowProps) {
  return (
    <tr className="border-t border-border-subtle">
      <td className="py-2 pr-4 font-mono text-[11px] text-text-muted uppercase tracking-wider whitespace-nowrap">
        {label}{unit && <span className="normal-case opacity-60"> {unit}</span>}
      </td>
      <td className="py-2 pr-6 font-mono text-[13px] text-text-primary tabular-nums text-right">
        {fmt(wt, decimals)}
      </td>
      <td className="py-2 pr-6 font-mono text-[13px] text-text-primary tabular-nums text-right">
        {fmt(mut, decimals)}
      </td>
      <td className={`py-2 font-mono text-[13px] tabular-nums text-right ${deltaColor(delta, positiveIsGood)}`}>
        {fmtDelta(delta, decimals)}
      </td>
    </tr>
  );
}

export function PocketComparisonPanel({ wildtype, mutantPocket, delta, mutantSource, isApprox }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Pocket Geometry</span>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="pb-2 pr-4 font-mono text-[10px] uppercase tracking-wider text-text-muted text-left">Metric</th>
              <th className="pb-2 pr-6 font-mono text-[10px] uppercase tracking-wider text-text-muted text-right">Wildtype</th>
              <th className="pb-2 pr-6 font-mono text-[10px] uppercase tracking-wider text-text-muted text-right">Mutant</th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted text-right">Δ</th>
            </tr>
          </thead>
          <tbody>
            <MetricRow label="Druggability" wt={wildtype.druggability_score} mut={mutantPocket.druggability_score} delta={delta.druggability_score} decimals={3} positiveIsGood={true} />
            <MetricRow label="Volume" unit="Å³" wt={wildtype.volume} mut={mutantPocket.volume} delta={delta.volume} decimals={0} positiveIsGood={true} />
            <MetricRow label="Surface" unit="Å²" wt={wildtype.surface_area} mut={mutantPocket.surface_area} delta={delta.surface_area} decimals={0} positiveIsGood={true} />
            <MetricRow label="Hydrophobicity" wt={wildtype.hydrophobicity} mut={mutantPocket.hydrophobicity} delta={delta.hydrophobicity} decimals={2} positiveIsGood={false} />
          </tbody>
        </table>
      </div>

      {/* Source badge */}
      <div className="flex items-center gap-2 pt-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Mutant structure:</span>
        <span className={`font-mono text-[10px] uppercase tracking-[0.06em] rounded px-2 py-0.5 border ${
          isApprox
            ? 'text-warning bg-warning-dim border-warning'
            : 'text-accent bg-accent-dim border-accent'
        }`}>
          {isApprox ? 'AlphaFold approx.' : mutantSource === 'rcsb_experimental' ? 'RCSB Experimental' : mutantSource}
        </span>
      </div>
    </div>
  );
}
