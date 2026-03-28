import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useComplex } from '../hooks/useComplex';
import { ComplexHeader } from '../components/complex/ComplexHeader';
import { ProteinViewer } from '../components/complex/viewer/ProteinViewer';
import { MetricsPanel } from '../components/complex/MetricsPanel';
import { BindingSitesPanel } from '../components/complex/BindingSitesPanel';
import { DockingPanel } from '../components/complex/DockingPanel';
import { DockingLeaderboard, DockingResultDetail } from '../components/complex/DockingLeaderboard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export function ComplexDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { complex, loading, error } = useComplex(id);
  const viewerRef = React.useRef(null);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Active docking pocket state — set when user clicks "Dock Molecule" on a pocket row
  const [activeDocking, setActiveDocking] = useState(null); // { pocket, sourceType, proteinPdbId, activeTab }

  // Called when user clicks "Dock Molecule" on a pocket row
  const handleStartDocking = useCallback((info) => {
    // If clicking the same pocket, toggle off
    if (activeDocking?.pocket?.pocket_id === info.pocket.pocket_id && activeDocking?.sourceType === info.sourceType) {
      viewerRef.current?.clearConformations?.('both');
      setActiveDocking(null);
      return;
    }
    // Clear any previous docked molecule before switching
    viewerRef.current?.clearConformations?.('both');
    setActiveDocking(info);
    setSelectedEntry(null);
  }, [activeDocking]);

  // Called when docking completes
  const handleDockingComplete = useCallback((result) => {
    const entryId = `${result.sourceType}-${result.pocketId}-${result.fragmentId}-${Date.now()}`;
    const newEntry = { ...result, id: entryId };
    setLeaderboard((prev) => {
      if (prev.some(e => e.pocketId === result.pocketId && e.fragmentId === result.fragmentId && e.sourceType === result.sourceType)) {
        return prev;
      }
      return [...prev, newEntry];
    });
    setSelectedEntry(newEntry);
    setActiveDocking(null);
    // Clear any old pose, then show the new one
    viewerRef.current?.clearConformations?.('both');
    const target = result.sourceType === 'monomer' ? 'monomer' : 'complex';
    if (result.conformations?.length) {
      viewerRef.current?.setConformations?.(result.conformations, 1, target);
    }
  }, []);

  // Called when undock/re-dock is clicked in DockingPanel
  const handleUndock = useCallback(() => {
    viewerRef.current?.clearConformations?.('both');
    viewerRef.current?.clearPocketHighlight?.();
  }, []);

  // Called when user selects a leaderboard entry
  const handleLeaderboardSelect = useCallback((entry) => {
    setSelectedEntry(entry);
    setActiveDocking(null);
    // Clear old pose first, then show the selected one
    viewerRef.current?.clearConformations?.('both');
    const target = entry.sourceType === 'monomer' ? 'monomer' : 'complex';
    if (entry.conformations?.length) {
      viewerRef.current?.setConformations?.(entry.conformations, 1, target);
    }
  }, []);

  // Called when user removes a leaderboard entry
  const handleLeaderboardRemove = useCallback((entryId) => {
    setLeaderboard((prev) => prev.filter(e => e.id !== entryId));
    setSelectedEntry((prev) => prev?.id === entryId ? null : prev);
  }, []);

  // Called when user clicks a conformation in the detail panel
  const handleConformationSelect = useCallback((entry, mode) => {
    const target = entry.sourceType === 'monomer' ? 'monomer' : 'complex';
    if (entry.conformations?.length) {
      viewerRef.current?.setConformations?.(entry.conformations, mode, target);
    }
  }, []);

  // Determine what to show in the right panel
  const renderRightPanel = () => {
    // If actively docking a pocket, show DockingPanel
    if (activeDocking) {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-primary font-bold">
                Dock — Pocket #{activeDocking.pocket.pocket_id}
              </span>
              <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                activeDocking.sourceType === 'monomer'
                  ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                  : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
              }`}>
                {activeDocking.sourceType}
              </span>
            </div>
            <button
              onClick={() => {
                handleUndock();
                setActiveDocking(null);
              }}
              className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-border text-text-muted hover:text-text-primary hover:border-border-subtle transition-colors"
            >
              ✕ Close
            </button>
          </div>
          <DockingPanel
            pocket={activeDocking.pocket}
            proteinPdbId={activeDocking.proteinPdbId}
            sourceType={activeDocking.sourceType}
            onConformationChange={(confs, mode) => {
              const target = activeDocking.activeTab === 'monomer' ? 'monomer' : 'complex';
              if (confs) {
                viewerRef.current?.setConformations?.(confs, mode, target);
              } else {
                viewerRef.current?.clearConformations?.(target);
              }
            }}
            onUndock={handleUndock}
            onDockingComplete={handleDockingComplete}
          />
        </div>
      );
    }

    // If a leaderboard entry is selected, show result detail
    if (selectedEntry) {
      return <DockingResultDetail entry={selectedEntry} onConformationSelect={handleConformationSelect} />;
    }

    // Default placeholder
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <svg className="w-10 h-10 text-text-muted opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Select a pocket to dock
        </span>
        <span className="font-mono text-[9px] text-text-muted opacity-60 text-center">
          Click "Dock Molecule" on any pocket, or select a result from the leaderboard
        </span>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-[1400px] px-6 py-[48px] flex flex-col gap-6">

        <button
          onClick={() => navigate(-1)}
          className="font-mono text-[11px] uppercase tracking-wider w-24 text-center py-2 bg-bg-tertiary border border-border flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary hover:bg-border-subtle hover:border-border-subtle rounded transition-colors duration-150"
        >
          ← BACK
        </button>

        {loading && <LoadingState message="Loading complex structure..." />}
        {error && <ErrorState message={error} />}

        {!loading && !error && complex && (
          <div className="flex flex-col">
            <ComplexHeader complex={complex} />
            <ProteinViewer
              ref={viewerRef}
              monomerUrl={complex.monomer_structure_url}
              complexUrl={complex.complex_structure_url}
              monomerPlddt={complex.monomer_plddt_avg}
              dimerPlddt={complex.dimer_plddt_avg}
              disorderDelta={complex.disorder_delta}
            />
            <MetricsPanel complex={complex} />

            {/* Docking workspace — below Structural Metrics */}
            <div className="flex flex-row gap-6 mt-2 mb-4">
              {/* Left: Leaderboard */}
              <div className="flex-1 min-w-0 bg-bg-secondary border border-border rounded flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-text-primary font-bold">
                      Docking Leaderboard
                    </span>
                    {leaderboard.length > 0 && (
                      <span className="bg-accent/20 text-accent text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {leaderboard.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 max-h-[400px] overflow-y-auto">
                  <DockingLeaderboard
                    entries={leaderboard}
                    activeEntryId={selectedEntry?.id}
                    onSelect={handleLeaderboardSelect}
                    onRemove={handleLeaderboardRemove}
                  />
                </div>
              </div>

              {/* Right: Docking UI or Result Detail */}
              <div className="flex-1 min-w-0 bg-bg-secondary border border-border rounded p-5">
                {renderRightPanel()}
              </div>
            </div>

            <BindingSitesPanel
              complexId={id}
              onHighlightPocket={(indices, target) => viewerRef.current?.highlightPocket?.(indices, target)}
              onClearHighlight={(target) => {
                viewerRef.current?.clearPocketHighlight?.(target);
                viewerRef.current?.clearConformations?.(target);
              }}
              monomerStructureUrl={complex.monomer_structure_url?.replace(/\.cif$/i, '.pdb') || ''}
              complexStructureUrl={complex.complex_structure_url?.replace(/\.cif$/i, '.pdb') || complex.uniprot_id || ''}
              onConformationChange={(confs, mode, target) => viewerRef.current?.setConformations?.(confs, mode, target)}
              onStartDocking={handleStartDocking}
              activeDockingPocketId={activeDocking?.pocket?.pocket_id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
