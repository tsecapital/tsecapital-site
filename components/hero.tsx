import { hero } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* warm radial glow behind the headline */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[55vh] w-[80vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(189,90,54,0.16),transparent)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28">
        <Reveal>
          <p className="label text-xs text-clay">{hero.eyebrow}</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-medium leading-[1.03] tracking-tight md:text-7xl">
            Your team is doing work that{" "}
            <span className="italic text-clay">AI should be doing.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-2 md:text-xl">
            {hero.lead}
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              href={hero.primaryCta.href}
              className="group inline-flex items-center gap-2 rounded-full bg-clay px-6 py-3.5 text-base font-medium text-cream shadow-sm transition-all hover:bg-clay-deep hover:shadow-md"
            >
              {hero.primaryCta.label}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex items-center rounded-full border hairline px-6 py-3.5 text-base font-medium text-ink transition-colors hover:bg-paper-2"
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.32}>
          <p className="mt-6 text-sm text-ink-2">{hero.note}</p>
        </Reveal>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="border-t hairline" />
      </div>
    </section>
  );
}
