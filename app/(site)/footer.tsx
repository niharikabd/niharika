import Link from "next/link";
import { CATS } from "@/lib/site";
import { Facebook, Instagram, Telegram, Mail, Rss } from "./icons";

export default function Footer() {
  return (
    <footer className="sfoot">
      <div className="sfoot-in">
        <div className="sfoot-col brand">
          <div className="sfoot-logo">
            <svg className="mark" viewBox="0 0 64 64" aria-hidden="true">
              <defs><radialGradient id="mk2" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#d7c9ff" /><stop offset=".6" stopColor="#6f7cff" /><stop offset="1" stopColor="#2b3a8c" /></radialGradient></defs>
              <circle cx="32" cy="32" r="30" fill="url(#mk2)" />
              <path d="M32 11 L36.5 27.5 L53 32 L36.5 36.5 L32 53 L27.5 36.5 L11 32 L27.5 27.5 Z" fill="#fff" />
            </svg>
            <strong>নীহারিকা</strong> <span className="muted">Niiharika</span>
          </div>
          <p>বিজ্ঞান ও প্রযুক্তির খবর, সহজ বাংলায়। নির্ভরযোগ্য সূত্র থেকে সংগ্রহ করে AI-সহায়তায় নিজের ভাষায় লেখা, প্রতিটি খবরে মূল সূত্রের লিংকসহ।</p>
        </div>

        <div className="sfoot-col">
          <h4>বিভাগ</h4>
          <ul>{Object.entries(CATS).map(([k, v]) => <li key={k}><Link href={`/category/${k}`}>{v}</Link></li>)}<li><Link href="/search">খুঁজুন</Link></li></ul>
        </div>

        <div className="sfoot-col">
          <h4>তথ্য</h4>
          <ul>
            <li><Link href="/about">আমাদের সম্পর্কে</Link></li>
            <li><Link href="/editorial-policy">সম্পাদকীয় নীতি</Link></li>
            <li><Link href="/privacy-policy">গোপনীয়তা নীতি</Link></li>
            <li><Link href="/en">English edition</Link></li>
          </ul>
        </div>

        <div className="sfoot-col">
          <h4>যোগাযোগ</h4>
          <ul className="icons">
            <li><a href="mailto:contact.niiharika@gmail.com"><Mail size={18} /><span>contact.niiharika@gmail.com</span></a></li>
            <li><a href="/rss.xml"><Rss size={18} /><span>RSS ফিড</span></a></li>
          </ul>
          <div className="social" aria-label="সোশ্যাল মিডিয়া">
            <a href="https://www.facebook.com/niiharika.fb" target="_blank" rel="noopener noreferrer" aria-label="Facebook: niiharika.fb" title="Facebook"><Facebook size={20} /></a>
            <a href="https://www.instagram.com/niiharika.bd" target="_blank" rel="noopener noreferrer" aria-label="Instagram: niiharika.bd" title="Instagram"><Instagram size={20} /></a>
            <a href="https://t.me/niiharikatelegram" target="_blank" rel="noopener noreferrer" aria-label="Telegram: niiharikatelegram" title="Telegram"><Telegram size={20} /></a>
          </div>
        </div>
      </div>
      <div className="sfoot-bar">
        <span>© {new Date().getFullYear()} নীহারিকা (Niiharika)। সর্বস্বত্ব সংরক্ষিত।</span>
        <span>AI-সহায়তায় তৈরি · মূল সূত্রের লিংকসহ · ভুল চোখে পড়লে আমাদের জানান</span>
      </div>
    </footer>
  );
}
