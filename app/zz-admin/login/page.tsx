import { adminClient } from "@/lib/supabase";
import { newChallenge, captchaMode, turnstileSiteKey } from "@/lib/captcha";
import { login, setupFirst } from "../actions";

const ERR: Record<string, string> = {
  "1": "Incorrect email or password.", "2": "Wrong setup code.", "3": "Could not create the account.",
  "4": "Password must be at least 10 characters.", "5": "Too many failed attempts. Please wait 15 minutes and try again.",
  "6": "Human verification failed. Please try again.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const { count } = await adminClient().from("admins").select("id", { count: "exact", head: true });
  const first = !count;
  const turnstile = captchaMode() === "turnstile";
  const ch = turnstile ? null : newChallenge();
  return (
    <>
      <h1>{first ? "Create first admin" : "Admin sign in"}</h1>
      {e && <p className="err">{ERR[e]}</p>}
      {turnstile && <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
      <form action={first ? setupFirst : login}>
        <input name="email" type="email" placeholder="Email" required autoComplete="username" />
        <input name="password" type="password" placeholder="Password" required autoComplete={first ? "new-password" : "current-password"} />
        {first && <input name="code" type="password" placeholder="Setup code" required />}
        {turnstile ? (
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey()} data-theme="auto" />
        ) : (
          <>
            <input type="hidden" name="ct" value={ch!.token} />
            <label className="meta">Human check: what is {ch!.question}?</label>
            <input name="answer" inputMode="numeric" pattern="[0-9]*" placeholder="Answer" required autoComplete="off" />
          </>
        )}
        <button className="btn">{first ? "Create account" : "Sign in"}</button>
      </form>
    </>
  );
}
