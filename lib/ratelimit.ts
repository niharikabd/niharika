// লগইন rate limit: ১৫ মিনিটে একই ইমেইলে ৫ বার বা একই IP-তে ৮ বার ব্যর্থ হলে লক
import { headers } from "next/headers";
import { adminClient } from "./supabase";

const WINDOW = 15 * 60 * 1000;

export async function ipOf() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

export async function isLocked(ip: string, email: string) {
  const db = adminClient();
  const since = new Date(Date.now() - WINDOW).toISOString();
  const [a, b] = await Promise.all([
    db.from("login_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since),
    email ? db.from("login_attempts").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since) : Promise.resolve({ count: 0 }),
  ]);
  return (a.count ?? 0) >= 8 || (b.count ?? 0) >= 5;
}

export async function recordFail(ip: string, email: string) {
  const db = adminClient();
  await db.from("login_attempts").insert({ ip, email: email || null });
  await db.from("login_attempts").delete().lt("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
}

export async function clearFails(email: string) {
  await adminClient().from("login_attempts").delete().eq("email", email);
}
