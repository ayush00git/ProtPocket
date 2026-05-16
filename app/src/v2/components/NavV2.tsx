export function NavV2() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] bg-white/55 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <a
          href="/v2"
          className="font-display text-[14px] font-semibold tracking-[0.22em] text-black"
        >
          PROTPOCKET
        </a>

        <div className="flex items-center gap-2">
          {[
            { href: '#discovery', label: 'Discovery' },
            { href: '#how', label: 'How it works' },
            { href: '#docs', label: 'Docs' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 font-display text-[13px] font-medium text-black/65 transition-colors hover:bg-black/[0.04] hover:text-black"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#github"
            className="group ml-2 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 font-display text-[13px] font-semibold text-white transition-colors hover:bg-black/85"
          >
            GitHub
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">↗</span>
          </a>
        </div>
      </div>
    </header>
  );
}
