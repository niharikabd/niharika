// প্রতি ঘণ্টায়: সংগ্রহ → (দিনের কোটা অনুযায়ী) লেখা → প্রকাশ + social → cache refresh
import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { adminClient } from "../lib/supabase";
import { getSettings, type Settings } from "../lib/settings";
import { log } from "../lib/log";
import { generate, hasAI, curate } from "./ai";
import { alertAdmin } from "./telegram";
import { publishAll } from "./publish";

const db = adminClient();
const parser = new Parser({ timeout: 15000 });
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
          published_at: it.isoDate ?? null, status: dup ? "duplicate" : "new",
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
  const { count } = await db.from("articles").select("id", { count: "exact", head: true }).gte("created_at", dayStart).neq("status", "rejected");
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

// আজ কোন ক্যাটাগরির কয়টি লেখা হয়েছে দেখে সবচেয়ে "পিছিয়ে" থাকা ক্যাটাগরি থেকে খবর বাছা
async function pickCandidate(ok: any[]) {
  const { data: today } = await db.from("articles").select("category").gte("created_at", dayStartISO()).neq("status", "rejected");
  const counts: Record<string, number> = {};
  for (const r of today ?? []) counts[r.category] = (counts[r.category] ?? 0) + 1;
  const total = (today ?? []).length;
  const cats = [...new Set(ok.map((i) => i.sources.category as string))];
  cats.sort((a, b) => ((WEIGHT[b] ?? 0.1) * (total + 1) - (counts[b] ?? 0)) - ((WEIGHT[a] ?? 0.1) * (total + 1) - (counts[a] ?? 0)));
  const pool = ok.filter((i) => i.sources.category === cats[0]);
  pool.sort((a, b) => b.sources.trust_level - a.sources.trust_level || +new Date(b.published_at ?? 0) - +new Date(a.published_at ?? 0));
  // সম্পাদকীয় বাছাই: সেরা ১০টির মধ্য থেকে AI সবচেয়ে গুরুত্বপূর্ণটি বাছে (একাধিক সূত্রে আসা খবর বেশি গুরুত্ব পায়)
  const top10 = pool.slice(0, 10);
  if (top10.length > 1 && hasAI()) {
    try {
      const cand = await Promise.all(top10.map(async (i) => ({ i, n: Number((await db.rpc("corroboration_count", { t: i.title, src: i.source_id })).data ?? 0) })));
      const r = await curate(cand.map(({ i, n }) => ({ title: i.title, summary: i.summary ?? "", source: i.sources.name, others: n })));
      await log("info", "curate", `বাছাই (${cats[0]}): ${top10[r.index].title.slice(0, 90)} — ${r.reason}`);
      return top10[r.index];
    } catch (e) { await log("warn", "curate", `AI বাছাই ব্যর্থ, সাধারণ নিয়মে: ${(e as Error).message.slice(0, 160)}`); }
  }
  const top = pool.slice(0, 3);                       // ফলব্যাক: একই সূত্র বারবার না আসতে সামান্য এলোমেলো
  return top[Math.floor(Math.random() * top.length)];
}

async function writeOne(s: Settings) {
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  const { data: items } = await db.from("raw_items").select("*, sources(name, category, trust_level)").eq("status", "new").gte("created_at", since).limit(200);
  const ok = (items ?? []).filter((i: any) => i.sources && s.categories[i.sources.category]);
  const pick: any = ok.length ? await pickCandidate(ok) : null;
  if (!pick) return log("info", "write", "লেখার মতো নতুন আইটেম নেই");

  try {
    const g = await generate(pick.title, pick.summary ?? "", pick.sources.name, pick.url);
    const { data: corro } = await db.rpc("corroboration_count", { t: pick.title, src: pick.source_id });
    const score = Math.min(100, pick.sources.trust_level * 15 + Math.min(corro ?? 0, 2) * 15);
    const sensitive = SENSITIVE.test(`${pick.title} ${pick.summary ?? ""}`);
    const status = s.approval_mode === "auto" && !sensitive && score >= 75 ? "approved" : "draft";

    const { error } = await db.from("articles").insert({
      slug: slugify(g.title_en), category: pick.sources.category,
      title_bn: g.title_bn, title_en: g.title_en, body_bn: g.body_bn, body_en: g.body_en, excerpt: g.excerpt_bn,
      social_caption: g.social_caption_bn ?? null, image_prompt: g.image_prompt ?? null,
      source_links: [{ name: pick.sources.name, url: pick.url }], verification_score: score, status,
    });
    if (error) throw new Error(error.message);
    await db.from("raw_items").update({ status: "used" }).eq("id", pick.id);
    await log("info", "write", `লেখা তৈরি (${status}, স্কোর ${score}${sensitive ? ", সংবেদনশীল" : ""}, ${pick.sources.category}): ${g.title_en}`);
  } catch (e) {
    await log("error", "write", (e as Error).message, { raw_item: pick.id });
    await alertAdmin(`❌ নীহারিকা: লেখা ব্যর্থ\n${(e as Error).message}`);
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
  }

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
