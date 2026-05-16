import { type ReactNode } from 'react';

type ChapterProps = {
  number: string;
  body: ReactNode;
  attribution: string;
  indent?: boolean;
};

function Chapter({ number, body, attribution, indent = false }: ChapterProps) {
  return (
    <div className={indent ? 'lg:pl-[22%]' : ''}>
      {/* Opening header — number + hairline */}
      <div className="flex items-center gap-6">
        <span className="font-mono text-[12px] font-medium uppercase tracking-[0.32em] text-black/70 tabular-nums">
          {number}
        </span>
        <span aria-hidden className="h-px flex-1 bg-black/15" />
      </div>

      {/* Body statement — massive */}
      <h2 className="mt-20 font-display text-[52px] font-semibold leading-[0.96] tracking-[-0.035em] text-black sm:text-[78px] lg:mt-24 lg:text-[104px]">
        {body}
      </h2>

      {/* Attribution — right-aligned, mono */}
      <div className="mt-20 flex justify-end lg:mt-28">
        <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-black/55">
          {attribution}
        </span>
      </div>

      {/* Closing hairline */}
      <div aria-hidden className="mt-14 h-px w-full bg-black/15" />
    </div>
  );
}

export function ProblemV2() {
  return (
    <section id="discovery" className="relative w-full bg-white py-40 lg:py-56">
      <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-10 lg:px-16">
        <Chapter
          number="01"
          attribution="open workflow, today"
          body={
            <>
              Six tools.
              <br />
              Six interfaces.
              <br />
              <span className="text-black/40">Half a day of context-switching.</span>
            </>
          }
        />

        {/* Huge vertical breathing room between chapters */}
        <div className="h-56 lg:h-80" />

        <Chapter
          number="02"
          attribution="with ProtPocket"
          indent
          body={
            <>
              One query.
              <br />
              Every step automated.
              <br />
              Result in seconds.
            </>
          }
        />
      </div>
    </section>
  );
}
