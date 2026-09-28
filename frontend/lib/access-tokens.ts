"use client"

/**
 * Access-token utilities for the activated-user session.
 * ------------------------------------------------------
 *
 * After a user successfully activates their account with a QXL key, we
 * issue them a brand-new opaque access token whose **prefix encodes the
 * tier** so the URL itself reads naturally:
 *
 *   qxl-basic-<hex>
 *   qxl-smart-<hex>
 *   qxl-pro-<hex>
 *   qxl-dominator-<hex>
 *   qxl-personal-<hex>
 *
 * The hex tail is generated from `crypto.getRandomValues` and has NO
 * mathematical relationship to the QXL key — the QXL key is the
 * *purchased entitlement* (managed by admin) while the access token is
 * the *session credential* (bound to one browser).
 *
 * The token + a randomly-generated `deviceId` are stored in three
 * places at activation time:
 *
 *   1. `localStorage["qxl-session-v1"]`            (frontend reads it)
 *   2. cookies `qxl-token` and `qxl-device`        (middleware reads them)
 *   3. Firebase `/access_tokens/{token}`           (server-of-truth)
 *
 * Access checks layer:
 *
 *   • Middleware  — verifies the URL token matches the cookie token.
 *   • Page client — verifies the URL token matches localStorage AND
 *                   that Firebase deviceId matches localStorage deviceId.
 *
 * If any check fails, the user is redirected back to `/activate-account`,
 * which means a leaked URL alone is useless — the visiting browser
 * doesn't have the matching cookie + device pair.
 */

import type { Tier } from "@/lib/admin-types"

const STORAGE_KEY = "qxl-session-v1"
const COOKIE_TOKEN = "qxl-token"
const COOKIE_DEVICE = "qxl-device"
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Tier slug used in the access-token URL prefix. Kept in sync with the
 * five tiers defined in `lib/admin-types.ts`. The slug is the lowercase
 * tier name verbatim — `dominator` and `personal` use the full word in
 * the URL even though their QXL-key prefix is abbreviated (DMTR / PRL).
 */
export const TIER_URL_SLUGS = [
  "basic",
  "smart",
  "pro",
  "dominator",
  "personal",
] as const

/** Strict regex matching every legal access-token shape. */
export const ACCESS_TOKEN_RE =
  /^qxl-(basic|smart|pro|dominator|personal)-[a-f0-9]{16,}$/i

export type ClientSession = {
  token: string
  deviceId: string
  qxlKey: string
}

/**
 * Generate a fresh access token tied to a specific tier. The tier slug
 * is embedded in the token itself so the URL `/profile/{token}` reads
 * as e.g. `/profile/qxl-pro-9414b69100256c7d`. The `qxl-` prefix +
 * lowercase hex tail keep tokens trivially distinguishable from QXL
 * keys (which are upper-case and dash-separated).
 */
export function generateAccessToken(tier: Tier): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `qxl-${tier}-${hex}`
}

/**
 * Per-browser fingerprint. Stored in localStorage and Firebase so we
 * can detect (and reject) link-sharing attempts where a different
 * browser tries to load `/profile/{token}` without having activated.
 */
export function generateDeviceId(): string {
  const c: Crypto | undefined = typeof crypto !== "undefined" ? crypto : undefined
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID()
  }
  const bytes = new Uint8Array(16)
  if (c) {
    c.getRandomValues(bytes)
  } else {
    // Last-resort fallback for environments without a Web Crypto API.
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

/** Cheap format check used by both middleware and the page client. */
export function isValidTokenFormat(token: string): boolean {
  return ACCESS_TOKEN_RE.test(token.trim())
}

/** Pull the tier slug out of an access token, or `null` if malformed. */
export function tierFromToken(token: string): Tier | null {
  const m = ACCESS_TOKEN_RE.exec(token.trim())
  if (!m) return null
  const slug = m[1].toLowerCase() as (typeof TIER_URL_SLUGS)[number]
  return slug as Tier
}

export function readClientSession(): ClientSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ClientSession>
    if (
      parsed &&
      typeof parsed.token === "string" &&
      typeof parsed.deviceId === "string" &&
      typeof parsed.qxlKey === "string" &&
      isValidTokenFormat(parsed.token)
    ) {
      return parsed as ClientSession
    }
    return null
  } catch {
    return null
  }
}

export function writeClientSession(session: ClientSession): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    /* localStorage may be blocked — cookies still work */
  }
  // Also write cookies so Next.js middleware can gate the route at
  // request time without needing access to the browser's localStorage.
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${COOKIE_TOKEN}=${encodeURIComponent(session.token)}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`
  document.cookie = `${COOKIE_DEVICE}=${encodeURIComponent(session.deviceId)}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`
}

export function clearClientSession(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  document.cookie = `${COOKIE_TOKEN}=; Path=/; Max-Age=0; SameSite=Lax`
  document.cookie = `${COOKIE_DEVICE}=; Path=/; Max-Age=0; SameSite=Lax`
}
