import React from 'react';
import { motion } from 'framer-motion';
import { AnimateIn, StaggerGroup, staggerItem } from '../components/AnimateIn';
import { EyebrowLabel } from '../components/EyebrowLabel';

const STATS = [
  { value: '570K+', label: 'Swiss-Prot entries surfaced' },
  { value: '< 2s', label: 'Median search response time' },
  { value: '100%', label: 'Reviewed-only coverage' },
];

export function StatsSection() {
  return (
    <section
      id="about"
      className="bg-[#f7f5f0]"
      style={{
        paddingBlock: 'clamp(5rem, 10vw, 10rem)',
        paddingInline: 'clamp(1.5rem, 5vw, 5rem)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1280 }}>
        <AnimateIn>
          <EyebrowLabel>By the numbers</EyebrowLabel>
          <h2
            className="font-['Cormorant_Garamond'] font-normal text-[#0d0d0b] leading-[1.15] tracking-[-0.01em] max-w-[560px]"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '4rem' }}
          >
            Built on curated, high-confidence biology.
          </h2>
        </AnimateIn>

        <StaggerGroup className="grid gap-px bg-[#0d0d0b]/10 border border-[#0d0d0b]/10 rounded-2xl overflow-hidden md:grid-cols-3 grid-cols-1">
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              variants={staggerItem}
              className="bg-[#f7f5f0] flex flex-col gap-4"
              style={{ padding: 'clamp(2rem, 3.5vw, 3rem)' }}
            >
              <div
                className="font-['Cormorant_Garamond'] font-light text-[#0d0d0b] leading-none tracking-[-0.02em]"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
              >
                {s.value}
              </div>
              <div className="font-['DM_Sans'] text-sm font-light text-[#4a4845] leading-relaxed">
                {s.label}
              </div>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
