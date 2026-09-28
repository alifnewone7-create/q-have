"use client"

/**
 * Premium chart card for the signal-room pages.
 *
 * Visual treatment matches the marketing home page (dark theme, no grid,
 * Quotex Live logo watermark behind the candles), but the chart itself
 * is fully unlocked so users can scroll, zoom, and inspect.
 *
 * The card also exposes:
 *   - the asset switcher dropdown (top-left)
 *   - live status badge + payout chip (top-right)
 *   - last-price + day-change ticker (bottom-left)
 *
 * Connection problems are surfaced as a friendly overlay so the user
 * understands why the chart is empty.
 */

import { useEffect, useState } from "react"
import { AlertTriangle, BarChart3, Clock, Lock, WifiOff, type LucideIcon } from "lucide-react"

import { AssetSelector } from "@/components/asset-selector"
import { TradingChart } from "@/components/trading-chart"
import { Spinner } from "@/components/ui/spinner"
import type { Asset, Candle, ConnectionStatus } from "@/hooks/use-quotex-ws"
import type { MarketChartPhase } from "@/hooks/use-market-chart"

type Props = {
  status: ConnectionStatus
  assets: Asset[]
  asset: string | null
  onSelectAsset: (symbol: string) => void
  history: Candle[]
  latest: Candle | null
  currentAsset: Asset | null
  /** Period in seconds, used for the timeframe pill in the corner. */
  period: number
  /** Optional warning under the chart (e.g. backend not reachable). */
  error?: string | null
  /**
   * When ``"replaced"``, ``error`` describes a backend ``session_replaced``
   * eviction (another tab / device opened this account). The card renders
   * a dedicated overlay with a "Take over here" button that calls
   * ``onReclaim`` to seize the session back for this tab. Any other
   * value falls back to the small warning banner under the chart.
   */
  errorKind?: null | "replaced"
  /** Reconnect after a session_replaced eviction. Required when ``errorKind === "replaced"``. */
  onReclaim?: () => void
  /**
   * Backend-driven gate phase. ``"waiting"`` shows a "Waiting for
   * closing running candle…" overlay (with countdown) instead of the
   * chart. ``"ready"`` lets the chart render normally. Defaults to
   * ``"ready"`` for any callers that haven't migrated yet.
   */
  phase?: MarketChartPhase
  /** Seconds remaining on the running-candle countdown (null when not waiting or unknown). */
  secondsLeft?: number | null
  /** Custom icon for the market selector. Defaults to BarChart3. */
  marketIcon?: LucideIcon
  /**
   * Cross-tab subscription lock state from `useMarketChart`. When
   * ``status === "blocked"`` we render a frosted overlay over the
   * chart explaining that another tab in this browser already owns a
   * pair for this user, with a "Take over here" button that calls
   * ``onTakeOver``. Pass ``null`` to disable the feature (default).
   */
  lock?: {
    status: "idle" | "owner" | "blocked"
    otherPair: string | null
    takeOver: () => void
  } | null
}

