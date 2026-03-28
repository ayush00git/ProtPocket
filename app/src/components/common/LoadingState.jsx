import React from 'react';

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-[96px]">
      <div className="w-8 h-8 rounded-full border-[3px] border-border-subtle border-t-accent animate-spin mb-4" style={{ borderRadius: '50%' }}></div>
      <div className="font-mono text-sm text-text-muted">{message}</div>
    </div>
  );
}
