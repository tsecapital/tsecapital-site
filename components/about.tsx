import Image from "next/image";
import { about } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function About() {
  return (
    <section id="about" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="grid items-start gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Reveal>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border hairline bg-paper-2">
              <Image
                src="/chauncey2.webp"
                alt="Chauncey Tse"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-top"
              />
            </div>
          </Reveal>
        </div>

        <div className="md:col-span-8 md:pl-6">
          <Reveal>
            <p className="label text-xs text-clay">{about.kicker}</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-5 text-balance text-3xl font-medium leading-tight tracking-tight md:text-5xl">
              {about.heading}
            </h2>
          </Reveal>
          <div className="mt-7 space-y-5 text-lg leading-relaxed text-ink-2">
            {about.paragraphs.map((p, i) => (
              <Reveal key={i} delay={0.1 + i * 0.06}>
                <p>{p}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <p className="mt-6 font-display text-2xl italic text-ink">{about.signature}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
