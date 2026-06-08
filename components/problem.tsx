import { problem } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Reveal>
            <h2 className="text-balance text-3xl font-medium leading-tight tracking-tight md:text-5xl">
              {problem.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg text-ink-2">{problem.sub}</p>
          </Reveal>
        </div>

        <div className="md:col-span-7 md:pl-8">
          <ul className="overflow-hidden rounded-2xl border hairline">
            {problem.items.map((item, i) => (
              <Reveal
                as="li"
                key={i}
                delay={i * 0.05}
                className="flex items-start gap-4 border-b hairline bg-cream/40 px-6 py-5 last:border-b-0"
              >
                <span className="mt-1 font-display text-sm text-clay">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-lg text-ink">{item}</span>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.1}>
            <p className="mt-8 font-display text-2xl italic leading-snug text-ink md:text-3xl">
              {problem.closer}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
