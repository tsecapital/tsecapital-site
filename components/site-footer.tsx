import { site, footer } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="border-t hairline bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg">
            Chauncey<span className="text-clay"> Tse</span>
          </p>
          <p className="mt-1 text-sm text-ink-2">
            {footer.blurb} · {site.area} · {site.zip}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-ink-2 md:items-end">
          <a href={`mailto:${site.email}`} className="transition-colors hover:text-ink">
            {site.email}
          </a>
          <p>{footer.building}</p>
          <p className="text-ink-2/70">© 2026 Chauncey Tse</p>
        </div>
      </div>
    </footer>
  );
}
