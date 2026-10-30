import Link from "next/link";
import { CATS, CAT_EN, bn } from "@/lib/site";
import { CatIcon } from "./icons";

export function Card({ a, en = false }: { a: any; en?: boolean }) {
  const href = en ? `/en/article/${a.slug}` : `/article/${a.slug}`;
  return (
    <Link href={href} className="card item">
      {a.banner_url && <img className="thumb" src={a.banner_url} alt="" loading="lazy" />}
      <div className="info">
        <span className={`badge c-${a.category}`}><CatIcon cat={a.category} size={13} />{(en ? CAT_EN : CATS)[a.category] ?? a.category}</span>
        <h2>{en ? a.title_en : a.title_bn}</h2>
        <p>{en ? (a.body_en ? String(a.body_en).slice(0, 150) + "…" : "") : a.excerpt}</p>
        <span className="meta">{en ? new Date(a.published_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }) : bn(a.published_at)}</span>
      </div>
    </Link>
  );
}
