import { adminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { bn } from "@/lib/site";
import { Nav } from "../nav";
import { addAdmin, removeAdmin } from "../actions";

export default async function Admins({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const { data } = await adminClient().from("admins").select("*").order("created_at");
  return (
    <>
      <Nav email={me.email} />
      <h1>অ্যাডমিন</h1>
      {sp.ok && <p className="meta">✅ হয়েছে</p>}
      {sp.e && <p className="err">ব্যর্থ (ইমেইল আগে ব্যবহৃত, পাসওয়ার্ড ৮ অক্ষরের কম, বা অনুমতি নেই)</p>}
      {(data ?? []).map((a) => (
        <div className="row" key={a.id}>
          <b>{a.email}</b> <span className="badge">{a.role}</span> <span className="meta">{bn(a.created_at)}</span>
          {me.role === "owner" && a.id !== me.id && (
            <form action={removeAdmin} style={{ display: "inline" }}><input type="hidden" name="id" value={a.id} /><button className="btn red">সরান</button></form>
          )}
        </div>
      ))}
      <h3>নতুন অ্যাডমিন যোগ</h3>
      <form action={addAdmin}>
        <input name="email" type="email" placeholder="ইমেইল" required />
        <input name="password" type="text" placeholder="শুরুর পাসওয়ার্ড (৮+ অক্ষর)" required minLength={8} />
        <button className="btn">যোগ করুন</button>
      </form>
    </>
  );
}
