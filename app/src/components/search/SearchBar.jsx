import React, { useState, useEffect } from 'react';

export function SearchBar({ onSearch, loading = false, initialValue = '' }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSearch(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const isDisabled = loading || !value.trim();

  return (
    <div className="w-full flex flex-col gap-2">
      <form 
        onSubmit={handleSubmit}
        className="flex flex-row w-full border border-border focus-within:border-[#3B82F6] dark:focus-within:border-accent rounded transition-colors duration-150 overflow-hidden"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Search gene, protein, disease, or organism..."
          className="flex-1 bg-bg-primary font-body text-[16px] px-5 py-4 outline-none w-full text-text-primary placeholder-text-muted disabled:opacity-50 transition-colors duration-150"
        />
        <button
          type="submit"
          disabled={isDisabled}
          className="font-mono font-bold px-8 bg-[#2563EB] dark:bg-bg-tertiary text-white dark:text-text-primary transition-colors duration-150 enabled:hover:bg-[#1E40AF] dark:enabled:hover:bg-accent dark:enabled:hover:text-[#000000] disabled:opacity-50 border-l border-transparent dark:border-border"
        >
          {loading ? 'SEARCHING...' : 'SEARCH'}
        </button>
      </form>
      <div className="font-mono text-[11px] text-text-muted px-1 mt-1 transition-colors duration-150">
        Try: TP53 · tuberculosis · BRCA1 · Staphylococcus aureus
      </div>
    </div>
  );
}
