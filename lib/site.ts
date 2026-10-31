export const SITE = process.env.SITE_URL || "https://niiharika.vercel.app";
export const CATS: Record<string, string> = { science: "বিজ্ঞান", tech: "প্রযুক্তি", bangladesh: "বাংলাদেশ", world: "বিশ্ব" };
export const CAT_EN: Record<string, string> = { science: "Science", tech: "Technology", bangladesh: "Bangladesh", world: "World" };

// বাংলাদেশ সময়ে বাংলা তারিখ-সময়
export const bn = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }) : "";

// অ্যাডমিন (ইংরেজি) প্যানেলের জন্য ইংরেজি তারিখ
export const dt = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }) : "";

export const SOCIAL = {
  facebook: "https://www.facebook.com/niiharika.fb",
  instagram: "https://www.instagram.com/niiharika.bd",
  telegram: "https://t.me/niiharikatelegram",
};

// স্থায়ী-মানের (খবর নয়) পোস্টের ধরন
export const KIND_BN: Record<string, string> = { tip: "ভালো অভ্যাস", fact: "জানেন কি?", myth: "ভুল ধারণা", explainer: "বিজ্ঞান-প্রযুক্তি" };
export const KIND_EN: Record<string, string> = { tip: "Healthy habit", fact: "Did you know?", myth: "Myth vs fact", explainer: "Explainer" };
