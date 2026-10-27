import { publicClient } from "./supabase";

const FIELDS = "slug,title_bn,title_en,excerpt,category,published_at,banner_url";

export async function latest(limit = 30, category?: string) {
  let q = publicClient().from("articles").select(FIELDS).eq("status", "published").order("published_at", { ascending: false }).limit(limit);
  if (category) q = q.eq("category", category);
  return (await q).data ?? [];
}
export async function bySlug(slug: string) {
  return (await publicClient().from("articles").select("*").eq("slug", slug).eq("status", "published").maybeSingle()).data;
}
export async function related(category: string, slug: string) {
  return (await publicClient().from("articles").select(FIELDS).eq("status", "published").eq("category", category).neq("slug", slug).order("published_at", { ascending: false }).limit(4)).data ?? [];
}
