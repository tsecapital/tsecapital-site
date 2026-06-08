import { nav } from "@/lib/content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b hairline bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="font-display text-lg font-semibold tracking-tight">
          Chauncey<span className="text-clay"> Tse</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-ink-2 md:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <a
          href="#book"
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-clay"
        >
          Book a call
        </a>
      </div>
    </header>
  );
}
