import React from 'react';
import type { MutationDSSResult } from '../../types';

const classificationLabel: Record<string, string> = {
  pocket_improved:     'Pocket Improved',
  pocket_unchanged:    'Pocket Unchanged',
  pocket_degraded:     'Pocket Degraded',
  pocket_collapsed:    'Pocket Collapsed',
  new_pocket_detected: 'New Pocket Detected',
};

function scoreColor(score: number): { text: string; fill: string } {
  if (score >= 0.15)  return { text: 'text-accent',   fill: 'bg-accent' };
  if (score >= -0.15) return { text: 'text-text-muted', fill: 'bg-text-muted' };
  if (score >= -0.5)  return { text: 'text-warning',  fill: 'bg-warning' };
  return                     { text: 'text-danger',   fill: 'bg-danger' };
}

interface Props {
  dss: MutationDSSResult;
}

export function DSSScoreBar({ dss }: Props) {
  const { score, classification, confidence } = dss;
  const { text, fill } = scoreColor(score);

  // Center-origin bar: 50% = score 0, 0% = score -1, 100% = score +1
  const positionPct = ((score + 1) / 2) * 100;
  const centerPct = 50;
  const fillLeft   = score >= 0 ? centerPct : positionPct;
  const fillWidth  = Math.abs(positionPct - centerPct);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Druggability Shift Score</span>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[11px] uppercase tracking-[0.06em] rounded px-2 py-0.5 border ${confidence === 'high' ? 'text-accent bg-accent-dim border-accent' : 'text-warning bg-warning-dim border-warning'}`}>
            {confidence} confidence
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-text-muted w-4 text-right">−1</span>
        <div className="relative flex-1 h-[8px] bg-border rounded-[4px] overflow-hidden">
          {/* center marker */}
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-border-subtle z-10" style={{ transform: 'translateX(-50%)' }} />
          {/* fill */}
          <div
            className={`absolute top-0 h-full ${fill} rounded-[4px] transition-all duration-300`}
            style={{ left: `${fillLeft}%`, width: `${Math.max(fillWidth, 0.5)}%` }}
          />
        </div>
        <span className="font-mono text-[10px] text-text-muted w-4">+1</span>
        <span className={`font-mono text-[20px] font-bold w-[72px] text-right tabular-nums ${text}`}>
          {score >= 0 ? '+' : ''}{score.toFixed(3)}
        </span>
      </div>

      {/* Classification */}
      <div className="flex items-center gap-2">
        <span className={`font-mono text-[11px] uppercase tracking-[0.06em] rounded px-2 py-0.5 border ${
          score >= 0.15  ? 'text-accent bg-accent-dim border-accent' :
          score >= -0.15 ? 'text-text-muted bg-bg-tertiary border-border' :
          score >= -0.5  ? 'text-warning bg-warning-dim border-warning' :
                           'text-danger bg-danger-dim border-danger'
        }`}>
          {classificationLabel[classification] ?? classification}
        </span>
      </div>
    </div>
  );
}
