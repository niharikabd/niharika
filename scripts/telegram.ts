const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const api = (m: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${m}`;
const SITE = () => process.env.SITE_URL || "https://niiharika.vercel.app";

async function call(method: string, body: object): Promise<string> {
  const r = await fetch(api(method), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.ok) throw new Error(`telegram: ${j.description}`);
  return String(j.result.message_id);
}

export function telegramReady() { return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID); }

export async function postTelegram(a: any): Promise<string> {
  const src = a.source_links?.[0];
  const tail = `\n\n🔗 ${SITE()}/article/${a.slug}\n${src ? `📰 সূত্র: <a href="${src.url}">${esc(src.name)}</a>\n` : ""}🤖 AI-সহায়তায় তৈরি`;
  const head = `<b>${esc(a.title_bn)}</b>\n\n`;
  const chat_id = process.env.TELEGRAM_CHANNEL_ID!;
  let body = esc(a.social_caption || a.excerpt || "");
  if (a.banner_url) {
    const room = 1000 - (head.length + tail.length);
    const cap = head + (body.length > room ? body.slice(0, Math.max(room - 1, 0)) + "…" : body) + tail;
    try { return await call("sendPhoto", { chat_id, photo: a.banner_url, caption: cap, parse_mode: "HTML" }); } catch { /* ছবি ব্যর্থ হলে টেক্সটে ফলব্যাক */ }
  }
  return call("sendMessage", { chat_id, text: head + body + tail, parse_mode: "HTML" });
}

export async function alertAdmin(text: string) {
  const id = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!id || !process.env.TELEGRAM_BOT_TOKEN) return;
  try { await call("sendMessage", { chat_id: id, text: text.slice(0, 3500) }); } catch { /* alert ব্যর্থ হলে চুপ */ }
}
