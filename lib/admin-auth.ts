import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { adminClient } from "./supabase";
import { A } from "./adminpath";

const NAME = "nh_admin";
const DAYS = 7;
const sign = (v: string) => createHmac("sha256", process.env.SESSION_SECRET!).update(v).digest("base64url");

export async function startSession(adminId: string) {
  const payload = `${adminId}.${Date.now() + DAYS * 864e5}`;
  (await cookies()).set(NAME, `${payload}.${sign(payload)}`, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: DAYS * 86400 });
}
export async function endSession() { (await cookies()).delete(NAME); }

export async function currentAdmin() {
  if (!process.env.SESSION_SECRET) return null;
  const c = (await cookies()).get(NAME)?.value;
  if (!c) return null;
  const parts = c.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const good = sign(`${id}.${exp}`);
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Number(exp) < Date.now()) return null;
  // প্রতি রিকোয়েস্টে যাচাই: অ্যাডমিন মুছে ফেললে সঙ্গে সঙ্গে ঢোকা বন্ধ
  const { data } = await adminClient().from("admins").select("*").eq("id", id).maybeSingle();
  return data as { id: string; email: string; role: "owner" | "admin" } | null;
}

export async function requireAdmin() {
  const a = await currentAdmin();
  if (!a) redirect(A("/login"));
  return a!;
}
