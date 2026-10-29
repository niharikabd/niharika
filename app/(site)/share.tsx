"use client";
import { useState } from "react";
import { Share } from "./icons";

// একটিমাত্র Share বাটন: মোবাইলে নেটিভ শেয়ার শিট (সব অ্যাপ), না থাকলে তালিকা
export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url), t = encodeURIComponent(title);

  async function onClick() {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try { await (navigator as any).share({ title, url }); return; } catch { /* বাতিল */ }
    }
    setOpen((o) => !o);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* উপেক্ষা */ }
  }
  const links: [string, string][] = [
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ["WhatsApp", `https://wa.me/?text=${t}%20${u}`],
    ["Telegram", `https://t.me/share/url?url=${u}&text=${t}`],
    ["X", `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
  ];
  return (
    <div className="sharewrap">
      <button type="button" className="btn sharebtn" onClick={onClick} aria-expanded={open}><Share /> শেয়ার করুন</button>
      {open && (
        <div className="sharemenu" role="menu">
          {links.map(([n, h]) => <a key={n} href={h} target="_blank" rel="noopener noreferrer" role="menuitem">{n}</a>)}
          <button type="button" onClick={copy} role="menuitem">{copied ? "কপি হয়েছে ✓" : "লিংক কপি"}</button>
        </div>
      )}
    </div>
  );
}
