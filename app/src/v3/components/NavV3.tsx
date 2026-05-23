import React from 'react';
import { Link } from 'react-router-dom';

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const ANCHOR_LINKS = [
  { label: 'Workflow', href: '#workflow' },
  { label: 'Mutation impact', href: '#mutation' },
  { label: 'Architecture', href: '#architecture' },
];

export function NavV3() {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        className="pointer-events-auto flex items-center justify-between rounded-full"
        style={{
          width: 'min(1100px, calc(100% - 32px))',
          padding: '10px 14px 10px 22px',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(11,15,20,0.08)',
          boxShadow:
            '0 1px 1px rgba(11,15,20,0.03), 0 8px 24px -16px rgba(11,15,20,0.08), 0 24px 64px -32px rgba(11,15,20,0.10)',
        }}
      >
        {/* Brand */}
        <a
          href="#top"
          className="inline-flex items-center text-[17px] font-semibold tracking-[-0.015em] text-[#0B0F14] no-underline"
        >
          ProtPocket
        </a>

        {/* Nav links */}
        <div
          className="hidden md:flex items-center gap-7 text-[14px] text-[#4A554D]"
          style={{ fontWeight: 450 }}
        >
          <Link
            to="/v3/platform"
            className="no-underline transition-opacity duration-200 hover:opacity-55 text-[#4A554D]"
          >
            Platform
          </Link>
          {ANCHOR_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="no-underline transition-opacity duration-200 hover:opacity-55"
            >
              {label}
            </a>
          ))}
        </div>

        {/* GitHub CTA */}
        <a
          href="https://github.com/ayush00git/ProtPocket"
          target="_blank"
          rel="noopener noreferrer"
          className="relative group overflow-hidden inline-flex items-center gap-2 px-4 py-[10px] rounded-full bg-[#0B0F14] border border-[#0B0F14] font-medium no-underline"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] bg-white rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-out z-0" />
          <span className="relative z-10 flex items-center gap-2 text-white text-[13.5px] group-hover:text-[#0B0F14] transition-colors duration-300">
            <GithubIcon />
            GitHub
          </span>
        </a>
      </nav>
    </div>
  );
}
