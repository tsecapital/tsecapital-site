import { faq } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function Faq() {
  return (
    <section id="faq" className="bg-paper-2">
      <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <Reveal>
          <h2 className="text-3xl font-medium tracking-tight md:text-5xl">{faq.heading}</h2>
        </Reveal>

        <div className="mt-12 border-t hairline">
          {faq.items.map((item, i) => (
            <Reveal key={i} delay={i * 0.03}>
              <details className="group border-b hairline py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg text-ink">
                  <span>{item.q}</span>
                  <span
                    aria-hidden
                    className="font-display text-2xl leading-none text-clay transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-ink-2">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
