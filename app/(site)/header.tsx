"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATS } from "@/lib/site";

// বাংলা ↔ English: বর্তমান পাতা অনুযায়ী উল্টো ভাষার সমতুল্য পাতায় নেয়
export default function Header() {
  const p = usePathname() || "/";
  const en = p === "/en" || p.startsWith("/en/");
  const bnPath = en ? p.replace(/^\/en/, "") || "/" : p;
  const enPath = en ? p : p.startsWith("/article/") ? `/en${p}` : "/en";
  return (
    <header className="head">
      <Link href={en ? "/en" : "/"} className="logo">
        <svg className="mark" viewBox="0 0 64 64" aria-hidden="true">
          <defs><radialGradient id="mk" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#d7c9ff" /><stop offset=".6" stopColor="#6f7cff" /><stop offset="1" stopColor="#2b3a8c" /></radialGradient></defs>
          <circle cx="32" cy="32" r="30" fill="url(#mk)" />
          <path d="M32 11 L36.5 27.5 L53 32 L36.5 36.5 L32 53 L27.5 36.5 L11 32 L27.5 27.5 Z" fill="#fff" />
        </svg>
        <span>নীহারিকা <small>Niiharika</small></span>
      </Link>
      <nav className="nav">
        {en ? <Link href="/en">Latest</Link> : Object.entries(CATS).map(([k, v]) => <Link key={k} href={`/category/${k}`}>{v}</Link>)}
        {!en && <Link href="/search">খুঁজুন</Link>}
        {en ? <Link className="lang" href={bnPath} hrefLang="bn">বাংলা</Link> : <Link className="lang" href={enPath} hrefLang="en">English</Link>}
      </nav>
    </header>
  );
}
