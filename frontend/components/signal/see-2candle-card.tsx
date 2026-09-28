"use client"

/**
 * "See 2 Candle Ahead" — tier-gated companion card on /chart-2candle.
 *
 * Per product spec, the right-hand companion to the live chart is no
 * longer a tutorial video — it now renders four distinct experiences,
 * one per purchased tier:
 *
 *   - basic      → Upgrade gate.  "Your tier isn't eligible."
 *   - smart      → Glitch / device-not-supported teaser pointing at
 *                  the $75 plan.
 *   - pro        → Live shadow projection of the next two candles,
 *                  computed from the most recent chart buckets.
 *   - dominator  → Simple direction call (UP / DOWN) for the next two
 *     personal     candles, also derived from live data.
 *
 * The card is intentionally self-contained: it consumes only the
 * candle history/latest pair already produced by `useMarketChart` on
 * the parent page. No additional WebSocket traffic, no extra state.
 */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Crown,
  Eye,
  LineChart,
  Lock,
  Settings2,
  TriangleAlert,
  Wand2,
  X,
} from "lucide-react"

import type { Candle } from "@/hooks/use-quotex-ws"
import { TIER_ACCENT, type Tier } from "@/lib/tiers"

/* -------------------------------------------------------------------------- */
/*  Card shell                                                                */
/* -------------------------------------------------------------------------- */

