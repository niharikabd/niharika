import { adminClient } from "./supabase";

export async function log(level: "info" | "warn" | "error", step: string, message: string, meta?: object) {
  console.log(`[${level}] ${step}: ${message}`);
  try { await adminClient().from("logs").insert({ level, step, message, meta: meta ?? null }); } catch { /* লগ ব্যর্থ হলে চুপ */ }
}
