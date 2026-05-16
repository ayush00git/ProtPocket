import React from 'react';

interface ViewerHeaderProps {
  label: string;
  plddt?: number;
}

export function ViewerHeader({ label, plddt }: ViewerHeaderProps) {
  return (
    <div className="flex flex-row justify-between items-center px-4 py-3 border-b border-border bg-bg-secondary">
      <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {plddt != null && plddt > 0 && (
        <span className="font-mono text-xs text-accent">
          {plddt.toFixed(1)}% confidence
        </span>
      )}
    </div>
  );
}
