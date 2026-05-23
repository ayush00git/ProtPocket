import React from 'react';

const PROBLEMS = [
  {
    num: '01',
    title: 'Five tools. Zero integration.',
    desc: 'A researcher investigating a single protein today manually queries AlphaFold, UniProt, ChEMBL, runs pocket detection locally, and consults fragment databases separately. Each in a different interface. Each producing output the next tool cannot read.',
  },
  {
    num: '02',
    title: 'Monomer structures hide the most valuable pockets.',
    desc: 'Most proteins only become biologically active as dimers. The cavities formed at the interface when two chains come together do not exist in either chain alone. Every tool that analyzes monomers misses them entirely.',
  },
  {
    num: '03',
    title: 'Resistance mutations are identified in the clinic, not before it.',
    desc: 'When a tumor acquires a point mutation that reshapes a binding pocket, confirming whether the drug still fits requires weeks of crystallography work. By the time the answer arrives, the patient has already relapsed.',
  },
];

export function ProblemV3() {
  return (
    <section id="problem" className="py-[120px] relative w-full">

      {/* Section header — full width, headline left / subtext right */}
      <div className="v3-reveal mb-16 lg:mb-20">
        <span
          className="inline-flex items-center gap-[8px] rounded-full text-[12.5px] text-[#4A554D] mb-8 font-medium"
          style={{
            padding: '6px 14px 6px 10px',
            border: '1px solid rgba(11,15,20,0.12)',
            background: '#FAFBFA',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#0B0F14] opacity-80" />
          The bottleneck
        </span>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-20">
          <h2
            className="font-medium tracking-[-0.035em] leading-[1.05] text-[#0B0F14] m-0 shrink-0"
            style={{ fontSize: 'clamp(38px, 4.8vw, 64px)' }}
          >
            Structure is available.<br />
            <span className="text-[#8b9590] font-normal">Targeting is not.</span>
          </h2>

          <p className="text-[17px] leading-[1.7] text-[#4A554D] m-0 font-normal max-w-[400px] lg:pb-[6px]">
            Drug discovery is fragmented by design. Every step requires a different
            tool, a different database, and a manual export.
          </p>
        </div>
      </div>

      {/* Problem rows */}
      <div style={{ borderTop: '1px solid rgba(11,15,20,0.08)' }}>
        {PROBLEMS.map(({ num, title, desc }) => (
          <div
            key={num}
            className="v3-reveal group py-10 lg:py-12 flex flex-col gap-4 lg:grid lg:items-start lg:gap-12"
            style={{
              borderBottom: '1px solid rgba(11,15,20,0.08)',
              gridTemplateColumns: '64px 1fr 1.25fr',
            }}
          >
            {/* Number */}
            <span className="font-jetbrains text-[12px] text-[#B8C2BD] tracking-[0.08em] lg:pt-[5px] shrink-0">
              {num}
            </span>

            {/* Title */}
            <h3 className="text-[20px] lg:text-[22px] font-medium tracking-[-0.025em] text-[#0B0F14] m-0 leading-[1.3]">
              {title}
            </h3>

            {/* Description */}
            <p className="text-[15.5px] leading-[1.72] text-[#4A554D] m-0 font-normal">
              {desc}
            </p>
          </div>
        ))}
      </div>

    </section>
  );
}
