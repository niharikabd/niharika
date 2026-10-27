import { publicClient } from "@/lib/supabase";
import { SITE } from "@/lib/site";

export const revalidate = 600;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Google News sitemap: গত ২ দিনের খবর
export async function GET() {
  const since = new Date(Date.now() - 2 * 86400000).toISOString();
  const { data } = await publicClient().from("articles").select("slug,title_bn,published_at").eq("status", "published").gte("published_at", since).order("published_at", { ascending: false }).limit(1000);
  const urls = (data ?? []).map((a) => `<url><loc>${SITE}/article/${a.slug}</loc><news:news><news:publication><news:name>নীহারিকা</news:name><news:language>bn</news:language></news:publication><news:publication_date>${new Date(a.published_at!).toISOString()}</news:publication_date><news:title>${esc(a.title_bn ?? "")}</news:title></news:news></url>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
