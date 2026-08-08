import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_AUTH_COOKIE, expectedAdminCookieValue } from "@/lib/adminAuth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/passcode") return NextResponse.next();

  const cookie = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;
  const expected = await expectedAdminCookieValue();
  if (cookie === expected) return NextResponse.next();

  const url = new URL("/admin/passcode", request.url);
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: "/admin/:path*",
};
