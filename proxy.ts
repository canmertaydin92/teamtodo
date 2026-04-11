import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Auth sayfaları ve API rotaları — dokunma
  const isAuthPage = pathname === "/";
  const isApiRoute = pathname.startsWith("/api/");

  if (isApiRoute) return NextResponse.next();

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
