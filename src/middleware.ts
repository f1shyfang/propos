import { type NextRequest, NextResponse } from "next/server";

import { fetchSession, sessionRole } from "@/lib/auth-middleware";

const AGENT_PREFIXES = [
  "/dashboard",
  "/briefs",
  "/properties",
  "/matches",
  "/pipeline",
  "/deals",
  "/docs",
  "/suggestions",
  "/off-market",
  "/account",
];

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/api/auth",
  "/api/beta-signup",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  if (pathname.startsWith("/_next")) return true;
  return false;
}

function isAgentRoute(pathname: string): boolean {
  return AGENT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPortalRoute(pathname: string): boolean {
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

function isPortalLogin(pathname: string): boolean {
  return pathname === "/portal/login";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const session = await fetchSession(request);
  const role = sessionRole(session);

  if (isPortalLogin(pathname)) {
    if (session && role === "client") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return NextResponse.next();
  }

  if (isPortalRoute(pathname)) {
    if (!session) {
      const login = new URL("/portal/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (role !== "client") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isAgentRoute(pathname)) {
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (role === "client") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
