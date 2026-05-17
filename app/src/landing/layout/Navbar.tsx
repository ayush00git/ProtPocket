import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../components/Button';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'About', href: '#about' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header
        className={
          'fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
          (scrolled
            ? 'bg-[#f7f5f0]/85 backdrop-blur-md border-b border-[#0d0d0b]/10'
            : 'bg-transparent border-b border-transparent')
        }
      >
        <div
          className="mx-auto flex h-16 items-center"
          style={{ maxWidth: 1280, paddingInline: 'clamp(1.25rem, 4vw, 4rem)' }}
        >
          <Link
            to="/"
            className="font-['Cormorant_Garamond'] text-[1.15rem] font-normal tracking-[0.01em] text-[#0d0d0b] mr-auto"
          >
            ProtPocket<span className="ml-2 text-xs font-['DM_Sans'] text-[#8a8780]">/ pocket discovery</span>
          </Link>

          <nav className="hidden md:flex items-center gap-9">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative font-['DM_Sans'] text-sm font-normal text-[#0d0d0b]/70 tracking-[0.01em] py-1 transition-colors duration-200 hover:text-[#0d0d0b] after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:bg-current after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                {l.label}
              </a>
            ))}
            <Button to="/search" variant="primary">
              explore structures
            </Button>
          </nav>

          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-[#0d0d0b]/15 text-[#0d0d0b]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 7h16" strokeLinecap="round" />
                  <path d="M4 17h16" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-[#f7f5f0] border-b border-[#0d0d0b]/10"
            style={{ paddingInline: 'clamp(1.25rem, 4vw, 4rem)' }}
          >
            <ul className="flex flex-col gap-1 py-6">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="block font-['DM_Sans'] text-base text-[#0d0d0b] py-3 border-b border-[#0d0d0b]/10"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="pt-4">
                <Button to="/search" variant="primary" className="w-full justify-center">
                  explore structures
                </Button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
