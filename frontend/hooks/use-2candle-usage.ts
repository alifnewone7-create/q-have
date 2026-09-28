"use client"

/**
 * Track daily time-based usage for the 2 Candle Ahead feature.
 *
 * Firebase tree
 * -------------
 *   /usage/{scopeId}/{YYYY-MM-DD}/chart-2candle/usedSeconds
 *
 * `scopeId` is the per-user access token (NOT the QXL key) so that
 * users sharing a no-limit / limited QXL key each get their own daily
 * timer. See `use-signal-usage.ts` for the full rationale.
 *
 * The hook:
 * - Reads the cumulative used seconds from Firebase
 * - Ticks locally while `isActive` is true (market selected)
 * - Persists updated seconds to Firebase every 5 seconds
 * - Exposes remaining time, limit exhausted state, and reset countdown
 */

import { useCallback, useEffect, useRef, useState } from "react"
import {
  onValue,
  ref,
  serverTimestamp,
  update,
} from "firebase/database"

import { getDb } from "@/lib/firebase"
import {
  CANDLE2_TIME_LIMITS,
  todayKey,
  type Tier,
} from "@/lib/tiers"

export type Candle2UsageState = {
  usedSeconds: number
  limitSeconds: number
  remainingSeconds: number
  isExhausted: boolean
  isUnlimited: boolean
  loading: boolean
  resetCountdown: { hours: number; minutes: number; seconds: number }
}

/**
 * Hook to track 2 Candle Ahead time usage.
 * @param scopeId - Per-user access token (issued at activation)
 * @param tier - User's tier
 * @param isActive - Whether to count time (true when market is selected)
 */
export function use2CandleUsage(
  scopeId: string | null,
  tier: Tier | null,
  isActive: boolean,
): Candle2UsageState {
  const [date, setDate] = useState<string>(() => todayKey())
  const [usedSeconds, setUsedSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [resetCountdown, setResetCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 })
  
  const localUsedRef = useRef(0)
  const lastSyncRef = useRef(0)

  const limitSeconds = tier ? CANDLE2_TIME_LIMITS[tier] : 0
  const isUnlimited = !isFinite(limitSeconds)
  const remainingSeconds = isUnlimited ? Infinity : Math.max(0, limitSeconds - usedSeconds)
  const isExhausted = !isUnlimited && remainingSeconds <= 0

  // Refresh date every minute for bucket rollover at 6 AM BD
  useEffect(() => {
    const id = window.setInterval(() => setDate(todayKey()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  // Calculate reset countdown (time until 6 AM BD)
  useEffect(() => {
    const calculateReset = () => {
      const now = new Date()
      // 6 AM BD (UTC+6) = 00:00 UTC
      const nowUTC = now.getTime()
      const todayMidnightUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      const nextResetUTC = nowUTC >= todayMidnightUTC 
        ? todayMidnightUTC + 24 * 60 * 60 * 1000 
        : todayMidnightUTC
      
      const diffMs = nextResetUTC - nowUTC
      const hours = Math.floor(diffMs / (60 * 60 * 1000))
      const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
      const seconds = Math.floor((diffMs % (60 * 1000)) / 1000)
      
      setResetCountdown({ hours, minutes, seconds })
    }
    
    calculateReset()
    const id = window.setInterval(calculateReset, 1000)
    return () => window.clearInterval(id)
  }, [])

  // Subscribe to Firebase for the current date
  useEffect(() => {
    if (!scopeId) {
      setUsedSeconds(0)
      setLoading(false)
      return
    }
    setLoading(true)
    const r = ref(getDb(), `usage/${scopeId}/${date}/chart-2candle/usedSeconds`)
    const unsub = onValue(
      r,
      (snap) => {
        const value = snap.val()
        const secs = typeof value === "number" ? value : 0
        setUsedSeconds(secs)
        localUsedRef.current = secs
        lastSyncRef.current = secs
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [scopeId, date])

  // Sync to Firebase periodically
  const syncToFirebase = useCallback(async () => {
    if (!scopeId || isUnlimited) return
    const current = localUsedRef.current
    if (current === lastSyncRef.current) return // No change
    
    try {
      await update(
        ref(getDb(), `usage/${scopeId}/${date}/chart-2candle`),
        { usedSeconds: current, lastAt: serverTimestamp() },
      )
      lastSyncRef.current = current
    } catch (err) {
      console.log("[v0] [2candle-usage] sync failed:", err)
    }
  }, [scopeId, date, isUnlimited])

  // Tick every second when active
  useEffect(() => {
    if (!isActive || isUnlimited || isExhausted || !scopeId) return

    const tickInterval = window.setInterval(() => {
      localUsedRef.current += 1
      setUsedSeconds(localUsedRef.current)
    }, 1000)

    // Sync every 5 seconds
    const syncInterval = window.setInterval(syncToFirebase, 5000)

    return () => {
      window.clearInterval(tickInterval)
      window.clearInterval(syncInterval)
      // Final sync on unmount
      syncToFirebase()
    }
  }, [isActive, isUnlimited, isExhausted, scopeId, syncToFirebase])

  // Sync when becoming inactive
  useEffect(() => {
    if (!isActive) {
      syncToFirebase()
    }
  }, [isActive, syncToFirebase])

  return {
    usedSeconds,
    limitSeconds,
    remainingSeconds,
    isExhausted,
    isUnlimited,
    loading,
    resetCountdown,
  }
}

/**
 * Format seconds as HH:MM:SS or MM:SS
 */
export function formatTime(totalSeconds: number, showHours = false): string {
  if (!isFinite(totalSeconds)) return "--:--"
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  
  if (showHours || h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(Math.floor(s)).padStart(2, "0")}`
  }
  return `${String(m).padStart(2, "0")}:${String(Math.floor(s)).padStart(2, "0")}`
}
