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
    <section id="problem" className="py-[120px]">

      {/* Header */}
      <div className="max-w-[760px] mb-[64px]">
        <span
          className="v3-reveal inline-block text-[12.5px] text-[#7A8580] font-medium mb-7 pb-[10px]"
          style={{ borderBottom: '1px solid rgba(11,15,20,0.16)' }}
        >
          The problem
        </span>
        <h2
          className="v3-reveal font-medium tracking-[-0.035em] leading-[1.0] text-[#0B0F14] m-0 mb-6"
          style={{ fontSize: 'clamp(34px, 4.8vw, 60px)' }}
        >
          Structure is available.{' '}
          <span className="text-[#B8C2BD] font-normal">Targeting is not.</span>
        </h2>
        <p className="v3-reveal text-[18px] leading-[1.5] text-[#4A554D] m-0 max-w-[560px] font-normal">
          Drug discovery is fragmented by design. Every step requires a different tool,
          a different database, and a manual export.
        </p>
      </div>

      {/* Problem blocks */}
      <div
        className="v3-reveal grid grid-cols-1 gap-px max-w-[760px] rounded-2xl overflow-hidden"
        style={{ background: 'rgba(11,15,20,0.08)', border: '1px solid rgba(11,15,20,0.08)' }}
      >
        {PROBLEMS.map(({ num, title, desc }) => (
          <div key={num} className="bg-white px-8 py-7 flex flex-col gap-2">
            <span className="font-jetbrains text-[11px] text-[#B8C2BD] tracking-[0.04em]">
              {num}
            </span>
            <h3 className="text-[17px] font-medium tracking-[-0.02em] text-[#0B0F14] m-0">
              {title}
            </h3>
            <p className="text-[14.5px] leading-[1.65] text-[#4A554D] m-0 font-normal">
              {desc}
            </p>
          </div>
        ))}
      </div>

    </section>
  );
}
