import { adminClient } from "../lib/supabase";
import { markPublished } from "../lib/publish-core";
import { getSettings } from "../lib/settings";
import { log } from "../lib/log";
import { buildBanner } from "./banner-flow";
import { postTelegram, telegramReady, alertAdmin } from "./telegram";
import { postFacebook, postInstagram, facebookReady, instagramReady } from "./meta";

const MAX_ATTEMPTS = 5;
const SENDERS: Record<string, { ready: () => boolean; send: (a: any) => Promise<string> }> = {
  telegram: { ready: telegramReady, send: postTelegram },
  facebook: { ready: facebookReady, send: postFacebook },
  instagram: { ready: instagramReady, send: postInstagram },
};

// আগে প্রকাশিত কিন্তু ব্যানারহীন লেখা (পুরনো) ঠিক করা
async function ensureBanners(db: any, mode: "open" | "all") {
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  const { data } = await db.from("articles").select("id,slug,title_bn,title_en,category,source_links,image_prompt,source_image_url").eq("status", "published").is("banner_url", null).gte("published_at", since).limit(4);
  for (const a of data ?? []) await buildBanner(db, a, mode);
}

export async function publishAll(): Promise<boolean> {
  const db = adminClient();
  let changed = false;

  // ১) approved → website-এ published
  // (ছবি/ব্যানার না থাকলে প্রকাশ হয় না; ব্যানার আগেই পাইপলাইনে তৈরি হয়)
  const s = await getSettings(db);
  const { data: approved } = await db.from("articles").select("id,slug").eq("status", "approved").not("banner_url", "is", null);
  for (const a of approved ?? []) { if (await markPublished(db, a.id)) { changed = true; await log("info", "publish", `website-এ প্রকাশ: ${a.slug}`); } }

  // ২) পুরনো ব্যানারহীন প্রকাশিত লেখা
  await ensureBanners(db, s.source_images);

  // ৩) social queue (প্রতিটি platform আলাদা retry)
  const { data: queue } = await db.from("publish_queue").select("*, articles(*)")
    .in("platform", Object.keys(SENDERS)).eq("status", "pending").lt("attempts", MAX_ATTEMPTS)
    .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: true }).limit(30);

  for (const q of queue ?? []) {
    const sender = SENDERS[q.platform];
    if (!s.platforms[q.platform]) continue;                         // সেটিংসে বন্ধ
    if (!sender.ready()) { await log("warn", q.platform, "credentials বসানো হয়নি, বাদ দেওয়া হলো"); continue; }
    if (q.articles.status !== "published") continue;
    if (!q.articles.banner_url) continue;                           // ছবি ছাড়া কোনো পোস্ট নয়
    try {
      const id = await sender.send(q.articles);
      await db.from("publish_queue").update({ status: "done", external_id: id, attempts: q.attempts + 1, last_error: null }).eq("id", q.id);
      await log("info", q.platform, `পোস্ট হয়েছে: ${q.articles.slug}`);
    } catch (e) {
      const attempts = q.attempts + 1;
      const waitMin = Math.min(2 ** attempts * 10, 240);
      await db.from("publish_queue").update({
        attempts, last_error: (e as Error).message, status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
        next_retry_at: new Date(Date.now() + waitMin * 60000).toISOString(),
      }).eq("id", q.id);
      await log("error", q.platform, (e as Error).message, { queue: q.id, attempts });
      if (attempts >= MAX_ATTEMPTS) await alertAdmin(`❌ নীহারিকা: ${q.platform} পোস্ট ${MAX_ATTEMPTS} বার ব্যর্থ (${q.articles.slug})`);
    }
  }
  return changed;
}
