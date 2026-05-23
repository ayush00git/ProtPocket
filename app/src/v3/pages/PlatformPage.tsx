import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { NavV3 } from '../components/NavV3';
import { FooterV3 } from '../components/FooterV3';
import { useSearch } from '../../hooks/useSearch';
import type { Complex } from '../../types';

type ViewMode = 'card' | 'grid' | 'list';

// ── Tag ───────────────────────────────────────────────────────────────────────

type TagVariant = 'who' | 'undrugged' | 'drugged' | 'unreviewed';

const TAG_STYLES: Record<TagVariant, { bg: string; color: string; border: string }> = {
  who:        { bg: 'rgba(239,68,68,0.08)',    color: '#DC2626', border: 'rgba(239,68,68,0.22)'   },
  undrugged:  { bg: 'rgba(245,158,11,0.09)',   color: '#B45309', border: 'rgba(245,158,11,0.25)'  },
  drugged:    { bg: 'rgba(16,185,129,0.08)',   color: '#047857', border: 'rgba(16,185,129,0.22)'  },
  unreviewed: { bg: 'rgba(251,191,36,0.10)',   color: '#92400E', border: 'rgba(251,191,36,0.28)'  },
};

// Soft card background keyed to the result's dominant property
function cardColors(complex: Complex): { bg: string; border: string; stripGap: string } {
  if (complex.is_who_pathogen)  return { bg: '#FFF5F5', border: 'rgba(239,68,68,0.13)',    stripGap: 'rgba(239,68,68,0.08)'    };
  if (complex.drug_count === 0) return { bg: '#FFFCF0', border: 'rgba(245,158,11,0.15)',   stripGap: 'rgba(245,158,11,0.10)'   };
  if (complex.drug_count > 0)   return { bg: '#F2FCF8', border: 'rgba(16,185,129,0.15)',   stripGap: 'rgba(16,185,129,0.10)'   };
  return                               { bg: '#F8FAFC', border: 'rgba(11,15,20,0.07)',     stripGap: 'rgba(11,15,20,0.06)'     };
}

function Tag({ variant, children }: { variant: TagVariant; children: React.ReactNode }) {
  const s = TAG_STYLES[variant];
  return (
    <span
      className="font-jetbrains text-[10px] tracking-[0.06em] uppercase px-[9px] py-[3px] rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {children}
    </span>
  );
}

// ── Gap score bar ─────────────────────────────────────────────────────────────

