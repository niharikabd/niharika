// Gemini (প্রধান, একাধিক মডেল ফলব্যাক) → Groq (ফলব্যাক)
export type Generated = {
  title_bn: string; title_en: string; body_bn: string; body_en: string; excerpt_bn: string;
  social_caption_bn?: string; image_prompt?: string; category?: string; hashtags_en?: string;
};

const PROMPT = (title: string, summary: string, source: string, url: string) => `তুমি "নীহারিকা" নিউজ পোর্টালের সম্পাদক। বিজ্ঞান ও প্রযুক্তির খবর গল্পের মতো আকর্ষণীয় করে লেখো, যাতে পাঠক শেষ পর্যন্ত পড়তে চায়।

কঠোর নিয়ম:
- মূল লেখার বাক্য কপি বা হুবহু অনুবাদ করবে না, সব নিজের ভাষায়।
- সূত্রে যা নেই তা যোগ করবে না; সংখ্যা, নাম বা উদ্ধৃতি বানাবে না।
- মিথ্যা বা অতিরঞ্জিত দাবি, ক্লিকবেইট নয়। অনিশ্চিত হলে "বলা হচ্ছে", "দাবি করা হয়েছে" লেখো।

লেখার ধরন:
- title_bn: কৌতূহল জাগানো, সর্বোচ্চ ৭০ অক্ষর, সহজ বাংলা।
- body_bn: ১৫০–২২০ শব্দ, ৩টি ছোট অনুচ্ছেদ (অনুচ্ছেদের মাঝে একটি ফাঁকা লাইন)। (১) প্রথম বাক্যেই চমক বা প্রশ্ন, (২) কী ঘটেছে, (৩) কেন গুরুত্বপূর্ণ বা আমাদের জন্য এর মানে কী।
- excerpt_bn: ১-২ বাক্যের টানটান সারকথা।
- social_caption_bn: Facebook/Instagram/Telegram ক্যাপশন, **২–৩ লাইন, ছোট ও আকর্ষণীয়** (প্রথম লাইনে হুক, বাকিটুকুতে সারকথা)। **শেষে কোনো প্রশ্ন করবে না।** ১–২টি মানানসই ইমোজি। হ্যাশট্যাগ, লিংক বা সূত্রের নাম এতে দেবে না।
- hashtags_en: ৪–৬টি হ্যাশট্যাগ, **শুধু ইংরেজি অক্ষরে** (বাংলা হ্যাশট্যাগ নয়), প্রতিটি # দিয়ে শুরু, স্পেস দিয়ে আলাদা, একটি অবশ্যই #Niiharika। যেমন: "#Science #Space #NASA #Niiharika"।
- category: খবরের আসল বিষয় অনুযায়ী ঠিক একটি: "science" (বিজ্ঞান, মহাকাশ, গবেষণা, পরিবেশ-জলবায়ু গবেষণা), "tech" (প্রযুক্তি, AI, ইন্টারনেট, গ্যাজেট), "bangladesh" (**শুধু** যখন খবরটি আসলেই বাংলাদেশ নিয়ে: বাংলাদেশের ঘটনা, সরকার, অর্থনীতি, নাগরিক; বাংলাদেশি পত্রিকা ছাপলেও বিদেশের ঘটনা হলে "world"), "world" (আন্তর্জাতিক খবর), অথবা "skip" (খেলাধুলা, বিনোদন, সেলিব্রিটি/গসিপ, জীবনযাপন-টিপস, বিজ্ঞাপন/ডিল/রিভিউ, ব্যক্তিগত মতামত লেখা)।
- image_prompt: ইংরেজিতে ১–২ বাক্যে ছবির দৃশ্যের বর্ণনা। **কঠোর নিয়ম:** কোনো প্রাণী (পশু-পাখি-মাছ-পোকা সহ) থাকবে না; কোনো মানুষের মুখ/চোখ/ঠোঁট থাকবে না। বস্তু, স্থান, প্রকৃতি-দৃশ্য, যন্ত্র, মহাকাশ, মাইক্রোস্কোপ-দৃশ্য, ছায়ামূর্তি (silhouette) বা চোখ-মুখহীন সরল কার্টুন-অবয়ব চলবে। কোনো লেখা, অক্ষর বা লোগো নয়। বিষয়-নির্দিষ্ট, সুন্দর, সিনেমাটিক।

সূত্র: ${source}
লিংক: ${url}
শিরোনাম: ${title}
সংক্ষেপ: ${summary}

শুধু এই JSON ফরম্যাটে উত্তর দাও (অন্য কিছু নয়):
{"title_bn":"...","title_en":"...","body_bn":"...","body_en":"80-120 word engaging English summary","excerpt_bn":"...","social_caption_bn":"...","hashtags_en":"#Science #Niiharika","image_prompt":"...","category":"science"}`;

