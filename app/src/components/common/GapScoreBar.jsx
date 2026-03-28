import React from 'react';

/**
 * Converts a raw gap score (0–2.0 range) to a percentage (0–100%).
 * Max theoretical score is ~2.0 (WHO pathogen, undrugged, high confidence, disorder bonus).
 */
export function toPercent(score) {
  return Math.min((score / 2.0) * 100, 100);
}

export function GapScoreBar({ score = 0, showLabel = true }) {
  const pct = toPercent(score);
  const fillWidth = score > 0 ? `${Math.max(pct, 1.5)}%` : '0%';
  
  let fillColor = 'bg-text-muted';
  let labelColor = 'text-text-muted';
  
  if (pct >= 75) {
    fillColor = 'bg-accent';
    labelColor = 'text-accent';
  } else if (pct >= 40) {
    fillColor = 'bg-warning';
    labelColor = 'text-warning';
  }

  return (
    <div className="flex flex-row items-center w-full gap-3">
      <div className="flex-1 h-[3px] bg-border rounded-[2px] overflow-hidden">
        <div 
          className={`h-full ${fillColor} transition-all duration-150 ease-out`}
          style={{ width: fillWidth }}
        />
      </div>
      {showLabel && (
        <span className={`font-mono text-[13px] w-[54px] text-right ${labelColor}`}>
          {pct.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
