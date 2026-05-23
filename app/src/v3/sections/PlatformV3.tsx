import React from 'react';
import { useMolstar } from '../../components/complex/viewer/useMolstar';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';

const EGFR_URL = 'https://alphafold.ebi.ac.uk/files/AF-0000000065996619-model_v1.cif';

const LEFT_NODES = [
  { id: 'tl', label: 'AlphaFold',    desc: 'High-confidence P9WFX1 structure prediction' },
  { id: 'bl', label: 'AlphaMissense', desc: 'Pathogenicity scores for P9WFX1 variants' },
];

const RIGHT_NODES = [
  { id: 'tr', label: 'UniProt', desc: 'P9WFX1 molecular function and disease context' },
  { id: 'br', label: 'ChEMBL',  desc: 'Known inhibitors and drug fragments for P9WFX1' },
];

function GlassCard({ title, desc, align = 'left' }: { title: string; desc: string; align?: 'left' | 'right' }) {
  return (
    <div
      className={`flex flex-col p-6 backdrop-blur-xl ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
      style={{
        width: '280px',
        background: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        borderRadius: '24px',
        boxShadow: '0 12px 48px -12px rgba(11,15,20,0.06)',
        pointerEvents: 'auto'
      }}
    >
      <div className={`flex items-center gap-3 mb-3 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="w-[8px] h-[8px] rounded-full bg-[#C6FF3D] border border-[rgba(11,15,20,0.1)] shadow-sm" />
        <span className="text-[17.5px] font-semibold text-[#0B0F14] tracking-[-0.02em]">
          {title}
        </span>
      </div>
      <span className="text-[14px] text-[#4A554D] leading-[1.6]">
        {desc}
      </span>
    </div>
  );
}

function EGFRViewer() {
  const { containerRef, isLoading, error } = useMolstar({
    structureUrl:   EGFR_URL,
    label:          'P9WFX1',
    autoLoad:       true,
    representation:   'cartoon',
    theme:            'light',
    canvasBackground: 0xffffff,
    hideControls:     true,
    onReady: (plugin) => {
      setTimeout(() => {
        plugin.canvas3d?.setProps({
          camera: { helper: { axes: { name: 'off', params: {} } } },
          trackball: { animate: { name: 'spin', params: { speed: 0.1, axis: Vec3.create(0, 1, 0) } } },
        });
      }, 500); // Slight delay to ensure it applies after structure is fully framed
    },
  });

  return (
    <div className="v3-pipeline relative w-full h-full mix-blend-multiply">
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="absolute inset-0"
      />

      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}>
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{ border: '2px solid rgba(11,15,20,0.08)', borderTopColor: '#0B0F14' }}
          />
          <span className="font-jetbrains text-[11px] text-[#4A554D] tracking-[0.06em] uppercase font-medium">
            Loading P9WFX1
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.8)' }}>
          <span className="font-jetbrains text-[12px] text-[#7A8580] tracking-[0.04em]">
            Could not load structure
          </span>
        </div>
      )}
    </div>
  );
}

export function PlatformV3() {
  return (
    <div className="w-full flex justify-center" style={{ background: 'linear-gradient(180deg, #EBF9F3 0%, #E4F1F8 100%)' }}>
      <section id="platform" className="py-[140px] px-6 max-w-[1200px] w-full">

      {/* Header */}
      <div className="max-w-[760px] mb-[72px] text-center mx-auto flex flex-col items-center">
        
        <h2
          className="v3-reveal font-medium tracking-[-0.035em] leading-[1.05] text-[#0B0F14] m-0 mb-6"
          style={{ fontSize: 'clamp(40px, 5.5vw, 68px)' }}
        >
          One pipeline.{' '}
          <span className="text-[#B8C2BD] font-normal">Every source.</span>
        </h2>
        <p className="v3-reveal text-[18px] leading-[1.6] text-[#4A554D] m-0 font-normal max-w-[540px]">
          All databases queried live, processed in parallel, and merged instantly into a single structural context.
        </p>
      </div>

      {/* Immersive HUD Layout */}
      <div 
        className="v3-reveal relative w-full rounded-[40px] overflow-hidden"
        style={{ 
          height: '720px', 
          backgroundImage: 'linear-gradient(rgba(11,15,20,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(11,15,20,0.035) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: 'center center'
        }}
      >
        {/* Center: Mol* Viewer */}
        <div className="absolute inset-0">
          <EGFRViewer />
        </div>

        {/* Overlay Cards Container (pointer events pass through the empty space to allow rotating the molecule) */}
        <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between">
          
          {/* Top Row */}
          <div className="flex justify-between items-start">
            <GlassCard title={LEFT_NODES[0].label} desc={LEFT_NODES[0].desc} align="left" />
            <GlassCard title={RIGHT_NODES[0].label} desc={RIGHT_NODES[0].desc} align="right" />
          </div>

          {/* Bottom Row */}
          <div className="flex justify-between items-end">
            <GlassCard title={LEFT_NODES[1].label} desc={LEFT_NODES[1].desc} align="left" />
            <GlassCard title={RIGHT_NODES[1].label} desc={RIGHT_NODES[1].desc} align="right" />
          </div>
          
        </div>
      </div>

      </section>
    </div>
  );
}
