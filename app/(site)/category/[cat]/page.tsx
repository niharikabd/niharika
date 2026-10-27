import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATS } from "@/lib/site";
import { latest } from "@/lib/queries";
import { Card } from "../../components";

export const revalidate = 600;
type P = { params: Promise<{ cat: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { cat } = await params;
  if (!CATS[cat]) return {};
  return { title: `${CATS[cat]} – সর্বশেষ খবর`, description: `${CATS[cat]} বিভাগের সর্বশেষ খবর, নীহারিকায়।`, alternates: { canonical: `/category/${cat}` } };
}

export default async function Category({ params }: P) {
  const { cat } = await params;
  if (!CATS[cat]) notFound();
  const items = await latest(40, cat);
  return (
    <>
      <h1>{CATS[cat]}</h1>
      {items.map((a) => <Card key={a.slug} a={a} />)}
      {!items.length && <p className="meta">এই বিভাগে এখনো কোনো খবর নেই।</p>}
    </>
  );
}
