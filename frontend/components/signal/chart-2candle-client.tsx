"use client"

import { CandlestickChart, Clock, AlertTriangle, Timer } from "lucide-react"

import { See2CandleCard } from "@/components/signal/see-2candle-card"
import { MarketChartCard } from "@/components/signal/market-chart-card"
import { SignalShell } from "@/components/signal/signal-shell"
import { useMarketChart } from "@/hooks/use-market-chart"
import { use2CandleUsage, formatTime } from "@/hooks/use-2candle-usage"
import { candle2LimitLabel, TIER_ACCENT, type Tier } from "@/lib/tiers"
import { cn } from "@/lib/utils"

const PERIOD_SECONDS = 60

export function Chart2CandleClient({ code }: { code: string }) {
  return (
    <SignalShell
      rawCode={code}
      pageEyebrow="Chart + Projection · 1m"
      pageTitle="See 2 candles ahead"
    >
      {({ accessToken, tier, qxlKey }) => (
        <Chart2CandleContent
          accessToken={accessToken}
          tier={tier}
          qxlKey={qxlKey}
          code={code}
        />
      )}
    </SignalShell>
  )
}

function Chart2CandleContent({
  accessToken,
  tier,
  qxlKey,
  code,
}: {
  accessToken: string
  tier: Tier
  qxlKey: string
  code: string
}) {
  const chart = useMarketChart({ period: PERIOD_SECONDS, accessToken })

  // Track time usage - active when a market is selected. Keyed by the
  // per-user `accessToken` (not the QXL key) so two users sharing the
  // same no-limit / limited QXL key each get their own daily timer.
  const hasMarketSelected = Boolean(chart.asset)
  const usage = use2CandleUsage(accessToken, tier, hasMarketSelected)

  const showQuota = !usage.isUnlimited

  return (
    <div className="relative">
      {/* Two-column grid mirroring chart-to-signal / chart-15sec-signal */}
      <div className="grid gap-5 lg:grid-cols-2">
        <MarketChartCard
          status={chart.status}
          assets={chart.assets}
          asset={chart.asset}
          onSelectAsset={chart.setAsset}
          history={chart.history}
          latest={chart.latest}
          currentAsset={chart.currentAsset}
          period={chart.period}
          error={chart.error}
          errorKind={chart.errorKind}
          onReclaim={chart.reclaim}
          phase={chart.phase}
          secondsLeft={chart.secondsLeft}
          marketIcon={CandlestickChart}
          lock={chart.lock}
        />

        {/* Right column: See2CandleCard only (quota moves below on all sizes) */}
        <div className="flex h-full flex-col gap-3 sm:gap-4">
          <See2CandleCard
            tier={tier}
            history={chart.history}
            latest={chart.latest}
            asset={chart.currentAsset?.symbol ?? chart.asset ?? null}
            code={code}
          />
        </div>
      </div>

      {/* Quota card sits below both the market selector and the projection card,
          spanning the full width on desktop and stacking naturally on mobile. */}
      {showQuota && (
        <div className="mt-5">
          <QuotaCard
            usedSeconds={usage.usedSeconds}
            limitSeconds={usage.limitSeconds}
            remainingSeconds={usage.remainingSeconds}
            isActive={hasMarketSelected}
            tier={tier}
          />
        </div>
      )}

      {/* Limit Exhausted Overlay */}
      {usage.isExhausted && (
        <LimitExhaustedOverlay
          tier={tier}
          resetCountdown={usage.resetCountdown}
        />
      )}
    </div>
  )
}

/* ══════════════════════════ QUOTA CARD ══════════════════════════════════ */
/**
 * Compact tier-time-quota card. Visually mirrors the slim UsageBar that
 * sits in the right-hand panel of /chart-to-signal and /chart-15sec-signal,
 * so the right column has a consistent visual rhythm across all three
 * signal pages: a slim usage chip on top, the action card below.
 */
