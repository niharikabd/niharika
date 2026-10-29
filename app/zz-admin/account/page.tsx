import { requireAdmin } from "@/lib/admin-auth";
import { Nav } from "../nav";
import { changePassword } from "../actions";

const ERR: Record<string, string> = {
  "1": "Current password is incorrect.", "2": "New passwords do not match.", "3": "New password must be at least 10 characters.",
  "4": "Could not update the password. Try again.", "5": "Too many failed attempts. Please wait 15 minutes.",
};

export default async function Account({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  return (
    <>
      <Nav email={me.email} />
      <h1>Account</h1>
      <p className="meta">Signed in as <b>{me.email}</b> ({me.role})</p>
      <h3>Change password</h3>
      {sp.ok && <p className="meta">✅ Password updated.</p>}
      {sp.e && <p className="err">{ERR[sp.e]}</p>}
      <form action={changePassword}>
        <input name="current" type="password" placeholder="Current password" required autoComplete="current-password" />
        <input name="next" type="password" placeholder="New password (10+ characters)" required minLength={10} autoComplete="new-password" />
        <input name="confirm" type="password" placeholder="Confirm new password" required minLength={10} autoComplete="new-password" />
        <button className="btn">Update password</button>
      </form>
    </>
  );
}
