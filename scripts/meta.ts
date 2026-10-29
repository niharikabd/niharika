// Facebook Page ও Instagram (Graph API)। একই Page access token দুটোতেই চলে।
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

const captionOf = (a: any) => String(a.social_caption || `${a.title_bn}\n\n${a.excerpt ?? ""}`);

// শুধু ছবি + ক্যাপশন (লিংক পোস্ট নয়; কোনো সূত্র/AI-চিহ্ন নয়)
export async function postFacebook(a: any): Promise<string> {
  if (!a.banner_url) throw new Error("ছবি নেই");
  const j = await graph(`${process.env.FB_PAGE_ID}/photos`, { url: a.banner_url, caption: captionOf(a), published: "true" });
  return j.post_id ?? j.id;
}

export async function postInstagram(a: any): Promise<string> {
  if (!a.banner_url) throw new Error("ছবি নেই");
  const ig = process.env.IG_USER_ID!;
  const c = await graph(`${ig}/media`, { image_url: a.banner_url, caption: captionOf(a).slice(0, 2200) });
  for (let i = 0; i < 6; i++) {
    const st = await graph(c.id, { fields: "status_code" }, "GET");
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR") throw new Error("meta: IG container ERROR");
    await new Promise((r) => setTimeout(r, 4000));
  }
  const p = await graph(`${ig}/media_publish`, { creation_id: c.id });
  return p.id;
}
