"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATS, CAT_EN, SOCIAL } from "@/lib/site";
import { Facebook, Instagram, Telegram, Mail, Rss } from "./icons";

export default function Footer() {
  const p = usePathname() || "/";
  const en = p === "/en" || p.startsWith("/en/");
  const labels = en ? CAT_EN : CATS;
  const base = en ? "/en/category/" : "/category/";
  const t = en
    ? { about: "Science and technology news in simple language. Collected from reliable sources, written with AI assistance in our own words, always with a link to the original source.", cats: "Categories", info: "Information", contact: "Contact", us: "About us", pol: "Editorial policy", priv: "Privacy policy", other: "বাংলা সংস্করণ", otherHref: "/", social: "Social media", rss: "RSS feed", rights: "All rights reserved.", note: "AI-assisted · links to original sources · tell us if you spot a mistake", search: "Search" }
    : { about: "বিজ্ঞান ও প্রযুক্তির খবর, সহজ বাংলায়। নির্ভরযোগ্য সূত্র থেকে সংগ্রহ করে AI-সহায়তায় নিজের ভাষায় লেখা, প্রতিটি খবরে মূল সূত্রের লিংকসহ।", cats: "বিভাগ", info: "তথ্য", contact: "যোগাযোগ", us: "আমাদের সম্পর্কে", pol: "সম্পাদকীয় নীতি", priv: "গোপনীয়তা নীতি", other: "English edition", otherHref: "/en", social: "সোশ্যাল মিডিয়া", rss: "RSS ফিড", rights: "সর্বস্বত্ব সংরক্ষিত।", note: "AI-সহায়তায় তৈরি · মূল সূত্রের লিংকসহ · ভুল চোখে পড়লে আমাদের জানান", search: "খুঁজুন" };
  const pre = en ? "/en" : "";
  return (
    <footer className="sfoot">
      <div className="sfoot-in">
        <div className="sfoot-col brand">
          <div className="sfoot-logo">
            <img className="mark" src="/logo-badge.png" alt="" width={32} height={32} />
            <strong>{en ? "Niiharika" : "নীহারিকা"}</strong> {!en && <span className="muted">Niiharika</span>}
          </div>
          <p>{t.about}</p>
        </div>

        <div className="sfoot-col">
          <h4>{t.cats}</h4>
          <ul>{Object.entries(labels).map(([k, v]) => <li key={k}><Link href={`${base}${k}`}>{v}</Link></li>)}<li><Link href={`${pre}/search`}>{t.search}</Link></li></ul>
        </div>

        <div className="sfoot-col">
          <h4>{t.info}</h4>
          <ul>
            <li><Link href={`${pre}/about`}>{t.us}</Link></li>
            <li><Link href={`${pre}/editorial-policy`}>{t.pol}</Link></li>
            <li><Link href={`${pre}/privacy-policy`}>{t.priv}</Link></li>
            <li><Link href={t.otherHref} onClick={() => { try { document.cookie = `nh_lang=${en ? "bn" : "en"}; path=/; max-age=31536000; samesite=lax`; } catch { /* উপেক্ষা */ } }}>{t.other}</Link></li>
          </ul>
        </div>

        <div className="sfoot-col contact">
          <h4>{t.contact}</h4>
          <ul className="icons">
            <li><a href="mailto:contact.niiharika@gmail.com"><Mail size={18} /><span>contact.niiharika@gmail.com</span></a></li>
            <li><a href="/rss.xml"><Rss size={18} /><span>{t.rss}</span></a></li>
          </ul>
          <div className="social" aria-label={t.social}>
            <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook: niiharika.fb" title="Facebook"><Facebook size={20} /></a>
            <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram: niiharika.bd" title="Instagram"><Instagram size={20} /></a>
            <a href={SOCIAL.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram: niiharikatelegram" title="Telegram"><Telegram size={20} /></a>
          </div>
        </div>
      </div>
      <div className="sfoot-bar">
        <span>© {new Date().getFullYear()} {en ? "Niiharika" : "নীহারিকা (Niiharika)"}. {t.rights}</span>
        <span>{t.note}</span>
      </div>
    </footer>
  );
}
