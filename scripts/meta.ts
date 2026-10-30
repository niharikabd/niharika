// Facebook Page ও Instagram (Graph API)। একই Page access token দুটোতেই চলে।
// দুটি স্টাইল (Admin → Settings): "full" = পুরো খবর পোস্টে, কমেন্টে লিংক; "short" = ছোট পোস্ট, ১ম কমেন্টে পুরো খবর, ২য় কমেন্টে লিংক
import { log } from "../lib/log";
import { fullNews, linksComment, shortCaption, withTags } from "./social-text";

const V = () => process.env.GRAPH_VERSION || "v26.0";

async function graph(path: string, params: Record<string, string>, method: "POST" | "GET" = "POST") {
  const qs = new URLSearchParams({ ...params, access_token: process.env.FB_PAGE_ACCESS_TOKEN! });
  const r = method === "POST"
    ? await fetch(`https://graph.facebook.com/${V()}/${path}`, { method: "POST", body: qs })
    : await fetch(`https://graph.facebook.com/${V()}/${path}?${qs}`);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`meta: ${j.error?.message ?? r.status}`);
  return j;
}

export const facebookReady = () => !!(process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN);
export const instagramReady = () => !!(process.env.IG_USER_ID && process.env.FB_PAGE_ACCESS_TOKEN);

// পোস্ট হয়ে যাওয়ার পর কমেন্ট; ব্যর্থ হলে পোস্ট আবার হয় না, শুধু সতর্কতা লগ (সাধারণত অনুমতি কম)
async function comments(platform: "facebook" | "instagram", objectId: string, texts: string[], a: any) {
  for (const message of texts) {
    try { await graph(`${objectId}/comments`, { message }); }
    catch (e) {
      const hint = platform === "facebook" ? "pages_manage_engagement" : "instagram_manage_comments";
      await log("warn", platform, `কমেন্ট ব্যর্থ (${hint} অনুমতি লাগতে পারে): ${(e as Error).message.slice(0, 160)}`, { slug: a.slug });
      return;
    }
  }
}

export async function postFacebook(a: any, style: "full" | "short"): Promise<string> {
  if (!a.banner_url) throw new Error("ছবি নেই");
  const caption = style === "full" ? withTags(fullNews(a), a, 60000) : withTags(shortCaption(a), a, 60000);
  const j = await graph(`${process.env.FB_PAGE_ID}/photos`, { url: a.banner_url, caption, published: "true" });
  const postId = j.post_id ?? j.id;
  await comments("facebook", postId, style === "full" ? [linksComment(a)] : [fullNews(a), linksComment(a)], a);
  return postId;
}

export async function postInstagram(a: any, style: "full" | "short"): Promise<string> {
  if (!a.banner_url) throw new Error("ছবি নেই");
  const ig = process.env.IG_USER_ID!;
  const caption = style === "full" ? withTags(fullNews(a), a, 2200) : withTags(shortCaption(a), a, 2200);
  const c = await graph(`${ig}/media`, { image_url: a.banner_url, caption });
  for (let i = 0; i < 6; i++) {
    const st = await graph(c.id, { fields: "status_code" }, "GET");
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR") throw new Error("meta: IG container ERROR");
    await new Promise((r) => setTimeout(r, 4000));
  }
  const p = await graph(`${ig}/media_publish`, { creation_id: c.id });
  const cm = (t: string) => (t.length > 2200 ? t.slice(0, 2199) + "…" : t);
  await comments("instagram", p.id, style === "full" ? [cm(linksComment(a))] : [cm(fullNews(a)), cm(linksComment(a))], a);
  return p.id;
}
