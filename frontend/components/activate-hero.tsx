"use client"

/**
 * Activate Account — luxury hero strip.
 * --------------------------------------
 * Frames the activation form like a premium membership pass:
 *  - Floating ornamental "EXCLUSIVE" plaque above the title
 *  - Decorative serial number / divider beneath the headline
 *  - Layered teal+champagne radial backdrop for a luxurious depth
 *  - Hosts the ActivateAccountForm card centered below
 *
 * Client component because copy is pulled via useLanguage().
 */

import { Gem } from "lucide-react"

import { ActivateAccountForm } from "@/components/activate-account-form"
import { useLanguage } from "@/components/language-provider"

export function ActivateHero() {
  const { t } = useLanguage()

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32">
      {/* Layered backdrop — teal halo + warm champagne tint for premium depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(91,192,216,0.30), transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(27,120,146,0.20), transparent 65%), radial-gradient(ellipse 50% 35% at 0% 100%, rgba(245,193,108,0.08), transparent 70%)",
        }}
      />
      {/* Ornamental top hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5BC0D8]/55 to-transparent"
      />
      {/* Soft grain dot field — subtle luxury texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(232,244,247,1) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
        {/* Header cluster */}
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Premium "Exclusive" plaque — replaces the plain badge with a
              tiered, double-ringed pill carrying a Gem accent that signals
              premium / membership-grade access (in keeping with the
              activate-account theme). */}
          <div className="group relative inline-flex items-center gap-2 rounded-full border border-[#5BC0D8]/40 bg-gradient-to-b from-[#0A2530]/80 to-[#03161B]/80 px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#5BC0D8] shadow-[inset_0_1px_0_rgba(125,227,255,0.18),0_8px_22px_-12px_rgba(91,192,216,0.55)] backdrop-blur-md">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[#7DE3FF]/60 to-transparent"
            />
            <Gem
              className="size-3 shrink-0 text-[#7DE3FF] motion-safe:animate-[wiggle_4s_ease-in-out_infinite]"
              strokeWidth={2.5}
              aria-hidden
            />
            <span>{t("activate.badge")}</span>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5BC0D8] opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#5BC0D8]" />
            </span>
          </div>

          {/* Headline — Quintessential display + Cormorant italic accent */}
          <h1 className="font-display text-balance text-[34px] leading-[1.1] tracking-wide sm:text-[44px] lg:text-[56px]">
            <span className="text-[#E8F4F7]">{t("activate.title.1")}</span>
            <br className="hidden sm:block" />{" "}
            <span className="font-serif italic font-medium bg-gradient-to-r from-[#7DE3FF] via-[#5BC0D8] to-[#1B7892] bg-clip-text text-transparent">
              {t("activate.title.2")}
            </span>
          </h1>

          {/* Ornamental divider — diamond between two hairlines */}
          <div
            aria-hidden
            className="flex items-center justify-center gap-3 pt-1"
          >
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#5BC0D8]/55" />
            <span className="size-1.5 rotate-45 bg-[#5BC0D8] shadow-[0_0_10px_rgba(91,192,216,0.7)]" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#5BC0D8]/55" />
          </div>

          {/* Subtitle — luxury Manrope body text */}
          <p className="max-w-xl text-pretty text-[15px] font-light leading-[1.7] tracking-[0.005em] text-[#E8F4F7]/72 sm:text-[16px]">
            {t("activate.subtitle")}
          </p>
        </div>

        {/* Form card */}
        <div className="mt-12 sm:mt-14">
          <ActivateAccountForm />
        </div>
      </div>
    </section>
  )
}
