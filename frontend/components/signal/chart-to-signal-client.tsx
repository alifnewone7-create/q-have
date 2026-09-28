"use client"

import { BarChart3 } from "lucide-react"

import { GenerateSignalPanel } from "@/components/signal/generate-signal-panel"
import { MarketChartCard } from "@/components/signal/market-chart-card"
import { SignalShell } from "@/components/signal/signal-shell"
import { useMarketChart } from "@/hooks/use-market-chart"
import type { Tier } from "@/lib/tiers"

const PERIOD_SECONDS = 60
const MIN_REMAINING_SECONDS = 30

export function ChartToSignalClient({ code }: { code: string }) {
  return (
    <SignalShell
      rawCode={code}
      pageEyebrow="Chart to Signal · 1m"
      pageTitle="Live next-candle signal room"
    >
      {({ accessToken, qxlKey, tier }) => (
        <ChartToSignalContent accessToken={accessToken} qxlKey={qxlKey} tier={tier} />
      )}
    </SignalShell>
  )
}

/**
 * The chart hook needs to mount inside the gated tree (after the QXL key
 * resolves) so an unauthorised visitor never opens a WebSocket to the
 * Python backend.
 */
function ChartToSignalContent({
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
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
        marketIcon={BarChart3}
        lock={chart.lock}
      />

      <GenerateSignalPanel
        qxlKey={qxlKey}
        accessToken={accessToken}
        tier={tier}
        system="chart-to-signal"
        period={PERIOD_SECONDS}
        minRemaining={MIN_REMAINING_SECONDS}
        asset={chart.asset}
        latest={chart.latest}
      />
    </div>
  )
}
