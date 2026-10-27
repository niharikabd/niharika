import { SITE } from "@/lib/site";
import { publicClient } from "@/lib/supabase";

export const revalidate = 600;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const { data } = await publicClient().from("articles").select("slug,title_bn,excerpt,published_at,banner_url").eq("status", "published").order("published_at", { ascending: false }).limit(50);
  const items = (data ?? []).map((a) => `<item><title>${esc(a.title_bn ?? "")}</title><link>${SITE}/article/${a.slug}</link><guid isPermaLink="true">${SITE}/article/${a.slug}</guid><description>${esc(a.excerpt ?? "")}</description><pubDate>${new Date(a.published_at!).toUTCString()}</pubDate>${a.banner_url ? `<enclosure url="${a.banner_url}" type="image/jpeg" length="0"/>` : ""}</item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>নীহারিকা</title><link>${SITE}</link><description>বিজ্ঞান ও প্রযুক্তির খবর</description><language>bn</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
