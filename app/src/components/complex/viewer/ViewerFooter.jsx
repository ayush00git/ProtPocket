import React from 'react';

export function ViewerFooter({ description, url }) {
  const filename = url ? url.split('/').pop() : null;

  return (
    <div className="flex flex-row justify-between items-center px-4 py-3 border-t border-border bg-bg-secondary">
      <span className="italic text-[13px] text-text-secondary">{description}</span>
      {url && filename ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-text-muted hover:text-accent transition-colors duration-150"
        >
          {filename}
        </a>
      ) : (
        <span className="font-mono text-[10px] text-text-muted">
          Complex structure file not yet available
        </span>
      )}
    </div>
  );
}
