import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware gate for the four activated-only routes:
 *
 *   /profile/{token}
 *   /chart-to-signal/{token}
 *   /chart-15sec-signal/{token}
 *   /chart-2candle/{token}
 *
 * Two server-side checks run before the page even loads:
 *
 *   1. The URL token must match `qxl-<hex>` format.
 *   2. The visiting browser must present a cookie `qxl-token`
 *      identical to the URL token (set at activation time).
 *
 * If either fails the visitor is redirected back to `/activate-account`,
 * which prevents naive link-sharing without ever touching Firebase.
 *
 * The full identity check (deviceId === Firebase deviceId) happens on
 * the client inside `useAccessSession` — see that hook for the third
 * layer of defense.
 *
 * Note: in Next.js 16 `middleware.ts` is still supported (and is the
 * documented backwards-compatible name; `proxy.ts` is the new alias).
 */

const PROTECTED_PREFIXES = [
  "/profile/",
  "/chart-to-signal/",
  "/chart-15sec-signal/",
  "/chart-2candle/",
]

const TOKEN_RE = /^qxl-(basic|smart|pro|dominator|personal)-[a-f0-9]{16,}$/i

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Strip the leading "/" then take the second segment (the [code]).
  const segments = pathname.split("/").filter(Boolean)
  const urlToken = (segments[1] ?? "").toLowerCase()

  if (!TOKEN_RE.test(urlToken)) {
    return redirectToActivate(req)
  }

  const cookieToken = req.cookies.get("qxl-token")?.value?.toLowerCase()
  const cookieDevice = req.cookies.get("qxl-device")?.value

  if (!cookieToken || !cookieDevice || cookieToken !== urlToken) {
    return redirectToActivate(req)
  }

  return NextResponse.next()
}

function redirectToActivate(req: NextRequest) {
  const url = req.nextUrl.clone()
  url.pathname = "/activate-account"
  url.search = ""
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/chart-to-signal/:path*",
    "/chart-15sec-signal/:path*",
    "/chart-2candle/:path*",
  ],
}
