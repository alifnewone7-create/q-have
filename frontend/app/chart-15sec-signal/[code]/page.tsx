import type { Metadata } from "next"

import { Chart5SecSignalClient } from "@/components/signal/chart-15sec-signal-client"

/**
 * /chart-15sec-signal/[code]
 * --------------------------
 * Same UX as /chart-to-signal but tuned for the 15-second timeframe.
 * The strategies that win at 15s are tuned for short-burst momentum
 * (engulfing, RSI tail, EMA cross) — the aggregator handles the heavy
 * lifting; the page just swaps the period.
 */

export const metadata: Metadata = {
  title: "15-Second Signal · Quotex Live",
  description: "15-second next-candle live signal room with multi-strategy confluence.",
  robots: { index: false, follow: false },
}

export default async function Chart5SecSignalPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <Chart5SecSignalClient code={code} />
}
