import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button, LinkCta } from '../components/Button';
import { EyebrowLabel } from '../components/EyebrowLabel';

const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

// White → teal-green → white → teal-blue, layered radial gradients on a
// warm cream base. The two blobs counter-rotate via Framer Motion (very
// slow) to give the impression of a living mesh without being distracting.
const GRADIENT_BG =
  'radial-gradient(ellipse 70% 55% at 18% 22%, rgba(154, 205, 193, 0.62) 0%, transparent 62%),' +
  'radial-gradient(ellipse 75% 60% at 82% 78%, rgba(168, 196, 220, 0.62) 0%, transparent 62%),' +
  'radial-gradient(ellipse 55% 45% at 50% 52%, rgba(255, 255, 255, 0.55) 0%, transparent 70%),' +
  'linear-gradient(180deg, #f8f6f1 0%, #f3efe7 100%)';

export function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: '100vh',
        background: GRADIENT_BG,
        paddingTop: '7rem',
        paddingBottom: 'clamp(4rem, 8vw, 7rem)',
        paddingInline: 'clamp(1.5rem, 5vw, 5rem)',
      }}
    >
      {/* Floating gradient orbs — same palette, slow drift */}
      {!reduced && (
        <>
          <motion.div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: '-10%',
              left: '-8%',
              width: '55vw',
              height: '55vw',
              background:
                'radial-gradient(circle at 50% 50%, rgba(154, 205, 193, 0.45) 0%, transparent 65%)',
              filter: 'blur(40px)',
            }}
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              bottom: '-12%',
              right: '-10%',
              width: '60vw',
              height: '60vw',
              background:
                'radial-gradient(circle at 50% 50%, rgba(168, 196, 220, 0.50) 0%, transparent 65%)',
              filter: 'blur(40px)',
            }}
            animate={{ x: [0, -25, 0], y: [0, -18, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Grain overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: NOISE_URL, opacity: 0.09 }}
      />

      {/* Content */}
      <div
        className="relative mx-auto h-full flex flex-col justify-end"
        style={{ maxWidth: 1280, minHeight: 'calc(100vh - 11rem)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <EyebrowLabel>Protein pocket analysis · Swiss-Prot · AI-powered</EyebrowLabel>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="font-['Cormorant_Garamond'] font-light text-[#0d0d0b] tracking-[-0.02em] leading-[1.0]"
          style={{
            fontSize: 'clamp(3rem, 8vw, 6.5rem)',
            maxWidth: '12ch',
            marginBottom: '2rem',
          }}
        >
          Find every pocket worth targeting.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          className="font-['DM_Sans'] font-light text-[#4a4845]"
          style={{
            fontSize: 'clamp(1rem, 1.4vw, 1.125rem)',
            lineHeight: 1.65,
            maxWidth: 520,
          }}
        >
          ProtPocket surfaces druggable binding sites across the Swiss-Prot proteome —
          giving research teams the spatial insight to design better candidates, faster.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
          className="flex flex-wrap items-center gap-4 mt-10"
        >
          <Button to="/search" variant="primary">
            explore structures →
          </Button>
          <LinkCta href="#how" tone="teal">
            how it works
          </LinkCta>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        style={{ bottom: '2.5rem' }}
      >
        <span className="font-['DM_Sans'] text-[10px] uppercase tracking-[0.18em] text-[#0d0d0b]/40">
          scroll
        </span>
        <motion.span
          animate={reduced ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="block w-px h-8 bg-[#0d0d0b]/30"
        />
      </motion.div>
    </section>
  );
}
