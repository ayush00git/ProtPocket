import React, { useState, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { MolstarPanel } from './MolstarPanel';
import { DisorderDeltaBar } from './DisorderDeltaBar';

/**
 * ProteinViewer — Displays monomer and dimer Mol* viewers side by side.
 * Includes a unified zoom button that opens both in a fullscreen overlay.
 */
export const ProteinViewer = forwardRef(({ monomerUrl, complexUrl, monomerPlddt, dimerPlddt, disorderDelta }, ref) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(null); // { indices, target }
  const monomerViewerRef = useRef(null);
  const complexViewerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    highlightPocket: (residueIndices, target = 'complex') => {
      setActiveHighlight({ indices: residueIndices, target });
    },
    clearPocketHighlight: () => {
      setActiveHighlight(null);
    }
  }));

  // Close zoom on Escape key
  React.useEffect(() => {
    if (!isZoomed) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsZoomed(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isZoomed]);

  const expandButton = useMemo(() => (
    <div className="flex flex-row justify-end items-center">
      <button
        onClick={() => setIsZoomed(true)}
        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded border border-border bg-bg-tertiary text-text-secondary hover:text-text-primary hover:border-accent transition-colors duration-150"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
        Expand View
      </button>
    </div>
  ), []);

  return (
    <div className="flex flex-col gap-2">
      {/* Zoom button */}
      {expandButton}

      {/* Inline viewers — hidden when zoomed to avoid duplicate Mol* instances */}
      <div className={`flex flex-row w-full border border-border rounded overflow-visible ${isZoomed ? 'invisible h-0 overflow-hidden' : ''}`}>
        <div className="flex flex-1" style={{ minWidth: 0 }}>
          <MolstarPanel
            ref={monomerViewerRef}
            structureUrl={monomerUrl}
            label="Monomer (single chain)"
            plddt={monomerPlddt}
            description="Disordered regions visible in isolation."
            visible={true}
            highlightIndices={(activeHighlight?.target === 'monomer' || activeHighlight?.target === 'comparison') ? activeHighlight.indices : null}
          />
        </div>

        <div className="flex-none overflow-hidden" style={{ width: 48, height: '400px' }}>
          <DisorderDeltaBar disorderDelta={disorderDelta} visible={true} />
        </div>

        <div className="flex flex-1 overflow-hidden" style={{ minWidth: 0 }}>
          <MolstarPanel
            ref={complexViewerRef}
            structureUrl={complexUrl}
            label="Homodimer (complex)"
            plddt={dimerPlddt}
            description="Functional domain revealed in complex form."
            visible={true}
            highlightIndices={(activeHighlight?.target === 'complex' || activeHighlight?.target === 'comparison') ? activeHighlight.indices : null}
          />
        </div>
      </div>

      {/* Fullscreen zoom overlay */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: 'var(--color-bg-primary, #0a0a0a)' }}
        >
          {/* Top bar */}
          <div className="flex-none flex items-center justify-between px-6 py-3 border-b border-border" style={{ backgroundColor: 'var(--color-bg-secondary, #111)' }}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-accent" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
              <span className="font-mono text-sm uppercase tracking-wider text-text-primary font-bold">
                Structure Comparison
              </span>
              <span className="font-mono text-xs text-text-muted">
                Monomer vs Homodimer
              </span>
            </div>
            <button
              onClick={() => setIsZoomed(false)}
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider px-4 py-2 rounded border border-border bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-danger/20 hover:border-danger/50 transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Close · ESC
            </button>
          </div>

          {/* Zoomed viewers — fill all remaining vertical space */}
          <div className="flex-1 flex flex-row min-h-0">
            {/* Monomer */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border">
              <MolstarPanel
                structureUrl={monomerUrl}
                label="Monomer (single chain)"
                plddt={monomerPlddt}
                description="Disordered regions visible in isolation."
                visible={true}
                highlightIndices={(activeHighlight?.target === 'monomer' || activeHighlight?.target === 'comparison') ? activeHighlight.indices : null}
              />
            </div>

            {/* Delta bar */}
            <div className="flex-none" style={{ width: 48 }}>
              <DisorderDeltaBar disorderDelta={disorderDelta} visible={true} />
            </div>

            {/* Dimer */}
            <div className="flex-1 flex flex-col min-w-0 border-l border-border">
              <MolstarPanel
                structureUrl={complexUrl}
                label="Homodimer (complex)"
                plddt={dimerPlddt}
                description="Functional domain revealed in complex form."
                visible={true}
                highlightIndices={(activeHighlight?.target === 'complex' || activeHighlight?.target === 'comparison') ? activeHighlight.indices : null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
