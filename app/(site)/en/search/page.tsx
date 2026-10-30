import type { Metadata } from "next";
import { publicClient } from "@/lib/supabase";
import { Card } from "../../components";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function EnSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").replace(/[%,()*]/g, " ").trim().slice(0, 60);
  const items = q
    ? (await publicClient().from("articles").select("slug,title_bn,title_en,excerpt,body_en,category,published_at,banner_url").eq("status", "published").or(`title_en.ilike.%${q}%,body_en.ilike.%${q}%,title_bn.ilike.%${q}%`).order("published_at", { ascending: false }).limit(30)).data ?? []
    : [];
  return (
    <div lang="en">
      <form action="/en/search"><input name="q" defaultValue={q} placeholder="Search news" /></form>
      {q && !items.filter((a) => a.title_en).length && <p className="meta">No results found.</p>}
      {items.filter((a) => a.title_en).map((a) => <Card key={a.slug} a={a} en />)}
    </div>
  );
}
