import { adminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { dt } from "@/lib/site";
import { Nav } from "../nav";

export default async function Logs() {
  const me = await requireAdmin();
  const db = adminClient();
  const [{ data: logs }, { data: failed }] = await Promise.all([
    db.from("logs").select("*").order("created_at", { ascending: false }).limit(100),
    db.from("publish_queue").select("platform,status,attempts,last_error,articles(slug)").neq("status", "done").order("created_at", { ascending: false }).limit(30),
  ]);
  return (
    <>
      <Nav email={me.email} />
      <h1>Pending / failed posts</h1>
      {(failed ?? []).map((q: any, i) => <div className="row" key={i}>{q.platform} · {q.status} · attempts {q.attempts} · {q.articles?.slug}<div className="err">{q.last_error}</div></div>)}
      {!failed?.length && <p className="meta">None</p>}
      <h1>Logs</h1>
      {(logs ?? []).map((l) => <div className="row" key={l.id}><span className={l.level === "error" ? "err" : "meta"}>[{l.level}] {l.step}</span> {l.message}<div className="meta">{dt(l.created_at)}</div></div>)}
    </>
  );
}
