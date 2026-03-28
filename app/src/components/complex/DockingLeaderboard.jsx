import React from 'react';

const CHEMBL_BASE_URL = 'https://www.ebi.ac.uk/chembl/compound_report_card/';

/**
 * DockingLeaderboard — Panel showing all completed docking results, sorted by binding affinity.
 * ChEMBL IDs are clickable links to the ChEMBL database.
 */
export function DockingLeaderboard({ entries, activeEntryId, onSelect, onRemove }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <svg className="w-8 h-8 text-text-muted opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          No docking results yet
        </span>
        <span className="font-mono text-[9px] text-text-muted opacity-60 text-center px-4">
          Dock a molecule to any pocket to see results here
        </span>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.bindingAffinity - b.bindingAffinity);

  return (
    <div className="flex flex-col gap-1">
      {sorted.map((entry, idx) => {
        const rank = idx + 1;
        const isTop = rank <= 3;
        const isActive = activeEntryId === entry.id;
        const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
        
        return (
          <div
            key={entry.id}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded border transition-all duration-150 cursor-pointer ${
              isActive
                ? 'border-accent/50 bg-accent/5 shadow-[0_0_0_1px_rgba(var(--color-accent-rgb),0.2)]'
                : 'border-transparent hover:border-border-subtle hover:bg-bg-secondary'
            }`}
            onClick={() => onSelect?.(entry)}
          >
            <span className={`font-mono text-sm font-bold w-5 text-center flex-none ${
              isTop ? medalColors[idx] : 'text-text-muted'
            }`}>
              {rank}
            </span>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-primary truncate font-medium">
                  {entry.fragmentName}
                </span>
                <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border flex-none ${
                  entry.sourceType === 'monomer'
                    ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                    : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                }`}>
                  {entry.sourceType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-text-muted">
                  Pocket #{entry.pocketId}
                </span>
                <span className="font-mono text-[10px] text-text-muted">·</span>
                <a
                  href={`${CHEMBL_BASE_URL}${entry.fragmentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[10px] text-accent hover:text-accent/80 hover:underline transition-colors"
                  title={`View ${entry.fragmentId} on ChEMBL`}
                >
                  {entry.fragmentId} ↗
                </a>
              </div>
            </div>

            <div className="flex flex-col items-end flex-none gap-0.5">
              <span className={`font-mono text-sm font-bold ${
                entry.bindingAffinity <= -7 ? 'text-success' :
                entry.bindingAffinity <= -5 ? 'text-warning' :
                'text-text-secondary'
              }`}>
                {entry.bindingAffinity.toFixed(1)}
              </span>
              <span className="font-mono text-[9px] text-text-muted">kcal/mol</span>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onRemove?.(entry.id); }}
              className="opacity-0 group-hover:opacity-100 flex-none w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
              title="Remove"
            >
              ×
            </button>
          </div>
        );
      })}

      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between px-3">
        <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider">
          {entries.length} result{entries.length !== 1 ? 's' : ''}
        </span>
        <span className="font-mono text-[9px] text-text-muted">
          Best: <span className="text-success font-bold">{sorted[0]?.bindingAffinity.toFixed(1)}</span> kcal/mol
        </span>
      </div>
    </div>
  );
}

/**
 * DockingResultDetail — Shows details of a selected leaderboard entry with conformations.
 * Includes a ConformationBrowser so the user can switch poses from the detail panel.
 */
export function DockingResultDetail({ entry, onConformationSelect }) {
  const [activeMode, setActiveMode] = React.useState(1);

  React.useEffect(() => {
    setActiveMode(1);
  }, [entry?.id]);

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <svg className="w-10 h-10 text-text-muted opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Select a result to view details
        </span>
        <span className="font-mono text-[9px] text-text-muted opacity-60 text-center">
          Click any entry in the leaderboard to see the docked molecule on the protein viewer
        </span>
      </div>
    );
  }

  const conformations = entry.conformations || [];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <span className="font-mono text-sm font-bold text-text-primary">{entry.fragmentName}</span>
        </div>
        <span className={`font-mono text-[9px] uppercase px-2 py-1 rounded border ${
          entry.sourceType === 'monomer'
            ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
            : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        }`}>
          {entry.sourceType} · Pocket #{entry.pocketId}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center p-3 bg-bg-primary border border-border rounded gap-1">
          <span className={`font-mono text-xl font-bold ${
            entry.bindingAffinity <= -7 ? 'text-success' :
            entry.bindingAffinity <= -5 ? 'text-warning' :
            'text-text-secondary'
          }`}>
            {entry.bindingAffinity.toFixed(1)}
          </span>
          <span className="font-mono text-[9px] uppercase text-text-muted">kcal/mol</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-bg-primary border border-border rounded gap-1">
          <a
            href={`${CHEMBL_BASE_URL}${entry.fragmentId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-accent hover:underline transition-colors"
          >
            {entry.fragmentId} ↗
          </a>
          <span className="font-mono text-[9px] uppercase text-text-muted">ChEMBL</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-bg-primary border border-border rounded gap-1">
          <span className="font-mono text-sm text-text-primary">{conformations.length}</span>
          <span className="font-mono text-[9px] uppercase text-text-muted">Poses</span>
        </div>
      </div>

      {/* Conformation Browser */}
      {conformations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">Conformations</span>
            <span className="font-mono text-[10px] text-text-muted">Vina output</span>
          </div>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
            {conformations.map((c) => {
              const isActive = c.mode === activeMode;
              const affinityColor =
                c.binding_affinity <= -8.0 ? 'text-success' : c.binding_affinity <= -6.0 ? 'text-warning' : 'text-danger';
              return (
                <div
                  key={c.mode}
                  onClick={() => {
                    setActiveMode(c.mode);
                    onConformationSelect?.(entry, c.mode);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-accent/10 border-l-2 border-l-accent pl-[10px]'
                      : 'hover:bg-bg-tertiary'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded flex-none">
                    #{c.mode}
                  </span>
                  {c.mode === 1 && (
                    <span className="font-mono text-[9px] bg-success/15 text-success border border-success/30 px-1 py-0.5 rounded uppercase tracking-wider flex-none">
                      Best
                    </span>
                  )}
                  <span className={`font-mono text-sm flex-1 ${affinityColor} font-bold`}>
                    {c.binding_affinity > 0 ? '+' : ''}
                    {c.binding_affinity.toFixed(2)}
                    <span className="text-text-muted text-[10px] font-normal ml-1">kcal/mol</span>
                  </span>
                  <span className="font-mono text-[10px] text-text-muted flex-none">
                    lb: {c.rmsd_lb.toFixed(1)} ub: {c.rmsd_ub.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="font-mono text-[9px] text-text-muted mt-2 text-center uppercase tracking-wider">
            Click a conformation to render it in the viewer
          </p>
        </div>
      )}

      {/* SMILES */}
      {entry.smiles && (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase text-text-muted tracking-wider">SMILES</span>
          <code className="font-mono text-[10px] text-text-secondary bg-bg-primary border border-border-subtle rounded px-3 py-2 break-all select-all">
            {entry.smiles}
          </code>
        </div>
      )}

      {/* Hint */}
      <div className="flex items-center gap-2 px-3 py-2 bg-accent/5 border border-accent/15 rounded">
        <svg className="w-3.5 h-3.5 text-accent flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-mono text-[10px] text-text-muted">
          Docked pose is displayed on the {entry.sourceType} viewer above
        </span>
      </div>
    </div>
  );
}
