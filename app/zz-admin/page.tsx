import { adminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { A } from "@/lib/adminpath";
import { CATS, bn } from "@/lib/site";
import { Nav } from "./nav";
import { articleOp } from "./actions";

const TABS: [string, string][] = [["draft", "Draft"], ["approved", "Approved"], ["published", "Published"], ["rejected", "Rejected"]];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const me = await requireAdmin();
  const sParam = (await searchParams).s ?? "draft";
  const status = TABS.some(([k]) => k === sParam) ? sParam : "draft";
  const db = adminClient();
  const counts = await Promise.all(TABS.map(async ([k]) => [k, (await db.from("articles").select("id", { count: "exact", head: true }).eq("status", k)).count ?? 0] as const));
  const { data } = await db.from("articles").select("id,title_bn,title_en,category,verification_score,created_at,status,source_links").eq("status", status).order("created_at", { ascending: false }).limit(50);
  const back = A(`?s=${status}`);

  return (
    <>
      <Nav email={me.email} />
      <p className="tabs">{TABS.map(([k, l]) => <a key={k} href={A(`?s=${k}`)} className={k === status ? "on" : ""}>{l} ({counts.find(([c]) => c === k)?.[1]})</a>)}</p>
      {(data ?? []).map((a) => (
        <div className="row" key={a.id}>
          <b>{a.title_bn || a.title_en}</b>
          <div className="meta">{CATS[a.category]} · স্কোর {a.verification_score ?? "-"} · {bn(a.created_at)} · সূত্র: {(a.source_links as any[])?.[0]?.name}</div>
          <a className="btn gray" href={A(`/articles/${a.id}`)}>দেখুন / সম্পাদনা</a>
          {["draft", "rejected", "approved"].includes(a.status) && (
            <form action={articleOp} style={{ display: "inline" }}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={back} /><button className="btn green" name="op" value="approve">অনুমোদন ও প্রকাশ</button></form>
          )}
          {a.status === "draft" && (
            <form action={articleOp} style={{ display: "inline" }}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={back} /><button className="btn red" name="op" value="reject">বাতিল</button></form>
          )}
          {a.status === "published" && (
            <form action={articleOp} style={{ display: "inline" }}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={back} /><button className="btn red" name="op" value="draft">প্রকাশ বন্ধ</button></form>
          )}
        </div>
      ))}
      {!data?.length && <p className="meta">কিছু নেই।</p>}
    </>
  );
}
