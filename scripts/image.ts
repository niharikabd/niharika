// ব্যানারের ছবি: (১) সূত্রের নিজস্ব ছবি → (২) AI "Concept Image" → না পেলে null (ছবি ছাড়া কিছু প্রকাশ হয় না)
import sharp from "sharp";

const OPEN: Record<string, string> = { "nasa.gov": "NASA", "esa.int": "ESA", "noaa.gov": "NOAA", "eso.org": "ESO", "nih.gov": "NIH" };
const STYLE = ", editorial photo-illustration, cinematic lighting, rich detail, vertical composition, no text, no letters, no logos, no watermark";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 NiiharikaBot/1.0";

export type Bg = { buf: Buffer; credit: string } | null;
export type ImgInput = { source_links?: { name: string; url: string }[]; source_image_url?: string | null; image_prompt?: string | null; title_en?: string | null };

async function getBuf(url: string, ms = 20000): Promise<{ buf: Buffer; type: string } | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { "User-Agent": UA, Accept: "text/html,image/*,*/*;q=0.8" }, redirect: "follow" });
    if (!r.ok) return null;
    return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get("content-type") || "" };
  } catch { return null; }
}

async function bigEnough(buf: Buffer) {
  try { const m = await sharp(buf).metadata(); return (m.width ?? 0) >= 700 && (m.height ?? 0) >= 450; } catch { return false; }
}

function pageImage(html: string, base: string): string | null {
  const pats = [
    /<meta[^>]+(?:property|name)=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::url)?["']/i,
    /<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
    /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
  ];
  for (const p of pats) {
    const m = html.match(p);
    if (m) { try { return new URL(m[1].replace(/&amp;/g, "&"), base).toString(); } catch { /* পরেরটা */ } }
  }
  return null;
}

// সূত্রের নিজস্ব ছবি। mode="open" হলে শুধু খোলা-লাইসেন্স উৎস (NASA, ESA...); "all" হলে যেকোনো সূত্রের (ক্রেডিটসহ)
async function sourcePhoto(a: ImgInput, mode: "open" | "all"): Promise<Bg> {
  const link = a.source_links?.[0];
  if (!link) return null;
  let host = "";
  try { host = new URL(link.url).hostname; } catch { return null; }
  const key = Object.keys(OPEN).find((k) => host === k || host.endsWith("." + k));
  if (!key && mode !== "all") return null;
  const credit = `ছবি: ${key ? OPEN[key] : link.name}`;

  const candidates: string[] = [];
  if (a.source_image_url) candidates.push(a.source_image_url);
  const page = await getBuf(link.url, 15000);
  if (page) { const u = pageImage(page.buf.toString("utf8"), link.url); if (u && !candidates.includes(u)) candidates.push(u); }
  for (const u of candidates) {
    const img = await getBuf(u);
    if (img && img.type.startsWith("image/") && (await bigEnough(img.buf))) return { buf: img.buf, credit };
  }
  return null;
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

export async function getBackground(a: ImgInput, mode: "open" | "all" = "all"): Promise<Bg> {
  const real = await sourcePhoto(a, mode);
  if (real) return real;                                   // ছবি থাকলে অবশ্যই সেটাই
  const base = (a.image_prompt || a.title_en || "").trim();
  if (!base) return null;
  const prompt = base + STYLE;
  for (let i = 0; i < 2; i++) {                            // AI ছবি: ২ বার চেষ্টা
    const buf = (await cloudflareAI(prompt)) || (await pollinations(prompt));
    if (buf) return { buf, credit: "Concept Image | নীহারিকা" };
  }
  return null;
}
