import Link from "next/link";
import { latest } from "@/lib/queries";
import { SITE, CATS } from "@/lib/site";
import { Card } from "./components";
import { CatIcon } from "./icons";

export const revalidate = 600;

export default async function Home() {
  const items = await latest(60);
  const top = items.slice(0, 6);
  const ld = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "নীহারিকা", url: SITE, inLanguage: "bn", potentialAction: { "@type": "SearchAction", target: `${SITE}/search?q={q}`, "query-input": "required name=q" } },
    { "@context": "https://schema.org", "@type": "NewsMediaOrganization", name: "নীহারিকা", url: SITE, logo: `${SITE}/icon.svg` },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h1 className="sec-title">সর্বশেষ খবর</h1>
      {top.map((a) => <Card key={a.slug} a={a} />)}
      {!items.length && <p className="meta">এখনো কোনো খবর প্রকাশিত হয়নি।</p>}

      {Object.entries(CATS).map(([k, label]) => {
        const rows = items.filter((a) => a.category === k && !top.some((t) => t.slug === a.slug)).slice(0, 3);
        if (!rows.length) return null;
        return (
          <section key={k} className={`catsec c-${k}`}>
            <div className="sec-head">
              <h2 className="sec-title"><span className="sec-ico"><CatIcon cat={k} size={20} /></span>{label}</h2>
              <Link href={`/category/${k}`} className="more">আরও দেখুন →</Link>
            </div>
            {rows.map((a) => <Card key={a.slug} a={a} />)}
          </section>
        );
      })}
    </>
  );
}
