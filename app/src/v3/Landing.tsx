import React, { useEffect, useRef, useState } from 'react';
import { NavV3 } from './components/NavV3';
import { FooterV3 } from './components/FooterV3';
import { ProblemV3 } from './sections/ProblemV3';
import { PlatformV3 } from './sections/PlatformV3';
import { WorkflowV3 } from './sections/WorkflowV3';
import { BenchmarkV3 } from './sections/BenchmarkV3';
import { InstallV3 } from './sections/InstallV3';
import { CTAV3 } from './sections/CTAV3';


const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';

function useFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONTS_HREF}"]`)) return;
    const pc1 = document.createElement('link');
    pc1.rel = 'preconnect';
    pc1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(pc1);
    const pc2 = document.createElement('link');
    pc2.rel = 'preconnect';
    pc2.href = 'https://fonts.gstatic.com';
    pc2.crossOrigin = '';
    document.head.appendChild(pc2);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS_HREF;
    document.head.appendChild(link);
  }, []);
}


function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('v3-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.v3-reveal:not(.v3-in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── font shorthands ────────────────────────────────────────────────────────────
const SERIF = '"Instrument Serif", "Times New Roman", Times, serif';
const SANS  = '"Geist", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO  = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace';

// ── color tokens ──────────────────────────────────────────────────────────────
const INK0        = '#FFFFFF';
const POCKET      = '#C6FF3D';
const POCKET1     = '#B3E832';
const TEXT_DIM    = 'rgba(255,255,255,0.72)';
const TEXT_FAINT  = 'rgba(255,255,255,0.50)';
const HAIR        = 'rgba(255,255,255,0.18)';
const HAIR_STRONG = 'rgba(255,255,255,0.30)';
const EASE        = 'cubic-bezier(0.22,1,0.36,1)';

const NAV_LINKS = [
  { label: 'Platform',       sub: 'How ProtPocket works',      href: '#platform' },
  { label: 'Benchmarks',     sub: 'Accuracy vs. FPocket, SiteMap', href: '#benchmarks' },
  { label: 'Research',       sub: 'Papers & methods',           href: '#research' },
  { label: 'Request access', sub: 'Early access programme',     href: '#contact' },
];

export function Landing() {
  useFonts();
  useReveal();
  const [navOpen, setNavOpen] = useState(false);
  const [openKey, setOpenKey] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowNav(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Notch nav — fixed, above everything, fades out when NavV3 takes over */}
      <div
        className="l-reveal l-d1"
        style={{
          position: 'fixed', top: 14, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 50,
          opacity: showNav ? 0 : 1,
          transition: 'opacity 400ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div
          style={{
            display: 'inline-block', pointerEvents: showNav ? 'none' : 'auto',
            border: '1px solid rgba(255,255,255,0.26)',
            borderTop: 'none',
            borderRadius: '0 0 22px 22px',
            background: 'rgba(255,255,255,0.11)',
            backdropFilter: 'blur(32px) saturate(220%) brightness(1.12)',
            WebkitBackdropFilter: 'blur(32px) saturate(220%) brightness(1.12)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.28), inset 0 -1px 0 rgba(255,255,255,0.16), inset 1px 0 0 rgba(255,255,255,0.10), inset -1px 0 0 rgba(255,255,255,0.10)',
            overflow: 'hidden',
          }}
          onMouseEnter={() => { setNavOpen(true); setOpenKey(k => k + 1); }}
          onMouseLeave={() => setNavOpen(false)}
        >
          <div
            className="flex items-center whitespace-nowrap cursor-default select-none"
            style={{ gap: 12, padding: '11px 26px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_DIM }}
          >
            <span style={{ color: POCKET1, fontSize: 10, transform: 'translateY(-0.5px)' }}>✦</span>
            &nbsp;&nbsp;ProtPocket · Drug discovery&nbsp;&nbsp;
            <span style={{ color: POCKET1, fontSize: 10, transform: 'translateY(-0.5px)' }}>✦</span>
          </div>
          <div style={{ display: 'grid', gridTemplateRows: navOpen ? '1fr' : '0fr', transition: `grid-template-rows 420ms ${EASE}` }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.14)', margin: '0 14px 6px' }} />
              {NAV_LINKS.map((link, i) => (
                <a key={`${openKey}-${i}`} href={link.href} className={`l-menu-item l-menu-link l-menu-i${i}`}>
                  <span>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.90)' }}>{link.label}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontFamily: MONO, letterSpacing: '0.04em' }}>{link.sub}</span>
                  </span>
                  <span className="l-menu-arrow" style={{ color: POCKET1, fontSize: 14 }}>→</span>
                </a>
              ))}
              <div style={{ height: 10 }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes landing-rise { to { opacity: 1; transform: translateY(0); } }
        .l-reveal {
          opacity: 0;
          transform: translateY(8px);
          animation: landing-rise 880ms ${EASE} forwards;
        }
        .l-d1 { animation-delay: .05s; }
        .l-d2 { animation-delay: .18s; }
        .l-d3 { animation-delay: .30s; }
        .l-d4 { animation-delay: .42s; }
        .l-d5 { animation-delay: .54s; }
        @media (prefers-reduced-motion: reduce) {
          .l-reveal { animation: none; opacity: 1; transform: none; }
          .l-btn-primary, .l-arrow { transition: none !important; }
        }

        .l-btn-primary { transition: background 220ms ${EASE}; }
        .l-btn-primary:hover { background: ${POCKET1} !important; }
        .l-arrow { transition: transform 220ms ${EASE}; }
        .l-btn-primary:hover .l-arrow { transform: translateX(3px); }

        .l-btn-ghost { transition: opacity 120ms ${EASE}, border-color 220ms ${EASE}; }
        .l-btn-ghost:hover { opacity: 0.62; }

        @keyframes l-menu-item-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .l-menu-item {
          opacity: 0;
          animation: l-menu-item-in 420ms ${EASE} forwards;
        }
        .l-menu-i0 { animation-delay: 80ms; }
        .l-menu-i1 { animation-delay: 150ms; }
        .l-menu-i2 { animation-delay: 220ms; }
        .l-menu-i3 { animation-delay: 290ms; }
        .l-menu-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; border-radius: 10px;
          font-family: ${SANS}; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.85); text-decoration: none;
          transition: background 160ms ease;
        }
        .l-menu-link:hover { background: rgba(255,255,255,0.10); }
        .l-menu-link .l-menu-arrow { opacity: 0; transform: translateX(-4px); transition: opacity 160ms ease, transform 160ms ease; }
        .l-menu-link:hover .l-menu-arrow { opacity: 1; transform: translateX(0); }

        @media (max-width: 860px) {
          .l-topbar { padding: 18px 18px 0 !important; }
          .l-corner { display: none !important; }
          .l-hero { grid-template-columns: 1fr !important; align-items: flex-start !important; gap: 26px; padding: 0 22px 26px !important; }
          .l-wordmark { font-size: clamp(46px, 16vw, 120px) !important; white-space: normal !important; }
          .l-detail { max-width: 520px !important; justify-self: start !important; }
          .l-spacer { min-height: 40px !important; }
        }
        @media (max-width: 480px) {
          .l-frame { padding: 8px !important; }
          .l-stage { border-radius: 16px !important; }
          .l-lead { font-size: 26px !important; }
        }
      `}</style>

      {/* Frame — sticky so sections slide over it */}
      <div className="l-frame relative min-h-screen" style={{ padding: 14, background: '#D6E6E4', position: 'sticky', top: 0, zIndex: 0 }}>

        {/* Stage */}
        <div
          className="l-stage relative w-full overflow-hidden flex flex-col isolate"
          style={{
            minHeight: 'calc(100svh - 28px)',
            borderRadius: 22,
            background: 'transparent',
          }}
        >
          {/* Video background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>

          {/* Dark weight overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1, background: 'rgba(0,0,0,0.35)' }}
          />

          {/* Grain texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '200px 200px',
              opacity: 0.28,
              mixBlendMode: 'overlay',
            }}
          />

          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1.4px)',
              backgroundSize: '30px 30px',
              WebkitMaskImage: 'radial-gradient(120% 95% at 72% 26%, #000 0%, transparent 78%)',
              maskImage: 'radial-gradient(120% 95% at 72% 26%, #000 0%, transparent 78%)',
            }}
          />

          {/* Content */}
          <div className="relative flex flex-col flex-1 min-h-0" style={{ zIndex: 3 }}>

            {/* Top bar — corners only */}
            <header
              className="l-topbar flex items-start justify-between"
              style={{ padding: '22px 30px 0' }}
            >
              <div
                className="l-corner l-reveal l-d1"
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEXT_FAINT }}
              >
                &copy;&nbsp;2026
              </div>
              <div
                className="l-corner l-reveal l-d1 text-right"
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEXT_FAINT }}
              >
                AlphaFold-native
              </div>
            </header>

            {/* Spacer */}
            <div className="l-spacer flex-1" style={{ minHeight: 60 }} />

            {/* Hero */}
            <div
              className="l-hero grid items-end"
              style={{
                gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
                gap: 40,
                padding: '0 34px 30px',
              }}
            >
              {/* Left — wordmark */}
              <div>
                <h1
                  className="l-wordmark l-reveal l-d2 whitespace-nowrap m-0"
                  style={{
                    fontFamily: SERIF, fontWeight: 400,
                    color: INK0, lineHeight: 0.84,
                    letterSpacing: '-0.03em',
                    fontSize: 'clamp(54px, 11.5vw, 176px)',
                  }}
                >
                  ProtPocket
                  <span style={{ color: POCKET1, fontSize: '0.34em', verticalAlign: 'top', marginLeft: '0.03em' }}>✦</span>
                </h1>
              </div>

              {/* Right — detail */}
              <div className="l-detail w-full" style={{ maxWidth: 440, justifySelf: 'end' }}>
                <p
                  className="l-lead l-reveal l-d3 m-0"
                  style={{
                    fontFamily: SERIF, fontSize: 'clamp(28px, 2.6vw, 38px)',
                    lineHeight: 1.32, letterSpacing: '-0.015em',
                    color: INK0, marginBottom: 26,
                  }}
                >
                  Find the pocket. <em>Cure the disease.</em>
                </p>

                <p
                  className="l-reveal l-d4 m-0"
                  style={{
                    fontFamily: SANS, fontSize: 15, lineHeight: 1.6,
                    color: TEXT_DIM, marginBottom: 24,
                  }}
                >
                  ProtPocket reads AlphaFold structures and returns ranked binding sites — including{' '}
                  <em style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.16em', color: INK0 }}>
                    cryptic
                  </em>{' '}
                  pockets that only open in motion. Built for chemistry teams who need answers in hours, not quarters.
                </p>

                {/* CTA row */}
                <div className="l-reveal l-d5 flex items-center flex-wrap" style={{ gap: 16 }}>
                  <a
                    href="#contact"
                    className="l-btn-primary inline-flex items-center no-underline whitespace-nowrap rounded-full"
                    style={{
                      gap: 14, padding: '8px 8px 8px 22px',
                      background: POCKET, color: '#0B0F14',
                      fontFamily: SANS, fontSize: 15, fontWeight: 500,
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    Request access
                    <span
                      className="l-arrow inline-grid place-items-center rounded-full"
                      aria-hidden="true"
                      style={{ width: 34, height: 34, background: '#0B0F14', color: POCKET }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </a>

                  <a
                    href="#tech"
                    className="l-btn-ghost inline-flex items-center no-underline whitespace-nowrap rounded-full"
                    style={{
                      gap: 9, padding: '11px 20px',
                      border: `1px solid ${HAIR_STRONG}`,
                      color: INK0, background: 'transparent',
                      fontFamily: SANS, fontSize: 14, fontWeight: 500,
                    }}
                  >
                    How it works
                  </a>
                </div>

                {/* Caption */}
                <div
                  className="l-reveal l-d5 flex items-center whitespace-nowrap"
                  style={{
                    gap: 10, marginTop: 22,
                    fontFamily: MONO, fontSize: 11,
                    letterSpacing: '0.06em', color: TEXT_FAINT,
                  }}
                >
                  <span style={{ color: TEXT_FAINT }}>✦</span>
                  <span>cryptic&nbsp;pockets</span>
                  <span>·</span>
                  <span>druggability</span>
                  <span>·</span>
                  <span>hours,&nbsp;not&nbsp;quarters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Sentinel — crossing viewport top triggers NavV3 */}
      <div ref={sentinelRef} style={{ height: 0 }} />

      {/* NavV3 — fades in once hero is scrolled past. NO transform here — transform breaks position:fixed children */}
      <div
        style={{
          opacity: showNav ? 1 : 0,
          transition: 'opacity 400ms cubic-bezier(0.22,1,0.36,1)',
          pointerEvents: showNav ? 'auto' : 'none',
        }}
      >
        <NavV3 />
      </div>

      {/* Sections — card that slides over the sticky hero */}
      <div
        className="overflow-x-hidden font-geist antialiased"
        style={{
          position: 'relative', zIndex: 1,
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.18)',
          color: '#0B0F14',
          marginTop: '-20px',
        }}
      >
        <main className="max-w-[1180px] mx-auto px-8" id="top">
          <ProblemV3 />
        </main>
        <PlatformV3 />
        <main className="max-w-[1180px] mx-auto px-8">
          <WorkflowV3 />
        </main>
        <BenchmarkV3 />
        <main className="max-w-[1180px] mx-auto px-8">
          <InstallV3 />
          <CTAV3 />
        </main>
        <FooterV3 />
      </div>
    </>
  );
}
