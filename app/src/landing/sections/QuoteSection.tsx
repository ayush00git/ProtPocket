import React from 'react';
import { AnimateIn } from '../components/AnimateIn';
import { EyebrowLabel } from '../components/EyebrowLabel';

export function QuoteSection() {
  return (
    <section
      className="bg-[#0d0d0b] relative overflow-hidden"
      style={{
        paddingBlock: 'clamp(5rem, 10vw, 9rem)',
        paddingInline: 'clamp(1.5rem, 5vw, 5rem)',
      }}
    >
      {/* Subtle gradient accents echoing the hero palette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 15% 30%, rgba(26, 92, 82, 0.32) 0%, transparent 60%),' +
            'radial-gradient(ellipse 60% 70% at 85% 70%, rgba(38, 70, 100, 0.30) 0%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto" style={{ maxWidth: 1000 }}>
        <AnimateIn>
          <EyebrowLabel tone="light">The mission</EyebrowLabel>
          <div
            className="font-['Cormorant_Garamond'] font-light text-[#f5f2ec]/15 leading-none"
            style={{ fontSize: '5rem', marginBottom: '-0.5rem' }}
            aria-hidden
          >
            “
          </div>
          <p
            className="font-['Cormorant_Garamond'] font-light italic text-[#f5f2ec] leading-[1.35]"
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              maxWidth: '780px',
              marginBottom: '2.5rem',
            }}
          >
            The three-dimensional geometry of a protein pocket determines everything —
            affinity, selectivity, and ultimately, therapeutic potential.
          </p>
          <div className="flex items-center gap-4">
            <div
              className="rounded-full bg-[#f5f2ec]/10 border border-[#f5f2ec]/15 flex items-center justify-center font-['Cormorant_Garamond'] text-[#f5f2ec]/55"
              style={{ width: 48, height: 48 }}
              aria-hidden
            >
              P
            </div>
            <div>
              <div className="font-['DM_Sans'] text-[11px] font-medium uppercase tracking-[0.12em] text-[#f5f2ec]/55">
                The ProtPocket Team
              </div>
              <div className="font-['DM_Sans'] text-[11px] uppercase tracking-[0.08em] text-[#f5f2ec]/30 mt-1">
                Research · Engineering
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
