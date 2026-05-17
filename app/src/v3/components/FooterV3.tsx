import React from 'react';

const PLATFORM_LINKS = [
  { label: 'Gap Score', href: '#platform' },
  { label: 'Binding sites', href: '#platform' },
  { label: 'Mutation impact', href: '#mutation' },
  { label: 'Docking', href: '#platform' },
];

const RESOURCE_LINKS = [
  { label: 'GitHub repository', href: 'https://github.com/ayush00git/ProtPocket', external: true },
  { label: 'Installation', href: '#install', external: false },
  { label: 'Architecture', href: '#architecture', external: false },
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
            className="text-[#4A554D] text-[14px] no-underline transition-opacity duration-200 hover:opacity-55"
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
    <footer
      className="max-w-[1180px] mx-auto px-8 mt-[120px] pt-20 pb-10"
      style={{ borderTop: '1px solid rgba(11,15,20,0.08)' }}
    >
      <div className="grid gap-10" style={{ gridTemplateColumns: '1.4fr repeat(3, 1fr)' }}>
        {/* Brand + blurb */}
        <div>
          <a
            href="#top"
            className="inline-flex items-center gap-[10px] text-[18px] font-semibold tracking-[-0.015em] text-[#0B0F14] no-underline"
          >
            <span className="w-[22px] h-[22px] rounded-[6px] bg-[#0B0F14] inline-flex items-center justify-center shrink-0">
              <span className="w-[9px] h-[9px] rounded-[2px] bg-[#C6FF3D]" />
            </span>
            ProtPocket
          </a>
          <p className="text-[#4A554D] text-[14px] leading-[1.6] max-w-[320px] mt-4 m-0">
            From protein to ranked drug candidates. Open-source, mutation-aware, built on the March
            2026 AlphaFold homodimer dataset.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h5 className="text-[13px] text-[#7A8580] m-0 mb-[18px] font-medium">Platform</h5>
          <FooterLinks links={PLATFORM_LINKS} />
        </div>

        {/* Resources */}
        <div>
          <h5 className="text-[13px] text-[#7A8580] m-0 mb-[18px] font-medium">Resources</h5>
          <FooterLinks links={RESOURCE_LINKS} />
        </div>

        {/* Citations */}
        <div>
          <h5 className="text-[13px] text-[#7A8580] m-0 mb-[18px] font-medium">Citations</h5>
          <FooterLinks links={CITATION_LINKS} />
        </div>
      </div>

      {/* Footer end */}
      <div
        className="mt-16 flex justify-between items-center flex-wrap gap-3 text-[13px] text-[#7A8580] pt-6"
        style={{ borderTop: '1px solid rgba(11,15,20,0.08)' }}
      >
        <span>MIT License</span>
        <span>github.com/ayush00git/ProtPocket</span>
      </div>
    </footer>
  );
}
