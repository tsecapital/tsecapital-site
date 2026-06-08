import { enablement } from "@/lib/content";
import { Reveal } from "@/components/reveal";
import { ClaudeMark } from "@/components/claude-mark";

export function Enablement() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <Reveal>
        <div className="flex items-center gap-2 text-clay">
          <ClaudeMark className="h-4 w-4" />
          <p className="label text-xs">{enablement.eyebrow}</p>
        </div>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-5 max-w-3xl text-balance text-3xl font-medium leading-tight tracking-tight md:text-5xl">
          {enablement.heading}
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-5 max-w-2xl text-lg text-ink-2">{enablement.sub}</p>
      </Reveal>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {enablement.items.map((it, i) => (
          <Reveal
            key={it.mark}
            delay={i * 0.08}
            className="flex h-full flex-col rounded-2xl border hairline bg-cream p-8 transition-shadow hover:shadow-md"
          >
            {/* Claude / Claude Code logo lockup */}
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay/10 text-clay">
                <ClaudeMark className="h-6 w-6" />
              </span>
              <span className="font-display text-2xl tracking-tight">{it.mark}</span>
            </div>
            <p className="label mt-6 text-[0.7rem] text-clay">{it.audience}</p>
            <h3 className="mt-2 text-xl tracking-tight">{it.title}</h3>
            <p className="mt-3 text-ink-2">{it.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.12}>
        <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-lg text-ink">{enablement.closer}</p>
          <a
            href={enablement.cta.href}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-base font-medium text-cream transition-colors hover:bg-clay"
          >
            {enablement.cta.label}
            <span aria-hidden>→</span>
          </a>
        </div>
      </Reveal>
    </section>
  );
}
