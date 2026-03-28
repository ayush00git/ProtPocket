import React from 'react';

export function ViewerHeader({ label, plddt }) {
  return (
    <div className="flex flex-row justify-between items-center px-4 py-3 border-b border-border bg-bg-secondary">
      <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span className="font-mono text-xs text-accent">
        {(plddt || 0).toFixed(1)}% confidence
      </span>
    </div>
  );
}
