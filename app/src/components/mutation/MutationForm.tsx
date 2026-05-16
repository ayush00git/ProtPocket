import React, { useState, useEffect } from 'react';

const EXAMPLES = [
  { label: 'EGFR T790M',    uniprotId: 'P00533', mutation: 'EGFR T790M' },
  { label: 'BCR-ABL T315I', uniprotId: 'P00519', mutation: 'BCR-ABL T315I' },
  { label: 'KRAS G12C',     uniprotId: 'P01116', mutation: 'KRAS G12C' },
];

interface Props {
  onSubmit: (uniprotId: string, mutation: string) => void;
  onInputChange?: () => void;
  loading: boolean;
  initialUniprotId?: string;
}

export function MutationForm({ onSubmit, onInputChange, loading, initialUniprotId }: Props) {
  const [uniprotId, setUniprotId] = useState(initialUniprotId ?? '');
  const [mutation, setMutation] = useState('');

  useEffect(() => {
    if (initialUniprotId) setUniprotId(initialUniprotId);
  }, [initialUniprotId]);

  const canSubmit = uniprotId.trim().length > 0 && mutation.trim().length > 0 && !loading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) onSubmit(uniprotId.trim(), mutation.trim());
  }

  function fillExample(ex: typeof EXAMPLES[0]) {
    setUniprotId(ex.uniprotId);
    setMutation(ex.mutation);
    onInputChange?.();
  }

  function handleUniprotChange(v: string) {
    setUniprotId(v);
    onInputChange?.();
  }

  function handleMutationChange(v: string) {
    setMutation(v);
    onInputChange?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted">UniProt ID</label>
        <input
          type="text"
          value={uniprotId}
          onChange={e => handleUniprotChange(e.target.value)}
          placeholder="e.g. P00533"
          disabled={loading}
          className="bg-bg-primary font-body text-[16px] px-5 py-4 outline-none border border-border focus:border-accent rounded transition-colors duration-150 text-text-primary placeholder-text-muted disabled:opacity-50 w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Mutation</label>
        <input
          type="text"
          value={mutation}
          onChange={e => handleMutationChange(e.target.value)}
          placeholder="e.g. EGFR T790M or T790M"
          disabled={loading}
          className="bg-bg-primary font-body text-[16px] px-5 py-4 outline-none border border-border focus:border-accent rounded transition-colors duration-150 text-text-primary placeholder-text-muted disabled:opacity-50 w-full"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="font-mono font-bold text-[13px] uppercase tracking-wider px-8 py-4 bg-[#2563EB] dark:bg-bg-tertiary text-white dark:text-text-primary rounded border border-transparent dark:border-border enabled:hover:bg-[#1E40AF] dark:enabled:hover:bg-accent dark:enabled:hover:text-black disabled:opacity-50 transition-colors duration-150"
      >
        {loading ? 'Analyzing…' : 'Analyze'}
      </button>

      {/* Example chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Try:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex.label}
            type="button"
            disabled={loading}
            onClick={() => fillExample(ex)}
            className="font-mono text-[11px] px-2.5 py-1 rounded border border-border text-text-secondary hover:text-text-primary hover:border-border-subtle disabled:opacity-50 transition-colors duration-150"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </form>
  );
}
