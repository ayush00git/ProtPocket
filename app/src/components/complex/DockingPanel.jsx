import React, { useEffect } from 'react';
import { useDockingJob } from '../../hooks/useDockingJob';
import { useChemblFragments } from '../../hooks/useChemblFragments';
import { MoleculePicker } from './MoleculePicker';

export function DockingPanel({ pocket, proteinPdbId, sourceType, onConformationChange, onUndock, onDockingComplete, apiBase = '/api' }) {
  const {
    fragments,
    isLoading: fragmentsLoading,
    error: fragmentsError,
    refetch: refetchFragments
  } = useChemblFragments(pocket.pocket_id, {
    volume: pocket.volume,
    hydrophobicity: pocket.hydrophobicity,
    polarity: pocket.polarity,
    sourceType: sourceType || 'dimer',
  }, apiBase);

  const {
    step,
    selectedFragment,
    conformations,
    activeConformation,
    jobError,
    jobId,
    selectFragment,
    submitDocking,
    setActiveConformation,
    reset,
  } = useDockingJob(apiBase);

  // When docking completes, notify parent (leaderboard + viewer) but do NOT push conformations
  // directly to the viewer. Let ComplexDetailPage handle that via handleDockingComplete.
  useEffect(() => {
    if (step === 'results' && conformations?.length && selectedFragment) {
      onDockingComplete?.({
        pocketId: pocket.pocket_id,
        sourceType: sourceType || 'dimer',
        fragmentId: selectedFragment.chembl_id || selectedFragment.id,
        fragmentName: selectedFragment.name || selectedFragment.chembl_id,
        smiles: selectedFragment.smiles,
        bindingAffinity: conformations[0].binding_affinity,
        conformations,
        timestamp: Date.now(),
      });
    }
    // Only fire once when step becomes 'results'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleUndock = () => {
    onUndock?.();
    onConformationChange?.(null, null);
    reset();
  };

  if (fragmentsLoading && step === 'idle') {
    return (
      <div className="flex items-center gap-3 py-6 justify-center">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider">
          Retrieving ChEMBL fragments for pocket #{pocket.pocket_id}…
        </span>
      </div>
    );
  }

  if (step === 'idle' || (step === 'error' && !jobError)) {
    return (
      <MoleculePicker
        fragments={fragments}
        isLoading={fragmentsLoading}
        error={fragmentsError}
        selectedFragment={selectedFragment}
        onSelect={selectFragment}
        onConfirm={() => submitDocking(pocket.pocket_id, proteinPdbId, sourceType || 'dimer')}
        onRetry={refetchFragments}
        isDockingRunning={false}
      />
    );
  }

  if (step === 'running') {
    return (
      <>
        <MoleculePicker
          fragments={fragments}
          isLoading={false}
          error={null}
          selectedFragment={selectedFragment}
          onSelect={() => { }}
          onConfirm={() => { }}
          onRetry={() => { }}
          isDockingRunning
        />
        <div className="flex items-start gap-2 mt-3 px-3 py-2 bg-bg-primary border border-warning/20 rounded">
          <div className="w-3 h-3 border border-warning border-t-transparent rounded-full animate-spin flex-none mt-0.5" />
          <span className="font-mono text-[10px] text-text-muted leading-relaxed">
            Vina is running on the server — typically 2–8 minutes for a drug-like fragment. You can navigate away; the
            result will appear automatically.
            {jobId && <span className="block mt-1 opacity-60">Job ID: {jobId}</span>}
          </span>
        </div>
      </>
    );
  }

  if (step === 'results') {
    return (
      <div className="flex flex-col gap-3">
        {/* Compact result banner — full results shown in the detail panel below */}
        <div className="flex items-center justify-between px-3 py-3 bg-success/5 border border-success/20 rounded">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs text-text-primary font-medium">
                Docking complete — {selectedFragment?.chembl_id}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                Best affinity: <span className="text-success font-bold">{conformations[0]?.binding_affinity?.toFixed(1)}</span> kcal/mol
                {' · '}{conformations.length} pose{conformations.length !== 1 ? 's' : ''}
                {' · '}View result in the leaderboard panel below
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUndock}
            className="font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded border border-border bg-bg-tertiary text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
          >
            Re-dock
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <span className="font-mono text-[10px] uppercase text-danger tracking-wider border border-danger px-2 py-0.5 rounded">
          ERR
        </span>
        <span className="font-mono text-xs text-text-muted text-center">{jobError}</span>
        <button
          type="button"
          onClick={handleUndock}
          className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded border border-border text-text-secondary hover:text-text-primary transition-colors"
        >
          Reset
        </button>
      </div>
    );
  }

  return null;
}
