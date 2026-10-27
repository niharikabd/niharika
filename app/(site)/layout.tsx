import Link from "next/link";
import { CATS } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="head">
        <Link href="/" className="logo">নীহারিকা <small>Niharika</small></Link>
        <nav className="nav">
          {Object.entries(CATS).map(([k, v]) => <Link key={k} href={`/category/${k}`}>{v}</Link>)}
          <Link href="/search">খুঁজুন</Link>
          <Link href="/en">English</Link>
        </nav>
      </header>
      <main className="wrap">{children}</main>
      <footer className="foot">
        <Link href="/about">আমাদের সম্পর্কে</Link> · <Link href="/editorial-policy">সম্পাদকীয় নীতি</Link> · <Link href="/privacy-policy">গোপনীয়তা নীতি</Link> · <Link href="/rss.xml">RSS</Link>
        <p>© নীহারিকা · AI-সহায়তায় তৈরি, মূল সূত্রের লিংকসহ</p>
      </footer>
    </>
  );
}
