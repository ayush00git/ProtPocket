import React, { useEffect } from 'react';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { HeroSection } from '../sections/HeroSection';
import { StatsSection } from '../sections/StatsSection';
import { FeatureSection } from '../sections/FeatureSection';
import { CapabilitiesSection } from '../sections/CapabilitiesSection';
import { QuoteSection } from '../sections/QuoteSection';
import { CTASection } from '../sections/CTASection';

export function LandingPage() {
  // Lock the landing page to its own light surface — the legacy app uses
  // CSS variables on :root for theming. We isolate by setting them here
  // for the duration of this page's mount.
  useEffect(() => {
    const root = document.documentElement;
    const prevBg = root.style.getPropertyValue('--bg-primary');
    root.style.setProperty('--bg-primary', '#f7f5f0');
    return () => {
      if (prevBg) root.style.setProperty('--bg-primary', prevBg);
      else root.style.removeProperty('--bg-primary');
    };
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-[#f7f5f0] text-[#0d0d0b] antialiased"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeatureSection />
        <CapabilitiesSection />
        <QuoteSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
