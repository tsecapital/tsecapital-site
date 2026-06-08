import { pricing } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function Pricing() {
  return (
    <section id="pricing" className="bg-paper-2">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="text-3xl font-medium tracking-tight md:text-5xl">{pricing.heading}</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mt-5 text-lg text-ink-2">{pricing.sub}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {pricing.tiers.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 0.08}
              className={`relative flex h-full flex-col rounded-2xl border p-8 ${
                t.highlight
                  ? "border-clay bg-ink text-cream shadow-lg"
                  : "hairline bg-cream"
              }`}
            >
              {"badge" in t && t.badge ? (
                <span className="absolute right-6 top-7 rounded-full bg-clay px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-cream">
                  {t.badge}
                </span>
              ) : null}

              <h3 className={`text-xl tracking-tight ${t.highlight ? "text-cream" : "text-ink"}`}>
                {t.name}
              </h3>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-medium">{t.price}</span>
                <span className={`text-sm ${t.highlight ? "text-cream/70" : "text-ink-2"}`}>
                  {t.cadence}
                </span>
              </div>

              <p className={`mt-3 text-sm ${t.highlight ? "text-cream/80" : "text-ink-2"}`}>
                {t.tagline}
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {t.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span className="text-clay" aria-hidden>
                      ✦
                    </span>
                    <span className={t.highlight ? "text-cream/90" : "text-ink"}>{p}</span>
                  </li>
                ))}
              </ul>

              <a
                href={t.cta.href}
                className={`mt-auto inline-flex items-center justify-center rounded-full px-5 pt-3 pb-3 text-sm font-medium transition-colors ${
                  t.highlight
                    ? "mt-8 bg-clay text-cream hover:bg-clay-deep"
                    : "mt-8 border border-ink/15 text-ink hover:bg-paper-2"
                }`}
              >
                {t.cta.label}
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-8 text-sm text-ink-2">{pricing.footnote}</p>
        </Reveal>
      </div>
    </section>
  );
}
