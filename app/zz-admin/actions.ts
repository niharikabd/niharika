"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminClient, publicClient } from "@/lib/supabase";
import { startSession, endSession, requireAdmin } from "@/lib/admin-auth";
import { A } from "@/lib/adminpath";
import { markPublished } from "@/lib/publish-core";
import { saveSettings, PLATFORMS, CATEGORIES } from "@/lib/settings";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const refresh = () => revalidatePath("/", "layout");

export async function login(fd: FormData) {
  const { data, error } = await publicClient().auth.signInWithPassword({ email: s(fd, "email").toLowerCase(), password: s(fd, "password") });
  if (error || !data.user) redirect(A("/login?e=1"));
  const { data: adm } = await adminClient().from("admins").select("id").eq("id", data.user!.id).maybeSingle();
  if (!adm) redirect(A("/login?e=1"));
  await startSession(data.user!.id);
  redirect(A());
}

export async function setupFirst(fd: FormData) {
  const db = adminClient();
  const { count } = await db.from("admins").select("id", { count: "exact", head: true });
  if (count) redirect(A("/login"));
  if (!process.env.ADMIN_SETUP_CODE || s(fd, "code") !== process.env.ADMIN_SETUP_CODE) redirect(A("/login?e=2"));
  const email = s(fd, "email").toLowerCase(), password = s(fd, "password");
  if (password.length < 8) redirect(A("/login?e=4"));
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) redirect(A("/login?e=3"));
  await db.from("admins").insert({ id: data.user!.id, email, role: "owner" });
  await startSession(data.user!.id);
  redirect(A());
}

export async function logout() { await endSession(); redirect(A("/login")); }

export async function addAdmin(fd: FormData) {
  const me = await requireAdmin();
  const email = s(fd, "email").toLowerCase(), password = s(fd, "password");
  if (!email.includes("@") || password.length < 8) redirect(A("/admins?e=1"));
  const db = adminClient();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) redirect(A("/admins?e=2"));
  await db.from("admins").insert({ id: data.user!.id, email, role: "admin", added_by: me.id });
  redirect(A("/admins?ok=1"));
}

export async function removeAdmin(fd: FormData) {
  const me = await requireAdmin();
  const id = s(fd, "id");
  if (me.role !== "owner" || id === me.id) redirect(A("/admins?e=3"));
  const db = adminClient();
  await db.from("admins").delete().eq("id", id);
  await db.auth.admin.deleteUser(id);
  redirect(A("/admins?ok=1"));
}

export async function articleOp(fd: FormData) {
  await requireAdmin();
  const db = adminClient();
  const id = s(fd, "id"), op = s(fd, "op"), back = s(fd, "back") || A();
  if (op === "approve") await markPublished(db, id);
  else if (op === "reject") await db.from("articles").update({ status: "rejected", published_at: null }).eq("id", id);
  else if (op === "draft") await db.from("articles").update({ status: "draft", published_at: null }).eq("id", id);
  refresh();
  redirect(back);
}

export async function saveArticle(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  await adminClient().from("articles").update({
    title_bn: s(fd, "title_bn"), title_en: s(fd, "title_en"), body_bn: String(fd.get("body_bn") ?? ""), body_en: String(fd.get("body_en") ?? ""),
    excerpt: s(fd, "excerpt"), category: s(fd, "category"),
  }).eq("id", id);
  refresh();
  redirect(A(`/articles/${id}?ok=1`));
}

export async function saveSettingsAction(fd: FormData) {
  await requireAdmin();
  await saveSettings(adminClient(), {
    posts_per_day: Math.min(48, Math.max(1, parseInt(s(fd, "posts_per_day")) || 6)),
    approval_mode: s(fd, "approval_mode") === "auto" ? "auto" : "manual",
    platforms: Object.fromEntries(PLATFORMS.map((p) => [p, fd.get(`p_${p}`) === "on"])),
    categories: Object.fromEntries(CATEGORIES.map((c) => [c, fd.get(`c_${c}`) === "on"])),
  });
  redirect(A("/settings?ok=1"));
}
