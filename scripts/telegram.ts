import { telegramCaption } from "./social-text";

const api = (m: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${m}`;

async function call(method: string, body: object): Promise<string> {
  const r = await fetch(api(method), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.ok) throw new Error(`telegram: ${j.description}`);
  return String(j.result.message_id);
}

export function telegramReady() { return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID); }

// ছবি + ক্যাপশন + ওয়েবসাইটের লিংক + ইংরেজি হ্যাশট্যাগ (কোনো AI-চিহ্ন/সূত্রের নাম নয়)
export async function postTelegram(a: any): Promise<string> {
  if (!a.banner_url) throw new Error("ছবি নেই");
  return call("sendPhoto", { chat_id: process.env.TELEGRAM_CHANNEL_ID!, photo: a.banner_url, caption: telegramCaption(a) });
}

export async function alertAdmin(text: string) {
  const id = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!id || !process.env.TELEGRAM_BOT_TOKEN) return;
  try { await call("sendMessage", { chat_id: id, text: text.slice(0, 3500) }); } catch { /* alert ব্যর্থ হলে চুপ */ }
}
