import React from 'react';

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
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
        className="v3-reveal text-center rounded-[28px] px-12 py-[88px]"
        style={{
          background: '#FAFBFA',
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
            className="inline-flex items-center gap-[10px] px-[22px] py-[14px] rounded-full bg-[#0B0F14] text-white text-[14.5px] font-medium no-underline transition-all duration-200 hover:-translate-y-px hover:bg-[#1F2A22]"
          >
            <GithubIcon />
            ayush00git / ProtPocket
          </a>
          <a
            href="#install"
            className="inline-flex items-center gap-[10px] px-[22px] py-[14px] rounded-full text-[14.5px] font-medium no-underline text-[#0B0F14] transition-all duration-200 hover:-translate-y-px hover:border-[#0B0F14]"
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(11,15,20,0.16)',
            }}
          >
            Installation
            <ArrowIcon />
          </a>
        </div>

        <p className="font-jetbrains text-[11.5px] text-[#7A8580] tracking-[0.04em] mt-7 m-0">
          MIT License · Built on AlphaFold, AlphaMissense, ChEMBL, UniProt
        </p>
      </div>
    </section>
  );
}