function GapScoreV3({ score = 0 }: { score?: number }) {
  const pct = Math.min((score / 2.0) * 100, 100);
  const fillWidth = score > 0 ? `${Math.max(pct, 1.5)}%` : '0%';

  const fillColor =
    pct >= 75 ? '#047857' :
    pct >= 40 ? '#B45309' :
    '#D1D9D5';
  const labelColor =
    pct >= 75 ? '#047857' :
    pct >= 40 ? '#B45309' :
    '#B8C2BD';

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="flex-1 h-[3px] rounded-full overflow-hidden"
        style={{ background: 'rgba(11,15,20,0.07)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: fillWidth, background: fillColor }}
        />
      </div>
      <span
        className="font-jetbrains text-[12px] w-[46px] text-right shrink-0"
        style={{ color: labelColor }}
      >
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCardV3({
  complex,
  layout = 'card',
  isLast = false,
}: {
  complex: Complex;
  layout?: 'card' | 'grid' | 'list';
  isLast?: boolean;
}) {
  const navigate = useNavigate();
  const {
    uniprot_id,
    protein_name,
    gene_name,
    organism,
    is_who_pathogen,
    dimer_plddt_avg,
    disorder_delta,
    drug_count,
    gap_score,
    review_status,
  } = complex;

  const drugVariant: TagVariant = drug_count === 0 ? 'undrugged' : 'drugged';
  const drugLabel = drug_count === 0
    ? 'Undrugged'
    : `${drug_count} drug${drug_count === 1 ? '' : 's'}`;

  const colors = cardColors(complex);

  const tags = (
    <div className="flex items-center gap-[6px] flex-wrap">
      {review_status === 'unreviewed' && <Tag variant="unreviewed">Unreviewed</Tag>}
      {is_who_pathogen               && <Tag variant="who">WHO pathogen</Tag>}
      {drug_count !== -1             && <Tag variant={drugVariant}>{drugLabel}</Tag>}
    </div>
  );

  // ── List row (ultra-compact) layout ──
  if (layout === 'list') {
    return (
      <div
        onClick={() => navigate(`/complex/${uniprot_id}`)}
        className="flex items-center gap-5 px-5 py-[14px] cursor-pointer"
        style={{
          background: colors.bg,
          borderBottom: isLast ? 'none' : '1px solid rgba(11,15,20,0.06)',
        }}
      >
        {/* Protein name */}
        <span className="flex-1 min-w-0 text-[15px] font-medium tracking-[-0.015em] text-[#0B0F14] truncate">
          {protein_name}
        </span>

        {/* Gene · organism */}
        <div className="hidden sm:flex items-center gap-[6px] shrink-0 text-[13px]">
          <span className="font-jetbrains text-[#0B0F14] font-medium">{gene_name}</span>
          <span style={{ color: 'rgba(11,15,20,0.18)' }}>·</span>
          <span className="italic text-[#4A554D] max-w-[180px] truncate">{organism}</span>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-[6px] shrink-0">
          {review_status === 'unreviewed' && <Tag variant="unreviewed">Unreviewed</Tag>}
          {is_who_pathogen               && <Tag variant="who">WHO pathogen</Tag>}
          {drug_count !== -1             && <Tag variant={drugVariant}>{drugLabel}</Tag>}
        </div>
      </div>
    );
  }

  // ── Tile (compact grid) layout ──
  if (layout === 'grid') {
    return (
      <div
        onClick={() => navigate(`/complex/${uniprot_id}`)}
        className="flex flex-col gap-4 p-5 rounded-[18px] cursor-pointer"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-medium tracking-[-0.02em] text-[#0B0F14] leading-[1.35] m-0 line-clamp-2">
            {protein_name}
          </h3>
          <div className="flex items-center gap-[6px] text-[13px]">
            <span className="font-jetbrains text-[#0B0F14] font-medium">{gene_name}</span>
            <span style={{ color: 'rgba(11,15,20,0.18)' }}>·</span>
            <span className="italic text-[#4A554D] truncate">{organism}</span>
          </div>
        </div>

        {tags}

        <div className="flex flex-col gap-[8px] mt-auto">
          <span
            className="font-jetbrains text-[10px] uppercase tracking-[0.07em]"
            style={{ color: 'rgba(11,15,20,0.32)' }}
          >
            Gap Score
          </span>
          <GapScoreV3 score={gap_score} />
        </div>
      </div>
    );
  }

  // ── Card (full) layout ──
  return (
    <div
      onClick={() => navigate(`/complex/${uniprot_id}`)}
      className="flex flex-col gap-5 p-7 rounded-[20px] cursor-pointer"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[18px] font-medium tracking-[-0.02em] text-[#0B0F14] leading-[1.3] m-0">
          {protein_name}
        </h3>
        <div className="flex items-center gap-[6px] flex-wrap justify-end shrink-0">
          {review_status === 'unreviewed' && <Tag variant="unreviewed">Unreviewed</Tag>}
          {is_who_pathogen               && <Tag variant="who">WHO pathogen</Tag>}
          {drug_count !== -1             && <Tag variant={drugVariant}>{drugLabel}</Tag>}
        </div>
      </div>

      {/* Gene · organism */}
      <div className="flex items-center gap-2 text-[14px]">
        <span className="font-jetbrains text-[#0B0F14] font-medium">{gene_name}</span>
        <span style={{ color: 'rgba(11,15,20,0.18)' }}>·</span>
        <span className="italic text-[#4A554D]">{organism}</span>
      </div>

      {/* Gap score */}
      <div className="flex flex-col gap-[10px]">
        <span
          className="font-jetbrains text-[11px] uppercase tracking-[0.07em]"
          style={{ color: 'rgba(11,15,20,0.35)' }}
        >
          Gap Score
        </span>
        <GapScoreV3 score={gap_score} />
      </div>

      {/* Metrics strip */}
      <div
        className="grid grid-cols-3 rounded-[10px] overflow-hidden"
        style={{ border: `1px solid ${colors.border}`, gap: '1px', background: colors.stripGap }}
      >
        {[
          { label: 'Confidence',  value: `${(dimer_plddt_avg || 0).toFixed(1)}%` },
          { label: 'Disorder Δ',  value: `${disorder_delta > 0 ? '+' : ''}${(disorder_delta || 0).toFixed(1)}` },
          { label: 'Structure',   value: disorder_delta > 0 ? 'Mono + Dimer' : 'Monomer only' },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center justify-center py-3 px-3 bg-white text-center">
            <span
              className="font-jetbrains text-[10px] uppercase tracking-[0.06em] mb-[5px]"
              style={{ color: 'rgba(11,15,20,0.32)' }}
            >
              {label}
            </span>
            <span className="font-jetbrains text-[12px] text-[#0B0F14]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── View toggle ───────────────────────────────────────────────────────────────

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const btn = (mode: ViewMode, title: string, icon: React.ReactNode) => (
    <button
      onClick={() => onChange(mode)}
      className="w-[30px] h-[26px] rounded-[6px] flex items-center justify-center transition-colors duration-150"
      style={{
        background:  view === mode ? 'white' : 'transparent',
        boxShadow:   view === mode ? '0 1px 3px rgba(11,15,20,0.1)' : 'none',
        color:       view === mode ? '#0B0F14' : 'rgba(11,15,20,0.35)',
      }}
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div
      className="inline-flex items-center rounded-[8px] p-[3px] gap-[2px]"
      style={{ background: 'rgba(11,15,20,0.05)' }}
    >
      {/* Card icon — tall rectangles */}
      {btn('card', 'Card view',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="5" rx="1.5" fill="currentColor" />
          <rect x="1" y="8" width="12" height="5" rx="1.5" fill="currentColor" />
        </svg>
      )}

      {/* Grid icon — 2×2 squares */}
      {btn('grid', 'Grid view',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor" />
          <rect x="8" y="1" width="5" height="5" rx="1.5" fill="currentColor" />
          <rect x="1" y="8" width="5" height="5" rx="1.5" fill="currentColor" />
          <rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor" />
        </svg>
      )}

      {/* List icon — tight horizontal rows */}
      {btn('list', 'List view',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2"  width="12" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="1" y="6"  width="12" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="1" y="10" width="12" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      )}
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────

function SearchBarV3({
  onSearch,
  loading,
  initialValue,
}: {
  onSearch: (q: string) => void;
  loading: boolean;
  initialValue: string;
}) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => { setValue(initialValue); }, [initialValue]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !loading) onSearch(value.trim());
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <form
        onSubmit={submit}
        className="flex w-full overflow-hidden rounded-[14px]"
        style={{ border: '1px solid rgba(11,15,20,0.12)' }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
          placeholder="Search gene, protein, disease, or organism…"
          className="flex-1 bg-white text-[16px] px-6 py-[18px] outline-none text-[#0B0F14] placeholder-[#B8C2BD] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="relative group overflow-hidden shrink-0 px-8 font-medium text-[14px] disabled:opacity-40"
          style={{ background: '#0B0F14', color: 'white', borderLeft: '1px solid rgba(11,15,20,0.12)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-white rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-out z-0" />
          <span className="relative z-10 group-hover:text-[#0B0F14] transition-colors duration-300">
            {loading ? 'Searching…' : 'Search →'}
          </span>
        </button>
      </form>
      <p className="font-jetbrains text-[11.5px] text-[#B8C2BD] tracking-[0.04em] px-1 m-0">
        Try: TP53 · tuberculosis · BRCA1 · Staphylococcus aureus
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PlatformPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const { search, results, loading, error, source, query } = useSearch();
  const [view, setView] = React.useState<ViewMode>('card');

  React.useEffect(() => {
    if (q) search(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleSearch = (newQ: string) => setSearchParams({ q: newQ });
  const hasSearched = !!query;
  const hasResults  = results.length > 0;
  const complexes   = results as unknown as Complex[];

  return (
    <div className="bg-white min-h-screen font-geist antialiased" style={{ color: '#0B0F14' }}>
      <NavV3 />

      <main
        className="mx-auto px-8 pt-[148px] pb-[100px] flex flex-col gap-12 transition-all duration-300"
        style={{ maxWidth: view === 'grid' && hasResults ? '1100px' : '860px' }}

      >
        {/* Page header */}
        <div>
          <span
            className="inline-flex items-center gap-[8px] rounded-full text-[12.5px] text-[#4A554D] mb-6 font-medium"
            style={{ padding: '6px 14px 6px 10px', border: '1px solid rgba(11,15,20,0.12)', background: '#FAFBFA' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#0B0F14] opacity-80" />
            Platform
          </span>
          <h1
            className="font-medium tracking-[-0.035em] leading-[1.05] text-[#0B0F14] m-0 mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Search the database.
          </h1>
          <p className="text-[17px] leading-[1.65] text-[#4A554D] m-0 max-w-[520px]">
            Query by gene, protein name, disease, or organism across the full AlphaFold homodimer dataset.
          </p>
        </div>

        {/* Search bar */}
        <SearchBarV3 onSearch={handleSearch} loading={loading} initialValue={q} />

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
              style={{ borderColor: 'rgba(11,15,20,0.15)', borderTopColor: '#0B0F14' }}
            />
            <span className="text-[14px] text-[#7A8580]">Querying AlphaFold + ChEMBL…</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="px-5 py-4 rounded-[12px] text-[14px]"
            style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.14)', color: '#DC2626' }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && !error && hasSearched && (
          <div className="flex flex-col gap-5">
            {hasResults ? (
              <>
                {/* Results bar: count + toggle */}
                <div
                  className="flex justify-between items-center pb-4"
                  style={{ borderBottom: '1px solid rgba(11,15,20,0.07)' }}
                >
                  <span
                    className="font-jetbrains text-[11px] tracking-[0.06em] uppercase"
                    style={{ color: 'rgba(11,15,20,0.38)' }}
                  >
                    {results.length} results for "{query}"
                    {source && <span className="ml-4">· {source}</span>}
                  </span>
                  <ViewToggle view={view} onChange={setView} />
                </div>

                {/* Cards */}
                {view === 'card' && (
                  <div className="flex flex-col gap-3">
                    {complexes.map((c) => (
                      <ResultCardV3 key={c.uniprot_id} complex={c} layout="card" />
                    ))}
                  </div>
                )}

                {view === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {complexes.map((c) => (
                      <ResultCardV3 key={c.uniprot_id} complex={c} layout="grid" />
                    ))}
                  </div>
                )}

                {view === 'list' && (
                  <div
                    className="rounded-[16px] overflow-hidden"
                    style={{ border: '1px solid rgba(11,15,20,0.08)' }}
                  >
                    {complexes.map((c, i) => (
                      <ResultCardV3
                        key={c.uniprot_id}
                        complex={c}
                        layout="list"
                        isLast={i === complexes.length - 1}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-20 gap-3">
                <span className="text-[18px] font-medium text-[#0B0F14]">No results for "{query}"</span>
                <span className="text-[15px] text-[#7A8580]">Try a gene symbol, disease name, or organism.</span>
              </div>
            )}
          </div>
        )}
      </main>

      <FooterV3 />
    </div>
  );
}
