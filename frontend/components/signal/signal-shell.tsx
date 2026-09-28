"use client"

/**
 * Shared shell for every activated-only page (profile + 4 signal rooms).
 *
 * Responsibilities
 * ----------------
 * 1. Validate the URL access token via `useAccessSession`. The hook
 *    enforces format + browser-binding + Firebase truth gates; this
 *    shell only renders a friendly screen for each non-OK state.
 * 2. Render the unified TopNav (rounded-rectangle pill bar) which
 *    holds the logo, section tabs, identity chip and sign-out / mobile
 *    hamburger. The bottom tab bar from the previous design is gone —
 *    every section is now reachable from the TopNav or the sidebar
 *    that opens behind the mobile hamburger.
 * 3. Provide an aurora background that matches the marketing site so
 *    the activated experience feels like a continuation of the brand.
 *
 * Children receive `{ accessToken, qxlKey, tier, holder }` so they
 * never need to re-validate or re-fetch.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import {
  ShieldAlert,
  ShieldX,
} from "lucide-react"

import { TopNav } from "@/components/signal/signal-navigation"
import { BrandLoader } from "@/components/brand-loader"
import { clearClientSession } from "@/lib/access-tokens"
import type { Tier } from "@/lib/tiers"
import { cn } from "@/lib/utils"
import {
  useAccessSession,
  type AccessSession,
} from "@/hooks/use-access-session"

type Holder = { fullName?: string; username?: string } | null

export type SignalShellChildArgs = {
  /** Random session credential — `qxl-<hex>` (used in URLs). */
  accessToken: string
  /** The actual purchased QXL key — used as the Firebase usage bucket. */
  qxlKey: string
  tier: Tier
  holder: Holder
}

export function SignalShell({
  rawCode,
  pageTitle,
  pageEyebrow,
  children,
}: {
  rawCode: string | null | undefined
  pageTitle: string
  pageEyebrow: string
  children: (args: SignalShellChildArgs) => React.ReactNode
}) {
  const session = useAccessSession(rawCode)

  // If the server-of-truth check fails (token deleted by admin OR a
  // different browser activated the same QXL key and rotated the
  // session) we proactively wipe this browser's localStorage + cookies.
  // This prevents `/activate-account`'s `ActivatedRedirect` from
  // ping-ponging the user between the protected page and the form.
  useEffect(() => {
    if (
      session.state === "invalid" &&
      (session.reason === "not-found" || session.reason === "wrong-device")
    ) {
      clearClientSession()
    }
  }, [session])

  return (
    <div className="relative min-h-svh w-full overflow-x-hidden bg-[#02141A] text-[#E8F4F7]">
      <SignalBackground />

      <main className="relative z-10 mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-4 px-2.5 pb-6 pt-2.5 sm:gap-6 sm:px-6 sm:pb-12 sm:pt-4 lg:px-8">
        <TopNav session={session} />

        <PageTitle
          pageEyebrow={pageEyebrow}
          pageTitle={pageTitle}
          session={session}
        />

        <div className="relative flex-1">
          <GatedContent session={session}>
            {(args) => children(args)}
          </GatedContent>
        </div>
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page title — eyebrow + headline                                           */
/* -------------------------------------------------------------------------- */

function PageTitle({
  pageEyebrow,
  pageTitle,
  session,
}: {
  pageEyebrow: string
  pageTitle: string
  session: AccessSession
}) {
  // On the profile page we hide the eyebrow + title entirely on every
  // breakpoint — the identity hero card sits directly under the top nav.
  const pathname = usePathname() ?? ""
  const isProfile = pathname.startsWith("/profile/")

  if (isProfile) {
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#5BC0D8]/85 sm:text-[10.5px] sm:tracking-[0.32em]">
        {pageEyebrow}
      </span>
      <h1 className="font-display text-balance text-[20px] leading-[1.15] tracking-wide text-[#E8F4F7] sm:text-[26px] lg:text-[34px]">
        <span className="font-normal">{pageTitle.split(" ")[0]}</span>{" "}
        <span className="italic font-light text-[#7DE3FF]/90">{pageTitle.split(" ").slice(1).join(" ")}</span>
      </h1>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Gate                                                                      */
/* -------------------------------------------------------------------------- */

function GatedContent({
  session,
  children,
}: {
  session: AccessSession
  children: (args: SignalShellChildArgs) => React.ReactNode
}) {
  if (session.state === "loading") {
    return <BrandLoader variant="overlay" />
  }

  if (session.state === "invalid") {
    const map: Record<typeof session.reason, { title: string; body: string }> = {
      format: {
        title: "Invalid link",
        body: "This URL doesn't look like a valid activated session. Make sure you're following the link your browser saved when you activated.",
      },
      "not-found": {
        title: "Session no longer exists",
        body: "We couldn't find this session. It may have been revoked or replaced after re-activating from a different browser.",
      },
      "wrong-device": {
        title: "Browser not recognised",
        body: "This browser hasn't activated this session. Activated access is tied to one browser at a time — please activate again from this device or use the original browser.",
      },
      error: {
        title: "Connection issue",
        body: "We hit a snag verifying your session. Check your internet connection and try again.",
      },
    }
    const info = map[session.reason]
    return (
      <CenterPanel
        icon={
          session.reason === "error" ? (
            <ShieldAlert className="size-6 text-amber-400" aria-hidden />
          ) : (
            <ShieldX className="size-6 text-rose-400" aria-hidden />
          )
        }
        title={info.title}
        body={info.body}
        tone={session.reason === "error" ? "warn" : "danger"}
        cta={{ href: "/activate-account", label: "Activate this browser" }}
      />
    )
  }

  // session.state === "ok"
  return (
    <>
      {children({
        accessToken: session.token,
        qxlKey: session.qxlKey,
        tier: session.tier,
        holder: session.holder,
      })}
    </>
  )
}

function CenterPanel({
  icon,
  title,
  body,
  tone,
  cta,
}: {
  icon: React.ReactNode
  title: string
  body: string
  tone: "info" | "warn" | "danger"
  cta?: { href: string; label: string }
}) {
  const ringByTone: Record<typeof tone, string> = {
    info: "border-[#5BC0D8]/40",
    warn: "border-amber-400/40",
    danger: "border-rose-400/40",
  }
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div
        className={cn(
          "relative max-w-md rounded-2xl border bg-[#03161B]/80 p-7 text-center backdrop-blur-md sm:p-8",
          ringByTone[tone],
        )}
      >
        <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-[#02141A]/85 ring-1 ring-inset ring-[#1B7892]/45">
          {icon}
        </div>
        <h2 className="font-display text-[22px] leading-tight tracking-wide text-[#E8F4F7] sm:text-[24px]">
          {title}
        </h2>
        <p className="mt-2 text-pretty text-[13.5px] font-light leading-relaxed text-[#E8F4F7]/72">
          {body}
        </p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-[#5BC0D8]/55 bg-[#03161B]/70 px-5 text-[13px] font-medium text-[#E8F4F7] transition-colors hover:bg-[#0A2530]/85 hover:text-[#7DE3FF]"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Background                                                                */
/* -------------------------------------------------------------------------- */

function SignalBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(91,192,216,0.22), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 90%, rgba(245,193,108,0.10), transparent 65%), linear-gradient(180deg, #02141A 0%, #02161D 60%, #010A0F 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(125, 227, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(125, 227, 255, 0.4) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, #000 35%, transparent 80%)",
        }}
      />
    </>
  )
}
