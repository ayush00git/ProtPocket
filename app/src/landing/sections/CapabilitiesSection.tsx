import React from 'react';
import { motion } from 'framer-motion';
import { AnimateIn, StaggerGroup, staggerItem } from '../components/AnimateIn';
import { EyebrowLabel } from '../components/EyebrowLabel';
import { LinkCta } from '../components/Button';

interface Capability {
  eyebrow: string;
  title: string;
  link: { label: string; to: string };
  icon: React.ReactNode;
}

const Icon = {
  Search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Cube: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  ),
  Beaker: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3v6l-5.7 9.5A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.2-2.5L15 9V3" />
      <path d="M9 3h6" />
      <path d="M7 14h10" />
    </svg>
  ),
};

const CAPS: Capability[] = [
  {
    eyebrow: 'Search',
    title: 'Proteome-wide pocket search with real-time filters.',
    link: { label: 'open search', to: '/search' },
    icon: Icon.Search,
  },
  {
    eyebrow: 'Visualize',
    title: 'Interactive 3D structures powered by Mol*.',
    link: { label: 'view structures', to: '/search' },
    icon: Icon.Cube,
  },
  {
    eyebrow: 'Screen',
    title: 'Fragment-based docking against ChEMBL libraries.',
    link: { label: 'launch a job', to: '/dashboard' },
    icon: Icon.Beaker,
  },
];

export function CapabilitiesSection() {
  return (
    <section
      id="how"
      className="bg-[#eeebe2]"
      style={{
        paddingBlock: 'clamp(5rem, 10vw, 10rem)',
        paddingInline: 'clamp(1.5rem, 5vw, 5rem)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1280 }}>
        <AnimateIn>
          <EyebrowLabel>What you can do</EyebrowLabel>
          <h2
            className="font-['Cormorant_Garamond'] font-normal text-[#0d0d0b] leading-[1.15] tracking-[-0.01em] max-w-[640px]"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '4rem' }}
          >
            From sequence to lead candidate, in one continuous workflow.
          </h2>
        </AnimateIn>

        <StaggerGroup className="grid gap-px bg-[#0d0d0b]/10 border border-[#0d0d0b]/10 rounded-2xl overflow-hidden md:grid-cols-3 grid-cols-1">
          {CAPS.map((c) => (
            <motion.div
              key={c.eyebrow}
              variants={staggerItem}
              className="bg-white flex flex-col group transition-colors duration-300 hover:bg-[#fafaf6]"
              style={{ padding: 'clamp(2rem, 3.5vw, 3rem) clamp(1.75rem, 3vw, 2.5rem)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <EyebrowLabel>{c.eyebrow}</EyebrowLabel>
                <span className="text-[#1a5c52]/70 group-hover:text-[#1a5c52] transition-colors duration-300">
                  {c.icon}
                </span>
              </div>
              <h3
                className="font-['Cormorant_Garamond'] font-normal text-[#0d0d0b] leading-[1.3] flex-1"
                style={{ fontSize: '1.35rem', marginBottom: '2rem' }}
              >
                {c.title}
              </h3>
              <LinkCta to={c.link.to}>{c.link.label}</LinkCta>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
