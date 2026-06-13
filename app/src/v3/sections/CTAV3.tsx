import React from 'react';

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

export function CTAV3() {
  return (
    <section id="contact" style={{ paddingBottom: '48px', paddingTop: '120px' }}>
      <div
        className="v3-reveal text-center rounded-[28px] px-6 sm:px-12 py-[52px] sm:py-[88px]"
        style={{
          background: 'linear-gradient(180deg, #EBF9F3 0%, #E4F1F8 100%)',
          border: '1px solid rgba(11,15,20,0.08)',
        }}
      >
        <h2
          className="font-medium tracking-[-0.04em] leading-[1.0] text-[#0B0F14] m-0 mb-[22px]"
          style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
        >
          Open-source.{' '}
          <span className="text-[#B8C2BD] font-normal">Open data.</span>
        </h2>
        <p className="text-[17px] leading-[1.55] text-[#4A554D] max-w-[580px] mx-auto mb-9">
          The code is MIT-licensed. The data sources are public. Contributions, benchmarks, and
          citations welcome.
        </p>

        <div className="flex gap-3 flex-wrap items-center justify-center">
          <a
            href="https://github.com/ayush00git/ProtPocket"
            target="_blank"
            rel="noopener noreferrer"
            className="relative group overflow-hidden inline-flex items-center gap-[10px] px-[22px] py-[14px] rounded-full bg-[#0B0F14] border border-[#0B0F14] font-medium no-underline"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-out z-0" />
            <span className="relative z-10 flex items-center gap-[10px] text-white text-[14.5px] group-hover:text-[#0B0F14] transition-colors duration-300">
              <GithubIcon />
              ayush00git / ProtPocket
            </span>
          </a>
          <a
            href="#install"
            className="relative group overflow-hidden inline-flex items-center gap-[10px] px-[22px] py-[14px] rounded-full font-medium no-underline bg-white/90 border border-[#0B0F14]/15 hover:border-[#0B0F14] transition-colors duration-300"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#0B0F14] rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-out z-0" />
            <span className="relative z-10 flex items-center gap-[10px] text-[14.5px] text-[#0B0F14] group-hover:text-white transition-colors duration-300">
              Installation
              <ArrowIcon />
            </span>
          </a>
        </div>

        <p className="font-jetbrains text-[11.5px] text-[#7A8580] tracking-[0.04em] mt-7 m-0">
          MIT License · Built on AlphaFold, AlphaMissense, ChEMBL, UniProt
        </p>
      </div>
    </section>
  );
}
