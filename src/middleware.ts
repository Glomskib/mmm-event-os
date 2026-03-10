import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// 301 redirects for old event slugs that were renamed
const SLUG_REDIRECTS: Record<string, string> = {
  "/events/fun-friday-fifty": "/events/findlay-further-fondo",
  "/events/houghton-hundred": "/events/hancock-horizontal-hundred-2026",
  "/events/hancock-horizontal-hundred": "/events/hancock-horizontal-hundred-2026",
};

export async function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;

  // Redirect hancockhorizontalhundred.com → makingmilesmatter.com
  if (host.includes("hancockhorizontalhundred.com")) {
    const target = new URL(pathname, "https://makingmilesmatter.com");
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, { status: 301 });
  }

  const redirect = SLUG_REDIRECTS[pathname];
  if (redirect) {
    return NextResponse.redirect(new URL(redirect, request.url), { status: 301 });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
