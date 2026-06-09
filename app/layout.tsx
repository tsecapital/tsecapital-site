import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site, faq, pricing } from "@/lib/content";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const title = "Claude AI Automation & Onboarding | Chauncey Tse, West LA";
const description =
  "Claude AI automation & onboarding for West Los Angeles businesses — I automate your busywork and get your team using Claude & Claude Code. Book a free call.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  applicationName: "Chauncey Tse",
  authors: [{ name: "Chauncey Tse", url: site.url }],
  creator: "Chauncey Tse",
  publisher: "Chauncey Tse",
  category: "technology",
  keywords: [
    "Claude AI automation",
    "Claude consultant",
    "Claude Code onboarding",
    "Claude Code training",
    "AI automation consultant",
    "AI consultant Los Angeles",
    "small business AI",
    "workflow automation",
    "West Los Angeles",
    "West LA",
    "AI for dentists lawyers real estate",
  ],
  openGraph: {
    title,
    description,
    url: site.url,
    siteName: "Chauncey Tse",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: { canonical: "/" },
  other: { "x-autodeploy-test": "live" },
};

export const viewport: Viewport = {
  themeColor: "#f4eee2",
  width: "device-width",
  initialScale: 1,
};

const priceNum = (p: string) => p.replace(/[^0-9.]/g, "");

// Local business / service entity
const businessLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${site.url}/#business`,
  name: "Chauncey Tse — Claude AI Automation & Onboarding",
  description,
  url: site.url,
  image: `${site.url}/opengraph-image`,
  email: site.email,
  priceRange: "$$$",
  areaServed: { "@type": "City", name: "Los Angeles" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "West Los Angeles",
    addressRegion: "CA",
    addressCountry: "US",
  },
  founder: {
    "@type": "Person",
    name: "Chauncey Tse",
    jobTitle: "AI Engineer & Consultant",
  },
  knowsAbout: [
    "AI automation",
    "workflow automation",
    "Claude",
    "Claude Code",
    "AI onboarding and training",
    "small business operations",
  ],
  serviceType: [
    "AI automation",
    "Claude onboarding",
    "Claude Code training",
    "Workflow automation",
  ],
  makesOffer: pricing.tiers.map((t) => ({
    "@type": "Offer",
    priceCurrency: "USD",
    price: priceNum(t.price),
    itemOffered: { "@type": "Service", name: t.name, description: t.tagline },
  })),
};

// FAQ structured data (eligible for rich results / AI answers)
const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.items.map((it) => ({
    "@type": "Question",
    name: it.q,
    acceptedAnswer: { "@type": "Answer", text: it.a },
  })),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <div className="grain" aria-hidden />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
