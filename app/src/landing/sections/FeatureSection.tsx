import React from 'react';
import { AnimateIn } from '../components/AnimateIn';
import { EyebrowLabel } from '../components/EyebrowLabel';
import { LinkCta } from '../components/Button';

interface Feature {
  eyebrow: string;
  headline: string;
  body: string;
  cta: { label: string; to: string };
  visual: 'pocket' | 'fragment';
  reverse?: boolean;
}

const FEATURES: Feature[] = [
  {
    eyebrow: 'Binding site discovery',
    headline: 'Every druggable pocket, automatically identified.',
    body:
      'Our pipeline runs Fpocket across the Swiss-Prot proteome, scoring geometric and physicochemical properties to surface the pockets most likely to bind small molecules — no manual structural review required.',
    cta: { label: 'explore the search', to: '/search' },
    visual: 'pocket',
  },
  {
    eyebrow: 'Fragment screening',
    headline: 'Screen ChEMBL fragments against any predicted pocket.',
    body:
      'Load a protein, select a pocket, and run fragment docking against the curated ChEMBL library. Results are scored and ranked in real time, with full 3D visualization through Mol*.',
    cta: { label: 'try a docking job', to: '/dashboard' },
    visual: 'fragment',
    reverse: true,
  },
];

function PocketVisual() {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 30% 40%, rgba(154, 205, 193, 0.30), transparent 60%),' +
          'radial-gradient(circle at 70% 65%, rgba(168, 196, 220, 0.30), transparent 60%),' +
          'linear-gradient(135deg, #15211f 0%, #0d0d0b 100%)',
      }}
    >
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="pkt-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9acdc1" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#9acdc1" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 7 }).map((_, i) => (
          <circle
            key={i}
            cx={200}
            cy={200}
            r={50 + i * 22}
            fill="none"
            stroke="#f5f2ec"
            strokeOpacity={0.08 - i * 0.008}
            strokeWidth={1}
          />
        ))}
        <circle cx={200} cy={200} r={110} fill="url(#pkt-glow)" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const r = 95 + Math.sin(i) * 14;
          const x = 200 + Math.cos(angle) * r;
          const y = 200 + Math.sin(angle) * r;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3}
              fill="#f5f2ec"
              fillOpacity={0.55}
            />
          );
        })}
        <text
          x={200}
          y={210}
          textAnchor="middle"
          fontFamily="Cormorant Garamond, serif"
          fontSize={56}
          fontWeight={300}
          fill="#9acdc1"
          opacity={0.85}
        >
          α
        </text>
      </svg>
    </div>
  );
}

function FragmentVisual() {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 65% 35%, rgba(168, 196, 220, 0.32), transparent 60%),' +
          'radial-gradient(circle at 30% 70%, rgba(154, 205, 193, 0.25), transparent 60%),' +
          'linear-gradient(135deg, #1a2026 0%, #0d0d0b 100%)',
      }}
    >
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {/* Grid of fragment "molecules" */}
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 4 }).map((__, col) => {
            const cx = 60 + col * 95;
            const cy = 60 + row * 95;
            const opacity = 0.25 + ((row + col) % 3) * 0.2;
            return (
              <g key={`${row}-${col}`} opacity={opacity}>
                <line x1={cx} y1={cy} x2={cx + 22} y2={cy - 14} stroke="#f5f2ec" strokeOpacity={0.4} strokeWidth={1} />
                <line x1={cx} y1={cy} x2={cx - 18} y2={cy + 16} stroke="#f5f2ec" strokeOpacity={0.4} strokeWidth={1} />
                <line x1={cx} y1={cy} x2={cx + 16} y2={cy + 20} stroke="#f5f2ec" strokeOpacity={0.4} strokeWidth={1} />
                <circle cx={cx} cy={cy} r={5} fill="#a8c4dc" />
                <circle cx={cx + 22} cy={cy - 14} r={4} fill="#9acdc1" fillOpacity={0.85} />
                <circle cx={cx - 18} cy={cy + 16} r={4} fill="#f5f2ec" fillOpacity={0.6} />
                <circle cx={cx + 16} cy={cy + 20} r={3.5} fill="#c8892a" fillOpacity={0.7} />
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

export function FeatureSection() {
  return (
    <section
      id="features"
      className="bg-[#f7f5f0]"
      style={{
        paddingBlock: 'clamp(2rem, 4vw, 4rem)',
        paddingInline: 'clamp(1.5rem, 5vw, 5rem)',
      }}
    >
      <div className="mx-auto flex flex-col" style={{ maxWidth: 1280, gap: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
        {FEATURES.map((f, i) => (
          <AnimateIn key={f.eyebrow} delay={i * 0.05}>
            <div
              className="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl overflow-hidden border border-[#0d0d0b]/10"
              style={{ minHeight: 'clamp(340px, 36vw, 460px)' }}
            >
              <div
                className={
                  'flex flex-col justify-center ' +
                  (f.reverse ? 'lg:order-2' : '')
                }
                style={{ padding: 'clamp(2.25rem, 4vw, 4rem) clamp(2rem, 3.5vw, 3.5rem)' }}
              >
                <EyebrowLabel>{f.eyebrow}</EyebrowLabel>
                <h3
                  className="font-['Cormorant_Garamond'] font-normal text-[#0d0d0b] leading-[1.2] tracking-[-0.005em]"
                  style={{
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                    marginBottom: '1.25rem',
                  }}
                >
                  {f.headline}
                </h3>
                <p
                  className="font-['DM_Sans'] font-light text-[#4a4845] leading-[1.75]"
                  style={{ fontSize: '1rem', marginBottom: '2rem' }}
                >
                  {f.body}
                </p>
                <div>
                  <LinkCta to={f.cta.to}>{f.cta.label}</LinkCta>
                </div>
              </div>

              <div
                className={(f.reverse ? 'lg:order-1 ' : '') + 'min-h-[280px] lg:min-h-0'}
              >
                {f.visual === 'pocket' ? <PocketVisual /> : <FragmentVisual />}
              </div>
            </div>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}
