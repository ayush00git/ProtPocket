import React, { useEffect } from 'react';
import { NavV3 } from './components/NavV3';
import { FooterV3 } from './components/FooterV3';
import { HeroV3 } from './sections/HeroV3';
import { ProblemV3 } from './sections/ProblemV3';
import { PlatformV3 } from './sections/PlatformV3';
import { WorkflowV3 } from './sections/WorkflowV3';
import { BenchmarkV3 } from './sections/BenchmarkV3';
import { InstallV3 } from './sections/InstallV3';
import { CTAV3 } from './sections/CTAV3';

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

export function LandingV3() {
  useReveal();

  return (
    <div
      className="bg-white min-h-screen overflow-x-hidden font-geist antialiased"
      style={{ color: '#0B0F14' }}
    >
      <NavV3 />
      <HeroV3 />
      <main className="max-w-[1180px] mx-auto px-8" id="top">
        <ProblemV3 />
        <PlatformV3 />
        <WorkflowV3 />
        <BenchmarkV3 />
        <InstallV3 />
        <CTAV3 />
      </main>
      <FooterV3 />
    </div>
  );
}
