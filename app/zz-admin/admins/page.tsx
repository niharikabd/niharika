import { adminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { dt } from "@/lib/site";
import { Nav } from "../nav";
import { addAdmin, removeAdmin } from "../actions";

export default async function Admins({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const { data } = await adminClient().from("admins").select("*").order("created_at");
  return (
    <>
      <Nav email={me.email} />
      <h1>Admins</h1>
      {sp.ok && <p className="meta">✅ Done</p>}
      {sp.e && <p className="err">Failed (email already used, password shorter than 10 characters, or not allowed)</p>}
      {(data ?? []).map((a) => (
        <div className="row" key={a.id}>
          <b>{a.email}</b> <span className="badge">{a.role}</span> <span className="meta">{dt(a.created_at)}</span>
          {me.role === "owner" && a.id !== me.id && (
            <form action={removeAdmin} style={{ display: "inline" }}><input type="hidden" name="id" value={a.id} /><button className="btn red">Remove</button></form>
          )}
        </div>
      ))}
      <h3>Add admin</h3>
      <form action={addAdmin}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="text" placeholder="Initial password (10+ characters)" required minLength={10} />
        <button className="btn">Add</button>
      </form>
    </>
  );
}
