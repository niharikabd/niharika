import { adminClient } from "../lib/supabase";
import { markPublished } from "../lib/publish-core";
import { getSettings } from "../lib/settings";
import { log } from "../lib/log";
import { buildBanner } from "./banner-flow";
import { postTelegram, telegramReady, alertAdmin } from "./telegram";
import { postFacebook, postInstagram, facebookReady, instagramReady } from "./meta";

const MAX_ATTEMPTS = 5;
type Style = "full" | "short";
const SENDERS: Record<string, { ready: () => boolean; send: (a: any, style: Style) => Promise<string> }> = {
  telegram: { ready: telegramReady, send: (a) => postTelegram(a) },
  facebook: { ready: facebookReady, send: postFacebook },
  instagram: { ready: instagramReady, send: postInstagram },
};

// আগে প্রকাশিত কিন্তু ব্যানারহীন লেখা (পুরনো) ঠিক করা
async function ensureBanners(db: any, mode: "open" | "all") {
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  const { data } = await db.from("articles").select("id,slug,title_bn,title_en,category,kind,banner_highlight,countries,source_links,image_prompt,source_image_url").eq("status", "published").is("banner_url", null).gte("published_at", since).limit(4);
  for (const a of data ?? []) await buildBanner(db, a, mode);
}

// প্রতি রানে সর্বোচ্চ ১টি লেখা প্রকাশ/পোস্ট হয় (পুঁজি জমে থাকলেও নয়); বাকিগুলো পরের ঘণ্টায়
export async function publishAll(): Promise<boolean> {
  const db = adminClient();
  const s = await getSettings(db);
  let changed = false;

  await ensureBanners(db, s.source_images);

  const nowIso = new Date().toISOString();
  const dueRows = async () => {
    const { data } = await db.from("publish_queue").select("*, articles(*)")
      .in("platform", Object.keys(SENDERS)).eq("status", "pending").lt("attempts", MAX_ATTEMPTS)
      .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`).order("created_at", { ascending: true }).limit(40);
    return (data ?? []).filter((q: any) => s.platforms[q.platform] && SENDERS[q.platform].ready() && q.articles?.status === "published" && q.articles?.banner_url);
  };

  // ১) আগে অসম্পন্ন social পোস্ট (সবচেয়ে পুরনো লেখাটির)
  let rows = await dueRows();

  // ২) না থাকলে সবচেয়ে পুরনো approved লেখাটি প্রকাশ করে তার social পোস্ট
  if (!rows.length) {
    const { data: next } = await db.from("articles").select("id,slug").eq("status", "approved").not("banner_url", "is", null).order("created_at", { ascending: true }).limit(1);
    const a = next?.[0];
    if (a && (await markPublished(db, a.id))) {
      changed = true;
      await log("info", "publish", `website-এ প্রকাশ: ${a.slug}`);
      rows = await dueRows();
    }
  }

  if (rows.length) {
    const articleId = rows[0].article_id;                       // শুধু একটি লেখা
    for (const q of rows.filter((r: any) => r.article_id === articleId)) {
      try {
        const id = await SENDERS[q.platform].send(q.articles, s.social_style);
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
  }
  return changed;
}
