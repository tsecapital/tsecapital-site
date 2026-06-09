import { booking, site, isCalConfigured } from "@/lib/content";
import { Reveal } from "@/components/reveal";
import BookingEmbed from "@/components/booking-embed";

export function Booking() {
  const calReady = isCalConfigured();

  return (
    <section id="book" className="bg-espresso text-cream">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-12 md:items-center">
          <div className="md:col-span-5">
            <Reveal>
              <h2 className="text-balance text-3xl font-medium leading-tight tracking-tight text-cream md:text-5xl">
                {booking.heading}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-6 text-lg text-cream/75">{booking.sub}</p>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-8 text-sm text-cream/60">
                Prefer email?{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="text-clay underline-offset-4 hover:underline"
                >
                  {site.email}
                </a>
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-7">
            <Reveal delay={0.1}>
              {calReady ? (
                <div className="h-[600px] overflow-hidden rounded-2xl bg-cream p-2">
                  <BookingEmbed calLink={site.calLink} />
                </div>
              ) : (
                <div className="rounded-2xl border border-cream/15 bg-cream/5 p-8 text-center">
                  <p className="font-display text-2xl text-cream">
                    Book a free 15-minute intro call
                  </p>
                  <p className="mt-3 text-sm text-cream/70">
                    The live calendar turns on once Cal.com is connected. For now, email to
                    grab a time — you’ll hear back within a day.
                  </p>
                  <a
                    href={`mailto:${site.email}?subject=Intro%20call`}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-clay px-6 py-3.5 text-base font-medium text-cream transition-colors hover:bg-clay-deep"
                  >
                    Email to book a time
                    <span aria-hidden>→</span>
                  </a>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
