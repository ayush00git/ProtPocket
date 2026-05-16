import { AmbientGreen } from '../components/AmbientGreen';

export function HeroV2() {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-white">
      <AmbientGreen />
      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col px-6 sm:px-10 lg:px-16">
        <div className="flex-1" />

        {/* Content block — bottom-left */}
        <div className="pb-24 lg:pb-32">
          <div className="font-mono text-[11px] font-normal uppercase tracking-[0.28em] text-black/55">
            Open-source drug discovery
          </div>

          <h1 className="mt-8 max-w-[18ch] font-display text-[52px] font-semibold leading-[0.95] tracking-[-0.035em] text-black sm:text-[76px] lg:text-[108px]">
            From protein name to ranked drug binding sites.
          </h1>

          <p className="mt-10 max-w-2xl font-display text-base font-normal leading-relaxed text-black/65 lg:text-lg">
            One query — AlphaFold structures, Gap Score ranking, fpocket cavities, ChEMBL fragments, and live AutoDock Vina docking. In seconds, in a browser.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <a
              href="#start"
              className="group inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 font-display text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-black/85"
            >
              Search a protein
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-display text-[14px] font-medium text-black ring-1 ring-inset ring-black/15 transition-colors hover:bg-black/[0.03]"
            >
              How it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
