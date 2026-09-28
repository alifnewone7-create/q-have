import type { Metadata } from "next"

import { UpgradeYourPlanClient } from "@/components/upgrade-your-plan-client"

export const metadata: Metadata = {
  title: "Upgrade Your Plan · Quotex Live",
  description:
    "Move up a tier on Quotex Live — automatic account swap once admin approves your upgrade.",
  robots: { index: false, follow: false },
}

export default async function UpgradeYourPlanPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <UpgradeYourPlanClient code={code} />
}
