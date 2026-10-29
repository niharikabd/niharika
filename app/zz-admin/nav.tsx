import { A } from "@/lib/adminpath";
import { logout } from "./actions";

export function Nav({ email }: { email: string }) {
  return (
    <div className="row">
      <a href={A()}>Dashboard</a> · <a href={A("/settings")}>Settings</a> · <a href={A("/admins")}>Admins</a> · <a href={A("/account")}>Account</a> · <a href={A("/logs")}>Logs</a>
      <span className="meta"> · {email}</span>
      <form action={logout} style={{ display: "inline" }}><button className="btn gray" style={{ marginLeft: 8 }}>Sign out</button></form>
    </div>
  );
}
