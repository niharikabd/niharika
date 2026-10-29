// Human verification: Cloudflare Turnstile (কী থাকলে), নইলে নিজস্ব স্বাক্ষরিত যোগের প্রশ্ন
import { createHmac, timingSafeEqual } from "node:crypto";

export const turnstileSiteKey = () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const useTurnstile = () => !!(process.env.TURNSTILE_SECRET_KEY && turnstileSiteKey());
const sign = (v: string) => createHmac("sha256", process.env.SESSION_SECRET || "dev").update(`captcha:${v}`).digest("base64url");

export function newChallenge() {
  const a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8);
  const exp = Date.now() + 10 * 60 * 1000;
  return { question: `${a} + ${b}`, token: `${exp}.${sign(`${a + b}.${exp}`)}` };   // উত্তর টোকেনে নেই, শুধু হ্যাশ
}

export const captchaMode = () => (useTurnstile() ? "turnstile" : "math");

export async function verifyHuman(fd: FormData, ip: string): Promise<boolean> {
  if (useTurnstile()) {
    const token = String(fd.get("cf-turnstile-response") ?? "");
    if (!token) return false;
    try {
      const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip }),
      });
      return !!(await r.json()).success;
    } catch { return false; }
  }
  const token = String(fd.get("ct") ?? ""), ans = String(fd.get("answer") ?? "").trim();
  const [exp, h] = token.split(".");
  if (!exp || !h || Number(exp) < Date.now() || !/^\d+$/.test(ans)) return false;
  const good = sign(`${ans}.${exp}`);
  return h.length === good.length && timingSafeEqual(Buffer.from(h), Buffer.from(good));
}
