export const SITE = process.env.SITE_URL || "https://niiharika.vercel.app";
export const CATS: Record<string, string> = { science: "বিজ্ঞান", tech: "প্রযুক্তি", bangladesh: "বাংলাদেশ", world: "বিশ্ব" };
export const CAT_EN: Record<string, string> = { science: "Science", tech: "Technology", bangladesh: "Bangladesh", world: "World" };

// বাংলাদেশ সময়ে বাংলা তারিখ-সময়
export const bn = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }) : "";

// অ্যাডমিন (ইংরেজি) প্যানেলের জন্য ইংরেজি তারিখ
export const dt = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }) : "";
