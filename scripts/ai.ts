// Gemini (প্রধান) → Groq (ফলব্যাক)
export type Generated = { title_bn: string; title_en: string; body_bn: string; body_en: string; excerpt_bn: string };

const PROMPT = (title: string, summary: string, source: string, url: string) => `তুমি একজন বিজ্ঞান-সাংবাদিক সম্পাদক। নিচের খবরের সূত্র থেকে নিজের ভাষায় সংক্ষিপ্ত সারাংশ লেখো। মূল লেখার বাক্য কপি বা হুবহু অনুবাদ করবে না। নিজে কিছু বানাবে না; সূত্রে যা নেই তা যোগ করবে না।

সূত্র: ${source}
লিংক: ${url}
শিরোনাম: ${title}
সংক্ষেপ: ${summary}

শুধু এই JSON ফরম্যাটে উত্তর দাও (অন্য কিছু নয়):
{"title_bn":"...","title_en":"...","body_bn":"১২০-১৮০ শব্দের সহজ বাংলা সারাংশ","body_en":"80-120 word English summary","excerpt_bn":"১-২ বাক্যের সারকথা"}`;

function parse(text: string): Generated {
  const j = JSON.parse(text.replace(/```json|```/g, "").trim());
  for (const k of ["title_bn", "title_en", "body_bn", "body_en", "excerpt_bn"]) {
    if (typeof j[k] !== "string" || !j[k].trim()) throw new Error(`missing field ${k}`);
  }
  return j;
}

async function gemini(prompt: string): Promise<Generated> {
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.4 } }),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return parse((await r.json()).candidates[0].content.parts[0].text);
}

async function groq(prompt: string): Promise<Generated> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({ model, temperature: 0.4, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`groq ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return parse((await r.json()).choices[0].message.content);
}

export function hasAI() { return !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY); }

export async function generate(title: string, summary: string, source: string, url: string): Promise<Generated> {
  const prompt = PROMPT(title, summary, source, url);
  const providers: [string, () => Promise<Generated>][] = [];
  if (process.env.GEMINI_API_KEY) providers.push(["gemini", () => gemini(prompt)]);
  if (process.env.GROQ_API_KEY) providers.push(["groq", () => groq(prompt)]);
  if (!providers.length) throw new Error("কোনো AI key নেই (GEMINI_API_KEY বা GROQ_API_KEY GitHub Secrets-এ দিন)");
  const errors: string[] = [];
  for (const [name, fn] of providers) {
    for (let i = 0; i < 2; i++) {
      try { return await fn(); } catch (e) { errors.push(`${name}#${i + 1}: ${(e as Error).message}`); }
    }
  }
  throw new Error("AI failed: " + errors.join(" | "));
}
