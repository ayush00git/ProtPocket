import React from 'react';

type DssVariant = 'negative' | 'severe' | 'new' | 'shift';

interface BenchmarkRow {
  mutation: string;
  drug: string;
  cancer: string;
  pocketChange: string;
  dssLabel: string;
  dssVariant: DssVariant;
}

const ROWS: BenchmarkRow[] = [
  {
    mutation: 'EGFR T790M',
    drug: 'Erlotinib',
    cancer: 'Non-small cell lung',
    pocketChange: 'Steric clash at ATP site; pocket contracts',
    dssLabel: 'Negative shift',
    dssVariant: 'negative',
  },
  {
    mutation: 'BCR-ABL T315I',
    drug: 'Imatinib',
    cancer: 'Chronic myeloid leukemia',
    pocketChange: 'Gatekeeper mutation removes H-bond donor; pocket blocked',
    dssLabel: 'Severe negative shift',
    dssVariant: 'severe',
  },
  {
    mutation: 'KRAS G12C',
    drug: 'Sotorasib',
    cancer: 'Lung, pancreatic',
    pocketChange: 'New covalent handle; previously undruggable',
    dssLabel: 'New cryptic pocket',
    dssVariant: 'new',
  },
  {
    mutation: 'BRAF V600E',
    drug: 'Vemurafenib',
    cancer: 'Melanoma',
    pocketChange: 'DFG-loop conformation shift; allosteric pocket altered',
    dssLabel: 'Altered but druggable',
    dssVariant: 'shift',
  },
  {
    mutation: 'PIK3CA H1047R',
    drug: 'Alpelisib',
    cancer: 'Breast',
    pocketChange: 'ATP-site accessibility and hydrophobicity altered',
    dssLabel: 'Moderate negative shift',
    dssVariant: 'negative',
  },
];

const DSS_STYLES: Record<DssVariant, { bg: string; color: string }> = {
  negative: { bg: '#FBE9EC', color: '#8C1E36' },
  severe:   { bg: '#F4D5DC', color: '#6B0F23' },
  new:      { bg: '#E8F8C8', color: '#3A6A0F' },
  shift:    { bg: '#F0F0EC', color: '#4A554D' },
};

function DssPill({ label, variant }: { label: string; variant: DssVariant }) {
  const { bg, color } = DSS_STYLES[variant];
  return (
    <span
      className="inline-block font-jetbrains text-[11px] px-[10px] py-1 rounded-full tracking-[0.03em] whitespace-nowrap"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

export function BenchmarkV3() {
  return (
    <section id="mutation" className="py-[120px]">
      <div className="max-w-[760px] mb-[72px]">
        <span
          className="v3-reveal inline-block text-[12.5px] text-[#7A8580] font-medium mb-7 pb-[10px]"
          style={{ borderBottom: '1px solid rgba(11,15,20,0.16)' }}
        >
          Benchmark
        </span>
        <h2
          className="v3-reveal font-medium tracking-[-0.035em] leading-[1.0] text-[#0B0F14] m-0 mb-[22px]"
          style={{ fontSize: 'clamp(34px, 4.8vw, 60px)' }}
        >
          Validated against{' '}
          <span className="text-[#B8C2BD] font-normal">known resistance mutations.</span>
        </h2>
        <p className="v3-reveal text-[18px] leading-[1.55] text-[#4A554D] m-0 max-w-[640px]">
          The Mutation Impact Predictor is benchmarked against well-characterized clinical mutations
          with decades of crystallographic and pharmacological ground truth.
        </p>
      </div>

      <div
        className="v3-reveal rounded-[18px] overflow-hidden bg-white"
        style={{ border: '1px solid rgba(11,15,20,0.08)' }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Mutation', 'Drug', 'Cancer / disease', 'Known pocket change', 'Expected DSS'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left text-[11.5px] font-medium text-[#7A8580] uppercase tracking-[0.08em] px-5 py-4 bg-[#FAFBFA]"
                    style={{ borderBottom: '1px solid rgba(11,15,20,0.08)' }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={row.mutation}
                className="transition-colors hover:bg-[#FAFBFA]"
                style={i < ROWS.length - 1 ? { borderBottom: '1px solid rgba(11,15,20,0.08)' } : {}}
              >
                <td className="px-5 py-[18px] font-jetbrains text-[13px] text-[#0B0F14] font-medium tracking-[0.02em] whitespace-nowrap align-top">
                  {row.mutation}
                </td>
                <td className="px-5 py-[18px] text-[14.5px] text-[#0B0F14] font-medium align-top">
                  {row.drug}
                </td>
                <td className="px-5 py-[18px] text-[14.5px] text-[#0B0F14] font-medium align-top hidden sm:table-cell">
                  {row.cancer}
                </td>
                <td className="px-5 py-[18px] text-[14.5px] text-[#4A554D] leading-[1.5] align-top hidden md:table-cell">
                  {row.pocketChange}
                </td>
                <td className="px-5 py-[18px] align-top">
                  <DssPill label={row.dssLabel} variant={row.dssVariant} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-jetbrains text-[11.5px] text-[#7A8580] mt-4 tracking-[0.02em] leading-[1.6]">
        Predicted pocket volumes, hydrophobicity deltas, and Druggability Shift Scores are
        benchmarked against crystallographically determined wildtype and mutant structures from the
        Protein Data Bank.
      </p>
    </section>
  );
}
