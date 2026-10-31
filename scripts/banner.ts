// ব্যানার ১০৮০×১৩৫০ (৪:৫): ওপরে ওয়েবসাইট (বামে) ও লোগো (ডানে), তারপর শিরোনাম ও সূত্র, নিচে ছবি।
// sharp + pango দিয়ে (বাংলা যুক্তাক্ষর ঠিকভাবে বসে)। GitHub runner-এ fonts-noto-core লাগে।
import sharp from "sharp";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const W = 1080, H = 1350;

async function text(markup: string, font: string, width: number) {
  return sharp({ text: { text: markup, font, width, rgba: true, wrap: "word", spacing: 10 } }).png().toBuffer();
}

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><radialGradient id="r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d7c9ff"/><stop offset=".6" stop-color="#6f7cff"/><stop offset="1" stop-color="#2b3a8c"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#r)"/><path d="M32 11 L36.5 27.5 L53 32 L36.5 36.5 L32 53 L27.5 36.5 L11 32 L27.5 27.5 Z" fill="#fff"/></svg>`;

export type BannerInput = { title: string; categoryLabel: string; source: string; bg?: Buffer | null; credit?: string; highlight?: string | null; big?: boolean };

export async function makeBanner(i: BannerInput): Promise<Buffer> {
  // ১) শিরোনাম ও সূত্র মেপে নেওয়া
  let head!: Buffer, hh = 0;
  // রঙিন হাইলাইট (শিক্ষামূলক পোস্টে) ও বড় লেখা
  let titleMarkup = esc(i.title);
  for (const w of String(i.highlight ?? "").split(/[,،|]/).map((x) => x.trim()).filter(Boolean)) {
    const e = esc(w);
    if (titleMarkup.includes(e)) titleMarkup = titleMarkup.replace(e, `<span foreground="#ffd166">${e}</span>`);
  }
  for (const size of i.big ? [100, 92, 84, 76, 68, 60, 52] : [80, 72, 64, 56, 48, 42]) {
    head = await text(`<span foreground="#ffffff">${titleMarkup}</span>`, `Noto Sans Bengali Bold ${size}`, W - 120);
    hh = (await sharp(head).metadata()).height!;
    if (hh <= 480) break;
  }
  const src = await text(`<span foreground="#9db4ff">${esc(i.categoryLabel)}</span>${i.source ? `<span foreground="#c9d3ff">  •  সূত্র: ${esc(i.source)}</span>` : ""}`, "Noto Sans Bengali 30", W - 120);
  const srcH = (await sharp(src).metadata()).height!;
  const textBottom = 150 + hh + 22 + srcH;
  // ২) ছবি থাকবে লেখার নিচে (লেখা মুখের ওপর পড়ে না, ছবি কম কাটা পড়ে)
  const photoTop = Math.min(Math.max(textBottom + 34, 460), 820);
  const photoH = H - photoTop;

  const base = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1020"/><stop offset="1" stop-color="#26307a"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="940" cy="200" r="260" fill="#7c9cff" opacity=".10"/><circle cx="120" cy="${photoTop - 40}" r="180" fill="#b07cff" opacity=".10"/></svg>`)).png().toBuffer();

  const layers: sharp.OverlayOptions[] = [];
  if (i.bg) {
    const photo = await sharp(i.bg).resize(W, photoH, { fit: "cover", position: "attention" }).toBuffer();
    layers.push({ input: photo, left: 0, top: photoTop });
    const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
      <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1020" stop-opacity=".92"/><stop offset="1" stop-color="#0b1020" stop-opacity="0"/></linearGradient>
      <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b1c" stop-opacity="0"/><stop offset="1" stop-color="#070b1c" stop-opacity=".8"/></linearGradient></defs>
      <rect y="${photoTop}" width="${W}" height="120" fill="url(#t)"/><rect y="${H - 150}" width="${W}" height="150" fill="url(#b)"/></svg>`);
    layers.push({ input: fade, left: 0, top: 0 });
  }

  const site = await text(`<span foreground="#e8ecff">niiharika.vercel.app</span>`, "Noto Sans Bengali 28", 460);
  const name = await text(`<span foreground="#ffffff">নীহারিকা</span>`, "Noto Sans Bengali Bold 40", 300);
  const nameW = (await sharp(name).metadata()).width!;
  layers.push(
    { input: site, left: 50, top: 52 },
    { input: Buffer.from(MARK), left: W - 50 - nameW - 74, top: 40 },
    { input: name, left: W - 50 - nameW, top: 50 },
    { input: head, left: 60, top: 150 },
    { input: src, left: 60, top: 150 + hh + 22 },
  );
  if (i.credit) {
    const cr = await text(`<span foreground="#dfe5ff">${esc(i.credit)}</span>`, "Noto Sans Bengali 24", 500);
    const crW = (await sharp(cr).metadata()).width!;
    layers.push({ input: cr, left: W - 50 - crW, top: H - 62 });
  }
  return sharp(base).composite(layers).jpeg({ quality: 90 }).toBuffer();
}