function CardShell({
  title,
  italic,
  accent,
  children,
  onEyeDoubleClick,
  eyeActive,
  eyeAriaLabel,
}: {
  title: string
  italic: string
  accent: { from: string; to: string }
  children: React.ReactNode
  /**
   * When provided, the eye icon becomes an interactive button that
   * fires this handler on double-click / double-tap. Used by the
   * personal tier to toggle "video mode" on the projection card.
   */
  onEyeDoubleClick?: () => void
  /** Visual hint that the eye toggle is currently active. */
  eyeActive?: boolean
  /** Accessible label for the eye toggle (only used when interactive). */
  eyeAriaLabel?: string
}) {
  const eyeBaseClass =
    "inline-flex size-6 items-center justify-center rounded-md ring-1 ring-inset ring-[#5BC0D8]/35 sm:size-8 sm:rounded-lg"
  const eyeStyle = {
    background: `linear-gradient(135deg, ${accent.from}30, ${accent.to}20, #03161B66)`,
    color: eyeActive ? "#C4B5FD" : "#7DE3FF",
  } as React.CSSProperties

  const eyeIcon = (
    <Eye className="size-3 sm:size-4" aria-hidden strokeWidth={2.2} />
  )

  return (
    <section className="relative flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-[#1B7892]/35 bg-[#02141A]/80 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] backdrop-blur-md sm:rounded-2xl">
      <div className="flex items-center gap-2 border-b border-[#1B7892]/30 bg-[#03171E]/70 px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-3">
        {onEyeDoubleClick ? (
          <button
            type="button"
            onDoubleClick={onEyeDoubleClick}
            className={`${eyeBaseClass} cursor-pointer transition hover:ring-[#C4B5FD]/60 ${
              eyeActive ? "ring-[#C4B5FD]/60" : ""
            }`}
            style={eyeStyle}
            aria-label={eyeAriaLabel ?? "Double-click to toggle"}
            aria-pressed={!!eyeActive}
            title="Double-click to toggle"
          >
            {eyeIcon}
          </button>
        ) : (
          <span className={eyeBaseClass} style={eyeStyle}>
            {eyeIcon}
          </span>
        )}
        <h2 className="font-display text-[14px] tracking-wide text-[#E8F4F7] sm:text-[17px]">
          <span className="font-normal">{title}</span>{" "}
          <span className="italic text-[#7DE3FF]/90">{italic}</span>
        </h2>
      </div>

      <div className="relative flex-1 min-h-[280px] lg:min-h-[460px]">{children}</div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Public component                                                          */
/* -------------------------------------------------------------------------- */

export function See2CandleCard({
  tier,
  history,
  latest,
  asset,
  code,
}: {
  tier: Tier
  history: Candle[]
  latest: Candle | null
  /** Currently-selected market symbol, or null when no market is open. */
  asset: string | null
  /** URL access token, used to deep-link into the upgrade hub. */
  code: string
}) {
  const accent = TIER_ACCENT[tier]

  // Whether or not we have a market selected. The Basic gate is hidden
  // until the user picks a market — instead we show an "open a market
  // to continue" placeholder so the right-hand panel doesn't shout
  // upgrade copy at someone who hasn't started using the chart yet.
  const marketSelected = !!asset && asset.length > 0

  if (tier === "basic") {
    return (
      <CardShell
        title="Two candles"
        italic="ahead view"
        accent={accent}
      >
        {marketSelected ? <BasicUpgrade code={code} /> : <SelectMarketHint />}
      </CardShell>
    )
  }

  if (tier === "smart") {
    return (
      <CardShell
        title="Two candles"
        italic="ahead view"
        accent={accent}
      >
        {marketSelected ? <SmartGlitch code={code} /> : <SelectMarketHint />}
      </CardShell>
    )
  }

  if (tier === "pro") {
    return (
      <CardShell
        title="Two candles"
        italic="ahead view"
        accent={accent}
      >
        {marketSelected ? (
          <ProShadow history={history} latest={latest} />
        ) : (
          <SelectMarketHint />
        )}
      </CardShell>
    )
  }

  if (tier === "personal") {
    return <PersonalCard accent={accent} marketSelected={marketSelected} history={history} latest={latest} />
  }

  // dominator
  return (
    <CardShell
      title="Two candles"
      italic="ahead view"
      accent={accent}
    >
      {marketSelected ? (
        <DominatorDirection history={history} latest={latest} tier={tier} />
      ) : (
        <SelectMarketHint />
      )}
    </CardShell>
  )
}

/* -------------------------------------------------------------------------- */
/*  Variant: BASIC — upgrade gate                                             */
/* -------------------------------------------------------------------------- */

function BasicUpgrade({ code }: { code: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#02141A]/85 p-5 text-center sm:gap-5 sm:p-7">
      {/* Glow ring icon */}
      <span
        aria-hidden
        className="relative inline-flex size-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_30px_-8px_rgba(251,191,36,0.55)] sm:size-16"
      >
        <Lock className="size-6 sm:size-7" strokeWidth={2.2} aria-hidden />
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-amber-300/30" />
      </span>

      <div className="flex max-w-md flex-col gap-2">
        <h3 className="font-display text-[20px] leading-tight tracking-wide text-[#E8F4F7] sm:text-[26px]">
          <span className="font-normal">Upgrade account tier</span>
        </h3>
        <p className="text-pretty font-sans text-[13px] leading-relaxed text-[#E8F4F7]/72 sm:text-[14px]">
          You&apos;re not eligible to view two candles ahead on the{" "}
          <span className="font-semibold italic text-[#E8F4F7]">Basic</span>{" "}
          plan. Move up a tier to unlock the projection engine.
        </p>
      </div>

      <Link
        href={`/upgrade-your-plan/${encodeURIComponent(code)}`}
        aria-label="Upgrade your plan"
        className="upgrade-cta group/cta relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 px-6 font-sans text-[12.5px] font-semibold uppercase tracking-[0.2em] text-[#1A1208] shadow-[0_10px_32px_-10px_rgba(251,191,36,0.65)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_14px_40px_-10px_rgba(251,191,36,0.85)] sm:h-12 sm:px-7 sm:text-[13px]"
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          <Crown
            className="size-4 transition-transform duration-300 group-hover/cta:-translate-y-0.5 group-hover/cta:rotate-[-6deg]"
            strokeWidth={2.2}
            aria-hidden
          />
          Upgrade Your Plan
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5"
            strokeWidth={2.4}
            aria-hidden
          />
        </span>
        {/* Diagonal sheen sweeping across on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40 opacity-0 transition-all duration-500 group-hover/cta:left-[120%] group-hover/cta:opacity-70"
        />
        {/* Soft pulse to draw the eye */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-amber-200/40"
        />
      </Link>

      <p className="font-sans text-[11px] leading-relaxed text-[#E8F4F7]/45 sm:text-[12px]">
        Automatic account swap once admin approves your upgrade.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Variant: SELECT-MARKET hint — shown to every tier when no market is open   */
/* -------------------------------------------------------------------------- */

function SelectMarketHint() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#02141A]/85 p-5 text-center sm:gap-4 sm:p-7">
      <span
        aria-hidden
        className="inline-flex size-12 items-center justify-center rounded-2xl border border-[#5BC0D8]/35 bg-[#5BC0D8]/10 text-[#7DE3FF] shadow-[0_0_30px_-12px_rgba(91,192,216,0.55)] sm:size-14"
      >
        <LineChart className="size-5 sm:size-6" strokeWidth={2.1} aria-hidden />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="font-display text-[18px] leading-tight tracking-wide text-[#E8F4F7] sm:text-[22px]">
          Pick a market to continue
        </h3>
        <p className="text-pretty font-sans text-[12.5px] leading-relaxed text-[#E8F4F7]/65 sm:text-[13.5px]">
          Open any pair from the chart on the left and the two-candle view will
          come alive here.
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Variant: SMART — glitch / not supported                                   */
/* -------------------------------------------------------------------------- */

function SmartGlitch({ code }: { code: string }) {
  // Static reference positions for the animated candle backdrop so each
  // candle has its own unique pulse/jitter cadence without re-flowing on
  // parent re-render.
  const bars = [22, 35, 48, 28, 42, 55, 38, 50, 33, 46, 30, 44, 36, 41]

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#02141A]/92">
      {/* Animated candlestick backdrop */}
      <svg
        viewBox="0 0 280 140"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-[0.32]"
        aria-hidden
      >
        <defs>
          <linearGradient id="bgGreen" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="bgRed" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {bars.map((h, i) => {
          const up = i % 2 === 0
          const x = 4 + i * 19
          return (
            <g
              key={i}
              className="bg-candle"
              style={{
                animationDelay: `${(i % 6) * 0.18}s`,
                transformOrigin: `${x + 4.5}px 70px`,
              }}
            >
              <line
                x1={x + 4.5}
                x2={x + 4.5}
                y1={70 - h / 2 - 6}
                y2={70 + h / 2 + 6}
                stroke={up ? "#10b981" : "#ef4444"}
                strokeWidth={1}
                strokeOpacity={0.55}
              />
              <rect
                x={x}
                y={70 - h / 2}
                width={9}
                height={h}
                rx={1.5}
                fill={up ? "url(#bgGreen)" : "url(#bgRed)"}
              />
            </g>
          )
        })}
      </svg>

      {/* Vertical scanline */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 h-px animate-[scan_3.2s_linear_infinite] bg-gradient-to-r from-transparent via-rose-400/70 to-transparent"
      />
      {/* Soft horizontal glitch slice */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[58%] h-3 animate-[slice_2.4s_steps(8,end)_infinite] bg-[#7DE3FF]/[0.05] mix-blend-screen"
      />
      {/* RGB chroma overlay */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-[chroma_4.5s_ease-in-out_infinite] bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.05),transparent_60%)]"
      />

      <style jsx>{`
        @keyframes scan {
          0%   { transform: translateY(-30px); opacity: 0.2; }
          50%  { transform: translateY(46px);  opacity: 0.85; }
          100% { transform: translateY(-30px); opacity: 0.2; }
        }
        @keyframes slice {
          0%, 92%, 100% { transform: translateX(0); opacity: 0; }
          30%           { transform: translateX(-4px); opacity: 0.9; }
          45%           { transform: translateX(6px);  opacity: 0.6; }
          60%           { transform: translateX(-2px); opacity: 0.8; }
        }
        @keyframes chroma {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes candleFloat {
          0%, 100% { transform: scaleY(1)    translateY(0); opacity: 0.8; }
          50%      { transform: scaleY(1.08) translateY(-1px); opacity: 1; }
        }
        .bg-candle {
          animation: candleFloat 2.6s ease-in-out infinite;
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
          15%      { transform: translate(-1.6px, 0.5px); clip-path: inset(8% 0 35% 0); }
          30%      { transform: translate(1.4px, -0.6px); clip-path: inset(45% 0 12% 0); }
          45%      { transform: translate(-1px, 1px);     clip-path: inset(20% 0 60% 0); }
          60%      { transform: translate(1.2px, 0.4px);  clip-path: inset(0 0 0 0); }
          75%      { transform: translate(-0.6px, -1.2px); clip-path: inset(70% 0 5% 0); }
        }
        .glitch-text {
          position: relative;
          animation: glitch 1.4s steps(3, end) infinite;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .glitch-text::before {
          color: #ef4444;
          transform: translate(1.4px, 0);
          mix-blend-mode: screen;
          opacity: 0.75;
          animation: glitch 1.4s steps(3, end) infinite reverse;
        }
        .glitch-text::after {
          color: #5BC0D8;
          transform: translate(-1.4px, 0);
          mix-blend-mode: screen;
          opacity: 0.75;
          animation: glitch 1.6s steps(3, end) infinite;
        }
        @keyframes errPulse {
          0%, 100% { opacity: 1;   box-shadow: 0 0 0 0 rgba(239,68,68,0.45); }
          50%      { opacity: 0.7; box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        .err-pill {
          animation: errPulse 1.6s ease-out infinite;
        }
        @keyframes upgradeShine {
          0%   { transform: translateX(-140%) skewX(-12deg); }
          60%  { transform: translateX(160%)  skewX(-12deg); }
          100% { transform: translateX(160%)  skewX(-12deg); }
        }
        .upgrade-shine::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
          animation: upgradeShine 2.6s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2.5 px-3 py-4 text-center sm:gap-4 sm:px-7 sm:py-7">
        <span className="inline-flex size-9 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-300 shadow-[0_0_30px_-10px_rgba(239,68,68,0.65)] sm:size-12 sm:rounded-2xl">
          <TriangleAlert className="size-4 sm:size-5" strokeWidth={2.2} aria-hidden />
        </span>

        <div className="relative w-full max-w-[20rem] sm:max-w-none">
          <h3
            data-text="Smart account API not supported on your device"
            className="glitch-text text-balance font-display text-[13px] font-normal leading-snug tracking-normal text-[#E8F4F7] sm:text-[19px] sm:tracking-wide"
          >
            <span className="font-normal">Smart account API</span>{" "}
            <span className="italic text-rose-300/95">not supported</span>{" "}
            <span className="font-normal">on your device</span>
          </h3>
        </div>

        <p className="max-w-[22rem] text-pretty font-sans text-[11.5px] leading-relaxed text-[#E8F4F7]/75 sm:max-w-md sm:text-[13.5px]">
          To see <span className="italic text-[#7DE3FF]">2 candles ahead</span>,
          upgrade your plan to{" "}
          <span className="font-semibold text-[#7DE3FF]">Pro</span> or{" "}
          <span className="font-semibold text-amber-300">Dominator</span>. We
          run a best-in-class API on those tiers — it supports{" "}
          <span className="italic">every device</span> and renders the next
          two-candle projection cleanly.
        </p>

        <span
          className="err-pill inline-flex items-center gap-1.5 rounded-full border border-rose-400/45 bg-rose-500/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-rose-300 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.2em]"
          aria-live="polite"
        >
          <span className="size-1.5 rounded-full bg-rose-400" aria-hidden />
          ERR · GLITCH_API_DEVICE
        </span>

        <Link
          href={`/upgrade-your-plan/${encodeURIComponent(code)}`}
          aria-label="Upgrade your plan"
          className="upgrade-shine group/cta relative inline-flex h-10 w-full max-w-[16rem] items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1A1208] shadow-[0_12px_36px_-10px_rgba(251,191,36,0.7)] transition-transform duration-200 hover:scale-[1.04] sm:h-12 sm:max-w-none sm:w-auto sm:gap-2 sm:px-7 sm:text-[13px] sm:tracking-[0.2em]"
        >
          <span className="relative z-10 inline-flex items-center gap-1.5 sm:gap-2">
            <Crown
              className="size-3.5 transition-transform duration-300 group-hover/cta:-translate-y-0.5 group-hover/cta:rotate-[-6deg] sm:size-4"
              strokeWidth={2.2}
              aria-hidden
            />
            Upgrade Your Plan
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5"
              strokeWidth={2.4}
              aria-hidden
            />
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-amber-200/40"
          />
        </Link>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Variant: PRO — live shadow projection                                     */
/* -------------------------------------------------------------------------- */

/**
 * Build a tiny SVG mini-chart of the last ~12 closed candles plus two
 * "ghost" projection candles whose direction extrapolates the
 * short-term momentum of the recent history.
 *
 * This is intentionally NOT a backtested predictor — the disclaimer in
 * the card makes it clear the shadow is a Quotex-data-driven heuristic,
 * not a guarantee. It's primarily a visual aid.
 */
function ProShadow({
  history,
  latest,
}: {
  history: Candle[]
  latest: Candle | null
}) {
  const series = useMemo(() => {
    const merged: Candle[] = latest
      ? [...history.filter((c) => c.time !== latest.time), latest]
      : history
    return merged.slice(-14)
  }, [history, latest])

  const projection = useMemo(() => {
    if (series.length < 4) return null
    const tail = series.slice(-6)
    const first = tail[0].close
    const last = tail[tail.length - 1].close
    const drift = (last - first) / Math.max(1, tail.length - 1)
    const c1Open = last
    const c1Close = c1Open + drift * 0.9
    const c2Open = c1Close
    const c2Close = c2Open + drift * 0.7
    return { c1Open, c1Close, c2Open, c2Close }
  }, [series])

  if (series.length === 0) {
    return <PendingState message="Subscribe to a market to project the next two candles." />
  }

  // Coordinate space
  const W = 320
  const H = 180
  const total = series.length + 2 // history + 2 ghost candles
  const slotW = W / total
  const candleW = Math.min(slotW * 0.62, 14)

  const allValues = series.flatMap((c) => [c.high, c.low])
  if (projection) {
    allValues.push(
      projection.c1Open,
      projection.c1Close,
      projection.c2Open,
      projection.c2Close,
    )
  }
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const range = Math.max(1e-9, max - min)
  const pad = range * 0.08
  const yMin = min - pad
  const yMax = max + pad
  const yRange = yMax - yMin

  const yOf = (v: number) => H - ((v - yMin) / yRange) * H

  return (
    <div className="absolute inset-0 flex flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <div className="relative flex-1 overflow-hidden rounded-lg border border-[#1B7892]/30 bg-[#020B0F]/70">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={0}
              x2={W}
              y1={H * t}
              y2={H * t}
              stroke="#1B7892"
              strokeOpacity="0.18"
              strokeDasharray="2 4"
            />
          ))}

          {/* Real candles */}
          {series.map((c, i) => {
            const x = i * slotW + slotW / 2
            const up = c.close >= c.open
            const color = up ? "#10b981" : "#ef4444"
            const top = yOf(Math.max(c.open, c.close))
            const bot = yOf(Math.min(c.open, c.close))
            return (
              <g key={`${c.time}-${i}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={yOf(c.high)}
                  y2={yOf(c.low)}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.85}
                />
                <rect
                  x={x - candleW / 2}
                  y={top}
                  width={candleW}
                  height={Math.max(1, bot - top)}
                  fill={color}
                  opacity={0.85}
                  rx={1}
                />
              </g>
            )
          })}

          {/* Divider between real and projected */}
          <line
            x1={series.length * slotW}
            x2={series.length * slotW}
            y1={4}
            y2={H - 4}
            stroke="#7DE3FF"
            strokeOpacity="0.55"
            strokeDasharray="3 3"
          />

          {/* Ghost candles */}
          {projection &&
            [
              { idx: series.length, o: projection.c1Open, c: projection.c1Close },
              { idx: series.length + 1, o: projection.c2Open, c: projection.c2Close },
            ].map(({ idx, o, c }, k) => {
              const x = idx * slotW + slotW / 2
              const up = c >= o
              const color = up ? "#7DE3FF" : "#F5C16C"
              const top = yOf(Math.max(o, c))
              const bot = yOf(Math.min(o, c))
              return (
                <g key={`ghost-${k}`} opacity={0.7}>
                  <rect
                    x={x - candleW / 2}
                    y={top}
                    width={candleW}
                    height={Math.max(2, bot - top)}
                    fill={color}
                    fillOpacity={0.18}
                    stroke={color}
                    strokeDasharray="3 2"
                    strokeWidth={1.2}
                    rx={1}
                  />
                  <text
                    x={x}
                    y={H - 4}
                    textAnchor="middle"
                    fontSize={8}
                    fill={color}
                    fillOpacity={0.85}
                    fontFamily="ui-monospace, monospace"
                  >
                    +{k + 1}
                  </text>
                </g>
              )
            })}
        </svg>

        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(125, 227, 255, 0.06))",
          }}
        />
      </div>

      <p className="text-pretty text-[10.5px] leading-relaxed text-[#E8F4F7]/55 sm:text-[11.5px]">
        Shadow candles extrapolate from the live Quotex feed. This is{" "}
        <span className="font-semibold text-[#E8F4F7]/80">
          not 100% correct
        </span>{" "}
        — it&apos;s a momentum-based projection of the next two buckets.
      </p>
    </div>
  )
}

