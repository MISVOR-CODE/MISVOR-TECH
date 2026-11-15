// Next.js 16 renamed the middleware.ts file convention to proxy.ts (the
// runtime this runs on also changed from edge to nodejs — that's a plus
// here, since it's more permissive for anything auth-related). No code
// change was needed beyond the filename: `export default auth(...)` was
// already a default export, and Next 16 accepts a default export under
// either name. Don't recreate middleware.ts — Next.js errors if both files
// exist at once.
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Deliberately NOT importing "@/lib/auth": that pulls Prisma, the adapter,
// bcrypt and the OAuth providers into the proxy, which runs on every page
// request. The JWT session cookie can be verified with the light config alone.
const { auth } = NextAuth(authConfig);

export default auth((request: NextRequest & { auth?: unknown }) => {
  const { pathname } = request.nextUrl;

  // The entire /admin tree is deliberately unlocalized (internal tool, not
  // marketing content) and sits outside the [locale] segment, so none of it
  // should ever reach the next-intl middleware below — that middleware
  // doesn't know these paths don't carry a locale prefix and would try to
  // redirect e.g. /admin/login to /es/admin/login, breaking the login page.
  if (pathname.startsWith("/admin")) {
    if (pathname !== "/admin/login" && !request.auth) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // Run on everything except Next internals, static files, and API routes
    // (API routes have their own auth checks and must never get an HTML
    // locale-redirect response).
    "/((?!api|_next|_vercel|.*\\..*).*)"
  ]
};
