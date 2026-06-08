import { services } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function Services() {
  return (
    <section className="bg-paper-2">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal>
          <h2 className="max-w-3xl text-balance text-3xl font-medium leading-tight tracking-tight md:text-5xl">
            {services.heading}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-5 max-w-2xl text-lg text-ink-2">{services.sub}</p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {services.items.map((s, i) => (
            <Reveal
              key={s.title}
              delay={i * 0.08}
              className="flex h-full flex-col rounded-2xl border hairline bg-cream p-7 transition-shadow hover:shadow-md"
            >
              <p className="label text-[0.7rem] text-clay">{s.audience}</p>
              <h3 className="mt-4 text-2xl tracking-tight">{s.title}</h3>
              <p className="mt-3 text-ink-2">{s.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-10 max-w-3xl text-lg text-ink">{services.closer}</p>
        </Reveal>
      </div>
    </section>
  );
}
