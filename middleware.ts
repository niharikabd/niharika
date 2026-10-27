import { NextResponse, type NextRequest } from "next/server";

const NOINDEX = "noindex, nofollow, noarchive";

export function middleware(req: NextRequest) {
  const ap = process.env.ADMIN_PATH;
  const p = req.nextUrl.pathname;

  if (ap && (p === `/${ap}` || p.startsWith(`/${ap}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = "/zz-admin" + p.slice(ap.length + 1);
    const res = NextResponse.rewrite(url);
    res.headers.set("X-Robots-Tag", NOINDEX);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  // ভেতরের পাথে সরাসরি ঢোকা যাবে না
  if (p === "/zz-admin" || p.startsWith("/zz-admin/")) {
    return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": NOINDEX } });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"] };
