import type { MetadataRoute } from "next";
import { publicClient } from "@/lib/supabase";
import { SITE, CATS } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await publicClient().from("articles").select("slug,body_en,published_at,updated_at").eq("status", "published").order("published_at", { ascending: false }).limit(2000);
  const arts = data ?? [];
  return [
    { url: SITE, changeFrequency: "hourly", priority: 1 },
    ...Object.keys(CATS).map((c) => ({ url: `${SITE}/category/${c}`, changeFrequency: "hourly" as const, priority: 0.7 })),
    { url: `${SITE}/en` }, { url: `${SITE}/about` }, { url: `${SITE}/editorial-policy` }, { url: `${SITE}/privacy-policy` },
    ...arts.map((a) => ({ url: `${SITE}/article/${a.slug}`, lastModified: a.updated_at ?? a.published_at ?? undefined, priority: 0.8 })),
    ...arts.filter((a) => a.body_en).map((a) => ({ url: `${SITE}/en/article/${a.slug}`, lastModified: a.updated_at ?? undefined, priority: 0.5 })),
  ];
}
