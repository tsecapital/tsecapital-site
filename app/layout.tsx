import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/lib/content";

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

const title = "Chauncey Tse — Claude AI Automation & Onboarding | West Los Angeles";
const description =
  "I help West Los Angeles businesses put Claude to work — automating the busywork (intake, scheduling, follow-ups, reporting) and onboarding your team to Claude and Claude Code. Fixed prices. Book a free intro call.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  keywords: [
    "AI automation",
    "Claude",
    "Claude Code",
    "Claude onboarding",
    "Claude Code training",
    "small business AI consultant",
    "West Los Angeles",
    "West LA",
    "Los Angeles",
    "workflow automation",
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
  robots: { index: true, follow: true },
  alternates: { canonical: site.url },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Chauncey Tse — AI Automation",
  description,
  url: site.url,
  email: site.email,
  priceRange: "$$$",
  areaServed: {
    "@type": "City",
    name: "Los Angeles",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "West Los Angeles",
    addressRegion: "CA",
    addressCountry: "US",
  },
  founder: { "@type": "Person", name: "Chauncey Tse" },
  knowsAbout: [
    "AI automation",
    "workflow automation",
    "Claude",
    "Claude Code",
    "AI onboarding and training",
    "small business operations",
  ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
