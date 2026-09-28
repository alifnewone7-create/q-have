"use client"

import { Gauge } from "lucide-react"

import { GenerateSignalPanel } from "@/components/signal/generate-signal-panel"
import { MarketChartCard } from "@/components/signal/market-chart-card"
import { SignalShell } from "@/components/signal/signal-shell"
import { useMarketChart } from "@/hooks/use-market-chart"
import type { Tier } from "@/lib/tiers"

// 15-second timeframe per spec — pyquotex / Quotex supports period=15 on
// most OTC markets the same way it does the 1m bucket.
const PERIOD_SECONDS = 15
// Minimum candle time-left before we let the user fire a signal. We pick
// a sensible 8s window — much shorter than the 1m page's 30s rule because
// the candle itself is only 15s long.
const MIN_REMAINING_SECONDS = 8

export function Chart5SecSignalClient({ code }: { code: string }) {
  return (
    <SignalShell
      rawCode={code}
      pageEyebrow="5-Second Signal · 15s"
      pageTitle="Short-burst next-candle signal"
    >
      {({ accessToken, qxlKey, tier }) => (
        <Chart5SecContent accessToken={accessToken} qxlKey={qxlKey} tier={tier} />
      )}
    </SignalShell>
  )
}

function Chart5SecContent({
  accessToken,
  qxlKey,
  tier,
}: {
  accessToken: string
  qxlKey: string
  tier: Tier
}) {
  const chart = useMarketChart({ period: PERIOD_SECONDS, accessToken })

  return (
    <div className="flex flex-col gap-3 sm:gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
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
        marketIcon={Gauge}
        lock={chart.lock}
      />

      <GenerateSignalPanel
        qxlKey={qxlKey}
        accessToken={accessToken}
        tier={tier}
        system="chart-15sec-signal"
        period={PERIOD_SECONDS}
        minRemaining={MIN_REMAINING_SECONDS}
        asset={chart.asset}
        latest={chart.latest}
      />
    </div>
  )
}
