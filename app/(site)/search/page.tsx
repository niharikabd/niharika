import type { Metadata } from "next";
import { publicClient } from "@/lib/supabase";
import { Card } from "../components";

export const metadata: Metadata = { title: "খুঁজুন", robots: { index: false, follow: true } };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").replace(/[%,()*]/g, " ").trim().slice(0, 60);
  const items = q
    ? (await publicClient().from("articles").select("slug,title_bn,title_en,excerpt,body_en,category,published_at,banner_url").eq("status", "published").or(`title_bn.ilike.%${q}%,title_en.ilike.%${q}%,excerpt.ilike.%${q}%`).order("published_at", { ascending: false }).limit(30)).data ?? []
    : [];
  return (
    <>
      <form action="/search"><input name="q" defaultValue={q} placeholder="খবর খুঁজুন…" /></form>
      {q && !items.length && <p className="meta">কিছু পাওয়া যায়নি।</p>}
      {items.map((a) => <Card key={a.slug} a={a} />)}
    </>
  );
}
