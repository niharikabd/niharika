// সোশ্যাল পোস্টের লেখা তৈরি: হ্যাশট্যাগ ইংরেজি, মূল লেখার পর কয়েক লাইন ফাঁক দিয়ে
import { SITE, SOCIAL } from "../lib/site";

const CATTAG: Record<string, string> = { science: "#Science", tech: "#Tech", bangladesh: "#Bangladesh", world: "#WorldNews" };

export const articleUrl = (a: any) => `${SITE}/article/${a.slug}`;
export const tagsOf = (a: any) => String(a.hashtags || `${CATTAG[a.category] ?? "#News"} #Niiharika`);
export const shortCaption = (a: any) => String(a.social_caption || `${a.title_bn}\n\n${a.excerpt ?? ""}`).trim();
export const fullNews = (a: any) => `${a.title_bn}\n\n${String(a.body_bn ?? "").trim()}`.trim();

const cut = (t: string, max: number) => {
  if (t.length <= max) return t;
  const c = t.slice(0, max - 1);
  const i = Math.max(c.lastIndexOf("।"), c.lastIndexOf("."), c.lastIndexOf("\n"));
  return (i > max * 0.6 ? c.slice(0, i + 1) : c) + (i > max * 0.6 ? "" : "…");
};

// মূল লেখা, তারপর ৩ লাইন ফাঁক, তারপর হ্যাশট্যাগ
export function withTags(main: string, a: any, max: number) {
  const tail = `\n\n\n${tagsOf(a)}`;
  return cut(main, max - tail.length) + tail;
}

export function linksComment(a: any) {
  return `🔗 পুরো খবর পড়ুন:\n${articleUrl(a)}\n\n📲 আমাদের অনুসরণ করুন:\nFacebook: ${SOCIAL.facebook}\nInstagram: ${SOCIAL.instagram}\nTelegram: ${SOCIAL.telegram}\nWebsite: ${SITE}`;
}

// Telegram ক্যাপশন (ছবির ক্যাপশন সীমা ১০২৪): ক্যাপশন + ওয়েবসাইট লিংক + হ্যাশট্যাগ
export function telegramCaption(a: any) {
  const tail = `\n\n🔗 ${articleUrl(a)}\n\n\n${tagsOf(a)}`;
  return cut(shortCaption(a), 1024 - tail.length) + tail;
}