function parse(text: string): Generated {
  const j = JSON.parse(text.replace(/```json|```/g, "").trim());
  for (const k of ["title_bn", "title_en", "body_bn", "body_en", "excerpt_bn"]) {
    if (typeof j[k] !== "string" || !j[k].trim()) throw new Error(`missing field ${k}`);
  }
  // হ্যাশট্যাগ: শুধু ইংরেজি/সংখ্যা/আন্ডারস্কোর, সর্বোচ্চ ৬টি, #Niiharika অবশ্যই
  const tags = String(j.hashtags_en ?? "").match(/#[A-Za-z][A-Za-z0-9_]{1,30}/g) ?? [];
  const uniq = [...new Set(tags.map((t) => t))].slice(0, 6);
  if (!uniq.some((t) => t.toLowerCase() === "#niiharika")) uniq.push("#Niiharika");
  j.hashtags_en = uniq.join(" ");
  if (j.social_caption_bn) j.social_caption_bn = String(j.social_caption_bn).replace(/#[^\s#]+/g, "").replace(/[ \t]+\n/g, "\n").trim();
  j.category = ["science", "tech", "bangladesh", "world", "skip"].includes(j.category) ? j.category : undefined;
  return j;
}

type Task = "write" | "curate";

async function geminiText(model: string, prompt: string, temperature: number): Promise<string> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature } }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 140)}`);
  return (await r.json()).candidates[0].content.parts[0].text;
}

// OpenAI-সামঞ্জস্যপূর্ণ API (Groq, Mistral, OpenRouter)
async function chatText(url: string, key: string, model: string, prompt: string, temperature: number, extraHeaders: Record<string, string> = {}): Promise<string> {
  const r = await fetch(url, {
    method: "POST", signal: AbortSignal.timeout(90000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...extraHeaders },
    body: JSON.stringify({ model, temperature, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 140)}`);
  const j = await r.json();
  const t = j?.choices?.[0]?.message?.content;
  if (!t) throw new Error("empty response");
  return t;
}

async function cloudflareText(prompt: string, temperature: number): Promise<string> {
  const id = process.env.CF_ACCOUNT_ID, tok = process.env.CF_API_TOKEN;
  const model = process.env.CF_TEXT_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${id}/ai/run/${model}`, {
    method: "POST", signal: AbortSignal.timeout(90000),
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt + "\n\nশুধু বৈধ JSON দাও।" }], temperature, max_tokens: 2048 }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 140)}`);
  const t = (await r.json())?.result?.response;
  if (!t) throw new Error("empty response");
  return typeof t === "string" ? t : JSON.stringify(t);
}

export function hasAI() {
  return !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.MISTRAL_API_KEY || process.env.OPENROUTER_API_KEY || (process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN));
}

// Gemini ফ্রি-টিয়ারে প্রতিটি মডেলের আলাদা দৈনিক কোটা (3.x Flash ~২০/দিন, Flash-Lite অনেক বেশি)। তাই একাধিক মডেল ঘুরিয়ে ব্যবহার।
function geminiModels(task: Task): string[] {
  const custom = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "").split(",").map((x) => x.trim()).filter(Boolean);
  const quality = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];
  const lite = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash"];
  if (custom.length) return task === "curate" ? [...custom.filter((m) => /lite/.test(m)), ...custom.filter((m) => !/lite/.test(m))] : custom;
  return task === "curate" ? lite : quality;
}

const dead = new Set<string>();   // এই রানে কোটা শেষ/অনুপলব্ধ প্রোভাইডার আর চেষ্টা করা হয় না

