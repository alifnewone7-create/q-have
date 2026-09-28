"use client"

/**
 * Premium navigation shared by the 5 activated-only pages.
 *
 *  ┌────────────────────────────────────────────────────────────┐
 *  │ All viewports: a single rounded-rectangle "pill" bar at    │
 *  │   the top of the page. Sticky, glassy, tier-tinted.        │
 *  │                                                             │
 *  │   Desktop (≥ md): logo · 5 tab pills · holder chip · sign  │
 *  │     out — every section reachable in one tap.              │
 *  │                                                             │
 *  │   Mobile (< md):  logo · current page chip · hamburger.    │
 *  │     The hamburger opens a slide-in sidebar from the right  │
 *  │     containing the identity card, all 5 nav links and a    │
 *  │     sign-out button.                                       │
 *  └────────────────────────────────────────────────────────────┘
 *
 * The bottom tab bar from the previous design has been removed — all
 * mobile navigation now lives behind the hamburger menu so the page
 * itself stays uncluttered.
 */

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  AlignJustify,
  BarChart3,
  CandlestickChart,
  ChevronRight,
  Crown,
  LogOut,
  Rocket,
  ShieldAlert,
  Sparkles,
  Timer,
  UserCircle2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react"

import { clearClientSession } from "@/lib/access-tokens"
import { TIER_ACCENT, TIER_LABEL, type Tier } from "@/lib/tiers"
import { cn } from "@/lib/utils"
import type { AccessSession } from "@/hooks/use-access-session"

const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/photo_2026-04-25_22-18-43-Photoroom-HtsnKHd3iq8op3TRyIaF1fSc0bkyA5.png"

const QX_SIDE_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/QX-Side-LH5nlMKE9ED8tof8zj1UoHR2iUdblk.png"

type Holder = { fullName?: string; username?: string } | null

export type NavKey =
  | "profile"
  | "chart-to-signal"
  | "chart-15sec-signal"
  | "chart-2candle"
  | "upgrade-your-plan"

type NavItem = {
  key: NavKey
  label: string
  short: string
  hint: string
  icon: LucideIcon
  pathPrefix: string
  buildHref: (token: string) => string
}

const NAV: NavItem[] = [
  {
    key: "profile",
    label: "Profile",
    short: "Profile",
    hint: "Account & usage",
    icon: UserCircle2,
    pathPrefix: "/profile/",
    buildHref: (t) => `/profile/${t}`,
  },
  {
    key: "chart-to-signal",
    label: "1m Signal",
    short: "1m",
    hint: "Live next-candle",
    icon: BarChart3,
    pathPrefix: "/chart-to-signal/",
    buildHref: (t) => `/chart-to-signal/${t}`,
  },
  {
    key: "chart-15sec-signal",
    label: "15s Signal",
    short: "15s",
    hint: "Short-burst momentum",
    icon: Timer,
    pathPrefix: "/chart-15sec-signal/",
    buildHref: (t) => `/chart-15sec-signal/${t}`,
  },
  {
    key: "chart-2candle",
    label: "2 Candle",
    short: "2 Candle",
    hint: "See 2 candles ahead",
    icon: CandlestickChart,
    pathPrefix: "/chart-2candle/",
    buildHref: (t) => `/chart-2candle/${t}`,
  },
  {
    key: "upgrade-your-plan",
    label: "Upgrade Your Plan",
    short: "Upgrade",
    hint: "Upgrade your plan",
    icon: Rocket,
    pathPrefix: "/upgrade-your-plan/",
    buildHref: (t) => `/upgrade-your-plan/${t}`,
  },
]

function useActiveKey(): NavKey | null {
  const pathname = usePathname() ?? ""
  for (const item of NAV) {
    if (pathname.startsWith(item.pathPrefix)) return item.key
  }
  return null
}

/* -------------------------------------------------------------------------- */
/*  TopNav — Redesigned premium navigation bar                                 */
/* -------------------------------------------------------------------------- */

