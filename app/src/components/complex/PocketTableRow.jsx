import React from 'react';

/**
 * PocketTableRow — displays details for a single predicted binding pocket in a table format.
 * "Dock Molecule" signals the parent to open the docking UI in the detail panel.
 */
export function PocketTableRow({ pocket, activeTab, isActive, onHighlight, proteinPdbId, sourceType, onStartDocking, isDockingActive }) {
  const scoreColor = pocket.druggability_score >= 0.5
    ? 'text-success'
    : pocket.druggability_score >= 0.3
      ? 'text-warning'
      : 'text-text-secondary';

  const displayResidues = (pocket.residue_names || []).slice(0, 3).map((r, i) => `${r}${pocket.residue_indices?.[i] || ''}`).join(', ');
  const moreResidues = (pocket.residue_names || []).length > 3 ? ` +${(pocket.residue_names || []).length - 3}` : '';

  return (
    <tr className={`border-b border-border transition-colors duration-150 ${
      isActive ? 'bg-accent-dim/20' : isDockingActive ? 'bg-purple-500/5' : 'bg-bg-primary hover:bg-bg-secondary'
    }`}>
      <td className="px-4 py-3 font-mono text-base text-text-primary">
        <div className="flex flex-col gap-1">
          <span>#{pocket.pocket_id}</span>
          {pocket.is_interface_pocket && (
            <span className="w-max font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30">
              Interface
            </span>
          )}
          {pocket.is_conserved && (
            <span className="w-max font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
              Conserved
            </span>
          )}
          {pocket.is_emergent && (
            <span className="w-max font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30">
              Emergent
            </span>
          )}
        </div>
      </td>
      <td className={`px-4 py-3 font-mono text-base font-bold ${scoreColor}`}>
        {pocket.druggability_score?.toFixed(3)}
      </td>
      <td className="px-4 py-3 font-mono text-sm text-text-primary">
        {pocket.volume?.toFixed(0)} <span className="text-[10px] text-text-muted">ų</span>
      </td>
      <td className="px-4 py-3 font-mono text-sm text-text-primary">
        {pocket.hydrophobicity?.toFixed(2)}
      </td>
      <td className="px-4 py-3 font-mono text-sm text-text-primary">
        {pocket.polarity?.toFixed(2)}
      </td>
      <td className={`px-4 py-3 font-mono text-sm ${
        activeTab === 'comparison'
          ? (pocket.avg_disorder_delta > 0 ? 'text-success' : pocket.avg_disorder_delta < 0 ? 'text-error' : 'text-text-primary')
          : (pocket.avg_plddt > 0 ? 'text-success' : 'text-text-primary')
      }`}>
        {activeTab === 'comparison'
          ? `${pocket.avg_disorder_delta > 0 ? '+' : ''}${pocket.avg_disorder_delta?.toFixed(1)}`
          : pocket.avg_plddt?.toFixed(1)
        }
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
        {pocket.center ? (
          <span>
            {pocket.center[0].toFixed(1)}, {pocket.center[1].toFixed(1)}, {pocket.center[2].toFixed(1)}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
        {displayResidues}{moreResidues}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            onClick={() => onHighlight?.(pocket.residue_indices)}
            className={`font-mono text-xs uppercase tracking-wider px-2 py-1 rounded border transition-colors duration-150 ${
              isActive
                ? 'bg-accent text-bg-primary border-accent'
                : 'bg-bg-tertiary text-text-secondary border-border hover:border-accent hover:text-accent'
            }`}
          >
            {isActive ? '● Highlighted' : 'Highlight'}
          </button>
          <button
            type="button"
            disabled={!proteinPdbId}
            onClick={() => {
              if (!proteinPdbId) return;
              onStartDocking?.({ pocket, sourceType, proteinPdbId });
            }}
            className={`font-mono text-xs uppercase tracking-wider px-2 py-1 rounded border transition-colors duration-150 ${
              !proteinPdbId
                ? 'opacity-40 cursor-not-allowed border-border bg-bg-tertiary text-text-muted'
                : isDockingActive
                  ? 'bg-accent/10 text-accent border-accent/50 shadow-[0_0_0_1px_rgba(var(--color-accent-rgb),0.3)]'
                  : 'bg-bg-tertiary text-text-secondary border-border hover:border-accent hover:text-accent font-bold'
            }`}
          >
            {isDockingActive ? '● Docking Active' : 'Dock Molecule'}
          </button>
        </div>
      </td>
    </tr>
  );
}
