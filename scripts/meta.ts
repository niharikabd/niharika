// Facebook Page ও Instagram (Graph API)। একই Page access token দুটোতেই চলে।
const V = () => process.env.GRAPH_VERSION || "v21.0";
const SITE = () => process.env.SITE_URL || "https://niharika.vercel.app";

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

export async function postFacebook(a: any): Promise<string> {
  const src = a.source_links?.[0];
  const message = `${a.title_bn}\n\n${a.excerpt ?? ""}\n\n${src ? `সূত্র: ${src.name}\n` : ""}🤖 AI-সহায়তায় তৈরি`;
  const j = await graph(`${process.env.FB_PAGE_ID}/feed`, { message, link: `${SITE()}/article/${a.slug}` });
  return j.id;
}

export async function postInstagram(a: any): Promise<string> {
  if (!a.banner_url) throw new Error("ব্যানার নেই");
  const caption = `${a.title_bn}\n\n${a.excerpt ?? ""}\n\n🔗 পুরো খবর: ${SITE().replace("https://", "")} (বায়োতে লিংক)\n🤖 AI-সহায়তায় তৈরি\n\n#নীহারিকা #বিজ্ঞান #প্রযুক্তি`.slice(0, 2200);
  const ig = process.env.IG_USER_ID!;
  const c = await graph(`${ig}/media`, { image_url: a.banner_url, caption });
  for (let i = 0; i < 6; i++) {
    const st = await graph(c.id, { fields: "status_code" }, "GET");
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR") throw new Error("meta: IG container ERROR");
    await new Promise((r) => setTimeout(r, 4000));
  }
  const p = await graph(`${ig}/media_publish`, { creation_id: c.id });
  return p.id;
}
