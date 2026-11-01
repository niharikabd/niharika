import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const font = Noto_Sans_Bengali({ subsets: ["bengali", "latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "নীহারিকা – বিজ্ঞান ও প্রযুক্তির খবর", template: "%s | নীহারিকা" },
  description: "বিজ্ঞান, প্রযুক্তি, বাংলাদেশ ও বিশ্বের খবর। AI-সহায়তায় তৈরি, মূল সূত্রের লিংকসহ।",
  applicationName: "নীহারিকা",
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
  openGraph: { siteName: "নীহারিকা", locale: "bn_BD", type: "website", images: [{ url: "/logo-512.png", width: 512, height: 512 }] },
  twitter: { card: "summary_large_image" },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ld = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "নীহারিকা", url: SITE, inLanguage: ["bn", "en"], potentialAction: { "@type": "SearchAction", target: `${SITE}/search?q={q}`, "query-input": "required name=q" } },
    { "@context": "https://schema.org", "@type": "NewsMediaOrganization", name: "নীহারিকা", url: SITE, logo: `${SITE}/logo.png` },
  ];
  return (
    <html lang="bn">
      <body className={font.className}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        {children}
      </body>
    </html>
  );
}
