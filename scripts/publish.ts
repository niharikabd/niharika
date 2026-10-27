import { adminClient } from "../lib/supabase";
import { markPublished } from "../lib/publish-core";
import { getSettings } from "../lib/settings";
import { log } from "../lib/log";
import { CATS } from "../lib/site";
import { makeBanner } from "./banner";
import { postTelegram, telegramReady, alertAdmin } from "./telegram";
import { postFacebook, postInstagram, facebookReady, instagramReady } from "./meta";

const MAX_ATTEMPTS = 5;
const SENDERS: Record<string, { ready: () => boolean; send: (a: any) => Promise<string> }> = {
  telegram: { ready: telegramReady, send: postTelegram },
  facebook: { ready: facebookReady, send: postFacebook },
  instagram: { ready: instagramReady, send: postInstagram },
};

async function ensureBanners(db: any) {
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  const { data } = await db.from("articles").select("id,slug,title_bn,category").eq("status", "published").is("banner_url", null).gte("published_at", since).limit(10);
  for (const a of data ?? []) {
    try {
      const buf = await makeBanner(a.title_bn, CATS[a.category] ?? "");
      const path = `${a.slug}.jpg`;
      const up = await db.storage.from("banners").upload(path, buf, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
      if (up.error) throw new Error(up.error.message);
      const { data: pub } = db.storage.from("banners").getPublicUrl(path);
      await db.from("articles").update({ banner_url: pub.publicUrl }).eq("id", a.id);
      await log("info", "banner", `ব্যানার তৈরি: ${a.slug}`);
    } catch (e) {
      await log("error", "banner", (e as Error).message, { slug: a.slug });
    }
  }
}

export async function publishAll(): Promise<boolean> {
  const db = adminClient();
  let changed = false;

  // ১) approved → website-এ published
  const { data: approved } = await db.from("articles").select("id,slug").eq("status", "approved");
  for (const a of approved ?? []) { await markPublished(db, a.id); changed = true; await log("info", "publish", `website-এ প্রকাশ: ${a.slug}`); }

  // ২) ব্যানার
  await ensureBanners(db);

  // ৩) social queue (প্রতিটি platform আলাদা retry)
  const s = await getSettings(db);
  const { data: queue } = await db.from("publish_queue").select("*, articles(*)")
    .in("platform", Object.keys(SENDERS)).eq("status", "pending").lt("attempts", MAX_ATTEMPTS)
    .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: true }).limit(30);

  for (const q of queue ?? []) {
    const sender = SENDERS[q.platform];
    if (!s.platforms[q.platform]) continue;                         // সেটিংসে বন্ধ
    if (!sender.ready()) { await log("warn", q.platform, "credentials বসানো হয়নি, বাদ দেওয়া হলো"); continue; }
    if (q.articles.status !== "published") continue;
    if (q.platform === "instagram" && !q.articles.banner_url) continue; // ব্যানার তৈরির অপেক্ষা
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
