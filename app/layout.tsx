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

const title = "Chauncey Tse — AI Automation for Local Business | Brentwood & West LA";
const description =
  "I help Brentwood and West LA practices and firms automate the busywork — intake, scheduling, follow-ups, and reporting — with today’s most capable AI. Fixed prices. Book a free intro call.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  keywords: [
    "AI automation",
    "small business AI consultant",
    "Brentwood",
    "West LA",
    "90049",
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
    addressLocality: "Los Angeles",
    addressRegion: "CA",
    postalCode: site.zip,
    addressCountry: "US",
  },
  founder: { "@type": "Person", name: "Chauncey Tse" },
  knowsAbout: ["AI automation", "workflow automation", "Claude", "small business operations"],
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
