import { PrivacyPolicyContent } from "@/components/privacy-policy-content"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata = {
  title: "Privacy Policy — Quotex Live",
  description:
    "How Quotex Live collects, handles and protects your information — and a transparent note on how our market data is sourced.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#03161B] text-[#E8F4F7]">
      <SiteHeader onDark />
      <main className="flex-1">
        <PrivacyPolicyContent />
      </main>
      <SiteFooter />
    </div>
  )
}
