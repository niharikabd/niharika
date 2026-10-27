import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE, CATS, bn } from "@/lib/site";
import { bySlug, related } from "@/lib/queries";
import { Card } from "../../components";

export const revalidate = 600;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const a = await bySlug((await params).slug);
  if (!a) return {};
  const title = a.title_bn || a.title_en;
  const url = `/article/${a.slug}`;
  return {
    title, description: a.excerpt ?? undefined,
    alternates: { canonical: url, languages: { bn: url, en: `/en/article/${a.slug}`, "x-default": url } },
    openGraph: { type: "article", title, description: a.excerpt ?? undefined, url, publishedTime: a.published_at, modifiedTime: a.updated_at, section: CATS[a.category], images: a.banner_url ? [{ url: a.banner_url, width: 1080, height: 1080 }] : [] },
    twitter: { card: "summary_large_image", title, description: a.excerpt ?? undefined, images: a.banner_url ? [a.banner_url] : [] },
  };
}

export default async function Article({ params }: P) {
  const a = await bySlug((await params).slug);
  if (!a) notFound();
  const rel = await related(a.category, a.slug);
  const links: { name: string; url: string }[] = a.source_links ?? [];
  const words = (a.body_bn ?? "").split(/\s+/).length;
  const ld = [
    {
      "@context": "https://schema.org", "@type": "NewsArticle",
      headline: a.title_bn || a.title_en, description: a.excerpt,
      datePublished: a.published_at, dateModified: a.updated_at,
      image: a.banner_url ? [a.banner_url] : undefined, inLanguage: "bn", articleSection: CATS[a.category], wordCount: words,
      isAccessibleForFree: true, mainEntityOfPage: `${SITE}/article/${a.slug}`,
      author: { "@type": "Organization", name: "নীহারিকা সম্পাদকীয়", url: SITE },
      publisher: { "@type": "Organization", name: "নীহারিকা", logo: { "@type": "ImageObject", url: `${SITE}/icon.svg` } },
      citation: links.map((l) => l.url),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: SITE },
        { "@type": "ListItem", position: 2, name: CATS[a.category], item: `${SITE}/category/${a.category}` },
        { "@type": "ListItem", position: 3, name: a.title_bn || a.title_en },
      ],
    },
  ];
  const share = encodeURIComponent(`${SITE}/article/${a.slug}`);
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="meta"><Link href="/">হোম</Link> › <Link href={`/category/${a.category}`}>{CATS[a.category]}</Link></p>
      <h1>{a.title_bn || a.title_en}</h1>
      <p className="meta">🤖 AI-সহায়তায় তৈরি · {bn(a.published_at)} · {Math.max(1, Math.round(words / 150))} মিনিটের পাঠ</p>
      {a.banner_url && <img src={a.banner_url} alt={a.title_bn || ""} width={1080} height={1080} style={{ aspectRatio: "16/9", objectFit: "cover", width: "100%" }} />}
      <div style={{ whiteSpace: "pre-wrap" }}>{a.body_bn}</div>
      <h3>মূল সূত্র</h3>
      <ul>{links.map((l) => <li key={l.url}><a href={l.url} rel="noopener nofollow" target="_blank">{l.name}</a></li>)}</ul>
      <p>
        <a className="btn" href={`https://www.facebook.com/sharer/sharer.php?u=${share}`} target="_blank" rel="noopener">Facebook</a>
        <a className="btn gray" href={`https://t.me/share/url?url=${share}`} target="_blank" rel="noopener">Telegram</a>
        <Link className="btn gray" href={`/en/article/${a.slug}`}>English</Link>
      </p>
      {!!rel.length && <><h3>আরও পড়ুন</h3>{rel.map((r) => <Card key={r.slug} a={r} />)}</>}
    </article>
  );
}
