import type { Metadata } from "next";
import Link from "next/link";
import { latest } from "@/lib/queries";
import { CAT_EN } from "@/lib/site";
import { Card } from "../components";
import { CatIcon } from "../icons";

export const revalidate = 600;
export const metadata: Metadata = { title: "Niiharika – Science & Technology News", description: "Science, technology, Bangladesh and world news. AI-assisted, with source links.", alternates: { canonical: "/en", languages: { bn: "/", en: "/en" } } };

export default async function EnHome() {
  const items = (await latest(60)).filter((a) => a.title_en);
  const top = items.slice(0, 6);
  return (
    <div lang="en">
      <h1 className="sec-title">Latest news</h1>
      {top.map((a) => <Card key={a.slug} a={a} en />)}
      {!items.length && <p className="meta">No stories yet.</p>}
      {Object.entries(CAT_EN).map(([k, label]) => {
        const rows = items.filter((a) => a.category === k && !top.some((t) => t.slug === a.slug)).slice(0, 3);
        if (!rows.length) return null;
        return (
          <section key={k} className={`catsec c-${k}`}>
            <div className="sec-head">
              <h2 className="sec-title"><span className="sec-ico"><CatIcon cat={k} size={20} /></span>{label}</h2>
              <Link href={`/en/category/${k}`} className="more">See all →</Link>
            </div>
            {rows.map((a) => <Card key={a.slug} a={a} en />)}
          </section>
        );
      })}
    </div>
  );
}
