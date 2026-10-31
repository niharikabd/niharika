import { adminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { A } from "@/lib/adminpath";
import { CAT_EN, dt } from "@/lib/site";
import { Nav } from "./nav";
import { articleOp } from "./actions";

const TABS: [string, string][] = [["draft", "Draft"], ["approved", "Approved"], ["published", "Published"], ["rejected", "Rejected"]];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ s?: string; e?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const status = TABS.some(([k]) => k === sp.s) ? sp.s! : "draft";
  const db = adminClient();
  const counts = await Promise.all(TABS.map(async ([k]) => [k, (await db.from("articles").select("id", { count: "exact", head: true }).eq("status", k)).count ?? 0] as const));
  const { data } = await db.from("articles").select("id,title_bn,title_en,category,kind,verification_score,created_at,status,source_links,banner_url,image_credit").eq("status", status).order("created_at", { ascending: false }).limit(50);
  const back = A(`?s=${status}`);

  return (
    <>
      <Nav email={me.email} />
      <p className="tabs">{TABS.map(([k, l]) => <a key={k} href={A(`?s=${k}`)} className={k === status ? "on" : ""}>{l} ({counts.find(([c]) => c === k)?.[1]})</a>)}</p>
      {sp.e === "noimage" && <p className="err">This article has no image yet, so it cannot be published. An image is generated automatically; try again after the next pipeline run.</p>}
      {(data ?? []).map((a) => (
        <div className="row" key={a.id} style={{ display: "flex", gap: 12 }}>
          {a.banner_url ? <img src={a.banner_url} alt="" width={64} height={80} style={{ objectFit: "cover", borderRadius: 6, flex: "none" }} /> : <div className="badge" style={{ alignSelf: "flex-start" }}>No image</div>}
          <div style={{ minWidth: 0 }}>
            <b>{a.title_bn || a.title_en}</b>
            <div className="meta">{a.kind && a.kind !== "news" ? `educational (${a.kind})` : CAT_EN[a.category]} · score {a.verification_score ?? "-"} · {dt(a.created_at)} · source: {(a.source_links as any[])?.[0]?.name}{a.image_credit ? ` · ${a.image_credit}` : ""}</div>
            <a className="btn gray" href={A(`/articles/${a.id}`)}>View / edit</a>
            {["draft", "rejected", "approved"].includes(a.status) && a.banner_url && (
              <form action={articleOp} style={{ display: "inline" }}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={back} /><input type="hidden" name="op" value="approve" /><button className="btn green">Approve &amp; publish</button></form>
            )}
            {["draft", "rejected", "approved"].includes(a.status) && !a.banner_url && <span className="meta"> Waiting for image…</span>}
            {a.status === "draft" && (
              <form action={articleOp} style={{ display: "inline" }}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={back} /><input type="hidden" name="op" value="reject" /><button className="btn red">Reject</button></form>
            )}
            {a.status === "published" && (
              <form action={articleOp} style={{ display: "inline" }}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={back} /><input type="hidden" name="op" value="draft" /><button className="btn red">Unpublish</button></form>
            )}
          </div>
        </div>
      ))}
      {!data?.length && <p className="meta">Nothing here.</p>}
    </>
  );
}