export function TopNav({ session }: { session: AccessSession }) {
  const router = useRouter()
  const active = useActiveKey()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Confirm-before-logout modal. Triggered by both the desktop "Log Out"
  // button and the mobile sidebar's "Log Out" button so the warning is
  // identical across viewports.
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const isOk = session.state === "ok"
  const token = isOk ? session.token : ""
  const tier: Tier = isOk ? session.tier : "smart"
  const holder: Holder = isOk ? session.holder : null
  const accent = TIER_ACCENT[tier]

  // Track scroll for enhanced shadow
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close sidebar on Esc + lock body scroll while open.
  useEffect(() => {
    if (!sidebarOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [sidebarOpen])

  function requestSignOut() {
    // Open the confirmation modal. Also close the mobile sidebar (if
    // open) so the dialog isn't visually trapped behind the slide-in
    // panel on small screens.
    setSidebarOpen(false)
    setLogoutConfirmOpen(true)
  }

  function handleSignOut() {
    clearClientSession()
    setLogoutConfirmOpen(false)
    setSidebarOpen(false)
    router.replace("/")
  }

  return (
    <>
      <header className="sticky top-0 z-30 w-full md:px-4 md:pt-4">
        <div
          className={cn(
            "relative mx-auto max-w-7xl overflow-hidden rounded-2xl border transition-all duration-300",
            scrolled
              ? "border-[#1B7892]/50 bg-[#020B0F]/95 shadow-[0_20px_70px_-20px_rgba(0,0,0,0.95)]"
              : "border-[#1B7892]/30 bg-[#020B0F]/90 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.7)]"
          )}
          style={{ backdropFilter: "blur(20px) saturate(1.8)" }}
        >
          {/* Animated top border gradient */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #1B7892 15%, #5BC0D8 30%, #F5C16C 50%, #5BC0D8 70%, #1B7892 85%, transparent 100%)",
            }}
          />
          
          {/* Subtle inner glow */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-40"
            style={{
              background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(91,192,216,0.15), transparent)",
            }}
          />

          <div className="relative flex items-center justify-between gap-2 p-2 md:p-2.5">
            {/* Left Section: Logo + Tier Badge */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                aria-label="Quotex Live home"
                className="group flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-300 hover:bg-[#1B7892]/10"
              >
                <Image
                  src={LOGO_URL || "/placeholder.svg"}
                  alt="Quotex Live"
                  width={120}
                  height={40}
                  priority
                  unoptimized
                  className="h-6 w-auto transition-all duration-300 group-hover:brightness-110 sm:h-7"
                />
              </Link>
            </div>

            {/* Center Section: Navigation Tabs - Desktop */}
            {isOk && (
              <nav
                aria-label="Signal sections"
                className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-xl bg-[#0A1A22]/60 p-1 md:flex"
                style={{
                  border: "1px solid rgba(27,120,146,0.25)",
                }}
              >
                {NAV.filter((item) =>
                  item.key === "upgrade-your-plan"
                    ? tier !== "dominator" && tier !== "personal"
                    : true,
                ).map((item) => {
                  const isActive = active === item.key
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.key}
                      href={item.buildHref(token)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-all duration-300",
                        isActive
                          ? "text-[#020B0F]"
                          : "text-[#E8F4F7]/70 hover:bg-[#1B7892]/20 hover:text-[#7DE3FF]"
                      )}
                    >
                      {/* Active background with gradient */}
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
                            boxShadow: `0 4px 20px -4px ${accent.from}60`,
                          }}
                        />
                      )}
                      
                      <Icon
                        className={cn(
                          "relative size-4 shrink-0 transition-all duration-300",
                          !isActive && "group-hover:scale-110",
                          isActive && "drop-shadow-sm"
                        )}
                        strokeWidth={2}
                        aria-hidden
                      />
                      <span className="relative truncate font-semibold tracking-wide">
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </nav>
            )}

            {/* Right Section: User Info + Sign Out */}
            <div className="flex items-center gap-2">
              {/* User chip - Desktop */}
              {isOk && holder && (holder.username || holder.fullName) && (
                <div className="hidden items-center md:flex">
                  <span
                    className="inline-flex items-center gap-2 rounded-xl border border-[#1B7892]/30 bg-gradient-to-br from-[#0A1A22]/80 to-[#061115]/80 px-3 py-1.5 transition-all duration-300 hover:border-[#1B7892]/50 hover:bg-[#0A1A22]"
                  >
                    <span
                      className="flex size-6 items-center justify-center rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${accent.from}30, ${accent.to}20)`,
                        border: `1px solid ${accent.from}40`,
                      }}
                    >
                      <UserRound
                        className="size-3.5"
                        style={{ color: accent.from }}
                        strokeWidth={2.2}
                        aria-hidden
                      />
                    </span>
                    <span className="text-[12px] font-medium text-[#E8F4F7]/90">
                      {holder.username ? `@${holder.username}` : holder.fullName}
                    </span>
                  </span>
                </div>
              )}

              {/* Sign out button - Desktop */}
              {isOk && (
                <button
                  type="button"
                  onClick={requestSignOut}
                  className="group hidden items-center gap-1.5 rounded-xl border border-[#1B7892]/25 bg-[#0A1A22]/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#E8F4F7]/70 transition-all duration-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 md:inline-flex"
                  aria-label="Log out"
                >
                  <LogOut
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                  Log Out
                </button>
              )}

              {/* Mobile menu button */}
              {isOk && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="group relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1B7892]/30 bg-gradient-to-br from-[#0A1A22]/80 to-[#061115]/80 text-[#7DE3FF] transition-all duration-300 hover:border-[#5BC0D8]/50 hover:shadow-[0_0_20px_-5px_rgba(91,192,216,0.5)] md:hidden"
                  aria-label="Open navigation menu"
                  aria-expanded={sidebarOpen}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent"
                  />
                  <AlignJustify
                    className="relative size-5 transition-transform duration-300 group-hover:scale-110"
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {isOk && (
        <MobileSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          token={token}
          tier={tier}
          holder={holder}
          activeKey={active}
          onSignOut={requestSignOut}
        />
      )}

      {/* Logout confirmation — shared by desktop and mobile */}
      <LogoutConfirmDialog
        open={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleSignOut}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Mobile sidebar — Redesigned premium slide-in panel                         */
/* -------------------------------------------------------------------------- */

function MobileSidebar({
  open,
  onClose,
  token,
  tier,
  holder,
  activeKey,
  onSignOut,
}: {
  open: boolean
  onClose: () => void
  token: string
  tier: Tier
  holder: Holder
  activeKey: NavKey | null
  onSignOut: () => void
}) {
  const accent = TIER_ACCENT[tier]

  return (
    <div className="md:hidden" aria-hidden={!open}>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        className={cn(
          "fixed inset-0 z-40 cursor-default transition-all duration-300",
          open ? "bg-[#020B0F]/80 opacity-100 backdrop-blur-md" : "pointer-events-none opacity-0"
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[90%] max-w-[340px] flex-col overflow-y-auto border-l border-[#1B7892]/30 transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, #020B0F 0%, #061115 50%, #0A1A22 100%)",
          boxShadow: open ? "-30px 0 80px -20px rgba(0,0,0,0.95)" : "none",
        }}
      >
        {/* Decorative gradient orb */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${accent.from} 0%, transparent 70%)`,
          }}
        />

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1B7892]/20 bg-[#020B0F]/95 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Active Session
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-[#1B7892]/30 bg-[#0A1A22]/60 text-[#7DE3FF] transition-all duration-300 hover:border-[#5BC0D8]/50 hover:bg-[#1B7892]/30"
            aria-label="Close menu"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="px-4 py-5">
          {(holder?.fullName || holder?.username) && (
            <div
              className="group relative overflow-hidden rounded-2xl p-4"
              style={{
                background: `linear-gradient(145deg, ${accent.from}12, ${accent.to}08)`,
                border: `1px solid ${accent.from}25`,
              }}
            >
              {/* Animated shine effect */}
              <span
                aria-hidden
                className="pointer-events-none absolute -left-full top-0 h-full w-1/2 skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-700 group-hover:left-[150%]"
              />

              <div className="relative flex items-center gap-3.5">
                <span
                  aria-hidden
                  className="relative size-14 shrink-0 overflow-hidden rounded-xl shadow-lg"
                  style={{
                    border: `2px solid ${accent.from}40`,
                    boxShadow: `0 8px 25px -8px ${accent.from}40`,
                  }}
                >
                  <Image
                    src={QX_SIDE_URL}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold tracking-wide text-[#E8F4F7]">
                    {holder?.fullName || "Trader"}
                  </p>
                  {holder?.username && (
                    <p className="mt-0.5 truncate font-mono text-[12px] text-[#5BC0D8]">
                      @{holder.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Tier Badge */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#020B0F]/50 px-3 py-2.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#E8F4F7]/50">
                  Membership Tier
                </span>
                <span
                  className="badge-shine relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
                    color: accent.fg,
                    boxShadow: `0 4px 15px -4px ${accent.from}50`,
                  }}
                >
                  <Crown className="size-3" strokeWidth={2.5} />
                  {TIER_LABEL[tier]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 pb-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1B7892]/40 to-transparent" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5BC0D8]/70">
              Navigation
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1B7892]/40 to-transparent" />
          </div>

          <nav aria-label="Signal sections" className="flex flex-col gap-2">
            {NAV.filter((item) =>
              item.key === "upgrade-your-plan"
                ? tier !== "dominator" && tier !== "personal"
                : true,
            ).map((item) => {
              const isActive = activeKey === item.key
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  href={item.buildHref(token)}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 transition-all duration-300",
                    isActive
                      ? "bg-[#1B7892]/20"
                      : "hover:bg-[#1B7892]/10"
                  )}
                  style={
                    isActive
                      ? {
                          border: `1px solid ${accent.from}30`,
                          boxShadow: `inset 0 0 20px -10px ${accent.from}30`,
                        }
                      : { border: "1px solid transparent" }
                  }
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full"
                      style={{
                        background: `linear-gradient(180deg, ${accent.from}, ${accent.to})`,
                        boxShadow: `0 0 12px ${accent.from}60`,
                      }}
                    />
                  )}

                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-lg transition-all duration-300",
                      isActive
                        ? "bg-[#7DE3FF]/15 text-[#7DE3FF]"
                        : "bg-[#1B7892]/15 text-[#5BC0D8] group-hover:bg-[#1B7892]/25 group-hover:text-[#7DE3FF]"
                    )}
                    style={
                      isActive
                        ? {
                            boxShadow: `0 0 15px -5px ${accent.from}50`,
                          }
                        : undefined
                    }
                    aria-hidden
                  >
                    <Icon className="size-5" strokeWidth={2} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[13px] font-semibold tracking-wide transition-colors duration-300",
                        isActive ? "text-[#7DE3FF]" : "text-[#E8F4F7]/85 group-hover:text-[#E8F4F7]"
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#E8F4F7]/45">{item.hint}</p>
                  </div>

                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 transition-all duration-300",
                      isActive
                        ? "text-[#7DE3FF]"
                        : "text-[#E8F4F7]/30 group-hover:translate-x-0.5 group-hover:text-[#5BC0D8]"
                    )}
                    strokeWidth={2}
                    aria-hidden
                  />
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer with Sign Out */}
        <div className="sticky bottom-0 border-t border-[#1B7892]/20 bg-[#020B0F]/95 px-4 py-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={onSignOut}
            className="group flex w-full items-center justify-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3.5 text-[12px] font-semibold text-rose-300 transition-all duration-300 hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-rose-200 hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.4)]"
            aria-label="Log out"
          >
            <LogOut
              className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5"
              strokeWidth={2}
              aria-hidden
            />
            Log Out
          </button>
        </div>
      </aside>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Logout confirmation dialog — portal so it covers the whole viewport       */
/* -------------------------------------------------------------------------- */

function LogoutConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  // Esc-to-cancel + body-scroll lock while open. Mirrors the pattern
  // used by the ghost-candle editor so behaviour stays consistent
  // across modals in the app.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onCancel])

  if (!open) return null
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      onClick={onCancel}
    >
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-rose-500/30 bg-[#020B0F]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
        style={{ backdropFilter: "blur(20px) saturate(1.6)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-rose-500/20 bg-rose-500/5 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-300">
              <ShieldAlert className="size-4" strokeWidth={2.2} aria-hidden />
            </span>
            <h3
              id="logout-confirm-title"
              className="text-[15px] font-semibold tracking-wide text-[#E8F4F7] sm:text-[16px]"
            >
              Are you sure you want to log out?
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex size-8 items-center justify-center rounded-lg text-[#E8F4F7]/70 transition hover:bg-white/10 hover:text-[#E8F4F7]"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.2} aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-pretty text-[13px] leading-relaxed text-[#E8F4F7]/80 sm:text-[13.5px]">
            If you log out of this account, you&apos;ll need a new QXL key to
            activate a new account again.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-rose-500/15 bg-[#0A1A22]/60 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 font-sans text-[12px] font-medium text-[#E8F4F7]/85 transition hover:bg-white/[0.07]"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 px-5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_-10px_rgba(244,63,94,0.65)] transition hover:scale-[1.02]"
          >
            <LogOut className="size-3.5" strokeWidth={2.4} aria-hidden />
            Yes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
