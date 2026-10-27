import Link from "next/link";
import { CATS } from "@/lib/site";

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

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
            <li><a href="mailto:contact.niiharika@gmail.com"><Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>contact.niiharika@gmail.com</a></li>
            <li><a href="https://www.facebook.com/niiharika.fb" target="_blank" rel="noopener"><Icon><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M21 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>Facebook · niiharika.fb</a></li>
            <li><a href="/rss.xml"><Icon><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" /></Icon>RSS ফিড</a></li>
          </ul>
        </div>
      </div>
      <div className="sfoot-bar">
        <span>© {new Date().getFullYear()} নীহারিকা (Niiharika)। সর্বস্বত্ব সংরক্ষিত।</span>
        <span>AI-সহায়তায় তৈরি · মূল সূত্রের লিংকসহ · ভুল চোখে পড়লে আমাদের জানান</span>
      </div>
    </footer>
  );
}
