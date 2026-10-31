// একটি লেখার ব্যানার বানিয়ে Storage-এ রাখে ও articles-এ লিংক বসায়। ছবি না পেলে false (লেখা প্রকাশ/পোস্ট হবে না)
import { makeBanner } from "./banner";
import { getBackground } from "./image";
import { log } from "../lib/log";
import { CATS, KIND_BN } from "../lib/site";

export async function buildBanner(db: any, a: any, mode: "open" | "all"): Promise<boolean> {
  try {
    const bg = await getBackground(a, mode);
    if (!bg) { await log("warn", "banner", `ছবি পাওয়া যায়নি (পরে আবার চেষ্টা হবে): ${a.slug}`); return false; }
    const edu = a.kind && a.kind !== "news";
    const buf = await makeBanner({
      title: a.title_bn, categoryLabel: edu ? (KIND_BN[a.kind] ?? "") : (CATS[a.category] ?? ""),
      source: edu ? "" : (a.source_links?.[0]?.name ?? ""), bg: bg.buf, credit: bg.credit, highlight: a.banner_highlight, big: !!edu,
    });
    const path = `${a.slug}.jpg`;
    const up = await db.storage.from("banners").upload(path, buf, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
    if (up.error) throw new Error(up.error.message);
    const { data: pub } = db.storage.from("banners").getPublicUrl(path);
    await db.from("articles").update({ banner_url: `${pub.publicUrl}?v=${Date.now()}`, image_credit: bg.credit }).eq("id", a.id);
    await log("info", "banner", `ব্যানার তৈরি (${bg.credit}): ${a.slug}`);
    return true;
  } catch (e) {
    await log("error", "banner", (e as Error).message, { slug: a.slug });
    return false;
  }
}