function DirectionPill({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "flat") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1B7892]/40 bg-[#0A2530]/70 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#E8F4F7]/70 sm:text-[10.5px]">
        Sideways
      </span>
    )
  }
  const up = direction === "up"
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.22em] sm:text-[10.5px]"
      style={{
        background: up ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        color: up ? "#10b981" : "#ef4444",
        border: `1px solid ${up ? "rgba(16,185,129,0.45)" : "rgba(239,68,68,0.45)"}`,
      }}
    >
      {up ? (
        <ArrowUpRight className="size-3" strokeWidth={2.4} aria-hidden />
      ) : (
        <ArrowDownRight className="size-3" strokeWidth={2.4} aria-hidden />
      )}
      Trending {up ? "UP" : "DOWN"}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Variant: DOMINATOR / PERSONAL — simple direction                          */
/* -------------------------------------------------------------------------- */

function DominatorDirection({
  history,
  latest,
  tier,
}: {
  history: Candle[]
  latest: Candle | null
  tier: Tier
}) {
  const series = useMemo(() => {
    const merged: Candle[] = latest
      ? [...history.filter((c) => c.time !== latest.time), latest]
      : history
    return merged.slice(-10)
  }, [history, latest])

  const verdict = useMemo(() => {
    if (series.length < 3) return null
    const tail = series.slice(-5)
    const first = tail[0].close
    const last = tail[tail.length - 1].close
    const drift = last - first
    const avgRange =
      tail.reduce((sum, c) => sum + (c.high - c.low), 0) / tail.length || 1
    const conviction = Math.min(1, Math.abs(drift) / (avgRange * 1.5))
    return {
      direction: drift > 0 ? ("up" as const) : drift < 0 ? ("down" as const) : ("flat" as const),
      conviction: Math.max(0.18, conviction),
    }
  }, [series])

  if (!verdict) {
    return <PendingState message="Subscribe to a market to compute the next two-candle direction." />
  }

  if (verdict.direction === "flat") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-[#1B7892]/40 bg-[#0A2530]/70 text-[#7DE3FF]">
          <Wand2 className="size-5" strokeWidth={2.2} aria-hidden />
        </span>
        <h3 className="font-display text-[18px] tracking-wide text-[#E8F4F7] sm:text-[20px]">
          Sideways market
        </h3>
        <p className="max-w-xs text-pretty text-[12.5px] leading-relaxed text-[#E8F4F7]/65">
          The next two candles look indecisive. Wait for momentum to build
          before placing a position.
        </p>
      </div>
    )
  }

  const up = verdict.direction === "up"
  const accent = up
    ? { from: "#10b981", to: "#047857", glow: "rgba(16,185,129,0.55)", text: "#03161B" }
    : { from: "#ef4444", to: "#991B1B", glow: "rgba(239,68,68,0.55)", text: "#1A0408" }

  const pct = Math.round(verdict.conviction * 100)

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Premium ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at 50% 38%, ${accent.glow} 0%, rgba(2,20,26,0) 70%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-screen"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <style jsx>{`
        @keyframes domHaloPulse {
          0%, 100% { transform: scale(1);   opacity: 0.55; }
          50%      { transform: scale(1.08); opacity: 0.9; }
        }
        @keyframes domRingSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes domShine {
          0%   { transform: translateX(-160%) skewX(-18deg); }
          100% { transform: translateX(160%)  skewX(-18deg); }
        }
        .dom-halo  { animation: domHaloPulse 3.2s ease-in-out infinite; }
        .dom-ring  { animation: domRingSpin 14s linear infinite; }
        .dom-shine::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%);
          animation: domShine 3.6s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 p-5 text-center sm:gap-6 sm:p-7">
        {/* Eyebrow tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-gradient-to-r from-amber-400/10 via-amber-300/5 to-amber-400/10 px-3 py-1 backdrop-blur-sm">
          <Crown className="size-3 text-amber-300" strokeWidth={2.4} aria-hidden />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-amber-200/90 sm:text-[10.5px]">
            Dominator Forecast
          </span>
        </div>

        {/* Hero direction emblem */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing halo */}
          <span
            aria-hidden
            className="dom-halo absolute inset-0 -m-6 rounded-full blur-2xl sm:-m-8"
            style={{ background: `radial-gradient(circle, ${accent.glow}, transparent 70%)` }}
          />
          {/* Rotating conic ring */}
          <span
            aria-hidden
            className="dom-ring absolute inset-0 -m-1.5 rounded-full opacity-70"
            style={{
              background: `conic-gradient(from 0deg, ${accent.from}, transparent 30%, ${accent.to}, transparent 70%, ${accent.from})`,
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
              mask:
                "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            }}
          />
          {/* Core medallion */}
          <span
            className="dom-shine relative inline-flex size-20 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/10 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.25)] sm:size-24"
            style={{
              background: `radial-gradient(120% 120% at 30% 20%, ${accent.from} 0%, ${accent.to} 70%, #0a0a0a 100%)`,
              color: accent.text,
            }}
          >
            {up ? (
              <ArrowUpRight className="relative z-10 size-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] sm:size-11" strokeWidth={2.6} aria-hidden />
            ) : (
              <ArrowDownRight className="relative z-10 size-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] sm:size-11" strokeWidth={2.6} aria-hidden />
            )}
          </span>
        </div>

        {/* Headline */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#5BC0D8]/75 sm:text-[10.5px]">
            Next 2 candles
          </span>
          <h3 className="font-display text-[34px] leading-none tracking-wide text-[#E8F4F7] sm:text-[44px]">
            <span
              className="italic font-semibold"
              style={{
                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                textShadow: `0 0 24px ${accent.glow}`,
              }}
            >
              {up ? "UP" : "DOWN"}
            </span>
          </h3>
          {/* Decorative divider */}
          <div className="mt-1 flex items-center gap-2">
            <span
              className="h-px w-10 sm:w-14"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent.from}, transparent)`,
              }}
            />
            <span
              className="size-1.5 rotate-45 rounded-[1px]"
              style={{ background: accent.from, boxShadow: `0 0 10px ${accent.glow}` }}
            />
            <span
              className="h-px w-10 sm:w-14"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent.from}, transparent)`,
              }}
            />
          </div>
        </div>

        {/* Conviction bar */}
        <div className="w-full max-w-[18rem]">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.28em] text-[#E8F4F7]/55 sm:text-[10.5px]">
            <span>Momentum</span>
            <span style={{ color: accent.from }}>{pct}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#03161B]/90 ring-1 ring-inset ring-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
                boxShadow: `0 0 14px ${accent.glow}`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Shared pending state                                                      */
/* -------------------------------------------------------------------------- */

function PendingState({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-[#1B7892]/35 bg-[#03161B]/70 text-[#5BC0D8]">
        <Eye className="size-5" strokeWidth={2.2} aria-hidden />
      </span>
      <p className="max-w-xs text-pretty text-[12.5px] leading-relaxed text-[#E8F4F7]/65 sm:text-[13.5px]">
        {message}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Variant: PERSONAL — Pro-style shadow + customizable ghost candles         */
/* -------------------------------------------------------------------------- */

type GhostColor = "green" | "red"
type GhostPosition = "above" | "below"

type GhostConfig = {
  /** Body size of the candle, expressed in % of the visible price range. */
  sizePct: number
  /** Wick (shadow) length on top + bottom, in % of the visible price range. */
  wickPct: number
  /** Whether the ghost sits above or below the last close. */
  position: GhostPosition
  /** Bullish (green) or bearish (red). */
  color: GhostColor
}

const DEFAULT_GHOSTS: [GhostConfig, GhostConfig] = [
  { sizePct: 16, wickPct: 6, position: "above", color: "green" },
  { sizePct: 14, wickPct: 5, position: "above", color: "green" },
]

const STORAGE_KEY = "v0:see2candle:personal-ghosts"

function loadGhosts(): [GhostConfig, GhostConfig] {
  if (typeof window === "undefined") return DEFAULT_GHOSTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_GHOSTS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length !== 2) return DEFAULT_GHOSTS
    const validate = (g: unknown, fallback: GhostConfig): GhostConfig => {
      if (!g || typeof g !== "object") return fallback
      const o = g as Record<string, unknown>
      const sizePct = typeof o.sizePct === "number" ? clamp(o.sizePct, 2, 60) : fallback.sizePct
      const wickPct = typeof o.wickPct === "number" ? clamp(o.wickPct, 0, 30) : fallback.wickPct
      const position: GhostPosition =
        o.position === "below" ? "below" : "above"
      const color: GhostColor = o.color === "red" ? "red" : "green"
      return { sizePct, wickPct, position, color }
    }
    return [
      validate(parsed[0], DEFAULT_GHOSTS[0]),
      validate(parsed[1], DEFAULT_GHOSTS[1]),
    ]
  } catch {
    return DEFAULT_GHOSTS
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function PersonalShadow({
  history,
  latest,
}: {
  history: Candle[]
  latest: Candle | null
}) {
  const [ghosts, setGhosts] = useState<[GhostConfig, GhostConfig]>(DEFAULT_GHOSTS)
  const [editorOpen, setEditorOpen] = useState(false)
  const lastTapRef = useRef<number>(0)

  // Hydrate from localStorage after mount.
  useEffect(() => {
    setGhosts(loadGhosts())
  }, [])

  const persist = useCallback((next: [GhostConfig, GhostConfig]) => {
    setGhosts(next)
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore quota errors */
      }
    }
  }, [])

  const series = useMemo(() => {
    const merged: Candle[] = latest
      ? [...history.filter((c) => c.time !== latest.time), latest]
      : history
    return merged.slice(-14)
  }, [history, latest])

  if (series.length === 0) {
    return <PendingState message="Subscribe to a market to project the next two candles." />
  }

  // Coordinate space — mirrors ProShadow.
  const W = 320
  const H = 180
  const total = series.length + 2
  const slotW = W / total
  const candleW = Math.min(slotW * 0.62, 14)

  const allValues = series.flatMap((c) => [c.high, c.low])
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const range = Math.max(1e-9, max - min)
  const pad = range * 0.18 // extra padding so customised ghosts have room
  const yMin = min - pad
  const yMax = max + pad
  const yRange = yMax - yMin

  const yOf = (v: number) => H - ((v - yMin) / yRange) * H

  const lastClose = series[series.length - 1].close

  // Compute ghost geometry from the user's config. Body size and wick
  // length are expressed as a percentage of the visible price range.
  const ghostShapes = ghosts.map((g, i) => {
    const body = (g.sizePct / 100) * range
    const wick = (g.wickPct / 100) * range
    // Anchor the candle either above or below the last real close, with a
    // small gap so each candle has breathing room.
    const gap = body * 0.1 + wick * 0.4 + i * body * 0.25
    const center =
      g.position === "above" ? lastClose + gap + body / 2 : lastClose - gap - body / 2

    const isUp = g.color === "green"
    const open = isUp ? center - body / 2 : center + body / 2
    const close = isUp ? center + body / 2 : center - body / 2
    const high = Math.max(open, close) + wick
    const low = Math.min(open, close) - wick

    return { open, close, high, low, color: isUp ? "#10b981" : "#ef4444" }
  })

  const handleTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 320) {
      setEditorOpen(true)
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <div className="relative flex-1 overflow-hidden rounded-lg border border-[#1B7892]/30 bg-[#020B0F]/70">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden
        >
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={0}
              x2={W}
              y1={H * t}
              y2={H * t}
              stroke="#1B7892"
              strokeOpacity="0.18"
              strokeDasharray="2 4"
            />
          ))}

          {series.map((c, i) => {
            const x = i * slotW + slotW / 2
            const up = c.close >= c.open
            const color = up ? "#10b981" : "#ef4444"
            const top = yOf(Math.max(c.open, c.close))
            const bot = yOf(Math.min(c.open, c.close))
            return (
              <g key={`${c.time}-${i}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={yOf(c.high)}
                  y2={yOf(c.low)}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.85}
                />
                <rect
                  x={x - candleW / 2}
                  y={top}
                  width={candleW}
                  height={Math.max(1, bot - top)}
                  fill={color}
                  opacity={0.85}
                  rx={1}
                />
              </g>
            )
          })}

          <line
            x1={series.length * slotW}
            x2={series.length * slotW}
            y1={4}
            y2={H - 4}
            stroke="#C4B5FD"
            strokeOpacity="0.55"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Interactive ghost layer — separate SVG so we can attach
            pointer events and a double-tap zone without disturbing the
            decorative aria-hidden chart layer above. */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full cursor-pointer"
          onPointerDown={handleTap}
          onDoubleClick={() => setEditorOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Double-tap to customize the two ghost candles"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setEditorOpen(true)
            }
          }}
        >
          {ghostShapes.map((g, idx) => {
            const x = (series.length + idx) * slotW + slotW / 2
            const top = yOf(Math.max(g.open, g.close))
            const bot = yOf(Math.min(g.open, g.close))
            return (
              <g key={`ghost-${idx}`} opacity={0.9}>
                <line
                  x1={x}
                  x2={x}
                  y1={yOf(g.high)}
                  y2={yOf(g.low)}
                  stroke={g.color}
                  strokeWidth={1.2}
                  strokeOpacity={0.85}
                  strokeDasharray="3 2"
                />
                <rect
                  x={x - candleW / 2}
                  y={top}
                  width={candleW}
                  height={Math.max(2, bot - top)}
                  fill={g.color}
                  fillOpacity={0.22}
                  stroke={g.color}
                  strokeDasharray="3 2"
                  strokeWidth={1.4}
                  rx={1}
                />
                <text
                  x={x}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize={8}
                  fill={g.color}
                  fillOpacity={0.9}
                  fontFamily="ui-monospace, monospace"
                >
                  +{idx + 1}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Subtle right-edge gradient to suggest projected zone. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(196, 181, 253, 0.06))",
          }}
        />
      </div>

      {editorOpen && (
        <GhostEditor
          ghosts={ghosts}
          onCancel={() => setEditorOpen(false)}
          onSave={(next) => {
            persist(next)
            setEditorOpen(false)
          }}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Personal — Ghost editor modal                                             */
/* -------------------------------------------------------------------------- */

function GhostEditor({
  ghosts,
  onCancel,
  onSave,
}: {
  ghosts: [GhostConfig, GhostConfig]
  onCancel: () => void
  onSave: (next: [GhostConfig, GhostConfig]) => void
}) {
  const [draft, setDraft] = useState<[GhostConfig, GhostConfig]>(ghosts)

  const update = (idx: 0 | 1, patch: Partial<GhostConfig>) => {
    setDraft((prev) => {
      const next = [...prev] as [GhostConfig, GhostConfig]
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  // Close on ESC for accessibility.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  // Lock body scroll while the modal is open so background can't move.
  useEffect(() => {
    if (typeof document === "undefined") return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Portal so we escape any ancestor that creates a containing block
  // (e.g. backdrop-blur, transforms, overflow-hidden) and the modal
  // genuinely covers the whole viewport on every screen size.
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Customize ghost candles"
      onClick={onCancel}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#C4B5FD]/35 bg-[#0E0420]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#C4B5FD]/20 bg-[#1A0A33]/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#C4B5FD] to-[#6D28D9] text-[#0E0420]">
              <Settings2 className="size-3.5" strokeWidth={2.4} aria-hidden />
            </span>
            <h3 className="font-display text-[15px] tracking-wide text-[#E8F4F7] sm:text-[17px]">
              Customize ghost candles
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex size-7 items-center justify-center rounded-lg text-[#E8F4F7]/70 transition hover:bg-white/10 hover:text-[#E8F4F7]"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.2} aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 sm:px-5">
          {[0, 1].map((i) => {
            const idx = i as 0 | 1
            const g = draft[idx]
            return (
              <fieldset
                key={idx}
                className="flex flex-col gap-3 rounded-xl border border-[#C4B5FD]/20 bg-[#1A0A33]/40 p-3 sm:p-4"
              >
                <legend className="px-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C4B5FD]">
                  Ghost candle +{idx + 1}
                </legend>

                {/* Color */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E8F4F7]/55">
                    Candle colour
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["green", "red"] as GhostColor[]).map((c) => {
                      const active = g.color === c
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => update(idx, { color: c })}
                          className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 font-mono text-[11px] uppercase tracking-[0.16em] transition ${
                            active
                              ? c === "green"
                                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                                : "border-rose-400/60 bg-rose-500/15 text-rose-300"
                              : "border-white/10 bg-white/[0.03] text-[#E8F4F7]/70 hover:bg-white/[0.07]"
                          }`}
                          aria-pressed={active}
                        >
                          <span
                            className="size-2.5 rounded-full"
                            style={{
                              background: c === "green" ? "#10b981" : "#ef4444",
                            }}
                            aria-hidden
                          />
                          {c === "green" ? "Green" : "Red"}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Position */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E8F4F7]/55">
                    Position relative to last close
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["above", "below"] as GhostPosition[]).map((p) => {
                      const active = g.position === p
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => update(idx, { position: p })}
                          className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 font-mono text-[11px] uppercase tracking-[0.16em] transition ${
                            active
                              ? "border-[#C4B5FD]/60 bg-[#C4B5FD]/15 text-[#C4B5FD]"
                              : "border-white/10 bg-white/[0.03] text-[#E8F4F7]/70 hover:bg-white/[0.07]"
                          }`}
                          aria-pressed={active}
                        >
                          {p === "above" ? (
                            <ArrowUpRight className="size-3.5" strokeWidth={2.4} aria-hidden />
                          ) : (
                            <ArrowDownRight className="size-3.5" strokeWidth={2.4} aria-hidden />
                          )}
                          {p === "above" ? "Above" : "Below"}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Body size */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E8F4F7]/55">
                      Body size
                    </span>
                    <span className="font-mono text-[10.5px] text-[#C4B5FD]">
                      {g.sizePct.toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={60}
                    step={1}
                    value={g.sizePct}
                    onChange={(e) =>
                      update(idx, { sizePct: clamp(Number(e.target.value), 2, 60) })
                    }
                    className="accent-[#C4B5FD]"
                    aria-label={`Body size for ghost candle ${idx + 1}`}
                  />
                </div>

                {/* Wick / shadow length */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E8F4F7]/55">
                      Wick length
                    </span>
                    <span className="font-mono text-[10.5px] text-[#C4B5FD]">
                      {g.wickPct.toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={g.wickPct}
                    onChange={(e) =>
                      update(idx, { wickPct: clamp(Number(e.target.value), 0, 30) })
                    }
                    className="accent-[#C4B5FD]"
                    aria-label={`Wick length for ghost candle ${idx + 1}`}
                  />
                </div>
              </fieldset>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#C4B5FD]/20 bg-[#1A0A33]/70 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 font-sans text-[12px] font-medium text-[#E8F4F7]/80 transition hover:bg-white/[0.07]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#C4B5FD] to-[#6D28D9] px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0E0420] shadow-[0_10px_28px_-10px_rgba(196,181,253,0.65)] transition hover:scale-[1.02]"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* -------------------------------------------------------------------------- */
/*  Personal — wrapper that double-clicks the eye to toggle video mode        */
/* -------------------------------------------------------------------------- */

function PersonalCard({
  accent,
  marketSelected,
  history,
  latest,
}: {
  accent: { from: string; to: string }
  marketSelected: boolean
  history: Candle[]
  latest: Candle | null
}) {
  // Default behaviour matches Pro shadow projection. Double-click on the
  // eye icon flips into video mode, double-click again returns to normal.
  // We intentionally do not persist this — the user said "default a ata
  // thakbe na, jokhon ante chaibe tokhon ante parbe".
  const [videoMode, setVideoMode] = useState(false)

  return (
    <CardShell
      title="Two candles"
      italic="ahead view"
      accent={accent}
      onEyeDoubleClick={() => setVideoMode((v) => !v)}
      eyeActive={videoMode}
      eyeAriaLabel={
        videoMode
          ? "Double-click to return to shadow candles"
          : "Double-click to switch to video mode"
      }
    >
      {marketSelected ? (
        videoMode ? (
          <PersonalVideoMode />
        ) : (
          <PersonalShadow history={history} latest={latest} />
        )
      ) : (
        <SelectMarketHint />
      )}
    </CardShell>
  )
}

/* -------------------------------------------------------------------------- */
/*  Personal — video mode (upload + play inside the card)                     */
/* -------------------------------------------------------------------------- */

function PersonalVideoMode() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Free the object URL when the component unmounts or when a new
  // file replaces the current one.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  const onPick = () => inputRef.current?.click()

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setVideoUrl(url)
    // Reset the input so the same file can be re-picked later.
    e.target.value = ""
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-b-xl sm:rounded-b-2xl">
      {videoUrl ? (
        <video
          key={videoUrl}
          src={videoUrl}
          controls
          playsInline
          className="absolute inset-0 h-full w-full bg-black object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#020B0F]/80 p-6 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-[#C4B5FD]/40 bg-[#1A0A33]/70 text-[#C4B5FD]">
            <Eye className="size-5" strokeWidth={2.2} aria-hidden />
          </span>
          <p className="max-w-xs text-pretty text-[12.5px] leading-relaxed text-[#E8F4F7]/70 sm:text-[13.5px]">
            Upload a video to play it right here in place of the shadow
            candles.
          </p>
          <button
            type="button"
            onClick={onPick}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#C4B5FD] to-[#6D28D9] px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0E0420] shadow-[0_10px_28px_-10px_rgba(196,181,253,0.65)] transition hover:scale-[1.02]"
          >
            Upload video
          </button>
        </div>
      )}

      {/* Hidden file input — kept mounted so the picker is always available. */}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
