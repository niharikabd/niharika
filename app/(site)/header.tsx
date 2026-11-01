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
          <img className="mark" src="/logo-badge.png" alt="" width={36} height={36} />
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
