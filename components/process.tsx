import { process } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function Process() {
  return (
    <section id="process" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <Reveal>
        <h2 className="text-3xl font-medium tracking-tight md:text-5xl">{process.heading}</h2>
      </Reveal>
      <Reveal delay={0.06}>
        <p className="mt-5 max-w-2xl text-lg text-ink-2">{process.sub}</p>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border hairline bg-rule md:grid-cols-3">
        {process.steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1} className="bg-cream p-8 md:p-10">
            <span className="font-display text-5xl font-medium text-clay/30">{s.n}</span>
            <h3 className="mt-5 text-2xl tracking-tight">{s.name}</h3>
            <p className="mt-3 text-ink-2">{s.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
