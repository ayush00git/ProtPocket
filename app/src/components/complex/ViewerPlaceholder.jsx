import React from 'react';

export function ViewerPlaceholder({ monomerUrl, complexUrl, monomerPlddt, dimerPlddt }) {
  const renderPanel = (label, url, plddt, desc) => {
    const filename = url ? url.split('/').pop() : 'No structure available';
    
    return (
      <div className="flex-1 flex flex-col h-[360px]">
        <div className="flex flex-row justify-between items-center px-4 py-3 border-b border-border bg-bg-secondary">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{label}</span>
          <span className="font-mono text-xs text-accent">{(plddt || 0).toFixed(1)}% confidence</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center bg-bg-primary gap-3">
          <span className="font-mono text-[10px] uppercase text-text-muted tracking-[0.1em] border border-border-subtle px-2 py-0.5 rounded bg-bg-tertiary">
            3D VIEWER — PHASE 4
          </span>
          <span className="font-mono text-xs text-text-muted">
            {filename}
          </span>
          {url && (
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 font-mono text-xs text-accent border border-accent hover:bg-accent-dim transition-colors px-3 py-1.5 rounded-[4px]"
            >
              Download .cif
            </a>
          )}
        </div>
        
        <div className="px-4 py-3 border-t border-border bg-bg-secondary">
          <span className="italic text-[13px] text-text-secondary">{desc}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-row w-full border border-border rounded overflow-hidden">
      {renderPanel('Monomer (single chain)', monomerUrl, monomerPlddt, 'Disordered regions visible in isolation.')}
      <div className="w-px bg-border flex-none" />
      {renderPanel('Homodimer (complex)', complexUrl, dimerPlddt, 'Functional domain revealed in complex form.')}
    </div>
  );
}
