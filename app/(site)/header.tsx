"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATS, CAT_EN } from "@/lib/site";
import { CatIcon, Search } from "./icons";

const setLang = (l: "bn" | "en") => { try { document.cookie = `nh_lang=${l}; path=/; max-age=31536000; samesite=lax`; } catch { /* উপেক্ষা */ } };

// বাংলা ↔ English: বর্তমান পাতার সমতুল্য পাতায় নেয় এবং পছন্দ কুকিতে মনে রাখে
export default function Header() {
  const p = usePathname() || "/";
  const en = p === "/en" || p.startsWith("/en/");
  const bnPath = en ? p.replace(/^\/en/, "") || "/" : p;
  const enPath = en ? p : p.startsWith("/article/") ? `/en${p}` : p.startsWith("/category/") ? `/en${p}` : "/en";
  const labels = en ? CAT_EN : CATS;
  const base = en ? "/en/category/" : "/category/";
  return (
    <header className="head">
      <div className="head-top">
        <Link href={en ? "/en" : "/"} className="logo">
          <svg className="mark" viewBox="0 0 64 64" aria-hidden="true">
            <defs><radialGradient id="mk" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#d7c9ff" /><stop offset=".6" stopColor="#6f7cff" /><stop offset="1" stopColor="#2b3a8c" /></radialGradient></defs>
            <circle cx="32" cy="32" r="30" fill="url(#mk)" />
            <path d="M32 11 L36.5 27.5 L53 32 L36.5 36.5 L32 53 L27.5 36.5 L11 32 L27.5 27.5 Z" fill="#fff" />
          </svg>
          <span>{en ? "Niiharika" : <>নীহারিকা <small>Niiharika</small></>}</span>
        </Link>
        <form className="searchbar" action={en ? "/en/search" : "/search"} role="search">
          <Search size={18} />
          <input name="q" type="search" placeholder={en ? "Search news…" : "খবর খুঁজুন…"} aria-label={en ? "Search" : "খুঁজুন"} />
        </form>
        {en
          ? <Link className="lang" href={bnPath} hrefLang="bn" onClick={() => setLang("bn")}>বাংলা</Link>
          : <Link className="lang" href={enPath} hrefLang="en" onClick={() => setLang("en")}>English</Link>}
      </div>
      <nav className="catnav" aria-label={en ? "Categories" : "বিভাগ"}>
        {Object.entries(labels).map(([k, v]) => <Link key={k} href={`${base}${k}`} className={`chip c-${k}`}><CatIcon cat={k} size={16} />{v}</Link>)}
      </nav>
    </header>
  );
}
