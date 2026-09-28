"use client"

/**
 * The interactive signal generator that lives next to the chart on
 * /chart-to-signal and /chart-15sec-signal.
 *
 * Flow
 * ----
 * 1. Show usage chip + tier label so the user always knows where they
 *    stand on the daily quota.
 * 2. The user picks a strategy from the "Select Strategy" dropdown.
 *    Right now we only ship "QX Volt - Strategy 1" (always selected);
 *    the menu also surfaces a "More strategies coming soon" affordance
 *    so the slot is visibly extensible without being interactive.
 * 3. When the user taps "Generate Live Signal":
 *    a. If the current candle has fewer than `minRemaining` seconds
 *       left we surface a full-screen modal warning with a single
 *       "Yes, understand" dismiss action (no inline banner — the
 *       warning must be impossible to miss).
 *    b. Atomically reserve a quota slot in Firebase (`useSignalUsage`).
 *    c. Call the Python backend to run all strategies on the most
 *       recent candle history.
 *    d. Render the result as a centred modal — market, entry time,
 *       direction (UP/DOWN), duration, and a "trade in next candle"
 *       hint. The OK button only appears after a 3s timing animation
 *       so the user has time to read the trade card.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  History,
  Hourglass,
  Radio,
  Target,
  Timer,
} from "lucide-react"

import { generateSignal, type SignalResponse } from "@/lib/signals-client"
import { TIER_ACCENT, type SignalSystem, type Tier } from "@/lib/tiers"
import { useSignalUsage } from "@/hooks/use-signal-usage"
import { addSignalHistoryEntry } from "@/lib/signal-history"
import { cn } from "@/lib/utils"
import type { Candle } from "@/hooks/use-quotex-ws"

import { SignalResultPopup, WaitWarningPopup } from "@/components/signal/signal-popups"
import { SignalHistoryPopup } from "@/components/signal/signal-history-popup"
import { UsageBar } from "@/components/signal/usage-bar"

type Props = {
  qxlKey: string
  /**
   * Per-user access token issued at activation time. Used as the scope
   * key for daily usage counters and history so two users sharing the
   * same QXL key (no-limit / limited types) each get their own data.
   */
  accessToken: string
  tier: Tier
  system: SignalSystem
  /** Candle period in seconds — used to compute remaining time on the
   *  current candle and to send to the backend. */
  period: number
  /** Minimum seconds that must remain on the current candle before we
   *  let the user generate. Per spec, 30s for /chart-to-signal and 8s
   *  for /chart-15sec-signal. */
  minRemaining: number
  asset: string | null
  latest: Candle | null
}

// Static strategy catalogue. Today only QX Volt - Strategy 1 ships
// enabled; everything else is rendered as a "coming soon" affordance.
// We keep this as a typed array (rather than inline JSX) so adding the
// next strategy is a one-line change and the active selection logic
// stays uniform.
type Strategy = { id: string; label: string; locked?: boolean }
const STRATEGIES: Strategy[] = [{ id: "qx-volt-1", label: "QX Volt - Strategy 1" }]

