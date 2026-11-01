// প্রতি ঘণ্টায়: সংগ্রহ → (দিনের কোটা অনুযায়ী) লেখা → প্রকাশ + social → cache refresh
import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { adminClient } from "../lib/supabase";
import { getSettings, type Settings } from "../lib/settings";
import { log } from "../lib/log";
import { generate, hasAI, curate, generateEvergreen, EVERGREEN_KINDS, EVERGREEN_AREAS } from "./ai";
import { alertAdmin } from "./telegram";
import { publishAll } from "./publish";
import { buildBanner } from "./banner-flow";
import { CATS } from "../lib/site";

const db = adminClient();
const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; NiiharikaBot/1.0; +https://niiharika.vercel.app)", Accept: "application/rss+xml, application/xml, text/xml, */*" },
  customFields: { item: [["media:content", "mediaContent", { keepArray: true }], ["media:thumbnail", "mediaThumb"], ["content:encoded", "contentEncoded"]] },
});

// RSS আইটেম থেকে ছবির ঠিকানা (enclosure, media:content, thumbnail, বা লেখার ভেতরের প্রথম <img>)
function feedImage(it: any): string | null {
  const enc = it.enclosure;
  if (enc?.url && (!enc.type || String(enc.type).startsWith("image"))) return enc.url;
  const mc = Array.isArray(it.mediaContent) ? it.mediaContent : [];
  const best = mc.map((m: any) => m?.$ ?? {}).filter((m: any) => m.url && (!m.medium || m.medium === "image") && (!m.type || String(m.type).startsWith("image")))
    .sort((a: any, b: any) => Number(b.width ?? 0) - Number(a.width ?? 0))[0];
  if (best?.url) return best.url;
  if (it.mediaThumb?.$?.url) return it.mediaThumb.$.url;
  const html = String(it.contentEncoded || it.content || "");
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
const BDT = 6 * 3600 * 1000;
const SENSITIVE = /politic|election|minister|parliament|murder|crime|arrest|police|health|disease|vaccine|cancer|virus|outbreak|রাজনীতি|নির্বাচন|হত্যা|গ্রেপ্তার/i;

async function collect() {
  const { data: sources } = await db.from("sources").select("*").eq("active", true);
  let added = 0;
  for (const s of sources ?? []) {
    try {
      const feed = await parser.parseURL(s.url);
      for (const it of feed.items.slice(0, 12)) {
        if (!it.link || !it.title) continue;
        const url_hash = createHash("sha256").update(it.link).digest("hex");
        const { data: seen } = await db.from("raw_items").select("id").eq("url_hash", url_hash).maybeSingle();
        if (seen) continue;
        const { data: dup } = await db.rpc("title_is_duplicate", { t: it.title });
        const { error } = await db.from("raw_items").insert({
          source_id: s.id, url: it.link, url_hash, title: it.title,
          summary: (it.contentSnippet || it.content || "").slice(0, 1500),
          published_at: it.isoDate ?? null, status: dup ? "duplicate" : "new", image_url: feedImage(it),
        });
        if (!error && !dup) added++;
      }
    } catch (e) {
      await log("warn", "collect", `${s.name} ব্যর্থ`, { error: (e as Error).message });
    }
  }
  await log("info", "collect", `নতুন আইটেম: ${added}`);
}

// আজকের (বাংলাদেশ সময়) মধ্যে এখন পর্যন্ত কয়টি লেখা বাকি
async function remainingQuota(perDay: number) {
  const bdt = new Date(Date.now() + BDT);
  const hoursElapsed = bdt.getUTCHours() + 1;
  bdt.setUTCHours(0, 0, 0, 0);
  const dayStart = new Date(bdt.getTime() - BDT).toISOString();
  const { count } = await db.from("articles").select("id", { count: "exact", head: true }).eq("kind", "news").gte("created_at", dayStart).neq("status", "rejected");
  const target = Math.ceil((perDay * hoursElapsed) / 24);
  return Math.min(Math.max(target - (count ?? 0), 0), 3);
}

const slugify = (t: string) => `${t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "news"}-${Math.random().toString(36).slice(2, 7)}`;

// ক্যাটাগরির লক্ষ্য অনুপাত: বিজ্ঞান বেশি (মূল ফোকাস), বাকিগুলো কম
const WEIGHT: Record<string, number> = { science: 0.4, tech: 0.25, bangladesh: 0.2, world: 0.15 };

function dayStartISO() {
  const bdt = new Date(Date.now() + BDT);
  bdt.setUTCHours(0, 0, 0, 0);
  return new Date(bdt.getTime() - BDT).toISOString();
}

// আজ কোন ক্যাটাগরির কয়টি লেখা হয়েছে দেখে সবচেয়ে "পিছিয়ে" থাকা ক্যাটাগরি থেকে খবর বাছা।
// AI সম্পাদক বিভাগের শর্ত (যেমন "বাংলাদেশ" মানে সত্যিই বাংলাদেশের খবর, খেলা/বিনোদন বাদ) মিলিয়ে বাছে; কোনোটি উপযুক্ত না হলে পরের বিভাগে যায়।
async function pickCandidate(ok: any[]) {
  const { data: today } = await db.from("articles").select("category").eq("kind", "news").gte("created_at", dayStartISO()).neq("status", "rejected");
  const counts: Record<string, number> = {};
  for (const r of today ?? []) counts[r.category] = (counts[r.category] ?? 0) + 1;
  const total = (today ?? []).length;
  const cats = [...new Set(ok.map((i) => i.sources.category as string))];
  cats.sort((a, b) => ((WEIGHT[b] ?? 0.1) * (total + 1) - (counts[b] ?? 0)) - ((WEIGHT[a] ?? 0.1) * (total + 1) - (counts[a] ?? 0)));
  for (const cat of cats) {
    const pool = ok.filter((i) => i.sources.category === cat);
    pool.sort((a, b) => b.sources.trust_level - a.sources.trust_level || +new Date(b.published_at ?? 0) - +new Date(a.published_at ?? 0));
    const top10 = pool.slice(0, 10);
    if (top10.length > 1 && hasAI()) {
      try {
        const cand = await Promise.all(top10.map(async (i) => ({ i, n: Number((await db.rpc("corroboration_count", { t: i.title, src: i.source_id })).data ?? 0) })));
        const r = await curate(cand.map(({ i, n }) => ({ title: i.title, summary: i.summary ?? "", source: i.sources.name, others: n })), CATS[cat] ?? cat);
        if (r.index >= 0) {
          await log("info", "curate", `বাছাই (${cat}): ${top10[r.index].title.slice(0, 90)} — ${r.reason}`);
          return top10[r.index];
        }
        await log("info", "curate", `${cat}: উপযুক্ত খবর নেই (${r.reason.slice(0, 120)}), পরের বিভাগে`);
        continue;
      } catch (e) { await log("warn", "curate", `AI বাছাই ব্যর্থ, সাধারণ নিয়মে: ${(e as Error).message.slice(0, 160)}`); }
    }
    const top = top10.slice(0, 3);
    return top[Math.floor(Math.random() * top.length)];
  }
  return null;
}

// স্বয়ংক্রিয় অনুমোদনের শর্ত: ultra = সব খবর (রাজনীতি/অপরাধ/স্বাস্থ্যসহ), auto = নির্ভরযোগ্য ও অসংবেদনশীল, manual = কখনো নয়
function isEligible(s: Settings, sensitive: boolean, score: number) {
  if (s.approval_mode === "ultra") return true;
  return s.approval_mode === "auto" && !sensitive && score >= 75;
}

async function writeOne(s: Settings) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const since = new Date(Date.now() - 3 * 864e5).toISOString();
    const { data: items } = await db.from("raw_items").select("*, sources(name, category, trust_level)").eq("status", "new").gte("created_at", since).limit(300);
    const ok = (items ?? []).filter((i: any) => i.sources && s.categories[i.sources.category]);
    const pick: any = ok.length ? await pickCandidate(ok) : null;
    if (!pick) return log("info", "write", "লেখার মতো নতুন আইটেম নেই");

    try {
      const g = await generate(pick.title, pick.summary ?? "", pick.sources.name, pick.url);
      // আসল বিষয় অনুযায়ী ক্যাটাগরি (সূত্রের ক্যাটাগরি নয়); খেলা/বিনোদন ইত্যাদি বাদ
      const category = g.category ?? pick.sources.category;
      if (category === "skip" || !s.categories[category]) {
        await db.from("raw_items").update({ status: "rejected" }).eq("id", pick.id);
        await log("info", "write", `বাদ (${category}): ${pick.title.slice(0, 90)}`);
        continue;
      }
      const { data: corro } = await db.rpc("corroboration_count", { t: pick.title, src: pick.source_id });
      const score = Math.min(100, pick.sources.trust_level * 15 + Math.min(corro ?? 0, 2) * 15);
      const sensitive = SENSITIVE.test(`${pick.title} ${pick.summary ?? ""}`);

      const { data: art, error } = await db.from("articles").insert({
        slug: slugify(g.title_en), category,
        title_bn: g.title_bn, title_en: g.title_en, body_bn: g.body_bn, body_en: g.body_en, excerpt: g.excerpt_bn,
        social_caption: g.social_caption_bn ?? null, hashtags: g.hashtags_en ?? null, image_prompt: g.image_prompt ?? null, countries: (g.countries ?? []).join(",") || null, source_image_url: pick.image_url ?? null,
        source_links: [{ name: pick.sources.name, url: pick.url }], verification_score: score, status: "draft",
      }).select().single();
      if (error) throw new Error(error.message);
      await db.from("raw_items").update({ status: "used" }).eq("id", pick.id);

      // ছবি আগে। ছবি না হলে লেখা draft-ই থাকে, পরের রানগুলোতে আবার চেষ্টা হয়; ছবি ছাড়া কিছু প্রকাশ বা পোস্ট হয় না
      const hasImg = await buildBanner(db, art, s.source_images);
      const eligible = isEligible(s, sensitive, score);
      if (hasImg && eligible) await db.from("articles").update({ status: "approved" }).eq("id", art.id);
      await log("info", "write", `লেখা তৈরি (${hasImg ? (eligible ? `approved/${s.approval_mode}` : "draft, ছবিসহ") : "draft, ছবি নেই"}, স্কোর ${score}${sensitive ? ", সংবেদনশীল" : ""}, ${category}): ${g.title_en}`);
      return;
    } catch (e) {
      await log("error", "write", (e as Error).message, { raw_item: pick.id });
      await alertAdmin(`❌ নীহারিকা: লেখা ব্যর্থ\n${(e as Error).message}`);
      return;
    }
  }
}


