import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProductionHost } from "@/config/hosts";

// Tag every non-production host as noindex. This covers preview deployments and
// the project's *.vercel.app aliases regardless of whether Vercel deployment
// protection is switched on, so sharing a preview link can never put a
// crawlable duplicate of the funnel into search results.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!isProductionHost(request.headers.get("host"))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  // Skip build assets and media. Crawlable HTML and API routes still pass
  // through, which is all the header needs to cover.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|mp4|webm|vtt|woff|woff2|txt|xml)$).*)",
  ],
};
