import React from 'react';

const STEPS = [
  {
    num: '01',
    title: 'Pocket analysis.',
    desc: 'Both the monomer and homodimer structures are analyzed independently. Pockets are compared across both forms. Cavities that exist only in the dimer are interface pockets, sites formed exclusively by chain-chain contact, invisible to any monomer-only tool, and among the highest-value targets in PPI inhibitor programs.',
    meta: 'Monomer vs dimer. Interface pockets surfaced.',
  },
  {
    num: '02',
    title: 'Live docking.',
    desc: 'Drug fragments from ChEMBL are matched to each pocket by volume, hydrophobicity, and charge distribution. Selected candidates are docked live against the receptor. Binding affinity scores and 3D poses render in seconds.',
    meta: 'Geometrically matched fragments. Affinity scored live.',
  },
  {
    num: '03',
    title: 'Mutation stress-test.',
    desc: 'Input any point mutation. The pocket analysis re-runs on the mutant structure. The Druggability Shift Score reports whether the pocket survived, degraded, collapsed, or whether a new cryptic pocket appeared elsewhere on the protein. Powered by AlphaMissense, 216 million mutations scored.',
    meta: 'Resistance mutations. Druggability shift computed.',
  },
];

export function WorkflowV3() {
  return (
    <section id="workflow" className="py-[80px] md:py-[120px]">
      <div className="max-w-[760px] mb-[72px]">
        <span
          className="v3-reveal inline-block text-[12.5px] text-[#7A8580] font-medium mb-7 pb-[10px]"
          style={{ borderBottom: '1px solid rgba(11,15,20,0.16)' }}
        >
          Workflow
        </span>
        <h2
          className="v3-reveal font-medium tracking-[-0.035em] leading-[1.0] text-[#0B0F14] m-0 mb-[22px]"
          style={{ fontSize: 'clamp(34px, 4.8vw, 60px)' }}
        >
          One query.{' '}
          <span className="text-[#B8C2BD] font-normal">Three stages. Full picture.</span>
        </h2>
        <p className="v3-reveal text-[18px] leading-[1.55] text-[#4A554D] m-0 max-w-[640px]">
          Submit a gene name, disease, UniProt accession, or AlphaFold ID. Everything else is automatic.
        </p>
      </div>

      <div
        className="v3-reveal grid grid-cols-1 md:grid-cols-3 gap-px rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(11,15,20,0.08)',
          border: '1px solid rgba(11,15,20,0.08)',
        }}
      >
        {STEPS.map(({ num, title, desc, meta }) => (
          <div
            key={num}
            className="flex flex-col gap-2 bg-white transition-colors duration-[280ms] hover:bg-[#FAFBFA]"
            style={{ padding: '40px 32px 44px' }}
          >
            <span className="text-[56px] leading-[1] text-[#B8C2BD] font-normal tracking-[-0.04em] mb-3">
              {num}
            </span>
            <h4 className="text-[22px] font-medium tracking-[-0.02em] m-0 mb-1 text-[#0B0F14]">
              {title}
            </h4>
            <p className="text-[#4A554D] text-[15px] leading-[1.6] m-0">{desc}</p>
            <span
              className="mt-5 font-jetbrains text-[11.5px] text-[#7A8580] font-medium tracking-[0.02em] pt-4"
              style={{ borderTop: '1px solid rgba(11,15,20,0.08)' }}
            >
              {meta}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