function QuotaCard({
  usedSeconds,
  limitSeconds,
  remainingSeconds,
  isActive,
  tier,
}: {
  usedSeconds: number
  limitSeconds: number
  remainingSeconds: number
  isActive: boolean
  tier: Tier
}) {
  const pct = limitSeconds > 0 ? Math.min(100, (usedSeconds / limitSeconds) * 100) : 0
  const isLow = remainingSeconds <= Math.max(60, limitSeconds * 0.1)
  const accent = TIER_ACCENT[tier]

  return (
    <div className="relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-[#1B7892]/40 bg-gradient-to-br from-[#03161B]/90 to-[#02141A]/95 p-4 backdrop-blur-md sm:rounded-2xl sm:p-5">
      {/* Subtle gradient accent — matches UsageBar */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-20 blur-2xl"
        style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
      />

      {/* Header row: label + countdown */}
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E8F4F7]/75 sm:text-[12px]">
          <span
            className="grid size-7 place-items-center rounded-lg sm:size-8 sm:rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${accent.from}20, ${accent.to}10)`,
              border: `1px solid ${accent.from}35`,
            }}
          >
            <Clock
              className={cn("size-3.5 sm:size-4", isActive && "animate-pulse")}
              style={{ color: isLow ? "#FCD34D" : accent.from }}
              aria-hidden
              strokeWidth={2.2}
            />
          </span>
          2 Candle Quota
        </span>

        <span
          className={cn(
            "font-mono text-[13px] tabular-nums sm:text-[14px]",
            isLow ? "text-amber-300" : "text-[#E8F4F7]",
          )}
        >
          {formatTime(remainingSeconds, true)}
        </span>
      </div>

      {/* Progress bar — same height/curve/glow as UsageBar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#03161B] ring-1 ring-inset ring-[#1B7892]/30">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: isLow
              ? "linear-gradient(90deg, #F59E0B 0%, #FCD34D 100%)"
              : `linear-gradient(90deg, ${accent.from} 0%, ${accent.to} 100%)`,
            boxShadow: isLow
              ? "0 0 12px -2px rgba(245,158,11,0.6)"
              : `0 0 12px -2px ${accent.ring}`,
          }}
        />
      </div>

      {/* Footer row: status pill + tier limit */}
      <div className="flex items-center justify-between gap-2 text-[10px] font-medium text-[#E8F4F7]/55">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em]",
            isActive
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-[#1B7892]/30 bg-[#1B7892]/10 text-[#5BC0D8]/70",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              isActive ? "animate-pulse bg-emerald-400" : "bg-[#5BC0D8]/40",
            )}
          />
          {isActive ? "Active" : "Paused"}
        </span>
        <span className="tabular-nums">
          <span className="text-[#E8F4F7]/35">Limit</span>{" "}
          <span className="font-bold text-[#F5C16C]">{candle2LimitLabel(tier)}</span>
        </span>
      </div>
    </div>
  )
}

/* ══════════════════════════ LIMIT EXHAUSTED OVERLAY ════════════════════ */

function LimitExhaustedOverlay({
  tier,
  resetCountdown,
}: {
  tier: Tier
  resetCountdown: { hours: number; minutes: number; seconds: number }
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020D12]/95 backdrop-blur-md">
      <div className="mx-4 w-full max-w-md">
        <div
          className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-[#03161B] p-6 sm:p-8"
          style={{
            boxShadow: "0 0 60px -15px rgba(245, 158, 11, 0.3)",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-amber-500/10 blur-3xl"
          />

          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div
                className="grid size-16 place-items-center rounded-full bg-amber-500/15 sm:size-20"
                style={{ boxShadow: "0 0 30px -5px rgba(245, 158, 11, 0.4)" }}
              >
                <AlertTriangle
                  className="size-8 text-amber-400 sm:size-10"
                  strokeWidth={1.5}
                />
              </div>
              <span
                aria-hidden
                className="absolute -inset-2 animate-ping rounded-full border border-amber-500/30"
                style={{ animationDuration: "2s" }}
              />
            </div>
          </div>

          <h2
            className="mb-2 text-center text-[22px] font-medium leading-tight text-[#E8F4F7] sm:text-[26px]"
            style={{ fontFamily: "var(--font-quintessential), 'Quintessential', serif" }}
          >
            Daily{" "}
            <span
              className="italic text-amber-400"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
            >
              Limit Reached
            </span>
          </h2>

          <p className="mb-6 text-center text-[13px] leading-relaxed text-[#E8F4F7]/60 sm:text-[14px]">
            Your <span className="font-semibold text-[#F5C16C]">{tier}</span> account
            {" "}daily limit for{" "}
            <span className="font-semibold text-[#7DE3FF]">2 Candle Ahead</span>
            {" "}has been used. The limit will reset at{" "}
            <span className="font-semibold text-emerald-400">6:00 AM BD (UTC+6)</span>.
          </p>

          <div className="rounded-xl border border-[#1B7892]/30 bg-[#020D12]/60 p-4">
            <div className="mb-3 flex items-center justify-center gap-2">
              <Timer className="size-4 text-[#5BC0D8]" strokeWidth={2} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5BC0D8]/60">
                Reset In
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <TimeUnit value={resetCountdown.hours} label="Hours" />
              <span className="text-[24px] font-bold text-[#5BC0D8]/40 sm:text-[28px]">:</span>
              <TimeUnit value={resetCountdown.minutes} label="Minutes" />
              <span className="text-[24px] font-bold text-[#5BC0D8]/40 sm:text-[28px]">:</span>
              <TimeUnit value={resetCountdown.seconds} label="Seconds" />
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-[#5BC0D8]/40">
            Come back after 6:00 AM Bangladesh time to use this feature again.
          </p>
        </div>
      </div>
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="grid size-14 place-items-center rounded-lg border border-[#1B7892]/30 bg-[#03161B] sm:size-16"
        style={{ boxShadow: "inset 0 1px 0 rgba(125, 227, 255, 0.1)" }}
      >
        <span className="font-mono text-[24px] font-bold tabular-nums text-[#E8F4F7] sm:text-[28px]">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#5BC0D8]/40">
        {label}
      </span>
    </div>
  )
}