// ---- শিক্ষামূলক (খবর নয়) পোস্ট: ভালো অভ্যাস, মজার তথ্য, ভুল ধারণা, ব্যাখ্যা ----
// auto মোডে শুধু তথ্য/ব্যাখ্যা স্বয়ংক্রিয়, স্বাস্থ্য-ঘেঁষা অভ্যাস/ভুল-ধারণা আপনার অনুমোদনে; ultra-তে সব স্বয়ংক্রিয়
function isEligibleEvergreen(s: Settings, kind: string) {
  if (s.approval_mode === "ultra") return true;
  return s.approval_mode === "auto" && (kind === "fact" || kind === "explainer");
}

// সকাল ৮টা–রাত ১০টার মধ্যে দিনে n টি, সমান ব্যবধানে
async function evergreenDue(n: number) {
  if (n <= 0) return false;
  const hour = new Date(Date.now() + BDT).getUTCHours();
  const allowed = Math.ceil(n * Math.min(1, Math.max(0, (hour - 7) / 14)));
  const { count } = await db.from("articles").select("id", { count: "exact", head: true }).neq("kind", "news").neq("status", "rejected").gte("created_at", dayStartISO());
  return (count ?? 0) < allowed;
}

async function writeEvergreen(s: Settings) {
  try {
    const { data: past } = await db.from("articles").select("kind,title_en").neq("kind", "news").neq("status", "rejected").order("created_at", { ascending: false }).limit(60);
    const recent = (past ?? []).slice(0, 16);
    const used: Record<string, number> = Object.fromEntries(EVERGREEN_KINDS.map((k) => [k, 0]));
    for (const r of recent) if (r.kind in used) used[r.kind]++;
    const least = Math.min(...Object.values(used));
    const pool = EVERGREEN_KINDS.filter((k) => used[k] === least);
    const kind = pool[Math.floor(Math.random() * pool.length)];
    const areas = EVERGREEN_AREAS[kind];
    const area = areas[Math.floor(Math.random() * areas.length)];

    const g = await generateEvergreen(kind, area, (past ?? []).map((r: any) => r.title_en).filter(Boolean));
    const { data: art, error } = await db.from("articles").insert({
      slug: slugify(g.title_en), category: "science", kind,
      title_bn: g.title_bn, title_en: g.title_en, body_bn: g.body_bn, body_en: g.body_en, excerpt: g.excerpt_bn,
      social_caption: g.social_caption_bn ?? null, hashtags: g.hashtags_en ?? null, image_prompt: g.image_prompt ?? null, banner_highlight: g.banner_highlight || null,
      source_links: [], verification_score: null, status: "draft",
    }).select().single();
    if (error) throw new Error(error.message);
    const hasImg = await buildBanner(db, art, s.source_images);
    const eligible = isEligibleEvergreen(s, kind);
    if (hasImg && eligible) await db.from("articles").update({ status: "approved" }).eq("id", art.id);
    await log("info", "evergreen", `শিক্ষামূলক পোস্ট (${kind}, ${area}; ${hasImg ? (eligible ? "approved" : "draft, ছবিসহ") : "draft, ছবি নেই"}): ${g.title_en}`);
  } catch (e) {
    await log("error", "evergreen", (e as Error).message.slice(0, 300));
  }
}

