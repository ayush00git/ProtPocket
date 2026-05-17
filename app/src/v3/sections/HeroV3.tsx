import React from 'react';

const GithubIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M7 17 17 7" /><path d="M7 7h10v10" />
  </svg>
);

const BUILT_ON = ['AlphaFold', 'AlphaMissense', 'ChEMBL', 'UniProt'];

const STATEMENTS = [
  { num: '01', line: 'One query. Complete structural analysis, returned in parallel.' },
  { num: '02', line: 'Ranked binding sites across monomer and complex structures.' },
  { num: '03', line: 'Fragment suggestions matched against ChEMBL, validated with live docking.' },
  { num: '04', line: 'Mutation impact scored instantly, so resistance never catches you off guard.' },
];

export function HeroV3() {
  return (
    <section className="pt-[120px] pb-[120px] max-w-[980px]">

      {/* Badge */}
      <div
        className="v3-reveal v3-in inline-flex items-center gap-[10px] rounded-full text-[12.5px] text-[#4A554D] mb-8"
        style={{
          padding: '6px 14px 6px 8px',
          border: '1px solid rgba(11,15,20,0.16)',
          background: '#FAFBFA',
        }}
      >
        <span className="bg-[#0B0F14] text-white px-[9px] py-[3px] rounded-full font-jetbrains text-[10.5px] tracking-[0.03em]">
          Open-source
        </span>
        <span>March 2026 AlphaFold homodimer dataset</span>
      </div>

      {/* Title */}
      <h1
        className="v3-reveal v3-in d1 font-medium tracking-[-0.04em] leading-[0.96] text-[#0B0F14] m-0 mb-9"
        style={{ fontSize: 'clamp(52px, 7.8vw, 112px)' }}
      >
        From protein to{' '}
        <span className="text-[#B8C2BD] font-normal">ranked drug candidates.</span>
      </h1>

      {/* Statement blocks */}
      <div
        className="v3-reveal v3-in d2 grid grid-cols-2 gap-px mb-[44px] max-w-[680px] rounded-2xl overflow-hidden"
        style={{ background: 'rgba(11,15,20,0.08)', border: '1px solid rgba(11,15,20,0.08)' }}
      >
        {STATEMENTS.map(({ num, line }) => (
          <div key={num} className="bg-white px-6 py-5 flex flex-col gap-2">
            <span className="font-jetbrains text-[11px] text-[#B8C2BD] tracking-[0.04em]">
              {num}
            </span>
            <p className="text-[15px] leading-[1.55] text-[#4A554D] m-0 font-normal">{line}</p>
          </div>
        ))}
      </div>

      {/* CTA row */}
      <div className="v3-reveal v3-in d3 flex gap-3 flex-wrap items-center">
        <a
          href="https://github.com/ayush00git/ProtPocket"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[10px] px-[22px] py-[14px] rounded-full bg-[#0B0F14] text-white text-[14.5px] font-medium no-underline transition-all duration-200 hover:-translate-y-px hover:bg-[#1F2A22]"
        >
          <GithubIcon color="#fff" />
          View on GitHub
        </a>
        <a
          href="#platform"
          className="inline-flex items-center gap-[10px] px-[22px] py-[14px] rounded-full text-[14.5px] font-medium no-underline text-[#0B0F14] transition-all duration-200 hover:-translate-y-px hover:border-[#0B0F14]"
          style={{
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(11,15,20,0.16)',
          }}
        >
          Read the docs
          <ArrowIcon />
        </a>
      </div>

      {/* Built on strip */}
      <div
        className="v3-reveal v3-in d4 mt-24 pt-9 flex items-baseline gap-14 flex-wrap"
        style={{ borderTop: '1px solid rgba(11,15,20,0.08)' }}
      >
        <span className="text-[13px] text-[#7A8580] font-medium shrink-0">Built on</span>
        <div className="flex gap-9 flex-wrap items-baseline flex-1">
          {BUILT_ON.map((name) => (
            <span key={name} className="text-[16px] text-[#1F2A22] tracking-[-0.01em] font-medium opacity-65">
              {name}
            </span>
          ))}
        </div>
      </div>

    </section>
  );
}
