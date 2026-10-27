// ব্যানার: sharp + pango দিয়ে (বাংলা যুক্তাক্ষর ঠিকভাবে বসে)। GitHub runner-এ fonts-noto-core লাগে।
import sharp from "sharp";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const W = 1080;

async function text(markup: string, font: string, width: number) {
  return sharp({ text: { text: markup, font, width, rgba: true, wrap: "word", spacing: 10 } }).png().toBuffer();
}

export async function makeBanner(title: string, categoryLabel: string): Promise<Buffer> {
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1020"/><stop offset="1" stop-color="#2b3a8c"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="920" cy="170" r="260" fill="#7c9cff" opacity=".13"/><circle cx="130" cy="960" r="330" fill="#b07cff" opacity=".10"/><rect x="70" y="880" width="120" height="6" fill="#7c9cff"/></svg>`);

  let titleImg!: Buffer;
  for (const size of [64, 54, 46, 40, 34]) {
    titleImg = await text(`<span foreground="#ffffff">${esc(title)}</span>`, `Noto Sans Bengali Bold ${size}`, W - 140);
    if ((await sharp(titleImg).metadata()).height! <= 560) break;
  }
  const cat = await text(`<span foreground="#9db4ff">${esc(categoryLabel)}</span>`, "Noto Sans Bengali Bold 38", 500);
  const brand = await text(`<span foreground="#c9d3ff">নীহারিকা · Niharika</span>`, "Noto Sans Bengali 36", 700);
  const ai = await text(`<span foreground="#8e9ad0">AI-সহায়তায় তৈরি</span>`, "Noto Sans Bengali 28", 400);

  return sharp(bg)
    .composite([
      { input: cat, left: 70, top: 130 },
      { input: titleImg, left: 70, top: 230 },
      { input: brand, left: 70, top: 915 },
      { input: ai, left: 70, top: 975 },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}
