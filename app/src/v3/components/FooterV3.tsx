import React from 'react';

const PLATFORM_LINKS = [
  { label: 'Gap Score', href: '#platform' },
  { label: 'Binding sites', href: '#platform' },
  { label: 'Mutation impact', href: '#mutation' },
  { label: 'Docking', href: '#platform' },
];

const RESOURCE_LINKS = [
  { label: 'GitHub repository', href: 'https://github.com/ayush00git/ProtPocket', external: true },
  { label: 'Installation', href: 'https://github.com/ayush00git/ProtPocket/blob/main/INSTALLATION.md', external: true },
  { label: 'Benchmark', href: '#mutation', external: false },
];

const CITATION_LINKS = [
  { label: 'AlphaFold DB', href: 'https://alphafold.ebi.ac.uk/', external: true },
  { label: 'AlphaMissense', href: 'https://alphamissense.hegelab.org/', external: true },
  { label: 'ChEMBL', href: 'https://www.ebi.ac.uk/chembl/', external: true },
  { label: 'UniProt', href: 'https://www.uniprot.org/', external: true },
];

function FooterLinks({ links }: { links: { label: string; href: string; external?: boolean }[] }) {
  return (
    <ul className="list-none p-0 m-0 flex flex-col gap-3">
      {links.map(({ label, href, external }) => (
        <li key={label}>
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="text-[14px] no-underline transition-colors duration-200"
            style={{ color: 'rgba(255,255,255,0.42)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.82)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.42)')}
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function FooterV3() {
  return (
    <footer className="w-full mt-[120px]" style={{ background: '#0B0F14' }}>
      <div className="max-w-[1180px] mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-8">

        <div className="grid grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] gap-10">
          {/* Brand + blurb */}
          <div className="col-span-2 lg:col-span-1">
            <a
              href="#top"
              className="inline-flex items-center text-[18px] font-semibold tracking-[-0.015em] no-underline"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              ProtPocket
            </a>
            <p
              className="text-[14px] leading-[1.6] max-w-[280px] mt-4 m-0"
              style={{ color: 'rgba(255,255,255,0.36)' }}
            >
              From protein to ranked drug candidates. Open-source, mutation-aware, built on the March
              2026 AlphaFold homodimer dataset.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h5
              className="text-[12px] m-0 mb-[18px] font-medium tracking-[0.06em] uppercase"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Platform
            </h5>
            <FooterLinks links={PLATFORM_LINKS} />
          </div>

          {/* Resources */}
          <div>
            <h5
              className="text-[12px] m-0 mb-[18px] font-medium tracking-[0.06em] uppercase"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Resources
            </h5>
            <FooterLinks links={RESOURCE_LINKS} />
          </div>

          {/* Citations */}
          <div>
            <h5
              className="text-[12px] m-0 mb-[18px] font-medium tracking-[0.06em] uppercase"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Citations
            </h5>
            <FooterLinks links={CITATION_LINKS} />
          </div>
        </div>

        {/* Footer end */}
        <div
          className="mt-14 flex justify-between items-center flex-wrap gap-3 text-[13px] pt-6"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.22)',
          }}
        >
          <span>MIT License</span>
          <span>github.com/ayush00git/ProtPocket</span>
        </div>

      </div>
    </footer>
  );
}
