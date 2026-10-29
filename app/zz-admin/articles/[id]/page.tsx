import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { A } from "@/lib/adminpath";
import { CAT_EN } from "@/lib/site";
import { Nav } from "../../nav";
import { saveArticle, articleOp } from "../../actions";

export default async function Edit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; e?: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const { data: a } = await adminClient().from("articles").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();
  const links: { name: string; url: string }[] = a.source_links ?? [];
  const op = (name: string, label: string, cls: string) => (
    <form action={articleOp}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={A()} /><input type="hidden" name="op" value={name} /><button className={`btn ${cls}`}>{label}</button></form>
  );
  return (
    <>
      <Nav email={me.email} />
      {sp.ok && <p className="meta">✅ Saved</p>}
      {sp.e === "noimage" && <p className="err">No image yet, so it cannot be published. It will be generated automatically.</p>}
      <p className="meta">Status: <b>{a.status}</b> · score {a.verification_score} · source: {links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.name}</a>)}</p>
      {a.banner_url ? <p><img src={a.banner_url} alt="" style={{ maxWidth: 240, borderRadius: 8 }} /><br /><span className="meta">{a.image_credit}</span></p> : <p className="err">No image yet (it will be retried automatically)</p>}
      <form action={saveArticle}>
        <input type="hidden" name="id" value={a.id} />
        <label>Category</label>
        <select name="category" defaultValue={a.category}>{Object.entries(CAT_EN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label>Title (Bangla)</label><input name="title_bn" defaultValue={a.title_bn ?? ""} />
        <label>Excerpt</label><input name="excerpt" defaultValue={a.excerpt ?? ""} />
        <label>Body (Bangla)</label><textarea name="body_bn" defaultValue={a.body_bn ?? ""} />
        <label>Social caption (Facebook / Instagram / Telegram)</label><textarea name="social_caption" style={{ minHeight: 120 }} defaultValue={a.social_caption ?? ""} />
        <label>Title (English)</label><input name="title_en" defaultValue={a.title_en ?? ""} />
        <label>Body (English)</label><textarea name="body_en" defaultValue={a.body_en ?? ""} />
        <button className="btn">Save</button>
      </form>
      <div className="row">
        {a.status !== "published" && a.banner_url && op("approve", "Approve & publish", "green")}
        {a.status === "draft" && op("reject", "Reject", "red")}
        {a.status === "published" && op("draft", "Unpublish", "red")}
      </div>
    </>
  );
}
