import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/briefs") ||
    pathname.startsWith("/properties") ||
    pathname.startsWith("/pipeline") ||
    pathname.startsWith("/deals") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/off-market") ||
    pathname.startsWith("/suggestions") ||
    pathname.startsWith("/docs");

  const isServerAction = request.headers.has("next-action");
  const hasSession = !!request.cookies.get("better-auth.session_token")?.value;

  if (!hasSession && isProtected && !isServerAction) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthRoute && !isServerAction) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
