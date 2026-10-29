// Gemini (প্রধান, একাধিক মডেল ফলব্যাক) → Groq (ফলব্যাক)
export type Generated = {
  title_bn: string; title_en: string; body_bn: string; body_en: string; excerpt_bn: string;
  social_caption_bn?: string; image_prompt?: string;
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
- social_caption_bn: Facebook/Instagram ক্যাপশন, ৪–৬ লাইন। প্রথম লাইনে হুক, মাঝে ২–৩ লাইনে সারকথা, শেষে পাঠকের প্রতি একটি প্রশ্ন। ২–৩টি মানানসই ইমোজি, সবশেষ লাইনে ৩–৪টি হ্যাশট্যাগ (#নীহারিকা সহ)। লিংক বা সূত্রের নাম দেবে না।
- image_prompt: ইংরেজিতে ১–২ বাক্যে ছবির দৃশ্যের বর্ণনা। কোনো লেখা, অক্ষর, লোগো বা নির্দিষ্ট বাস্তব মানুষের মুখ থাকবে না। বিষয়-নির্দিষ্ট, সুন্দর, সিনেমাটিক।

সূত্র: ${source}
লিংক: ${url}
শিরোনাম: ${title}
সংক্ষেপ: ${summary}

শুধু এই JSON ফরম্যাটে উত্তর দাও (অন্য কিছু নয়):
{"title_bn":"...","title_en":"...","body_bn":"...","body_en":"80-120 word engaging English summary","excerpt_bn":"...","social_caption_bn":"...","image_prompt":"..."}`;

function parse(text: string): Generated {
  const j = JSON.parse(text.replace(/```json|```/g, "").trim());
  for (const k of ["title_bn", "title_en", "body_bn", "body_en", "excerpt_bn"]) {
    if (typeof j[k] !== "string" || !j[k].trim()) throw new Error(`missing field ${k}`);
  }
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
export async function curate(items: Candidate[]): Promise<{ index: number; reason: string }> {
  const list = items.map((it, i) => `${i}. [${it.source}${it.others ? `; আরও ${it.others}টি ভিন্ন সূত্রেও এসেছে` : ""}] ${it.title} — ${it.summary.replace(/\s+/g, " ").slice(0, 220)}`).join("\n");
  const prompt = `তুমি "নীহারিকা" বিজ্ঞান ও প্রযুক্তি নিউজ পোর্টালের সম্পাদক। নিচের খবরগুলো থেকে এখন প্রকাশের জন্য সবচেয়ে ভালো একটি বাছো।

বাছাইয়ের মাপকাঠি (গুরুত্ব অনুযায়ী):
১) গুরুত্ব ও নতুনত্ব: বড় আবিষ্কার, নীতি/প্রযুক্তিতে বড় পরিবর্তন, অনেক মানুষের উপর প্রভাব।
২) পাঠকের আগ্রহ: বাংলাভাষী পাঠক (বিশেষত বাংলাদেশের) জানতে চাইবে এমন, কৌতূহলজাগানো।
৩) নির্ভরযোগ্যতা: একাধিক সূত্রে এলে বেশি গুরুত্ব দাও।
এড়াবে: বিজ্ঞাপন/ডিল/রিভিউ/কেনাকাটার পরামর্শ, গসিপ, ব্যক্তিগত মতামত লেখা, ছোটখাটো ঘোষণা, পুরনো বা পুনরাবৃত্ত খবর।

খবরের তালিকা:
${list}

শুধু JSON দাও: {"index": <সংখ্যা>, "reason": "এক বাক্যে কারণ"}`;
  return llm(prompt, 0.2, (t) => {
    const j = JSON.parse(t.replace(/```json|```/g, "").trim());
    if (!Number.isInteger(j.index) || j.index < 0 || j.index >= items.length) throw new Error("bad index");
    return { index: j.index, reason: String(j.reason ?? "") };
  }, "curate");
}
