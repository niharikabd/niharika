import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { A } from "@/lib/adminpath";
import { CATS } from "@/lib/site";
import { Nav } from "../../nav";
import { saveArticle, articleOp } from "../../actions";

export default async function Edit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const { data: a } = await adminClient().from("articles").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();
  const links: { name: string; url: string }[] = a.source_links ?? [];
  return (
    <>
      <Nav email={me.email} />
      {(await searchParams).ok && <p className="meta">✅ সেভ হয়েছে</p>}
      <p className="meta">অবস্থা: <b>{a.status}</b> · স্কোর {a.verification_score} · সূত্র: {links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.name}</a>)}</p>
      <form action={saveArticle}>
        <input type="hidden" name="id" value={a.id} />
        <label>বিভাগ</label>
        <select name="category" defaultValue={a.category}>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label>শিরোনাম (বাংলা)</label><input name="title_bn" defaultValue={a.title_bn ?? ""} />
        <label>সারকথা</label><input name="excerpt" defaultValue={a.excerpt ?? ""} />
        <label>বিস্তারিত (বাংলা)</label><textarea name="body_bn" defaultValue={a.body_bn ?? ""} />
        <label>Title (English)</label><input name="title_en" defaultValue={a.title_en ?? ""} />
        <label>Body (English)</label><textarea name="body_en" defaultValue={a.body_en ?? ""} />
        <button className="btn">সেভ</button>
      </form>
      <div className="row">
        {a.status !== "published" && (
          <form action={articleOp}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={A()} /><input type="hidden" name="op" value="approve" /><button className="btn green">অনুমোদন ও প্রকাশ</button></form>
        )}
        {a.status === "draft" && (
          <form action={articleOp}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={A()} /><input type="hidden" name="op" value="reject" /><button className="btn red">বাতিল</button></form>
        )}
        {a.status === "published" && (
          <form action={articleOp}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="back" value={A()} /><input type="hidden" name="op" value="draft" /><button className="btn red">প্রকাশ বন্ধ</button></form>
        )}
      </div>
    </>
  );
}
