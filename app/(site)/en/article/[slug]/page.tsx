import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE, CAT_EN, bn } from "@/lib/site";
import { bySlug } from "@/lib/queries";

export const revalidate = 600;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const a = await bySlug((await params).slug);
  if (!a?.title_en) return {};
  return {
    title: a.title_en, description: (a.body_en ?? "").slice(0, 160),
    alternates: { canonical: `/en/article/${a.slug}`, languages: { bn: `/article/${a.slug}`, en: `/en/article/${a.slug}`, "x-default": `/article/${a.slug}` } },
    openGraph: { type: "article", title: a.title_en, locale: "en_US", images: a.banner_url ? [a.banner_url] : [] },
  };
}

export default async function EnArticle({ params }: P) {
  const a = await bySlug((await params).slug);
  if (!a?.title_en) notFound();
  const links: { name: string; url: string }[] = a.source_links ?? [];
  const ld = { "@context": "https://schema.org", "@type": "NewsArticle", headline: a.title_en, datePublished: a.published_at, dateModified: a.updated_at, inLanguage: "en", image: a.banner_url ? [a.banner_url] : undefined, mainEntityOfPage: `${SITE}/en/article/${a.slug}`, author: { "@type": "Organization", name: "Niiharika Editorial" }, publisher: { "@type": "Organization", name: "Niiharika" } };
  return (
    <article lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="meta"><Link href="/en">Home</Link> › {CAT_EN[a.category]}</p>
      <h1>{a.title_en}</h1>
      <p className="meta">🤖 AI-assisted · {new Date(a.published_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })}</p>
      {a.banner_url && <img className="hero" src={a.banner_url} alt={a.title_en || ""} />}
      <div style={{ whiteSpace: "pre-wrap" }}>{a.body_en}</div>
      <h3>Source</h3>
      <ul>{links.map((l) => <li key={l.url}><a href={l.url} rel="noopener nofollow" target="_blank">{l.name}</a></li>)}</ul>
      <p><Link href={`/article/${a.slug}`}>বাংলায় পড়ুন</Link></p>
    </article>
  );
}
