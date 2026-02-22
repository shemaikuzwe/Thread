import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/auth-client";


const publicRoutes = ["/", "/auth/login", "/auth/register"];

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.pathname;
  const session = await getSession({ fetchOptions: { headers: request.headers } });
  const isLoggedIn = !!session?.data?.user;

  if (isLoggedIn && publicRoutes.includes(url)) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (!isLoggedIn && !publicRoutes.includes(url)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|uploads|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|csv)).*)",
  ],
};
