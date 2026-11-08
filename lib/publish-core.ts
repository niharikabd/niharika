import { getSettings, PLATFORMS } from "./settings";

// লেখা website-এ প্রকাশ করে এবং সক্রিয় social platform-এর জন্য queue সারি বানায়।
// ছবি (banner_url) না থাকলে কিছুই প্রকাশ হয় না এবং false ফেরত দেয়।
export async function markPublished(db: any, articleId: string): Promise<boolean> {
  const { data: a } = await db.from("articles").select("banner_url").eq("id", articleId).maybeSingle();
  if (!a?.banner_url) return false;
  const s = await getSettings(db);
  await db.from("articles").update({ status: "published", published_at: new Date().toISOString() }).eq("id", articleId);
  let platforms: string[] = PLATFORMS.filter((p) => s.platforms[p]);
  // Instagram স্প্যাম-সুরক্ষা এড়াতে: দিনে সর্বোচ্চ N টি, সমান ব্যবধানে (24ঘণ্টা ÷ N)
  if (platforms.includes("instagram")) {
    const cap = s.instagram_per_day;
    const gapMs = cap > 0 ? (24 / cap) * 3600e3 : Infinity;
    const { data: last } = await db.from("publish_queue").select("created_at").eq("platform", "instagram").order("created_at", { ascending: false }).limit(1);
    const tooSoon = !!last?.[0] && Date.now() - +new Date(last[0].created_at) < gapMs - 10 * 60e3;
    if (cap <= 0 || tooSoon) platforms = platforms.filter((p) => p !== "instagram");
  }
  const rows = [
    { article_id: articleId, platform: "website", status: "done" },
    ...platforms.map((p) => ({ article_id: articleId, platform: p, status: "pending" })),
  ];
  await db.from("publish_queue").upsert(rows, { onConflict: "article_id,platform", ignoreDuplicates: true });
  return true;
}
