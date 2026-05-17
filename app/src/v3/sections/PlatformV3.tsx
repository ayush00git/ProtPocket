import React from 'react';
import { useMolstar } from '../../components/complex/viewer/useMolstar';

const EGFR_URL = 'https://alphafold.ebi.ac.uk/files/AF-0000000066583957-model_v1.cif';

const LEFT_NODES = [
  { id: 'tl', label: 'AlphaFold',    desc: 'Protein structure and confidence' },
  { id: 'bl', label: 'AlphaMissense', desc: 'Mutation pathogenicity scores' },
];

const RIGHT_NODES = [
  { id: 'tr', label: 'UniProt', desc: 'Gene identity and disease context' },
  { id: 'br', label: 'ChEMBL',  desc: 'Drug candidates and fragments' },
];

function NodeCard({ label, desc }: { label: string; desc: string }) {
  return (
    <div
      className="flex-1 flex flex-col justify-end px-7 pb-7 bg-white"
      style={{ border: '1px solid rgba(11,15,20,0.10)', borderRadius: '18px' }}
    >
      <span className="text-[26px] font-semibold text-[#0B0F14] tracking-[-0.03em] leading-none">
        {label}
      </span>
      <span className="text-[12.5px] text-[#7A8580] mt-[10px] font-normal leading-snug">
        {desc}
      </span>
    </div>
  );
}

function EGFRViewer() {
  const { containerRef, isLoading, error } = useMolstar({
    structureUrl:   EGFR_URL,
    label:          'EGFR · P00533',
    autoLoad:       true,
    representation:   'molecular-surface',
    theme:            'light',
    canvasBackground: 0xEEFAF5,
    hideControls:     true,
    onReady: (plugin) => {
      requestAnimationFrame(() => {
        plugin.canvas3d?.setProps({
          trackball: { animate: { name: 'spin', params: { speed: 0.3 } } },
        });
      });
    },
  });

  return (
    <div className="v3-pipeline relative w-full h-full">
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="absolute inset-0"
      />

      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(238,250,245,0.92)' }}>
          <div
            className="w-6 h-6 rounded-full animate-spin"
            style={{ border: '2px solid rgba(11,15,20,0.10)', borderTopColor: '#C6FF3D' }}
          />
          <span className="font-jetbrains text-[10px] text-[#B8C2BD] tracking-[0.06em] uppercase">
            Loading structure
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(238,250,245,0.92)' }}>
          <span className="font-jetbrains text-[10px] text-[#7A8580] tracking-[0.04em]">
            Could not load structure
          </span>
        </div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex justify-center py-2"
        style={{ background: 'rgba(238,250,245,0.92)', borderTop: '1px solid rgba(11,15,20,0.07)' }}
      >
        <span className="font-jetbrains text-[10px] text-[#B8C2BD] tracking-[0.05em]">
          EGFR · P00533 · pLDDT confidence coloring
        </span>
      </div>
    </div>
  );
}

export function PlatformV3() {
  return (
    <section id="platform" className="py-[120px]">

      {/* Header */}
      <div className="max-w-[760px] mb-[72px]">
        <span
          className="v3-reveal inline-block text-[12.5px] text-[#7A8580] font-medium mb-7 pb-[10px]"
          style={{ borderBottom: '1px solid rgba(11,15,20,0.16)' }}
        >
          How it works
        </span>
        <h2
          className="v3-reveal font-medium tracking-[-0.035em] leading-[1.0] text-[#0B0F14] m-0 mb-[18px]"
          style={{ fontSize: 'clamp(34px, 4.8vw, 60px)' }}
        >
          One pipeline.{' '}
          <span className="text-[#B8C2BD] font-normal">Every source.</span>
        </h2>
        <p className="v3-reveal text-[18px] leading-[1.5] text-[#4A554D] m-0 font-normal">
          All databases. Queried live. Merged before response.
        </p>
      </div>

      {/* 3-column layout */}
      <div className="v3-reveal flex gap-3" style={{ height: '580px' }}>

        {/* Left: 2 stacked cards */}
        <div className="flex flex-col gap-3 shrink-0" style={{ width: '210px' }}>
          {LEFT_NODES.map(n => <NodeCard key={n.id} label={n.label} desc={n.desc} />)}
        </div>

        {/* Center: Mol* viewer */}
        <div
          className="flex-1 overflow-hidden"
          style={{
            borderRadius: '24px',
            border:       '1px solid rgba(11,15,20,0.10)',
            boxShadow:    '0 8px 48px -12px rgba(11,15,20,0.12)',
          }}
        >
          <EGFRViewer />
        </div>

        {/* Right: 2 stacked cards */}
        <div className="flex flex-col gap-3 shrink-0" style={{ width: '210px' }}>
          {RIGHT_NODES.map(n => <NodeCard key={n.id} label={n.label} desc={n.desc} />)}
        </div>

      </div>

    </section>
  );
}
