import React from 'react';
import { Link } from 'react-router-dom';

const GithubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const pillBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.80)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(11,15,20,0.09)',
  boxShadow:
    '0 1px 2px rgba(11,15,20,0.04), 0 4px 16px -8px rgba(11,15,20,0.10), 0 16px 40px -20px rgba(11,15,20,0.08)',
};

export function NavV3() {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center items-center gap-2.5 pointer-events-none px-4">

      {/* Brand pill */}
      <Link
        to="/"
        className="pointer-events-auto no-underline inline-flex items-center px-5 py-[9px] rounded-full text-[15px] font-semibold tracking-[-0.015em] text-[#0B0F14] transition-opacity duration-200 hover:opacity-70"
        style={pillBase}
      >
        ProtPocket
      </Link>

      {/* Nav links pill */}
      <div
        className="pointer-events-auto hidden md:flex items-center gap-1 px-2 py-2 rounded-full"
        style={pillBase}
      >
        <Link
          to="/platform"
          className="no-underline px-4 py-[6px] rounded-full text-[13.5px] text-[#4A554D] hover:bg-[rgba(11,15,20,0.06)] hover:text-[#0B0F14] transition-all duration-200"
          style={{ fontWeight: 450 }}
        >
          Platform
        </Link>
        <Link
          to="/mutation"
          className="no-underline px-4 py-[6px] rounded-full text-[13.5px] text-[#4A554D] hover:bg-[rgba(11,15,20,0.06)] hover:text-[#0B0F14] transition-all duration-200"
          style={{ fontWeight: 450 }}
        >
          Mutation impact
        </Link>
      </div>

      {/* GitHub pill */}
      <a
        href="https://github.com/ayush00git/ProtPocket"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto relative group overflow-hidden inline-flex items-center gap-2 px-4 py-[9px] rounded-full bg-[#0B0F14] no-underline"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 1px 2px rgba(11,15,20,0.2), 0 4px 16px -8px rgba(11,15,20,0.3)',
        }}
      >
        <div className="absolute inset-0 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-out" />
        <span className="relative z-10 flex items-center gap-2 text-white text-[13.5px] font-medium group-hover:text-[#0B0F14] transition-colors duration-300">
          <GithubIcon />
          GitHub
        </span>
      </a>

    </div>
  );
}
