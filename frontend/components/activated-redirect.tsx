"use client"

/**
 * Client-only guard that lives at the top of `/activate-account`.
 *
 * If the visiting browser already has a saved session (i.e. they've
 * activated before in this browser) we transparently bounce them to
 * their profile dashboard rather than re-show the activation form.
 *
 * To prevent ANY flash of the activate-account page during the
 * redirect, this component wraps the page children and renders
 * nothing until the localStorage check completes. The check is
 * synchronous via useLayoutEffect, so an already-activated browser
 * will navigate away before the page contents ever paint.
 */

import { useLayoutEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { readClientSession } from "@/lib/access-tokens"
import { BrandLoader } from "@/components/brand-loader"

export function ActivatedRedirect({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  // "checking"  — initial render, decide whether to redirect
  // "redirect"  — already activated, navigating away (render nothing)
  // "show"      — fresh browser, render the activation page
  const [phase, setPhase] = useState<"checking" | "redirect" | "show">("checking")

  useLayoutEffect(() => {
    const session = readClientSession()
    if (session) {
      setPhase("redirect")
      router.replace(`/profile/${encodeURIComponent(session.token)}`)
    } else {
      setPhase("show")
    }
  }, [router])

  if (phase !== "show") {
    return <BrandLoader variant="overlay" />
  }

  return <>{children}</>
}