export function GenerateSignalPanel({
  qxlKey,
  accessToken,
  tier,
  system,
  period,
  minRemaining,
  asset,
  latest,
}: Props) {
  const usage = useSignalUsage(accessToken, tier, system)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warningOpen, setWarningOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [result, setResult] = useState<SignalResponse | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [strategy] = useState<string>(STRATEGIES[0].id)
  // One-signal-per-candle rule. When the user fires a signal we stamp
  // the unix-second END of the candle they were inside; the button
  // stays disabled until ``now >= cooldownUntil`` so they cannot
  // generate a second signal during the same candle window — even if
  // the result modal closed and there's still time left on the candle.
  // Persisted to sessionStorage (per-system) so a route change /
  // refresh inside the same browser session can't be used to bypass
  // the cooldown.
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const accent = TIER_ACCENT[tier]
  // Guard against the same backend response getting written twice into
  // history (e.g. if the popup re-opens for the same `result` ref).
  const persistedSignalRef = useRef<SignalResponse | null>(null)

  // Live countdown — recomputed every 250ms so the user sees the
  // minimum-seconds rule reflected in real time.
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const id = window.setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      250,
    )
    return () => window.clearInterval(id)
  }, [])

  const remaining = useMemo(
    () => candleSecondsRemaining(latest, period, now),
    [latest, period, now],
  )

  // Rehydrate cooldown from sessionStorage on mount and whenever the
  // (accessToken, system) pair changes. The key is namespaced per-(system,
  // user) so a Pro user with multiple chart pages doesn't bleed
  // cooldowns across systems — and so two users sharing the same
  // QXL key (no-limit / limited) don't share cooldowns either.
  const cooldownKey = useMemo(
    () => `qxl:signal-cooldown:${system}:${accessToken}`,
    [system, accessToken],
  )
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.sessionStorage.getItem(cooldownKey)
      if (!raw) {
        setCooldownUntil(null)
        return
      }
      const parsed = Number(raw)
      if (!Number.isFinite(parsed)) {
        setCooldownUntil(null)
        return
      }
      // Drop stale values — if the candle the user generated on has
      // already closed we don't want to keep the button disabled.
      if (parsed <= Math.floor(Date.now() / 1000)) {
        window.sessionStorage.removeItem(cooldownKey)
        setCooldownUntil(null)
        return
      }
      setCooldownUntil(parsed)
    } catch {
      setCooldownUntil(null)
    }
  }, [cooldownKey])

  // Auto-clear once the candle the cooldown was stamped against has
  // expired. We watch ``now`` (1Hz tick from the existing setInterval)
  // so the button re-enables exactly at the boundary.
  useEffect(() => {
    if (cooldownUntil === null) return
    if (now >= cooldownUntil) {
      setCooldownUntil(null)
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.removeItem(cooldownKey)
        } catch {
          /* ignore */
        }
      }
    }
  }, [now, cooldownUntil, cooldownKey])

  const cooldownRemaining =
    cooldownUntil !== null ? Math.max(0, cooldownUntil - now) : 0
  const inCooldown = cooldownRemaining > 0

  async function onGenerate() {
    if (!asset) {
      setError("Select a market first.")
      return
    }
    // One signal per candle — block fast re-fires within the same
    // candle window. The button itself is also disabled below, this
    // is a defensive second line of defence in case state is racey.
    if (inCooldown) {
      setError(
        `Please wait for the current candle to close. Next signal in ${cooldownRemaining}s.`,
      )
      return
    }
    // Per spec the "wait for next candle" affordance is no longer an
    // inline banner — it's a full-screen modal that the user has to
    // explicitly acknowledge. Surfacing it here also short-circuits
    // the quota consumption below so the user isn't charged a slot
    // for clicking too early.
    if (latest && remaining !== null && remaining < minRemaining) {
      setWarningOpen(true)
      return
    }
    if (usage.remaining <= 0) {
      setError(
        "You've used your daily signal quota for this system. The counter resets at 6:00 AM BD (UTC+6).",
      )
      return
    }

    setGenerating(true)
    setError(null)

    // Reserve quota atomically BEFORE we hit the backend so two
    // parallel taps can never exceed the daily limit.
    const consumed = await usage.consume()
    if (!consumed.ok) {
      setGenerating(false)
      if (consumed.reason === "limit-reached") {
        setError(
          "Daily signal limit reached. Please come back after the 6:00 AM BD (UTC+6) reset.",
        )
      } else {
        setError(consumed.message ?? "Couldn't reserve a signal slot.")
      }
      return
    }

    try {
      const sig = await generateSignal({ asset, period, count: 120 })
      setResult(sig)
      setResultOpen(true)
      // One-signal-per-candle latch. We stamp the END of the candle
      // the user generated inside, NOT a fixed 15s/60s wall clock,
      // because the trade itself opens at the next candle boundary —
      // letting the user fire again before that boundary would mean
      // two competing trades on the same candle.
      const nowSec = Math.floor(Date.now() / 1000)
      // Use the ``latest`` candle timestamp if available so the
      // boundary lines up with the chart; fall back to ``now`` so we
      // still enforce *some* cooldown if the candle stream is stale.
      const boundary = latest
        ? Math.floor(latest.time / period) * period + period
        : Math.ceil((nowSec + 1) / period) * period
      setCooldownUntil(boundary)
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(cooldownKey, String(boundary))
        } catch {
          /* ignore quota/private-mode errors — runtime state still works */
        }
      }
      // Persist into the per-(system, accessToken) history. We compute
      // the entry candle here using the same convention the result popup
      // uses (`nextCandleStart`) so the value the user sees in the
      // popup is the value stored in history. Keying by accessToken
      // (not qxlKey) ensures users sharing a no-limit / limited QXL key
      // each see only their own history.
      if (persistedSignalRef.current !== sig) {
        persistedSignalRef.current = sig
        addSignalHistoryEntry(system, accessToken, sig, nextCandleStart(period))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  const buttonDisabled =
    generating ||
    !asset ||
    usage.remaining <= 0 ||
    latest === null ||
    inCooldown

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Desktop: UsageBar above */}
      <div className="hidden sm:block">
        <UsageBar
          count={usage.count}
          limit={usage.limit}
          tier={tier}
          loading={usage.loading}
          label="Today's signal quota"
        />
      </div>

      <div className="rounded-xl border border-[#1B7892]/35 bg-[#02141A]/80 p-3 backdrop-blur-md sm:rounded-2xl sm:p-4 md:p-5">
        {/* Strategy picker (replaces the old descriptive paragraph) */}
        <StrategyPicker selected={strategy} />

        {/* Candle countdown */}
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-[#1B7892]/30 bg-[#03171E]/65 px-2.5 py-1.5 sm:mb-4 sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8F4F7]/60 sm:gap-1.5 sm:text-[11px] sm:tracking-[0.2em]">
            <Timer className="size-3 text-[#5BC0D8] sm:size-3.5" aria-hidden strokeWidth={2.4} />
            <span className="hidden xs:inline">Current</span> candle
          </span>
          <span
            className={cn(
              "font-mono text-[12px] tabular-nums sm:text-[14px]",
              remaining === null && "text-[#E8F4F7]/40",
              remaining !== null && remaining < minRemaining && "text-amber-300",
              remaining !== null && remaining >= minRemaining && "text-emerald-300",
            )}
          >
            {remaining === null
              ? "—"
              : `${String(remaining).padStart(2, "0")}s left`}
          </span>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={buttonDisabled}
          className={cn(
            "group relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-lg text-[13px] font-semibold tracking-[0.01em] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:h-12 sm:rounded-xl sm:text-[15px]",
            "disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0",
          )}
          style={{
            background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
            color: accent.fg,
            boxShadow: `0 14px 32px -12px ${accent.ring}`,
          }}
          aria-busy={generating}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent"
          />
          <span className="relative flex items-center justify-center gap-2">
            {generating ? (
              <>
                <Hourglass className="size-3.5 animate-spin sm:size-4" strokeWidth={2.4} />
                <span className="font-normal">Analyzing</span>{" "}
                <span className="italic">strategies...</span>
              </>
            ) : inCooldown ? (
              <>
                <Timer className="size-3.5 sm:size-4" strokeWidth={2.4} />
                <span className="font-normal">Next signal in</span>{" "}
                <span className="font-mono italic tabular-nums">
                  {String(cooldownRemaining).padStart(2, "0")}s
                </span>
              </>
            ) : (
              <>
                <Radio className="size-3.5 sm:size-4" strokeWidth={2.4} />
                <span className="font-normal">Generate</span>{" "}
                <span className="italic">Live Signal</span>
              </>
            )}
          </span>
        </button>

        {/* History affordance — opens the per-(system, qxlKey) drawer.
            Sits directly under the generate button on every breakpoint
            so the user never has to hunt for it. The badge surfaces the
            current count without inflating the visual weight of the row. */}
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#1B7892]/45 bg-[#03171E]/65 text-[12px] font-medium tracking-[0.01em] text-[#E8F4F7]/85 transition-colors hover:border-[#5BC0D8]/55 hover:bg-[#03171E] hover:text-[#E8F4F7] sm:mt-2.5 sm:h-10 sm:rounded-xl sm:text-[12.5px]"
          aria-label="Open signal history"
        >
          <History
            className="size-3.5 text-[#7DE3FF] sm:size-4"
            aria-hidden
            strokeWidth={2.3}
          />
          <span className="font-normal">Signal</span>{" "}
          <span className="font-normal text-[#7DE3FF]/95">History</span>
        </button>

        {error && (
          <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-rose-400/40 bg-rose-400/10 px-2.5 py-2 text-[11px] leading-relaxed text-rose-100 sm:mt-3 sm:rounded-xl sm:px-3 sm:text-[12.5px]">
            <AlertTriangle
              className="mt-0.5 size-3.5 shrink-0 text-rose-300 sm:size-4"
              aria-hidden
              strokeWidth={2.2}
            />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Mobile: UsageBar below the generate button */}
      <div className="block sm:hidden">
        <UsageBar
          count={usage.count}
          limit={usage.limit}
          tier={tier}
          loading={usage.loading}
          label="Today's signal quota"
        />
      </div>

      {/* Modals */}
      <WaitWarningPopup
        open={warningOpen}
        minRemaining={minRemaining}
        onClose={() => setWarningOpen(false)}
      />
      <SignalResultPopup
        open={resultOpen}
        result={result}
        period={period}
        system={system}
        onClose={() => setResultOpen(false)}
      />
      <SignalHistoryPopup
        open={historyOpen}
        system={system}
        scopeId={accessToken}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Strategy picker                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Compact dropdown that replaces the old descriptive paragraph above
 * the generate button. It always shows a single selected strategy
 * (QX Volt - Strategy 1). Tapping the trigger reveals the menu with
 * the active strategy plus a disabled "More strategies coming soon"
 * row, so the affordance is visibly extensible without being
 * misleadingly interactive.
 */
function StrategyPicker({ selected }: { selected: string }) {
  const [open, setOpen] = useState(false)
  const active = STRATEGIES.find((s) => s.id === selected) ?? STRATEGIES[0]

  return (
    <div className="relative mb-3 sm:mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg border border-[#1B7892]/35 bg-[#03171E]/65 px-3 py-2.5 text-left transition-colors hover:border-[#5BC0D8]/55 sm:rounded-xl sm:py-3"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-[#5BC0D8]/30 via-[#1B7892]/30 to-[#03161B]/60 text-[#7DE3FF] ring-1 ring-inset ring-[#5BC0D8]/35 sm:size-9 sm:rounded-lg">
          <Target className="size-3.5 sm:size-4" aria-hidden strokeWidth={2.3} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#5BC0D8]/85 sm:text-[10.5px] sm:tracking-[0.32em]">
            Select Strategy
          </span>
          <span className="font-display text-[14px] tracking-wide text-[#E8F4F7] sm:text-[16px]">
            <span className="font-normal">{active.label.split(" - ")[0]}</span>{" "}
            <span className="italic text-[#7DE3FF]/90">{active.label.split(" - ")[1]}</span>
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#E8F4F7]/55 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
          strokeWidth={2.4}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-xl border border-[#1B7892]/40 bg-[#02141A]/95 p-1 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.85)] backdrop-blur-md"
        >
          {STRATEGIES.map((s) => {
            const isActive = s.id === selected
            return (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                  isActive
                    ? "bg-[#5BC0D8]/10 text-[#7DE3FF]"
                    : "text-[#E8F4F7]/85 hover:bg-[#03171E]/65",
                )}
              >
                <Check
                  className={cn(
                    "size-3.5 shrink-0",
                    isActive ? "text-[#7DE3FF]" : "opacity-0",
                  )}
                  aria-hidden
                  strokeWidth={2.4}
                />
                <span className="font-mono text-[12.5px] sm:text-[13.5px]">{s.label}</span>
              </button>
            )
          })}
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-[#1B7892]/35 bg-[#03171E]/45 px-2.5 py-2 text-[#E8F4F7]/55">
            <span className="size-1.5 rounded-full bg-[#5BC0D8]/55 motion-safe:animate-pulse" aria-hidden />
            <span className="font-mono text-[11.5px] italic sm:text-[12.5px]">
              More strategies coming soon
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compute how many seconds remain on the current candle bucket.
 * Returns `null` when we don't yet have a `latest` candle.
 */
function candleSecondsRemaining(
  latest: Candle | null,
  period: number,
  now: number,
): number | null {
  if (!latest) return null
  const end = Math.floor(latest.time / period) * period + period
  return Math.max(0, end - now)
}

/**
 * Resolve the unix-second start of the *next* candle bucket. Used to
 * stamp the "entry time" on history entries — must mirror the
 * `nextCandleStart` helper in `signal-popups.tsx` so the popup and the
 * stored history agree on the same wall-clock entry moment.
 */
function nextCandleStart(period: number): number {
  const nowSec = Math.floor(Date.now() / 1000)
  return Math.ceil((nowSec + 1) / period) * period
}
