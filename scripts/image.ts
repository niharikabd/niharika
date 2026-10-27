// ব্যানারের ব্যাকগ্রাউন্ড ছবি: (১) খোলা-লাইসেন্স উৎসের নিজস্ব ছবি (NASA, ESA...) → (২) AI "Concept Image" → (৩) null (ডিজাইন করা ব্যাকগ্রাউন্ড)
import sharp from "sharp";

const OPEN: Record<string, string> = { "nasa.gov": "NASA", "esa.int": "ESA", "noaa.gov": "NOAA", "eso.org": "ESO", "nih.gov": "NIH" };
const STYLE = ", editorial photo-illustration, cinematic lighting, rich detail, vertical composition, no text, no letters, no logos, no watermark";

export type Bg = { buf: Buffer; credit: string } | null;

async function getBuf(url: string, ms = 20000): Promise<{ buf: Buffer; type: string } | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { "User-Agent": "NiiharikaBot/1.0 (+https://niiharika.vercel.app)" } });
    if (!r.ok) return null;
    return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get("content-type") || "" };
  } catch { return null; }
}

async function openPhoto(pageUrl: string): Promise<Bg> {
  let host = "";
  try { host = new URL(pageUrl).hostname; } catch { return null; }
  const key = Object.keys(OPEN).find((k) => host === k || host.endsWith("." + k));
  if (!key) return null;
  const html = await getBuf(pageUrl, 15000);
  if (!html) return null;
  const m = html.buf.toString("utf8").match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)
    || html.buf.toString("utf8").match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
  if (!m) return null;
  const img = await getBuf(new URL(m[1], pageUrl).toString());
  if (!img || !img.type.startsWith("image/")) return null;
  try {
    const meta = await sharp(img.buf).metadata();
    if ((meta.width ?? 0) < 700 || (meta.height ?? 0) < 500) return null; // লোগো/ছোট ছবি বাদ
  } catch { return null; }
  return { buf: img.buf, credit: `ছবি: ${OPEN[key]}` };
}

async function cloudflareAI(prompt: string): Promise<Buffer | null> {
  const id = process.env.CF_ACCOUNT_ID, tok = process.env.CF_API_TOKEN;
  if (!id || !tok) return null;
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${id}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
      method: "POST", signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, steps: 6 }),
    });
    const j = await r.json();
    return j?.result?.image ? Buffer.from(j.result.image, "base64") : null;
  } catch { return null; }
}

async function pollinations(prompt: string): Promise<Buffer | null> {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1350&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1e6)}`;
  const r = await getBuf(url, 70000);
  return r && r.type.startsWith("image/") && r.buf.length > 20000 ? r.buf : null;
}

export async function getBackground(a: { source_links?: { url: string }[]; image_prompt?: string | null; title_en?: string | null }): Promise<Bg> {
  const link = a.source_links?.[0]?.url;
  if (link) { const o = await openPhoto(link); if (o) return o; }
  const base = (a.image_prompt || a.title_en || "").trim();
  if (!base) return null;
  const prompt = base + STYLE;
  const buf = (await cloudflareAI(prompt)) || (await pollinations(prompt));
  return buf ? { buf, credit: "Concept Image | নীহারিকা" } : null;
}
