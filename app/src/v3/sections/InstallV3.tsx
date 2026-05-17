import React from 'react';

export function InstallV3() {
  return (
    <section id="install" style={{ paddingTop: '24px', paddingBottom: '120px' }}>
      <div className="max-w-[760px] mb-[72px]">
        <span
          className="v3-reveal inline-block text-[12.5px] text-[#7A8580] font-medium mb-7 pb-[10px]"
          style={{ borderBottom: '1px solid rgba(11,15,20,0.16)' }}
        >
          Get started
        </span>
        <h2
          className="v3-reveal font-medium tracking-[-0.035em] leading-[1.0] text-[#0B0F14] m-0 mb-[22px]"
          style={{ fontSize: 'clamp(34px, 4.8vw, 60px)' }}
        >
          Clone, build,{' '}
          <span className="text-[#B8C2BD] font-normal">query.</span>
        </h2>
        <p className="v3-reveal text-[18px] leading-[1.55] text-[#4A554D] m-0 max-w-[640px]">
          Backend in Go, frontend in React + Vite. The AlphaMissense dataset is optional and
          required only for the Mutation Impact Predictor.
        </p>
      </div>

      {/* macOS-style terminal block */}
      <div
        className="v3-reveal rounded-[16px] overflow-hidden"
        style={{ border: '1px solid rgba(11,15,20,0.14)', boxShadow: '0 12px 48px -12px rgba(11,15,20,0.22)' }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-4"
          style={{ height: '40px', background: '#1C2020', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
        </div>

        {/* Code body */}
        <pre
          className="font-jetbrains text-[13.5px] leading-[1.7] overflow-x-auto m-0"
          style={{ background: '#0B0F14', color: '#DCE3DF', padding: '24px 28px' }}
        >
          <span style={{ color: '#7A8580' }}># Clone the repo{'\n'}</span>
          <span style={{ color: '#C6FF3D' }}>git clone</span>
          {' '}
          <span style={{ color: '#DCE3DF' }}>https://github.com/ayush00git/ProtPocket{'\n'}</span>
          <span style={{ color: '#C6FF3D' }}>cd</span>
          {' '}
          <span style={{ color: '#DCE3DF' }}>ProtPocket{'\n\n'}</span>

          <span style={{ color: '#7A8580' }}># Backend (Go + Gin){'\n'}</span>
          <span style={{ color: '#C6FF3D' }}>go mod tidy</span>
          {' && '}
          <span style={{ color: '#C6FF3D' }}>go run</span>
          {' '}
          <span style={{ color: '#DCE3DF' }}>main.go{'\n\n'}</span>

          <span style={{ color: '#7A8580' }}># Frontend (React + Vite){'\n'}</span>
          <span style={{ color: '#C6FF3D' }}>cd</span>
          {' '}
          <span style={{ color: '#DCE3DF' }}>app</span>
          {' && '}
          <span style={{ color: '#C6FF3D' }}>npm install</span>
          {' && '}
          <span style={{ color: '#C6FF3D' }}>npm run dev</span>
          {'\n\n'}

          <span style={{ color: '#7A8580' }}># Optional — AlphaMissense index (required for Mutation Impact Predictor){'\n'}</span>
          <span style={{ color: '#C6FF3D' }}>go run</span>
          {' '}
          <span style={{ color: '#DCE3DF' }}>{'./cmd/alphamissense_import/'}</span>
          <span style={{ color: '#7A8580' }}>{'   # ~15–30 min depending on disk\n'}</span>
          <span style={{ color: '#C6FF3D' }}>go run</span>
          {' '}
          <span style={{ color: '#DCE3DF' }}>{'./cmd/alphamissense_index/'}</span>
          <span style={{ color: '#7A8580' }}>{'   # ~10–20 min'}</span>
        </pre>
      </div>
    </section>
  );
}
