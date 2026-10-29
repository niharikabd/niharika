import { getSettings, PLATFORMS } from "./settings";

// লেখা website-এ প্রকাশ করে এবং সক্রিয় social platform-এর জন্য queue সারি বানায়।
// ছবি (banner_url) না থাকলে কিছুই প্রকাশ হয় না এবং false ফেরত দেয়।
export async function markPublished(db: any, articleId: string): Promise<boolean> {
  const { data: a } = await db.from("articles").select("banner_url").eq("id", articleId).maybeSingle();
  if (!a?.banner_url) return false;
  const s = await getSettings(db);
  await db.from("articles").update({ status: "published", published_at: new Date().toISOString() }).eq("id", articleId);
  const rows = [
    { article_id: articleId, platform: "website", status: "done" },
    ...PLATFORMS.filter((p) => s.platforms[p]).map((p) => ({ article_id: articleId, platform: p, status: "pending" })),
  ];
  await db.from("publish_queue").upsert(rows, { onConflict: "article_id,platform", ignoreDuplicates: true });
  return true;
}
