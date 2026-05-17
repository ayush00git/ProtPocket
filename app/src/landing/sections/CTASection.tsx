import React from 'react';
import { AnimateIn } from '../components/AnimateIn';
import { EyebrowLabel } from '../components/EyebrowLabel';
import { Button, LinkCta } from '../components/Button';

export function CTASection() {
  return (
    <section
      className="bg-[#f7f5f0] relative overflow-hidden"
      style={{
        paddingBlock: 'clamp(5rem, 10vw, 10rem)',
        paddingInline: 'clamp(1.5rem, 5vw, 5rem)',
      }}
    >
      {/* Soft echo of the hero gradient */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 20% 50%, rgba(154, 205, 193, 0.35) 0%, transparent 60%),' +
            'radial-gradient(ellipse 50% 50% at 80% 50%, rgba(168, 196, 220, 0.35) 0%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto text-center flex flex-col items-center" style={{ maxWidth: 820 }}>
        <AnimateIn className="flex flex-col items-center">
          <EyebrowLabel>Get started</EyebrowLabel>
          <h2
            className="font-['Cormorant_Garamond'] font-normal text-[#0d0d0b] leading-[1.1] tracking-[-0.01em]"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', marginBottom: '1.5rem' }}
          >
            Ready to find your next lead?
          </h2>
          <p
            className="font-['DM_Sans'] font-light text-[#4a4845] leading-[1.7] max-w-[520px]"
            style={{ fontSize: '1.05rem', marginBottom: '2.5rem' }}
          >
            Start exploring binding sites across the Swiss-Prot proteome — no setup, no
            install. Your next target is one search away.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button to="/search" variant="primary">
              search structures →
            </Button>
            <LinkCta href="#how">view documentation</LinkCta>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
