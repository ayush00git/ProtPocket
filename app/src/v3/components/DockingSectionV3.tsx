import React, { useEffect, useRef, useState } from 'react';
import { useDockingJob } from '../../hooks/useDockingJob';
import { useChemblFragments } from '../../hooks/useChemblFragments';
import type { Pocket, Conformation, LeaderboardEntry, Fragment, DockingInfo } from '../../types';

const CHEMBL_BASE_URL = 'https://www.ebi.ac.uk/chembl/compound_report_card/';

// ─────────────────────────────────────────────────────────────────────────────
// 1. MOLECULE PICKER V3
// ─────────────────────────────────────────────────────────────────────────────

interface MoleculePickerV3Props {
  fragments: Fragment[];
  isLoading: boolean;
  error: string | null;
  selectedFragment: Fragment | null;
  onSelect: (fragment: Fragment) => void;
  onConfirm: () => void;
  isDockingRunning: boolean;
  onRetry: () => void;
}

export function MoleculePickerV3({
  fragments,
  isLoading,
  error,
  selectedFragment,
  onSelect,
  onConfirm,
  isDockingRunning,
  onRetry,
}: MoleculePickerV3Props) {
  // Lazy-render the (potentially 100+) compound cards in batches as the user
  // scrolls, instead of mounting them all at once.
  const LAZY_BATCH = 16;
  const [visibleCount, setVisibleCount] = useState(LAZY_BATCH);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset the window whenever the underlying fragment list changes.
  useEffect(() => {
    setVisibleCount(LAZY_BATCH);
  }, [fragments]);

  // Reveal the next batch when the sentinel scrolls into view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= fragments.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + LAZY_BATCH, fragments.length));
        }
      },
      { root: scrollRef.current, rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, fragments.length]);

  const visibleFragments = fragments.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(11,15,20,0.07)', paddingBottom: '10px' }}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" style={{ color: '#7A8580' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#7A8580] font-bold">Select Target Molecule</span>
        </div>
        {!isLoading && !error && fragments.length > 0 && (
          <span className="font-mono text-[10.5px] px-2.5 py-[2px] rounded-full text-[#8b5cf6] font-medium"
            style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)' }}>
            {fragments.length} matching compounds
          </span>
        )}
      </div>

      <div ref={scrollRef} className="max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        {isLoading && (
          <div className="flex flex-col items-center gap-2 py-10 justify-center">
            <div className="w-5 h-5 border-[2px] rounded-full animate-spin"
              style={{ borderColor: 'rgba(11,15,20,0.12)', borderTopColor: '#8b5cf6' }} />
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#7A8580]">
              Fetching ChEMBL fragments…
            </span>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center gap-3 py-8 justify-center">
            <span className="text-[12px] font-mono text-[#DC2626] text-center max-w-[280px]">{error}</span>
            <button
              type="button"
              onClick={onRetry}
              className="text-[11px] font-mono uppercase tracking-[0.05em] px-4 py-1.5 rounded-full transition-colors duration-150"
              style={{ background: 'rgba(11,15,20,0.04)', color: '#4A554D', border: '1px solid rgba(11,15,20,0.10)' }}
            >
              Retry Connection
            </button>
          </div>
        )}

        {!(isLoading || error) && fragments.length === 0 && (
          <div className="text-center py-10">
            <span className="font-mono text-[11px] text-[#7A8580] block leading-relaxed">
              No ChEMBL fragments matched this pocket's properties.<br />Try another pocket or review query options.
            </span>
          </div>
        )}

        {!isLoading && !error && fragments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
            {visibleFragments.map((frag) => {
              const isSelected = selectedFragment?.chembl_id === frag.chembl_id;
              return (
                <div
                  key={frag.chembl_id}
                  onClick={() => !isDockingRunning && onSelect(frag)}
                  className={`rounded-[14px] border p-3.5 transition-all duration-200 text-left ${
                    isDockingRunning
                      ? 'cursor-not-allowed opacity-55'
                      : isSelected
                        ? 'cursor-pointer'
                        : 'cursor-pointer hover:-translate-y-[2px] hover:border-[rgba(139,92,246,0.35)] hover:shadow-[0_6px_16px_-6px_rgba(11,15,20,0.12)]'
                  }`}
                  style={
                    isDockingRunning
                      ? { borderColor: 'rgba(11,15,20,0.08)' }
                      : isSelected
                        ? { borderColor: '#8b5cf6', background: 'rgba(139,92,246,0.04)', boxShadow: '0 0 0 1px rgba(139,92,246,0.30), 0 6px 16px -6px rgba(139,92,246,0.20)' }
                        : { borderColor: 'rgba(11,15,20,0.09)', background: 'white' }
                  }
                >
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className="font-mono text-[12.5px] font-bold text-[#8b5cf6]">{frag.chembl_id}</span>
                    {frag.name && frag.name !== frag.chembl_id && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.04em] text-[#7A8580] truncate max-w-[120px] px-1.5 py-[2px] rounded"
                        style={{ background: 'rgba(11,15,20,0.04)' }} title={frag.name}>{frag.name}</span>
                    )}
                  </div>
                  <code
                    title={frag.smiles}
                    className="font-mono text-[9.5px] text-[#4A554D] px-2 py-1.5 rounded-[6px] block mb-3 truncate"
                    style={{ background: 'rgba(11,15,20,0.035)', border: '1px solid rgba(11,15,20,0.05)' }}
                  >
                    {frag.smiles}
                  </code>
                  <div className="flex items-stretch gap-3">
                    <div className="flex-1 flex flex-col items-center py-1.5 rounded-[8px]" style={{ background: 'rgba(11,15,20,0.02)' }}>
                      <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-[#7A8580] mb-[2px]">MW</span>
                      <span className="font-mono text-[12.5px] font-semibold text-[#0B0F14]">
                        {frag.mw != null ? frag.mw.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center py-1.5 rounded-[8px]" style={{ background: 'rgba(11,15,20,0.02)' }}>
                      <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-[#7A8580] mb-[2px]">LogP</span>
                      <span className="font-mono text-[12.5px] font-semibold text-[#0B0F14]">
                        {frag.logp != null ? frag.logp.toFixed(2) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lazy-load sentinel + progress indicator */}
        {!isLoading && !error && fragments.length > 0 && (
          <div ref={sentinelRef} className="flex items-center justify-center py-3">
            {visibleCount < fragments.length ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-[1.5px] rounded-full animate-spin"
                  style={{ borderColor: 'rgba(11,15,20,0.12)', borderTopColor: '#8b5cf6' }} />
                <span className="font-mono text-[9.5px] uppercase tracking-[0.05em] text-[#B8C2BD]">
                  Loading more · {visibleCount}/{fragments.length}
                </span>
              </div>
            ) : (
              <span className="font-mono text-[9.5px] uppercase tracking-[0.05em] text-[#B8C2BD]">
                All {fragments.length} compounds loaded
              </span>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-4 flex items-center justify-between gap-4" style={{ borderColor: 'rgba(11,15,20,0.07)' }}>
        <span className="font-mono text-[11px] text-[#7A8580] truncate max-w-[200px]">
          {selectedFragment
            ? `${selectedFragment.chembl_id} · Selected`
            : 'No ligand selected'}
        </span>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedFragment || isDockingRunning}
          className="font-mono text-[10.5px] uppercase tracking-[0.05em] px-5 py-[7px] rounded-full transition-colors duration-150 flex items-center gap-2"
          style={
            !selectedFragment || isDockingRunning
              ? { background: 'rgba(11,15,20,0.03)', color: 'rgba(11,15,20,0.30)', border: '1px solid rgba(11,15,20,0.08)', cursor: 'not-allowed' }
              : { background: '#0B0F14', color: 'white', border: '1px solid #0B0F14', cursor: 'pointer', boxShadow: '0 4px 12px -4px rgba(11,15,20,0.35)' }
          }
        >
          {isDockingRunning ? (
            <>
              <span className="w-3 h-3 border-[1.5px] rounded-full animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white' }} />
              Running Vina…
            </>
          ) : (
            'Run Docking Vina'
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DOCKING PANEL V3 (RUNNING / STATE CONTROLLER)
// ─────────────────────────────────────────────────────────────────────────────

interface DockingPanelV3Props {
  pocket: Pocket;
  proteinPdbId: string;
  sourceType?: string;
  onConformationChange?: (confs: Conformation[] | null, mode: number | null) => void;
  onUndock?: () => void;
  onDockingComplete?: (result: {
    pocketId: number;
    sourceType: string;
    fragmentId: string;
    fragmentName: string;
    smiles: string;
    bindingAffinity: number;
    conformations: Conformation[];
    timestamp: number;
  }) => void;
  onRunDocking?: () => void;
  apiBase?: string;
}

export function DockingPanelV3({
  pocket,
  proteinPdbId,
  sourceType,
  onConformationChange,
  onUndock,
  onDockingComplete,
  onRunDocking,
  apiBase = '/api',
}: DockingPanelV3Props) {
  const {
    fragments,
    isLoading: fragmentsLoading,
    error: fragmentsError,
    refetch: refetchFragments,
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
    jobError,
    jobId,
    selectFragment,
    submitDocking,
    reset,
  } = useDockingJob(apiBase);

  useEffect(() => {
    if (step === 'results' && conformations?.length && selectedFragment) {
      onDockingComplete?.({
        pocketId: pocket.pocket_id,
        sourceType: sourceType || 'dimer',
        fragmentId: selectedFragment.chembl_id || selectedFragment.id || '',
        fragmentName: selectedFragment.name || selectedFragment.chembl_id,
        smiles: selectedFragment.smiles || '',
        bindingAffinity: conformations[0].binding_affinity,
        conformations,
        timestamp: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleUndock = () => {
    onUndock?.();
    onConformationChange?.(null, null);
    reset();
  };

  if (fragmentsLoading && step === 'idle') {
    return (
      <div className="flex flex-col items-center gap-3 py-16 justify-center">
        <div className="w-6 h-6 border-[2px] rounded-full animate-spin"
          style={{ borderColor: 'rgba(11,15,20,0.10)', borderTopColor: '#0B0F14' }} />
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#7A8580]">
          Searching ChEMBL for pocket #{pocket.pocket_id} properties…
        </span>
      </div>
    );
  }

  if (step === 'idle' || (step === 'error' && !jobError)) {
    return (
      <MoleculePickerV3
        fragments={fragments}
        isLoading={fragmentsLoading}
        error={fragmentsError}
        selectedFragment={selectedFragment}
        onSelect={selectFragment}
        onConfirm={() => { onRunDocking?.(); submitDocking(pocket.pocket_id, proteinPdbId, sourceType || 'dimer'); }}
        onRetry={refetchFragments}
        isDockingRunning={false}
      />
    );
  }

  if (step === 'running') {
    return (
      <div className="flex flex-col gap-4">
        <MoleculePickerV3
          fragments={fragments}
          isLoading={false}
          error={null}
          selectedFragment={selectedFragment}
          onSelect={() => { }}
          onConfirm={() => { }}
          onRetry={() => { }}
          isDockingRunning
        />
        <div className="flex items-start gap-3 mt-1 p-4 rounded-[12px] text-left"
          style={{ border: '1px solid rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.04)' }}>
          <div className="w-4 h-4 border-[2px] rounded-full animate-spin shrink-0 mt-[2px]"
            style={{ borderColor: 'rgba(245,158,11,0.20)', borderTopColor: '#B45309' }} />
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-[11px] font-bold text-[#B45309] uppercase tracking-[0.05em]">Docking calculations active</span>
            <span className="font-mono text-[10.5px] text-[#7A8580] leading-relaxed">
              AutoDock Vina is running on the compute server. This usually takes 2–8 minutes. You may continue exploring; the result will dynamically populate when done.
            </span>
            {jobId && (
              <span className="font-mono text-[9px] text-[#B8C2BD] mt-1">
                Job Identifier: {jobId}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="flex flex-col gap-3 justify-center py-6 text-left">
        <div className="flex flex-col gap-3 p-5 rounded-[12px]"
          style={{ border: '1px solid rgba(16,185,129,0.22)', background: 'rgba(16,185,129,0.03)' }}>
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-[#047857] flex items-center justify-center text-white text-[9px] font-bold">✓</div>
            <span className="font-mono text-[12px] font-bold text-[#047857] uppercase tracking-[0.05em]">
              Vina Docking completed
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#7A8580] m-0 leading-relaxed">
            Ligand <span className="font-bold text-[#0B0F14]">{selectedFragment?.chembl_id}</span> docked successfully on Pocket #{pocket.pocket_id}.<br />
            Best binding affinity: <span className="text-[#047857] font-bold">{conformations[0]?.binding_affinity?.toFixed(2)}</span> kcal/mol.<br />
            Select the entry in the Leaderboard on the left to browse individual conformations and visualize poses.
          </p>
          <button
            type="button"
            onClick={handleUndock}
            className="self-start font-mono text-[10px] uppercase tracking-[0.05em] px-4 py-[6px] rounded-full transition-colors duration-150"
            style={{ background: 'white', color: '#4A554D', border: '1px solid rgba(11,15,20,0.12)' }}
          >
            Run Another Docking
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 justify-center">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#DC2626] border border-[#DC2626] px-2 py-0.5 rounded-full bg-red-50">
          Job Error
        </span>
        <span className="font-mono text-[12px] text-[#7A8580] text-center max-w-[280px]">{jobError}</span>
        <button
          type="button"
          onClick={handleUndock}
          className="font-mono text-[10.5px] uppercase tracking-[0.05em] px-5 py-1.5 rounded-full transition-colors duration-150"
          style={{ background: 'rgba(11,15,20,0.04)', color: '#4A554D', border: '1px solid rgba(11,15,20,0.10)' }}
        >
          Reset Panel
        </button>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DOCKING LEADERBOARD V3
// ─────────────────────────────────────────────────────────────────────────────

interface DockingLeaderboardV3Props {
  entries: LeaderboardEntry[];
  activeEntryId?: string;
  onSelect?: (entry: LeaderboardEntry) => void;
  onRemove?: (entryId: string) => void;
}

export function DockingLeaderboardV3({
  entries,
  activeEntryId,
  onSelect,
  onRemove,
}: DockingLeaderboardV3Props) {
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-1"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
          <svg className="w-7 h-7" style={{ color: 'rgba(139,92,246,0.55)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#4A554D] font-bold">
          Docking Leaderboard empty
        </span>
        <span className="font-mono text-[10px] text-[#B8C2BD] max-w-[220px] leading-relaxed">
          Dock a molecule on any predicted pocket to populate the docking list.
        </span>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.bindingAffinity - b.bindingAffinity);

  return (
    <div className="flex flex-col gap-1.5 text-left">
      {sorted.map((entry, idx) => {
        const rank = idx + 1;
        const isTop = rank <= 3;
        const isActive = activeEntryId === entry.id;
        
        // Colors for top ranks
        const medalColors = ['#ca8a04', '#7A8580', '#B45309'];
        const badgeBg = rank === 1 ? 'rgba(234,179,8,0.12)' : rank === 2 ? 'rgba(11,15,20,0.06)' : 'rgba(245,158,11,0.10)';

        return (
          <div
            key={entry.id}
            className="group flex items-center gap-3 px-3.5 py-3 rounded-[12px] border transition-all duration-150 cursor-pointer relative"
            style={
              isActive
                ? { borderColor: '#8b5cf6', background: 'rgba(139,92,246,0.04)', boxShadow: '0 1px 4px rgba(139,92,246,0.08)' }
                : { borderColor: 'rgba(11,15,20,0.06)', background: 'white' }
            }
            onClick={() => onSelect?.(entry)}
          >
            {/* Rank badge */}
            <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 font-mono text-[11px] font-bold"
              style={
                isTop
                  ? { background: badgeBg, color: medalColors[idx] }
                  : { background: 'rgba(11,15,20,0.03)', color: '#7A8580' }
              }>
              {rank}
            </div>

            {/* Compound metadata */}
            <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-[#0B0F14] truncate font-semibold">
                  {entry.fragmentName}
                </span>
                <span className="font-mono text-[9px] uppercase px-1.5 py-[1px] rounded"
                  style={
                    entry.sourceType === 'monomer'
                      ? { color: '#3b82f6', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }
                      : { color: '#8b5cf6', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }
                  }>
                  {entry.sourceType}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-[#7A8580]">
                  Pocket {entry.pocketId}
                </span>
                <span className="font-mono text-[10px] text-[#B8C2BD]">·</span>
                <a
                  href={`${CHEMBL_BASE_URL}${entry.fragmentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[10px] text-[#8b5cf6] hover:opacity-60 transition-opacity"
                  title={`View ${entry.fragmentId} on ChEMBL`}
                >
                  {entry.fragmentId} ↗
                </a>
              </div>
            </div>

            {/* Affinity metrics */}
            <div className="flex flex-col items-end shrink-0 gap-[1px]">
              <span className="font-mono text-[13.5px] font-bold"
                style={
                  entry.bindingAffinity <= -7 ? { color: '#047857' } :
                  entry.bindingAffinity <= -5 ? { color: '#B45309' } :
                  { color: '#4A554D' }
                }>
                {entry.bindingAffinity.toFixed(1)}
              </span>
              <span className="font-mono text-[9px] text-[#7A8580] uppercase tracking-[0.02em]">kcal/mol</span>
            </div>

            {/* Quick remove button */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove?.(entry.id); }}
              className="opacity-0 group-hover:opacity-100 absolute -top-[5px] -right-[5px] w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white hover:bg-[#DC2626] transition-all"
              style={{ background: '#7A8580', border: '1px solid white' }}
              title="Delete result"
            >
              ✕
            </button>
          </div>
        );
      })}

      <div className="mt-3 pt-3 flex items-center justify-between px-1" style={{ borderTop: '1px solid rgba(11,15,20,0.07)' }}>
        <span className="font-mono text-[10px] text-[#7A8580] uppercase tracking-[0.05em]">
          {entries.length} Completed result{entries.length !== 1 ? 's' : ''}
        </span>
        <span className="font-mono text-[10px] text-[#7A8580]">
          Top affinity: <span className="text-[#047857] font-bold">{sorted[0]?.bindingAffinity.toFixed(1)}</span> kcal/mol
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DOCKING RESULT DETAIL V3
// ─────────────────────────────────────────────────────────────────────────────

interface DockingResultDetailV3Props {
  entry: LeaderboardEntry | null;
  onConformationSelect?: (entry: LeaderboardEntry, mode: number) => void;
}

export function DockingResultDetailV3({
  entry,
  onConformationSelect,
}: DockingResultDetailV3Props) {
  const [activeMode, setActiveMode] = React.useState(1);

  React.useEffect(() => {
    setActiveMode(1);
  }, [entry?.id]);

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <svg className="w-10 h-10" style={{ color: 'rgba(11,15,20,0.22)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#7A8580]">
          Ligand Inspection Panel
        </span>
        <span className="font-mono text-[10px] text-[#B8C2BD] max-w-[240px] leading-relaxed">
          Select any leaderboard entry to browse structural poses and copy SMILES targets.
        </span>
      </div>
    );
  }

  const conformations = entry.conformations || [];

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* Detail header */}
      <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(11,15,20,0.07)', paddingBottom: '12px' }}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <span className="font-mono text-[13px] font-bold text-[#0B0F14]">{entry.fragmentName}</span>
        </div>
        <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded"
          style={{ background: 'rgba(11,15,20,0.04)', color: '#4A554D', border: '1px solid rgba(11,15,20,0.1)' }}>
          {entry.sourceType} · Pocket #{entry.pocketId}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center p-3.5 rounded-[12px] gap-1 text-center"
          style={{ background: 'rgba(11,15,20,0.02)', border: '1px solid rgba(11,15,20,0.06)' }}>
          <span className="font-mono text-[16px] font-bold"
            style={
              entry.bindingAffinity <= -7 ? { color: '#047857' } :
              entry.bindingAffinity <= -5 ? { color: '#B45309' } :
              { color: '#4A554D' }
            }>
            {entry.bindingAffinity.toFixed(1)}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.03em] text-[#7A8580]">Affinity</span>
        </div>
        <div className="flex flex-col items-center p-3.5 rounded-[12px] gap-1 text-center"
          style={{ background: 'rgba(11,15,20,0.02)', border: '1px solid rgba(11,15,20,0.06)' }}>
          <a
            href={`${CHEMBL_BASE_URL}${entry.fragmentId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[12.5px] text-[#8b5cf6] font-semibold hover:opacity-60 transition-opacity truncate max-w-full"
          >
            {entry.fragmentId} ↗
          </a>
          <span className="font-mono text-[9px] uppercase tracking-[0.03em] text-[#7A8580]">ChEMBL ID</span>
        </div>
        <div className="flex flex-col items-center p-3.5 rounded-[12px] gap-1 text-center"
          style={{ background: 'rgba(11,15,20,0.02)', border: '1px solid rgba(11,15,20,0.06)' }}>
          <span className="font-mono text-[13px] font-bold text-[#0B0F14]">{conformations.length}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.03em] text-[#7A8580]">Poses</span>
        </div>
      </div>

      {/* Conformation grid browser */}
      {conformations.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#7A8580] font-bold">Predicted Poses</span>
            <span className="font-mono text-[9.5px] text-[#B8C2BD]">Click pose to set 3D view</span>
          </div>
          <div className="max-h-[160px] overflow-y-auto flex flex-col gap-1 pr-1" style={{ scrollbarWidth: 'thin' }}>
            {conformations.map((c) => {
              const isActive = c.mode === activeMode;
              return (
                <div
                  key={c.mode}
                  onClick={() => {
                    setActiveMode(c.mode);
                    onConformationSelect?.(entry, c.mode);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[8px] cursor-pointer transition-all duration-150 ${
                    isActive ? '' : 'hover:bg-[rgba(11,15,20,0.04)]'
                  }`}
                  style={
                    isActive
                      ? { background: 'rgba(139,92,246,0.08)', borderLeft: '3px solid #8b5cf6', paddingLeft: '9px' }
                      : { background: 'rgba(11,15,20,0.02)', borderLeft: '3px solid transparent' }
                  }
                >
                  <span className="font-mono text-[10.5px] font-bold text-[#7A8580] px-1.5 py-[2px] rounded"
                    style={{ background: 'rgba(11,15,20,0.04)' }}>
                    Pose #{c.mode}
                  </span>
                  {c.mode === 1 && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.05em] px-1.5 py-[1px] rounded text-[#047857] font-semibold"
                      style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.22)' }}>
                      Optimal
                    </span>
                  )}
                  <span className="font-mono text-[12px] font-bold flex-1"
                    style={
                      c.binding_affinity <= -8.0 ? { color: '#047857' } :
                      c.binding_affinity <= -6.0 ? { color: '#B45309' } :
                      { color: '#4A554D' }
                    }>
                    {c.binding_affinity.toFixed(2)}
                    <span className="text-[#7A8580] text-[9.5px] font-normal ml-1">kcal/mol</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#B8C2BD]">
                    lb: {c.rmsd_lb.toFixed(1)} · ub: {c.rmsd_ub.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SMILES block */}
      {entry.smiles && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-[#7A8580] font-bold">SMILES String</span>
          <code className="font-mono text-[10px] text-[#4A554D] bg-[#FAFBFA] border p-3 rounded-[10px] break-all select-all leading-normal text-left block"
            style={{ borderColor: 'rgba(11,15,20,0.06)' }}>
            {entry.smiles}
          </code>
        </div>
      )}

      <div className="flex items-center gap-2 p-3.5 rounded-[12px] text-left"
        style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
        <svg className="w-4 h-4 text-[#8b5cf6] shrink-0 mt-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-mono text-[10.5px] text-[#7A8580] leading-relaxed">
          The selected pose's molecular conformation is being loaded directly onto the 3D structure viewer above.
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MAIN DOCKING SECTION V3 WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

interface DockingSectionV3Props {
  complexId: string | undefined;
  activeDocking: (DockingInfo & { activeTab?: string }) | null;
  leaderboard: LeaderboardEntry[];
  selectedEntry: LeaderboardEntry | null;
  onDockingComplete: (result: {
    pocketId: number;
    sourceType: string;
    fragmentId: string;
    fragmentName: string;
    smiles: string;
    bindingAffinity: number;
    conformations: Conformation[];
    timestamp: number;
  }) => void;
  onConformationChange: (confs: Conformation[] | null, mode: number | null) => void;
  onUndock: () => void;
  onCloseDocking: () => void;
  onSelectLeaderboardEntry: (entry: LeaderboardEntry) => void;
  onRemoveLeaderboardEntry: (entryId: string) => void;
  onRunDocking?: () => void;
}

export function DockingSectionV3({
  complexId,
  activeDocking,
  leaderboard,
  selectedEntry,
  onDockingComplete,
  onConformationChange,
  onUndock,
  onCloseDocking,
  onSelectLeaderboardEntry,
  onRemoveLeaderboardEntry,
  onRunDocking,
}: DockingSectionV3Props) {
  const renderRightPanel = () => {
    if (activeDocking) {
      return (
        <div className="flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(11,15,20,0.07)' }}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#0B0F14] font-bold">
                Docking — Pocket #{activeDocking.pocket.pocket_id}
              </span>
              <span className="font-mono text-[9px] uppercase px-1.5 py-[1px] rounded"
                style={
                  activeDocking.sourceType === 'monomer'
                    ? { color: '#3b82f6', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }
                    : { color: '#8b5cf6', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }
                }>
                {activeDocking.sourceType}
              </span>
            </div>
            <button
              onClick={onCloseDocking}
              className="font-mono text-[10px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full transition-colors duration-150"
              style={{ background: 'white', color: '#7A8580', border: '1px solid rgba(11,15,20,0.12)' }}
            >
              ✕ Close
            </button>
          </div>
          <DockingPanelV3
            pocket={activeDocking.pocket}
            proteinPdbId={activeDocking.proteinPdbId}
            sourceType={activeDocking.sourceType}
            onConformationChange={onConformationChange}
            onUndock={onUndock}
            onDockingComplete={onDockingComplete}
            onRunDocking={onRunDocking}
          />
        </div>
      );
    }

    return (
      <DockingResultDetailV3
        entry={selectedEntry}
        onConformationSelect={onSelectLeaderboardEntry}
      />
    );
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h2 className="font-medium tracking-[-0.025em] text-[#0B0F14] m-0 mb-1" style={{ fontSize: '22px' }}>
          AutoDock Vina Virtual Screening
        </h2>
        <p className="text-[14px] text-[#7A8580] m-0">
          Dock custom ligands on predicted binding pockets to identify candidate inhibitors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Leaderboard */}
        <div className="lg:col-span-5 bg-white border rounded-[16px] flex flex-col"
          style={{ borderColor: 'rgba(11,15,20,0.09)', boxShadow: '0 1px 2px rgba(11,15,20,0.03), 0 16px 40px -24px rgba(11,15,20,0.14)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'rgba(11,15,20,0.07)', background: 'linear-gradient(180deg, rgba(11,15,20,0.015), transparent)' }}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#0B0F14] font-bold">
                Docking Leaderboard
              </span>
              {leaderboard.length > 0 && (
                <span className="font-mono text-[10px] px-2 py-[1px] rounded-full text-white bg-[#0B0F14] font-bold">
                  {leaderboard.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 max-h-[460px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <DockingLeaderboardV3
              entries={leaderboard}
              activeEntryId={selectedEntry?.id}
              onSelect={onSelectLeaderboardEntry}
              onRemove={onRemoveLeaderboardEntry}
            />
          </div>
        </div>

        {/* Right Side: Active calculations or entry inspection */}
        <div className="lg:col-span-7 bg-[#FAFBFA] border rounded-[16px] p-6 flex flex-col justify-between"
          style={{ borderColor: 'rgba(11,15,20,0.09)', boxShadow: '0 1px 2px rgba(11,15,20,0.03), 0 16px 40px -24px rgba(11,15,20,0.14)' }}>
          {renderRightPanel()}
        </div>
      </div>
    </div>
  );
}
