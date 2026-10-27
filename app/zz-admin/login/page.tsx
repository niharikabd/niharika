import { adminClient } from "@/lib/supabase";
import { login, setupFirst } from "../actions";

const ERR: Record<string, string> = { "1": "ইমেইল বা পাসওয়ার্ড ভুল", "2": "সেটআপ কোড ভুল", "3": "অ্যাকাউন্ট তৈরি হয়নি", "4": "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে" };

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const { count } = await adminClient().from("admins").select("id", { count: "exact", head: true });
  const first = !count;
  return (
    <>
      <h1>{first ? "প্রথম অ্যাডমিন তৈরি" : "লগইন"}</h1>
      {e && <p className="err">{ERR[e]}</p>}
      <form action={first ? setupFirst : login}>
        <input name="email" type="email" placeholder="ইমেইল" required autoComplete="username" />
        <input name="password" type="password" placeholder="পাসওয়ার্ড" required autoComplete={first ? "new-password" : "current-password"} />
        {first && <input name="code" type="password" placeholder="সেটআপ কোড (ADMIN_SETUP_CODE)" required />}
        <button className="btn">{first ? "তৈরি করুন" : "ঢুকুন"}</button>
      </form>
    </>
  );
}