export function MarketChartCard({
  status,
  assets,
  asset,
  onSelectAsset,
  history,
  latest,
  currentAsset,
  period,
  error,
  errorKind = null,
  onReclaim,
  phase = "idle",
  secondsLeft = null,
  marketIcon = BarChart3,
  lock = null,
}: Props) {
  const hasData = history.length > 0 || !!latest
  const noMarketSelected = asset === null || phase === "idle"

  // Initial chart zoom level. Mobile gets a tighter ``barSpacing`` so the
  // candles read clearly without the user pinching in; desktop uses a
  // slightly looser value so more history is visible at a glance. We
  // start with the desktop value to keep SSR/hydration stable, then
  // refine in the browser. ``TradingChart`` only consumes this on its
  // first render so a one-frame swap is harmless.
  //
  // Critically, providing ``defaultBarSpacing`` also flips the chart
  // out of ``fitContent()`` mode on every history refresh — that's the
  // call that was secretly zooming users back out every time a candle
  // closed. With it skipped, the chart preserves whatever zoom level
  // the user has pinched/scrolled to, exactly like the home-page chart.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 768px)")
    setIsMobile(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  const isLocked = lock?.status === "blocked"

  // Two overlays stack on top of the chart frame:
  //
  //   1. The connection / loading overlay (existing, ``buildOverlay``)
  //      surfaces backend-side problems like a closed WebSocket. Only
  //      shown when there's no candle data to render.
  //   2. The wait-for-running-candle overlay is shown whenever the
  //      backend has gated this subscription behind the next bucket
  //      boundary. The wait overlay takes priority. When phase is
  //      "idle" (no market selected), we show the select-market
  //      overlay instead.
  const overlay =
    phase === "waiting" || noMarketSelected ? null : !hasData ? buildOverlay(status) : null
  const showWaitOverlay = phase === "waiting" && !noMarketSelected

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#1B7892]/35 bg-[#02141A]/80 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] backdrop-blur-md sm:rounded-2xl">
      {/* Top row — asset switcher + status + payout */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1B7892]/30 bg-[#03171E]/70 px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <AssetSelector
          assets={assets}
          current={asset}
          onSelect={onSelectAsset}
          loading={assets.length === 0}
          icon={marketIcon}
          disabled={isLocked}
        />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1B7892]/35 bg-[#02141A]/70 px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] text-[#7DE3FF] sm:px-2.5 sm:py-1 sm:text-[11px]">
          {periodLabel(period)}
        </span>

        <div className="ml-auto flex items-center gap-1.5 font-mono text-[11px] sm:gap-2 sm:text-[12px]">
          {currentAsset?.payout != null && (
            <span className="hidden rounded-full border border-[#1B7892]/35 bg-[#02141A]/70 px-2 py-0.5 text-[#E8F4F7]/85 sm:inline-flex sm:px-2.5 sm:py-1">
              Payout{" "}
              <span className="ml-1 text-[#7DE3FF]">{currentAsset.payout}%</span>
            </span>
          )}
          <StatusPill status={status} />
        </div>
      </div>

      {/* Chart frame */}
      <div className="relative h-[280px] w-full sm:h-[420px] lg:h-[540px]">
        <TradingChart
          history={history}
          latest={latest}
          theme="dark"
          hideGrid
          hideScales
          // Pin the leftmost edge so users can pan back through whatever
          // history we have but never scroll past the very first candle
          // into empty space — same convention the home-page USD/BRL OTC
          // chart uses.
          restrictLeftEdge
          // Pre-zoomed at boot: tight candles on mobile, slight zoom on
          // desktop. Also doubles as the "do not refit on every history
          // refresh" switch (see the ``isMobile`` setup above).
          defaultBarSpacing={isMobile ? 14 : 9}
        />

        {/* Quotex Live watermark — same image and treatment as the home page */}
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-hidden
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Qx-Live%20%28%20Powered%20by%20MTZ%20%29-rZMdOs8iZrTsDQq5Aw7Rs9slRvcvhB.png"
            alt=""
            className="h-auto w-[55%] max-w-[440px] select-none opacity-[0.12]"
            draggable={false}
          />
        </div>

        {overlay && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#02141A]/55 backdrop-blur-sm">
            <div className="flex max-w-sm flex-col items-center gap-2 rounded-xl border border-[#1B7892]/40 bg-[#03161B]/85 px-5 py-4 text-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#E8F4F7]">
                {overlay.kind === "info" ? (
                  <Spinner className="size-4 text-[#7DE3FF]" />
                ) : (
                  <WifiOff className="size-4 text-amber-400" aria-hidden />
                )}
                {overlay.title}
              </div>
              <p className="text-pretty text-xs leading-relaxed text-[#E8F4F7]/72">
                {overlay.body}
              </p>
            </div>
          </div>
        )}

        {showWaitOverlay && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#02141A]/85 backdrop-blur-md">
            <div className="mx-3 flex max-w-sm flex-col items-center gap-2 rounded-xl border border-[#1B7892]/40 bg-[#03161B]/90 px-4 py-4 text-center sm:gap-3 sm:px-6 sm:py-5">
              <Clock
                className="size-5 text-[#7DE3FF] motion-safe:animate-pulse sm:size-6"
                aria-hidden
              />
              <div className="text-[13px] font-semibold text-[#E8F4F7] sm:text-sm">
                <span className="font-normal">Waiting for</span>{" "}
                <span className="italic text-[#7DE3FF]">closing candle...</span>
              </div>
              <p className="text-pretty text-[11px] leading-relaxed text-[#E8F4F7]/72 sm:text-xs">
                {"Chart syncs after the running candle closes."}
              </p>
              {typeof secondsLeft === "number" && secondsLeft > 0 && (
                <div className="flex items-baseline gap-1.5 font-mono text-[10px] tracking-[0.18em] text-[#7DE3FF] sm:text-[11px]">
                  <span className="text-[#E8F4F7]/55">CLOSES IN</span>
                  <span className="text-base text-[#7DE3FF] sm:text-lg">
                    {secondsLeft}s
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No market selected overlay */}
        {noMarketSelected && !isLocked && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#02141A]/90 backdrop-blur-md">
            <div className="mx-3 flex max-w-sm flex-col items-center gap-2 rounded-xl border border-[#5BC0D8]/40 bg-[#03161B]/90 px-4 py-4 text-center sm:gap-3 sm:px-6 sm:py-5">
              {(() => {
                const IconComponent = marketIcon
                return <IconComponent className="size-6 text-[#5BC0D8] sm:size-8" aria-hidden />
              })()}
              <div className="text-[14px] font-semibold text-[#E8F4F7] sm:text-base">
                <span className="font-normal">Select a</span>{" "}
                <span className="italic text-[#7DE3FF]">Market</span>
              </div>
              <p className="text-pretty text-[11px] leading-relaxed text-[#E8F4F7]/72 sm:text-xs">
                Choose a market from the dropdown above to start viewing live chart data.
              </p>
            </div>
          </div>
        )}

        {/* Cross-tab single-pair lock overlay. Sits ABOVE every other
            overlay (z-40) so the user can't interact with the chart or
            its other overlays until they take over the lock. */}
        {isLocked && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#02141A]/90 backdrop-blur-md">
            <div className="mx-3 flex max-w-sm flex-col items-center gap-3 rounded-xl border border-amber-400/40 bg-[#03161B]/90 px-5 py-5 text-center sm:px-7 sm:py-6">
              <div className="relative flex size-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/35">
                <Lock className="size-5" aria-hidden strokeWidth={2.2} />
              </div>
              <div className="text-[14px] font-semibold text-[#E8F4F7] sm:text-[15px]">
                <span className="font-normal">Active session in</span>{" "}
                <span className="italic text-amber-300">another tab</span>
              </div>
              <p className="text-pretty text-[12px] leading-relaxed text-[#E8F4F7]/72 sm:text-[13px]">
                {lock?.otherPair
                  ? `Your account is already streaming ${lock.otherPair} in another tab. Close it, or take over here to switch the live feed to this tab.`
                  : "Your account is already streaming a market in another tab. Close it, or take over here to switch the live feed to this tab."}
              </p>
              <button
                type="button"
                onClick={() => lock?.takeOver()}
                className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/45 bg-amber-400/10 px-5 text-[13px] font-medium text-amber-200 transition-colors hover:bg-amber-400/20 hover:text-amber-100"
              >
                <Lock className="size-3.5" aria-hidden strokeWidth={2.4} />
                Take over here
              </button>
            </div>
          </div>
        )}

        {/* Last-price ticker intentionally removed per product spec —
            the floating "asset · price · change" pill at the bottom-
            left of the chart is now redundant with the asset selector
            in the card header. */}

        {/* Session-replaced overlay. Sits at the very top of the stack
            (z-50) so it covers the cross-tab lock overlay too — when
            the backend evicts our socket we want the user to see *only*
            this prompt and not a stale "another tab" overlay. The user
            clicks "Take over here" to forcefully reclaim the account on
            this tab; the hook bumps its mount id and reconnects, which
            in turn evicts whatever other tab / device caused this. */}
        {errorKind === "replaced" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#02141A]/92 backdrop-blur-md">
            <div className="mx-3 flex max-w-sm flex-col items-center gap-3 rounded-xl border border-amber-400/40 bg-[#03161B]/92 px-5 py-5 text-center sm:px-7 sm:py-6">
              <div className="relative flex size-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/35">
                <Lock className="size-5" aria-hidden strokeWidth={2.2} />
              </div>
              <div className="text-[14px] font-semibold text-[#E8F4F7] sm:text-[15px]">
                <span className="font-normal">Account opened in</span>{" "}
                <span className="italic text-amber-300">another session</span>
              </div>
              <p className="text-pretty text-[12px] leading-relaxed text-[#E8F4F7]/72 sm:text-[13px]">
                {error ?? "Another tab or device opened this account."}{" "}
                Take over here to switch the live feed back to this tab.
              </p>
              <button
                type="button"
                onClick={() => onReclaim?.()}
                disabled={!onReclaim}
                className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/45 bg-amber-400/10 px-5 text-[13px] font-medium text-amber-200 transition-colors hover:bg-amber-400/20 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock className="size-3.5" aria-hidden strokeWidth={2.4} />
                Take over here
              </button>
            </div>
          </div>
        )}
      </div>

      {error && errorKind !== "replaced" && (
        <div className="flex items-center gap-2 border-t border-amber-400/20 bg-amber-400/10 px-4 py-2 text-[12px] text-amber-200">
          <AlertTriangle className="size-3.5" aria-hidden />
          <span className="font-mono">{error}</span>
        </div>
      )}
    </section>
  )
}

function periodLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds % 3600 === 0) return `${seconds / 3600}h`
  if (seconds % 60 === 0) return `${seconds / 60}m`
  return `${seconds}s`
}

function StatusPill({ status }: { status: ConnectionStatus }) {
  const map: Record<ConnectionStatus, { label: string; cls: string }> = {
    open: { label: "Live", cls: "border-emerald-400/40 text-emerald-300" },
    connecting: {
      label: "Connecting",
      cls: "border-[#1B7892]/45 text-[#7DE3FF]",
    },
    closed: { label: "Offline", cls: "border-amber-400/40 text-amber-300" },
    error: { label: "Error", cls: "border-rose-400/40 text-rose-300" },
  }
  const { label, cls } = map[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border bg-[#02141A]/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${cls}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "open"
            ? "bg-emerald-400"
            : status === "connecting"
              ? "bg-[#7DE3FF] motion-safe:animate-pulse"
              : "bg-amber-400"
        }`}
        aria-hidden
      />
      {label}
    </span>
  )
}

function buildOverlay(status: ConnectionStatus): {
  kind: "info" | "warn"
  title: string
  body: string
} | null {
  if (status === "error" || status === "closed") {
    return {
      kind: "warn",
      title: "Live feed unavailable",
      body: "The Quotex backend isn't reachable right now. We'll resume automatically once the stream is back online.",
    }
  }
  if (status === "connecting") {
    return {
      kind: "info",
      title: "Connecting to live feed",
      body: "Establishing a secure link to the Quotex stream\u2026",
    }
  }
  if (status === "open") {
    return {
      kind: "info",
      title: "Loading candles",
      body: "Fetching the latest candle history\u2026",
    }
  }
  return null
}
