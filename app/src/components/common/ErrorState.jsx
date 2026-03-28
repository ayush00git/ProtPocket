import React from 'react';

export function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-[96px]">
      <div className="text-[11px] uppercase tracking-wider text-danger border border-danger rounded px-2 py-0.5 mb-4">
        ERR
      </div>
      <div className="text-text-muted text-sm text-center max-w-md">
        {message || 'An unknown error occurred'}
      </div>
    </div>
  );
}
