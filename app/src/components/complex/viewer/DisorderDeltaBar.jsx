import React from 'react';

export function DisorderDeltaBar({ disorderDelta, visible }) {
  if (!visible) return null;

  const delta = disorderDelta || 0;
  const isPositive = delta > 0;
  const fillPercent = Math.min(Math.abs(delta) / 40, 1) * 100;

  let fillColor = 'bg-text-muted';
  let textColor = 'text-text-muted';
  if (isPositive) {
    fillColor = 'bg-accent';
    textColor = 'text-accent';
  } else if (delta < 0) {
    fillColor = 'bg-danger';
    textColor = 'text-danger';
  }

  return (
    <div className="w-12 flex-none flex flex-col items-center justify-center bg-bg-secondary border-x border-border gap-3 py-6 h-full">
      {/* Vertical bar track */}
      <div className="relative w-[3px] flex-1 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={`absolute bottom-0 left-0 right-0 ${fillColor} rounded-full transition-all duration-500`}
          style={{ height: `${fillPercent}%` }}
        />
      </div>

      {/* Delta value */}
      <div className="flex flex-col items-center gap-0.5">
        <span className={`font-mono text-xs font-bold ${textColor}`}>
          {isPositive ? '+' : ''}{delta.toFixed(1)}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-wider text-text-muted text-center leading-tight">
          Delta
        </span>
      </div>
    </div>
  );
}