// প্রোভাইডার ক্রমে চেষ্টা; কোটা/404 হলে পরেরটায়। validate ব্যর্থ হলেও পরেরটায় যায়।
async function llm<T>(prompt: string, temperature: number, validate: (t: string) => T, task: Task): Promise<T> {
  const P: [string, () => Promise<string>][] = [];
  if (process.env.GEMINI_API_KEY) for (const m of geminiModels(task)) P.push([`gemini:${m}`, () => geminiText(m, prompt, temperature)]);
  if (process.env.GROQ_API_KEY) P.push(["groq", () => chatText("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY!, process.env.GROQ_MODEL || "llama-3.3-70b-versatile", prompt, temperature)]);
  if (process.env.MISTRAL_API_KEY) P.push(["mistral", () => chatText("https://api.mistral.ai/v1/chat/completions", process.env.MISTRAL_API_KEY!, process.env.MISTRAL_MODEL || "mistral-small-latest", prompt, temperature)]);
  if (process.env.OPENROUTER_API_KEY) P.push(["openrouter", () => chatText("https://openrouter.ai/api/v1/chat/completions", process.env.OPENROUTER_API_KEY!, process.env.OPENROUTER_MODEL || "openrouter/free", prompt, temperature, { "X-Title": "Niiharika" })]);
  if (process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN) P.push(["cloudflare", () => cloudflareText(prompt, temperature)]);
  if (!P.length) throw new Error("কোনো AI key নেই (GEMINI_API_KEY ইত্যাদি GitHub Secrets-এ দিন)");
  const errors: string[] = [];
  for (const [name, fn] of P) {
    if (dead.has(name)) continue;
    try { return validate(await fn()); }
    catch (e) {
      const msg = (e as Error).message;
      if (/HTTP (404|429|403|401)/.test(msg)) dead.add(name);   // কোটা/মডেল/কী সমস্যা: এই রানে আর নয়
      errors.push(`${name}: ${msg}`);
    }
  }
  throw new Error("সব AI ব্যর্থ: " + errors.join(" | "));
}

export async function generate(title: string, summary: string, source: string, url: string): Promise<Generated> {
  return llm(PROMPT(title, summary, source, url), 0.7, parse, "write");
}

// সম্পাদকীয় বাছাই: কোনটি সবচেয়ে গুরুত্বপূর্ণ ও পাঠকের কাজের খবর
export type Candidate = { title: string; summary: string; source: string; others: number };
export async function curate(items: Candidate[], categoryLabel: string): Promise<{ index: number; reason: string }> {
  const list = items.map((it, i) => `${i}. [${it.source}${it.others ? `; আরও ${it.others}টি ভিন্ন সূত্রেও এসেছে` : ""}] ${it.title} — ${it.summary.replace(/\s+/g, " ").slice(0, 220)}`).join("\n");
  const prompt = `তুমি "নীহারিকা" বিজ্ঞান ও প্রযুক্তি নিউজ পোর্টালের সম্পাদক। নিচের খবরগুলো "${categoryLabel}" বিভাগের জন্য। এখন প্রকাশের জন্য সবচেয়ে ভালো একটি বাছো।

বাধ্যতামূলক শর্ত:
- খবরটি আসলেই "${categoryLabel}" বিভাগের হতে হবে। "বাংলাদেশ" বিভাগে শুধু যে খবর সত্যিই বাংলাদেশ নিয়ে (দেশের ঘটনা, সরকার, অর্থনীতি, নাগরিক); বাংলাদেশি পত্রিকায় ছাপা বিদেশের ঘটনা বাদ।
- খেলাধুলা, বিনোদন, সেলিব্রিটি, গসিপ, বিজ্ঞাপন/ডিল/রিভিউ, ব্যক্তিগত মতামত, জীবনযাপন-টিপস সবসময় বাদ।

বাছাইয়ের মাপকাঠি (গুরুত্ব অনুযায়ী):
১) গুরুত্ব ও নতুনত্ব: বড় আবিষ্কার/ঘটনা, নীতি বা প্রযুক্তিতে বড় পরিবর্তন, অনেক মানুষের উপর প্রভাব।
২) পাঠকের আগ্রহ: বাংলাভাষী পাঠক জানতে চাইবে এমন।
৩) নির্ভরযোগ্যতা: একাধিক সূত্রে এলে বেশি গুরুত্ব দাও।
৪) ছোটখাটো ঘোষণা, পুরনো বা পুনরাবৃত্ত খবর এড়াও।

খবরের তালিকা:
${list}

যদি কোনোটিই শর্ত মেনে উপযুক্ত না হয় তবে index দাও -1। শুধু JSON দাও: {"index": <সংখ্যা বা -1>, "reason": "এক বাক্যে কারণ"}`;
  return llm(prompt, 0.2, (t) => {
    const j = JSON.parse(t.replace(/```json|```/g, "").trim());
    if (!Number.isInteger(j.index) || j.index < -1 || j.index >= items.length) throw new Error("bad index");
    return { index: j.index, reason: String(j.reason ?? "") };
  }, "curate");
}

// ---------------------------------------------------------------------------
// স্থায়ী-মানের (খবর নয়) পোস্ট: ভালো অভ্যাস, মজার তথ্য, ভুল ধারণা ভাঙা, বিজ্ঞান-প্রযুক্তি ব্যাখ্যা
// ---------------------------------------------------------------------------
export type Evergreen = Generated & { banner_highlight: string };

const KIND_DESC: Record<string, string> = {
  tip: "ভালো অভ্যাস: মানুষকে উৎসাহিত করার মতো একটি সহজ, প্রমাণভিত্তিক অভ্যাস ও তার উপকারিতা (যেমন সময়মতো ঘুমানো)।",
  fact: "মজার বৈজ্ঞানিক তথ্য: বিজ্ঞান, মহাকাশ, মানবদেহ, প্রকৃতি বা প্রযুক্তির আগ্রহ-জাগানো সত্য তথ্য।",
  myth: "ভুল ধারণা ভাঙা: মানুষের মধ্যে প্রচলিত একটি সাধারণ ভুল ধারণা তুলে ধরে সত্যটি ব্যাখ্যা করা।",
  explainer: "ব্যাখ্যা: কোনো বৈজ্ঞানিক আবিষ্কার বা প্রযুক্তি কীভাবে কাজ করে তা সহজ ভাষায় বোঝানো।",
};
export const EVERGREEN_KINDS = Object.keys(KIND_DESC);
export const EVERGREEN_AREAS: Record<string, string[]> = {
  tip: ["ঘুম", "পানি পান", "হাঁটা ও শরীরচর্চা", "স্ক্রিন-টাইম ও চোখের যত্ন", "সুষম খাবারের সাধারণ নিয়ম", "মানসিক প্রশান্তি ও বিশ্রাম", "পড়াশোনার কার্যকর অভ্যাস", "পরিবেশ বাঁচানোর ছোট অভ্যাস", "হাত ধোয়া ও পরিচ্ছন্নতা", "সূর্যের আলো ও সময়সূচি"],
  fact: ["মহাকাশ", "মানবদেহ", "সাগর ও পৃথিবী", "আলো ও শব্দ", "গণিত ও সংখ্যা", "রসায়ন ও দৈনন্দিন জীবন", "আবহাওয়া ও জলবায়ু", "কম্পিউটার ও ইন্টারনেটের ইতিহাস"],
  myth: ["মস্তিষ্ক নিয়ে ভুল ধারণা", "খাবার ও পুষ্টি নিয়ে ভুল ধারণা", "আবহাওয়া নিয়ে ভুল ধারণা", "মহাকাশ নিয়ে ভুল ধারণা", "প্রযুক্তি ও মোবাইল নিয়ে ভুল ধারণা", "বিজ্ঞান নিয়ে প্রচলিত গুজব"],
  explainer: ["কৃত্রিম বুদ্ধিমত্তা (AI)", "মহাকাশ অভিযান", "নবায়নযোগ্য শক্তি", "ইন্টারনেট কীভাবে কাজ করে", "ভ্যাকসিন কীভাবে কাজ করে (সাধারণ ধারণা)", "জিপিএস/স্যাটেলাইট", "ব্যাটারি ও বিদ্যুৎ", "রোবটিক্স"],
};

export async function generateEvergreen(kind: string, area: string, avoid: string[]): Promise<Evergreen> {
  const prompt = `তুমি "নীহারিকা" বিজ্ঞান ও প্রযুক্তি পোর্টালের সম্পাদক। এখন খবর নয়, একটি স্থায়ী-মানের শিক্ষামূলক পোস্ট লেখো।

ধরন: ${KIND_DESC[kind]}
বিষয়ের এলাকা: ${area}

কঠোর নিয়ম:
- শুধু সুপ্রতিষ্ঠিত, বহুল-স্বীকৃত বৈজ্ঞানিক তথ্য। অনিশ্চিত, বিতর্কিত বা নতুন-গবেষণার দাবি নয়। সংখ্যা/পরিসংখ্যান তখনই দেবে যখন সর্বজনবিদিত ও নির্ভুল; নইলে সংখ্যা বাদ দাও।
- স্বাস্থ্য-বিষয়ক হলে: শুধু সাধারণ ভালো অভ্যাস। চিকিৎসা, ওষুধ, মাত্রা, রোগ নিরাময় বা রোগ-প্রতিরোধের দাবি নয়। body_bn-এর শেষে এক বাক্যে মনে করিয়ে দাও যে এটি সাধারণ তথ্য, ব্যক্তিগত সমস্যায় চিকিৎসকের পরামর্শ নিতে হবে।
- ভুল ধারণার ধরন হলে: প্রচলিত ভুল ধারণাটি স্পষ্ট করে বলো, তারপর সত্যটি ব্যাখ্যা করো।
- নিচের বিষয়গুলো আগেই প্রকাশিত, এগুলোর পুনরাবৃত্তি বা কাছাকাছি কিছু লিখবে না: ${avoid.length ? avoid.join("; ") : "(কিছু নেই)"}
- সহজ, উৎসাহব্যঞ্জক, বন্ধুসুলভ বাংলা।

ফিল্ড:
- title_bn: **ছোট** (সর্বোচ্চ ৫০ অক্ষর), সুন্দর ও আগ্রহ-জাগানো; ছবিতে বসবে।
- banner_highlight: title_bn থেকে **হুবহু** ১–২টি শব্দ (কমা দিয়ে আলাদা), যেগুলো ছবিতে রঙিন হবে।
- body_bn: ১২০–১৮০ শব্দ, ৩টি ছোট অনুচ্ছেদ (মাঝে ফাঁকা লাইন): (১) চমকপ্রদ শুরু, (২) ব্যাখ্যা, (৩) সহজ করণীয় বা মূল কথা।
- excerpt_bn: ১–২ বাক্য।
- social_caption_bn: **২–৩ লাইন, ছোট ও আকর্ষণীয়**, শেষে প্রশ্ন নয়, ১–২টি ইমোজি, হ্যাশট্যাগ/লিংক নয়।
- hashtags_en: ৪–৬টি, শুধু ইংরেজি অক্ষরে, # দিয়ে শুরু, একটি অবশ্যই #Niiharika।
- title_en, body_en (৮০–১২০ শব্দ ইংরেজি)।
- image_prompt: ইংরেজিতে ১–২ বাক্য। **কঠোর নিয়ম:** কোনো প্রাণী (পশু-পাখি-মাছ-পোকা) নয়; কোনো মানুষের মুখ/চোখ/ঠোঁট নয়। বস্তু, প্রকৃতি-দৃশ্য, মহাকাশ, যন্ত্র, ছায়ামূর্তি বা চোখ-মুখহীন সরল কার্টুন-অবয়ব চলবে। কোনো লেখা/অক্ষর/লোগো নয়। সুন্দর, রঙিন, সিনেমাটিক।

শুধু JSON দাও: {"title_bn":"...","banner_highlight":"...","body_bn":"...","excerpt_bn":"...","social_caption_bn":"...","hashtags_en":"#Science #Niiharika","title_en":"...","body_en":"...","image_prompt":"..."}`;
  return llm(prompt, 0.9, (t) => {
    const j = parse(t) as Evergreen;
    j.banner_highlight = String((JSON.parse(t.replace(/```json|```/g, "").trim()).banner_highlight) ?? "").trim();
    if (j.title_bn.length > 70) throw new Error("title too long");
    return j;
  }, "write");
}

// জেনারেট করা ছবিতে প্রাণী বা মানুষের মুখ আছে কি না (Gemini দিয়ে)। true = নিয়ম ভাঙে; null = যাচাই করা যায়নি
export async function imageBreaksRules(buf: Buffer): Promise<boolean | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const sharp = (await import("sharp")).default;
    const small = await sharp(buf).resize(512, 512, { fit: "inside" }).jpeg({ quality: 70 }).toBuffer();
    const prompt = 'Look at the image. Reply with JSON only: {"animal": true|false, "face": true|false}. "animal" = any animal, bird, fish or insect is visible, even partially. "face" = any human face, eyes or mouth are visible. Silhouettes and faceless cartoon figures without eyes and mouth are NOT faces.';
    for (const model of ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"]) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", signal: AbortSignal.timeout(45000),
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: small.toString("base64") } }, { text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0 } }),
      });
      if (!r.ok) continue;
      const j = JSON.parse(((await r.json()).candidates[0].content.parts[0].text as string).replace(/```json|```/g, "").trim());
      return !!(j.animal || j.face);
    }
  } catch { /* যাচাই ব্যর্থ হলে গ্রহণ */ }
  return null;
}
