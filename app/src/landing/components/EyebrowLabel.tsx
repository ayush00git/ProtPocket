import React from 'react';

interface Props {
  children: React.ReactNode;
  tone?: 'dark' | 'light';
  className?: string;
}

export function EyebrowLabel({ children, tone = 'dark', className = '' }: Props) {
  const color = tone === 'light' ? 'text-[#f5f2ec]/40' : 'text-[#8a8780]';
  return (
    <span
      className={`block font-['DM_Sans'] text-[11px] font-medium uppercase tracking-[0.12em] ${color} ${className}`}
    >
      {children}
    </span>
  );
}
