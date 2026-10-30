import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { latest } from "@/lib/queries";
import { CAT_EN } from "@/lib/site";
import { Card } from "../../../components";

export const revalidate = 600;
type P = { params: Promise<{ cat: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { cat } = await params;
  if (!CAT_EN[cat]) return {};
  return { title: CAT_EN[cat], description: `Latest ${CAT_EN[cat]} news`, alternates: { canonical: `/en/category/${cat}`, languages: { bn: `/category/${cat}`, en: `/en/category/${cat}` } } };
}

export default async function EnCategory({ params }: P) {
  const { cat } = await params;
  if (!CAT_EN[cat]) notFound();
  const items = (await latest(60, cat)).filter((a) => a.title_en);
  return (
    <div lang="en">
      <h1>{CAT_EN[cat]}</h1>
      {items.map((a) => <Card key={a.slug} a={a} en />)}
      {!items.length && <p className="meta">No stories in this category yet.</p>}
    </div>
  );
}
