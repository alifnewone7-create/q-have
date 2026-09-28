"use client"

/**
 * Track daily signal usage for a specific (scopeId, system) pair.
 *
 * Firebase tree
 * -------------
 *   /usage/{scopeId}/{YYYY-MM-DD}/{system}/count
 *
 * `scopeId` is the per-user access token issued at activation time
 * (e.g. `qxl-pro-abc123…`) — NOT the underlying QXL key. This is
 * deliberate: a single QXL key with key-type "no_limit" or "limited"
 * can be activated by many distinct users, each receiving their own
 * unique access token. Keying usage by access token instead of by
 * QXL key gives every activated user their own daily counter, so one
 * user's signals don't drain everyone else's quota.
 *
 * The hook watches the count in real time so two tabs of the same user
 * stay in sync, and exposes a `consume()` action that bumps the count
 * by one using `runTransaction` (so concurrent generates can't exceed
 * the limit).
 */

import { useCallback, useEffect, useState } from "react"
import {
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
  update,
} from "firebase/database"

import { getDb } from "@/lib/firebase"
import {
  DAILY_LIMITS,
  todayKey,
  type SignalSystem,
  type Tier,
} from "@/lib/tiers"

export type UsageState = {
  count: number
  limit: number
  remaining: number
  loading: boolean
}

type ConsumeResult =
  | { ok: true; count: number; remaining: number }
  | { ok: false; reason: "limit-reached"; count: number; limit: number }
  | { ok: false; reason: "error"; message: string }

/**
 * Read + write helper for the daily usage counter. Returns reactive state
 * + a `consume()` function that atomically increments the counter (or
 * refuses if the day's limit is already reached).
 */
export function useSignalUsage(
  scopeId: string | null,
  tier: Tier | null,
  system: SignalSystem,
): UsageState & { consume: () => Promise<ConsumeResult>; date: string } {
  const [date, setDate] = useState<string>(() => todayKey())
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Refresh the date every minute so the bucket rolls over without a page
  // reload at 6:00 AM Bangladesh time (UTC+6) — fully automatic, no user
  // action required. The RTDB subscription below resubscribes to the new
  // bucket the moment the date string flips, so the counter visibly resets
  // to 0 in real time.
  useEffect(() => {
    const id = window.setInterval(() => setDate(todayKey()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  // Subscribe to the counter for the current (scope, date, system) triplet.
  useEffect(() => {
    if (!scopeId) {
      setCount(0)
      setLoading(false)
      return
    }
    setLoading(true)
    const r = ref(getDb(), `usage/${scopeId}/${date}/${system}/count`)
    const unsub = onValue(
      r,
      (snap) => {
        const value = snap.val()
        setCount(typeof value === "number" ? value : 0)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [scopeId, date, system])

  const limit = tier ? DAILY_LIMITS[tier][system] : 0

  const consume = useCallback(async (): Promise<ConsumeResult> => {
    if (!scopeId || !tier) {
      return { ok: false, reason: "error", message: "Missing scope or tier" }
    }
    const tx = ref(
      getDb(),
      `usage/${scopeId}/${date}/${system}/count`,
    )
    try {
      const result = await runTransaction(tx, (current) => {
        const next = (typeof current === "number" ? current : 0) + 1
        if (next > limit) return // abort; quota exceeded
        return next
      })
      if (!result.committed) {
        return {
          ok: false,
          reason: "limit-reached",
          count: limit,
          limit,
        }
      }
      const next = (result.snapshot.val() as number) ?? 0
      // Stamp the last-used timestamp alongside the count so the profile
      // page can show "last signal at HH:mm" if we ever want to.
      await update(
        ref(getDb(), `usage/${scopeId}/${date}/${system}`),
        { lastAt: serverTimestamp() },
      )
      return { ok: true, count: next, remaining: Math.max(0, limit - next) }
    } catch (err) {
      console.log("[v0] [signal-usage] consume failed:", err)
      return {
        ok: false,
        reason: "error",
        message: err instanceof Error ? err.message : String(err),
      }
    }
  }, [scopeId, tier, system, date, limit])

  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
    loading,
    consume,
    date,
  }
}
