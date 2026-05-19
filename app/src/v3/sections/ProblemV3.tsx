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
    <section id="problem" className="py-[140px] relative w-full">
      <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start w-full">
        
        {/* Left Side: Sticky Header */}
        <div className="w-full lg:w-[45%] md:sticky md:top-[160px] self-start">
          <div className="v3-reveal">
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
            
            <h2
              className="font-medium tracking-[-0.035em] leading-[1.05] text-[#0B0F14] m-0 mb-6"
              style={{ fontSize: 'clamp(40px, 5vw, 68px)' }}
            >
              Structure is available.<br />
              <span className="text-[#8b9590] font-normal">Targeting is not.</span>
            </h2>
            
            <p className="text-[18px] leading-[1.65] text-[#4A554D] m-0 font-normal max-w-[480px]">
              Drug discovery is fragmented by design. Every step requires a different tool,
              a different database, and a manual export.
            </p>
          </div>
        </div>

        {/* Right Side: Flowing Problem Cards */}
        <div className="w-full lg:w-[55%] flex flex-col gap-8">
          {PROBLEMS.map(({ num, title, desc }) => (
            <div 
              key={num} 
              className="v3-reveal p-10 sm:p-12 rounded-[32px] bg-white relative overflow-hidden"
              style={{ border: '1px solid rgba(11,15,20,0.06)' }}
            >
              <div className="relative z-10">
                <div className="w-[42px] h-[42px] rounded-full bg-[#F4F7F5] flex items-center justify-center mb-8 border border-[rgba(11,15,20,0.04)] shadow-sm">
                  <span className="font-jetbrains text-[13px] text-[#0B0F14] font-semibold tracking-wider">
                    {num}
                  </span>
                </div>
                
                <h3 className="text-[22px] sm:text-[24px] font-medium tracking-[-0.025em] text-[#0B0F14] m-0 mb-4 leading-[1.3]">
                  {title}
                </h3>
                
                <p className="text-[15.5px] sm:text-[16px] leading-[1.7] text-[#4A554D] m-0 font-normal">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
