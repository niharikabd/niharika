import type { Metadata } from "next";
import { latest } from "@/lib/queries";
import { Card } from "../components";

export const revalidate = 600;
export const metadata: Metadata = { title: "Niiharika – Science & Technology News", description: "Science, technology, Bangladesh and world news. AI-assisted, with source links.", alternates: { canonical: "/en", languages: { bn: "/", en: "/en" } } };

export default async function EnHome() {
  const items = (await latest(40)).filter((a) => a.title_en);
  return <div lang="en"><h1 style={{ fontSize: "1.2rem" }}>Latest news</h1>{items.map((a) => <Card key={a.slug} a={a} en />)}</div>;
}
