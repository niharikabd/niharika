import Link from "next/link";
import { CATS, CAT_EN, bn } from "@/lib/site";

export function Card({ a, en = false }: { a: any; en?: boolean }) {
  const href = en ? `/en/article/${a.slug}` : `/article/${a.slug}`;
  return (
    <Link href={href} className="card">
      {a.banner_url && <img src={a.banner_url} alt="" loading="lazy" width={1080} height={1080} style={{ aspectRatio: "16/9", objectFit: "cover" }} />}
      <span className="badge">{(en ? CAT_EN : CATS)[a.category] ?? a.category}</span>
      <h2>{en ? a.title_en : a.title_bn}</h2>
      <p>{a.excerpt}</p>
      <span className="meta">{bn(a.published_at)}</span>
    </Link>
  );
}
