import React from 'react';
import { motion } from 'framer-motion';

export function RevealButton({ isRevealed, onReveal, disabled }) {
  return (
    <motion.button
      onClick={onReveal}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`
        font-mono text-[11px] uppercase tracking-wider px-5 py-2.5 rounded
        border transition-colors duration-150
        ${disabled
          ? 'border-border-subtle text-text-muted cursor-not-allowed bg-bg-tertiary'
          : isRevealed
            ? 'border-border text-text-secondary bg-bg-tertiary hover:text-text-primary hover:border-border'
            : 'border-accent text-accent bg-accent-dim hover:bg-accent hover:text-bg-primary'
        }
      `}
    >
      {isRevealed ? '\u2190 Monomer Only' : 'Reveal Complex \u2192'}
    </motion.button>
  );
}
