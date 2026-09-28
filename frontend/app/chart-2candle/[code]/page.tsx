import type { Metadata } from "next"

import { Chart2CandleClient } from "@/components/signal/chart-2candle-client"

export const metadata: Metadata = {
  title: "See 2 Candle Ahead View · Quotex Live",
  description: "Two-candle look-ahead view with multi-strategy confluence.",
  robots: { index: false, follow: false },
}

export default async function Chart2CandlePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <Chart2CandleClient code={code} />
}
