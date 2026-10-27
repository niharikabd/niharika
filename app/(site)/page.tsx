import { latest } from "@/lib/queries";
import { SITE } from "@/lib/site";
import { Card } from "./components";

export const revalidate = 600;

export default async function Home() {
  const items = await latest(40);
  const ld = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "নীহারিকা", url: SITE, inLanguage: "bn" },
    { "@context": "https://schema.org", "@type": "NewsMediaOrganization", name: "নীহারিকা", url: SITE, logo: `${SITE}/icon.svg` },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h1 style={{ fontSize: "1.2rem" }}>সর্বশেষ খবর</h1>
      {items.map((a) => <Card key={a.slug} a={a} />)}
      {!items.length && <p className="meta">এখনো কোনো খবর প্রকাশিত হয়নি।</p>}
    </>
  );
}
