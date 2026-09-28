import { ActivatedRedirect } from "@/components/activated-redirect"
import { ActivateHero } from "@/components/activate-hero"
import { QxlKeyTiers } from "@/components/qxl-key-tiers"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata = {
  title: "Activate Account — Quotex Live",
  description:
    "Enter your full name, username, and QXL Key to activate your Quotex Live access. New here? Learn how to get a QXL Key.",
}

export default function ActivateAccountPage() {
  return (
    // Page-scoped luxury body font via .font-luxury utility.
    // IM Fell Double Pica SC cascades to all body text, while explicit
    // font-display / font-serif on heading elements still take precedence.
    //
    // ActivatedRedirect wraps the entire page so an already-activated
    // browser never sees a flash of the activation form before the
    // profile page loads. Instead, a branded loading image is shown.
    <ActivatedRedirect>
      <div className="font-luxury flex min-h-screen flex-col bg-[#03161B] text-[#E8F4F7]">
        <SiteHeader onDark />

        {/* Hero + activation form (single composed section) */}
        <ActivateHero />

        {/* How to get QXL Key — pricing tiers in a different visual rhythm */}
        <QxlKeyTiers />

        <SiteFooter />
      </div>
    </ActivatedRedirect>
  )
}
