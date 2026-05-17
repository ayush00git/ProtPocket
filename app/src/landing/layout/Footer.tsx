import React from 'react';
import { Link } from 'react-router-dom';

const COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Search structures', to: '/search' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'How it works', href: '#how' },
      { label: 'Features', href: '#features' },
    ],
  },
  {
    title: 'Science',
    links: [
      { label: 'Swiss-Prot', href: 'https://www.uniprot.org/uniprotkb?query=reviewed:true' },
      { label: 'Fpocket', href: 'https://github.com/Discngine/fpocket' },
      { label: 'ChEMBL', href: 'https://www.ebi.ac.uk/chembl/' },
      { label: 'Mol*', href: 'https://molstar.org/' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'GitHub', href: 'https://github.com' },
      { label: 'Contact', href: 'mailto:hello@protpocket.io' },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="bg-[#0d0d0b] text-[#f5f2ec]"
      style={{
        paddingBlock: 'clamp(3.5rem, 7vw, 6rem) 2rem',
        paddingInline: 'clamp(1.5rem, 5vw, 5rem)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1280 }}>
        <div className="grid gap-12 pb-12 border-b border-[#f5f2ec]/10 grid-cols-1 sm:grid-cols-2 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="font-['Cormorant_Garamond'] text-[1.25rem] font-normal mb-4">
              ProtPocket
            </div>
            <p className="font-['DM_Sans'] text-sm font-light leading-relaxed text-[#f5f2ec]/40 max-w-[260px]">
              Surfacing druggable pockets across the Swiss-Prot proteome — so research teams can target the right structures, faster.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="font-['DM_Sans'] text-[11px] font-medium uppercase tracking-[0.12em] text-[#f5f2ec]/30 mb-4">
                {col.title}
              </div>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) =>
                  'to' in l && l.to ? (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="font-['DM_Sans'] text-sm text-[#f5f2ec]/55 hover:text-[#f5f2ec] transition-colors duration-200"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <a
                        href={('href' in l && l.href) || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="font-['DM_Sans'] text-sm text-[#f5f2ec]/55 hover:text-[#f5f2ec] transition-colors duration-200"
                      >
                        {l.label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between items-center gap-4 pt-8">
          <p className="font-['DM_Sans'] text-xs uppercase tracking-[0.08em] text-[#f5f2ec]/25">
            © {new Date().getFullYear()} ProtPocket
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Cookies'].map((l) => (
              <a
                key={l}
                href="#"
                className="font-['DM_Sans'] text-xs text-[#f5f2ec]/25 hover:text-[#f5f2ec]/70 transition-colors duration-200"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
