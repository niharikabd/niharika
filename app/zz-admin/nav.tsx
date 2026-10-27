import { A } from "@/lib/adminpath";
import { logout } from "./actions";

export function Nav({ email }: { email: string }) {
  return (
    <div className="row">
      <a href={A()}>ড্যাশবোর্ড</a> · <a href={A("/settings")}>সেটিংস</a> · <a href={A("/admins")}>অ্যাডমিন</a> · <a href={A("/logs")}>লগ</a>
      <span className="meta"> · {email}</span>
      <form action={logout} style={{ display: "inline" }}><button className="btn gray" style={{ marginLeft: 8 }}>লগআউট</button></form>
    </div>
  );
}
