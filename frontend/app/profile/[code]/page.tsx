import { ProfileClient } from "@/components/signal/profile-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Profile · Quotex Live",
  description: "View your QXL Key account, plan, and live signal usage.",
  robots: { index: false, follow: false },
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <ProfileClient code={code} />
}