// ছবি তৈরি হয়নি এমন লেখাগুলোতে আবার চেষ্টা (সর্বোচ্চ ৩ দিন পুরনো)
async function retryImages(s: Settings) {
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  const { data } = await db.from("articles").select("*").in("status", ["draft", "approved"]).is("banner_url", null).gte("created_at", since).order("created_at", { ascending: false }).limit(4);
  for (const a of data ?? []) {
    const ok = await buildBanner(db, a, s.source_images);
    const sensitive = SENSITIVE.test(`${a.title_en ?? ""} ${a.title_bn ?? ""} ${a.excerpt ?? ""}`);
    const eligible = a.kind && a.kind !== "news" ? isEligibleEvergreen(s, a.kind) : isEligible(s, sensitive, a.verification_score ?? 0);
    if (ok && a.status === "draft" && eligible) {
      await db.from("articles").update({ status: "approved" }).eq("id", a.id);
    }
  }
}

async function main() {
  const s = await getSettings(db);
  await collect();

  if (!hasAI()) {
    await log("warn", "write", "AI key নেই, লেখা তৈরি বাদ");
  } else {
    const n = await remainingQuota(s.posts_per_day);
    await log("info", "quota", `প্রতিদিন ${s.posts_per_day}টি, এই রানে লেখা হবে ${n}টি, মোড: ${s.approval_mode}`);
    for (let i = 0; i < n; i++) await writeOne(s);
    if (await evergreenDue(s.evergreen_per_day)) await writeEvergreen(s);   // খবরের কোটা থেকে আলাদা; খবর বন্ধ হয় না
  }
  await retryImages(s);

  const changed = await publishAll();

  if (process.env.SITE_URL && process.env.REVALIDATE_SECRET) {
    try { await fetch(`${process.env.SITE_URL}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": process.env.REVALIDATE_SECRET } }); } catch { /* ধীরে হলেও ISR আপডেট হবে */ }
  }
  await db.from("logs").delete().lt("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
  if (changed) await log("info", "publish", "সাইট রিফ্রেশ করা হয়েছে");
}

main().catch(async (e) => {
  await alertAdmin(`❌ নীহারিকা pipeline ক্র্যাশ: ${e.message}`);
  console.error(e);
  process.exit(1);
});
