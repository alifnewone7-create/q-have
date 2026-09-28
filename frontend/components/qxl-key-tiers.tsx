"use client"

/**
 * QXL Key Tiers — exact clone of the home page Pricing section.
 *
 * Renders the same 4-up pricing cards (Basic / Smart / Pro / Dominator) with
 * identical copy, animations, dialog, and styling as the home page. Used on
 * the activate-account page so visitors who need a QXL Key see the full
 * pricing flow they would see on the home page.
 */

import Link from "next/link"
import { useMemo } from "react"
import {
  ArrowRight,
  Award,
  ChevronRight,
  Crown,
  Flame,
  Gem,
  Info,
  MessageCircle,
  Trophy,
} from "lucide-react"

import { AnimatedIcon } from "@/components/animated-icon"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const QUOTEX_SIGNUP_URL = "https://market-qx.pro/sign-up/?lid=1506771"
const ADMIN_TELEGRAM_URL = "https://t.me/Mushfiq2615"

type Feature = {
  label: string
  sub?: string
  included?: boolean
  highlight?: boolean
  meta?: { label: string; variant: "limited" | "daily" | "time" }
}

type DetailItem = { title: string; body: string; included?: boolean }

type Tier = {
  name: string
  price: string
  suffix: string
  description: string
  features: Feature[]
  details: DetailItem[]
  icon: typeof Gem
  accent: "teal" | "ivory" | "highlight" | "onyx"
  popular?: boolean
  href: string
  cta: string
  isBasic?: boolean
}

function buildTiers(t: (k: string) => string): Tier[] {
  const metaLimited = { label: t("pricing.meta.limited"), variant: "limited" as const }
  const metaDaily = { label: t("pricing.meta.daily"), variant: "daily" as const }
  const metaUnlocked = { label: t("pricing.meta.unlocked"), variant: "daily" as const }
  const metaBasicTime = { label: t("pricing.meta.basicLimit"), variant: "time" as const }
  const metaSmartTime = { label: t("pricing.meta.smartLimit"), variant: "time" as const }
  const metaProTime = { label: t("pricing.meta.proLimit"), variant: "time" as const }
  const metaDomTime = { label: t("pricing.meta.domLimit"), variant: "time" as const }

  const buildFeatures = (
    prefix: string,
    count: number,
    metas: Record<number, { label: string; variant: "limited" | "daily" | "time" }>,
    excluded: number[] = [],
    highlightIdx?: number,
    skip: number[] = [],
  ) => {
    const items = Array.from({ length: count }, (_, i) => {
      const idx = i + 1
      if (skip.includes(idx)) return null
      const item: Feature = {
        label: t(`${prefix}.f${idx}.label`),
        sub: t(`${prefix}.f${idx}.sub`),
      }
      if (metas[idx]) item.meta = metas[idx]
      if (excluded.includes(idx)) item.included = false
      if (highlightIdx === idx) item.highlight = true
      return item
    }).filter((it): it is Feature => it !== null)
    if (highlightIdx) {
      const i = items.findIndex((it) => it.highlight)
      if (i > 0) {
        const [hi] = items.splice(i, 1)
        items.unshift(hi)
      }
    }
    return items
  }

  const buildDetails = (
    prefix: string,
    count: number,
    excluded: number[] = [],
    skip: number[] = [],
  ) =>
    Array.from({ length: count }, (_, i) => {
      const idx = i + 1
      if (skip.includes(idx)) return null
      const item: DetailItem = {
        title: t(`${prefix}.d${idx}.title`),
        body: t(`${prefix}.d${idx}.body`),
      }
      if (excluded.includes(idx)) item.included = false
      return item
    }).filter((it): it is DetailItem => it !== null)

  return [
    {
      name: t("tier.basic.name"),
      price: "$15",
      suffix: t("pricing.suffix.deposit"),
      description: t("tier.basic.desc"),
      features: buildFeatures("tier.basic", 6, { 2: metaDaily, 3: metaDaily, 6: metaBasicTime }, [], 6, [4]),
      details: buildDetails("tier.basic", 6, [], [4]),
      icon: Gem,
      accent: "teal",
      href: QUOTEX_SIGNUP_URL,
      cta: t("pricing.cta.basic"),
      isBasic: true,
    },
    {
      name: t("tier.smart.name"),
      price: "$50",
      suffix: t("pricing.suffix.purchase"),
      description: t("tier.smart.desc"),
      features: buildFeatures("tier.smart", 6, { 1: metaUnlocked, 2: metaDaily, 3: metaDaily, 5: metaSmartTime }, [], 5, [4]),
      details: buildDetails("tier.smart", 6, [], [4]),
      icon: Award,
      accent: "ivory",
      href: "/purchase-smart-account",
      cta: t("pricing.cta.purchase"),
    },
    {
      name: t("tier.pro.name"),
      price: "$75",
      suffix: t("pricing.suffix.purchase"),
      description: t("tier.pro.desc"),
      features: buildFeatures("tier.pro", 9, { 1: metaUnlocked, 2: metaDaily, 4: metaProTime }, [], 4, [3]),
      details: buildDetails("tier.pro", 9, [], [3]),
      icon: Crown,
      accent: "highlight",
      popular: true,
      href: "/purchase-pro-account",
      cta: t("pricing.cta.purchase"),
    },
    {
      name: t("tier.dom.name"),
      price: "$149",
      suffix: t("pricing.suffix.purchase"),
      description: t("tier.dom.desc"),
      features: buildFeatures("tier.dom", 11, { 1: metaUnlocked, 2: metaDaily, 4: metaDomTime }, [], 4, [3]),
      details: buildDetails("tier.dom", 11, [], [3]),
      icon: Trophy,
      accent: "onyx",
      href: "/purchase-dominator-account",
      cta: t("pricing.cta.purchase"),
    },
  ]
}

const ACCENT_STYLES = {
  teal: {
    iconTone: "teal" as const,
    badge: "bg-[#1B7892]/20 text-[#5BC0D8] border-[#1B7892]/50",
    price: "text-[#5BC0D8]",
    button:
      "bg-[#1B7892] text-white hover:bg-[#2A9DBA] shadow-lg shadow-[#1B7892]/40",
  },
  ivory: {
    iconTone: "ivory" as const,
    badge: "bg-[#E8F4F7]/10 text-[#E8F4F7] border-[#E8F4F7]/30",
    price: "text-[#E8F4F7]",
    button:
      "bg-[#E8F4F7] text-[#03161B] hover:bg-white shadow-lg shadow-[#E8F4F7]/20",
  },
  highlight: {
    iconTone: "cyan" as const,
    badge: "bg-[#5BC0D8]/15 text-[#5BC0D8] border-[#5BC0D8]/50",
    price: "text-[#5BC0D8]",
    button:
      "bg-[#5BC0D8] text-[#03161B] hover:bg-[#7DD0E3] shadow-lg shadow-[#5BC0D8]/40",
  },
  onyx: {
    iconTone: "gold" as const,
    badge: "bg-black text-[#5BC0D8] border-[#1B7892]/40",
    price: "text-[#E8F4F7]",
    button:
      "bg-black text-[#5BC0D8] hover:bg-[#03161B] border border-[#1B7892]/50",
  },
}

export function QxlKeyTiers() {
  const { t } = useLanguage()
  const tiers = useMemo(() => buildTiers(t), [t])

  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32"
    >
      {/* Background gradient — teal washes on dark surface */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(27,120,146,0.28), transparent), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(91,192,216,0.18), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 xl:max-w-[84rem]">
        {/* Section header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1B7892]/50 bg-[#1B7892]/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5BC0D8] backdrop-blur-sm">
            {t("pricing.badge")}
          </span>

          <h2 className="font-display max-w-3xl text-balance text-3xl leading-[1.2] tracking-wide sm:text-4xl lg:text-5xl">
            <span className="text-[#E8F4F7]">{t("pricing.title.1")}</span>{" "}
            <span className="font-serif italic font-medium bg-gradient-to-r from-[#5BC0D8] via-[#1B7892] to-[#5BC0D8] bg-clip-text text-transparent">
              {t("pricing.title.2")}
            </span>
          </h2>

          <p className="max-w-2xl text-pretty font-serif text-lg italic text-[#E8F4F7]/70 sm:text-xl">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Pricing grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 pt-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {tiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TierDetailsDialog({ tier }: { tier: Tier }) {
  const { t } = useLanguage()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group/details flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-[#1B7892]/40 bg-transparent px-3 py-2 text-[12px] font-medium text-[#E8F4F7]/75 transition-all hover:border-[#5BC0D8]/60 hover:bg-[#1B7892]/10 hover:text-[#5BC0D8]"
        >
          <span className="inline-flex items-center gap-1.5">
            <Info className="size-3.5" aria-hidden />
            {t("pricing.viewDetails")}
          </span>
          <ChevronRight
            className="size-3.5 transition-transform group-hover/details:translate-x-0.5"
            aria-hidden
          />
        </button>
      </DialogTrigger>

      <DialogContent
        className="max-h-[85vh] max-w-lg gap-0 overflow-hidden border-[#1B7892]/30 bg-[#03161B]/98 p-0 text-[#E8F4F7] sm:max-w-2xl"
      >
        {/* Decorative top accent */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5BC0D8]/60 to-transparent"
        />

        {/* Header */}
        <DialogHeader className="space-y-3 border-b border-[#1B7892]/20 bg-gradient-to-b from-[#1B7892]/15 to-transparent p-6 pb-5 text-left">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-[#1B7892]/25 ring-1 ring-inset ring-[#5BC0D8]/35">
              <tier.icon
                className="size-[18px] text-[#5BC0D8]"
                aria-hidden
                strokeWidth={1.7}
              />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5BC0D8]">
                {tier.name} {t("pricing.dialog.plan")}
              </span>
              <DialogTitle className="text-lg font-semibold tracking-tight text-[#E8F4F7] sm:text-xl">
                {t("pricing.dialog.titlePrefix")} {tier.name}
              </DialogTitle>
            </div>
          </div>

          <DialogDescription className="text-[13px] leading-relaxed text-[#E8F4F7]/70">
            {tier.description} {t("pricing.dialog.subtitle")}
          </DialogDescription>

          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="font-sans text-3xl font-semibold tracking-tight text-[#E8F4F7]">
              {tier.price}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#E8F4F7]/55">
              {tier.suffix}
            </span>
          </div>
        </DialogHeader>

        {/* Body — scrollable details list */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <ol className="flex flex-col gap-4">
            {tier.details.map((item, idx) => {
              const included = item.included !== false
              return (
                <li
                  key={item.title}
                  className={`relative rounded-xl border p-4 transition-colors ${
                    included
                      ? "border-[#1B7892]/25 bg-[#082935]/40"
                      : "border-rose-500/20 bg-rose-500/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Numbered chip */}
                    <span
                      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                        included
                          ? "bg-[#1B7892]/25 text-[#5BC0D8] ring-1 ring-inset ring-[#5BC0D8]/35"
                          : "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/35"
                      }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-semibold ${
                            included ? "text-[#E8F4F7]" : "text-[#E8F4F7]/55"
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!included && (
                          <span className="rounded-full bg-rose-500/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-rose-300 ring-1 ring-inset ring-rose-400/30">
                            {t("pricing.notIncluded")}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[13px] leading-relaxed ${
                          included ? "text-[#E8F4F7]/70" : "text-[#E8F4F7]/45"
                        }`}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-[#1B7892]/20 bg-[#03161B]/80 p-4 sm:p-5">
          {tier.isBasic ? (
            <Button
              asChild
              className="h-11 w-full gap-2 rounded-lg bg-gradient-to-r from-[#1B7892] to-[#5BC0D8] font-semibold text-[#03161B] shadow-lg shadow-[#1B7892]/40 transition-all hover:brightness-110"
            >
              <a href={tier.href} target="_blank" rel="noopener noreferrer">
                {tier.cta}
                <ArrowRight className="size-4" />
              </a>
            </Button>
          ) : (
            <Button
              asChild
              className="h-11 w-full gap-2 rounded-lg bg-gradient-to-r from-[#1B7892] to-[#5BC0D8] font-semibold text-[#03161B] shadow-lg shadow-[#1B7892]/40 transition-all hover:brightness-110"
            >
              <Link href={tier.href}>
                {tier.cta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PricingCard({ tier }: { tier: Tier }) {
  const { t } = useLanguage()
  const style = ACCENT_STYLES[tier.accent]
  const popular = !!tier.popular

  return (
    <div className="relative flex h-full flex-col">
      {/* Floating "Most Popular" badge — sits over the card top edge */}
      {popular && (
        <div className="pointer-events-none absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
          {/* Soft outer glow */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-[#5BC0D8] opacity-40 blur-md"
          />
          <span className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-b from-[#7DD3E8] to-[#3BAAC4] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#03161B] shadow-[0_4px_16px_-2px_rgba(91,192,216,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] ring-1 ring-white/25">
            {/* Subtle inner highlight band */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"
            />
            <Flame className="relative size-3 drop-shadow-sm" strokeWidth={2.5} fill="currentColor" />
            <span className="relative">{t("pricing.popular")}</span>
          </span>
        </div>
      )}

      <div
        className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${
          popular
            ? "border-[#5BC0D8]/55 bg-[#03161B]/95 ring-1 ring-[#5BC0D8]/25 shadow-2xl shadow-[#5BC0D8]/15"
            : "border-[#1B7892]/25 bg-[#03161B]/75 shadow-lg shadow-black/40 hover:border-[#5BC0D8]/45 hover:shadow-[#1B7892]/25"
        }`}
      >
        {/* Subtle accent strip on top for popular */}
        {popular && (
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#5BC0D8] to-transparent"
          />
        )}

        {/* HEADER — animated icon + tier label */}
        <div className="flex items-center gap-3 px-6 pt-7 xl:px-5 xl:pt-6">
          <AnimatedIcon icon={tier.icon} tone={style.iconTone} size="md" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#E8F4F7]/70">
            {tier.name}
          </span>
        </div>

        {/* PRICE */}
        <div className="px-6 pt-5 xl:px-5">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-sans text-[44px] font-semibold leading-none tracking-tight ${style.price}`}
            >
              {tier.price}
            </span>
          </div>
          <span className="mt-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-[#E8F4F7]/50">
            {tier.suffix}
          </span>
        </div>

        {/* DESCRIPTION */}
        <p className="px-6 pt-4 text-[13px] leading-relaxed text-[#E8F4F7]/65 xl:px-5 xl:text-[12.5px]">
          {tier.description}
        </p>

        {/* DIVIDER */}
        <div className="mx-6 mt-6 h-px bg-[#1B7892]/20 xl:mx-5 xl:mt-5" />

        {/* FEATURES */}
        <ul className="flex flex-col gap-3 px-6 py-5 xl:gap-2.5 xl:px-5">
          {tier.features.map((feature) => {
            const included = feature.included !== false
            const highlighted = included && !!feature.highlight
            return (
              <li key={feature.label} className="flex items-start gap-3">
                {/* Animated check / cross badge */}
                {included ? (
                  <span
                    aria-hidden
                    className="mark-pop relative mt-0.5 inline-flex size-[22px] shrink-0 items-center justify-center"
                  >
                    {/* Soft pulsing ring */}
                    <span
                      className={`mark-ring absolute inset-0 rounded-full ring-1 ${
                        highlighted ? "ring-amber-300/70" : "ring-[#5BC0D8]/55"
                      }`}
                    />
                    <span
                      className={`mark-ring mark-ring-delay absolute inset-0 rounded-full ring-1 ${
                        highlighted ? "ring-amber-300/55" : "ring-[#5BC0D8]/45"
                      }`}
                    />
                    {/* Filled disc with gradient */}
                    <span
                      className={`absolute inset-0 rounded-full ${
                        highlighted
                          ? "shadow-[0_0_14px_-1px_rgba(251,191,36,0.7)]"
                          : "shadow-[0_0_12px_-2px_rgba(91,192,216,0.55)]"
                      }`}
                      style={{
                        background: highlighted
                          ? "radial-gradient(circle at 30% 30%, #FDE68A, #B45309 75%)"
                          : "radial-gradient(circle at 30% 30%, #7DE3FF, #1B7892 70%)",
                      }}
                    />
                    {/* Check stroke */}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="relative size-3.5"
                    >
                      <path
                        d="M5.5 12.5l4 4 9-9"
                        stroke="#03161B"
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="check-draw"
                      />
                    </svg>
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="mark-pop relative mt-0.5 inline-flex size-[22px] shrink-0 items-center justify-center"
                  >
                    {/* Outline disc — softer than the included one */}
                    <span
                      className="absolute inset-0 rounded-full border border-rose-400/40 bg-rose-500/10"
                    />
                    {/* Cross strokes */}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="relative size-3"
                    >
                      <path
                        d="M6 6L18 18"
                        stroke="#fb7185"
                        strokeWidth={3}
                        strokeLinecap="round"
                        className="cross-draw-a"
                      />
                      <path
                        d="M18 6L6 18"
                        stroke="#fb7185"
                        strokeWidth={3}
                        strokeLinecap="round"
                        className="cross-draw-b"
                      />
                    </svg>
                  </span>
                )}

                {/* Label + sub (with optional inline meta) */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={`text-[13px] font-medium leading-snug ${
                      included
                        ? highlighted
                          ? "font-bold text-amber-200"
                          : "text-[#E8F4F7]"
                        : "text-[#E8F4F7]/40 line-through decoration-rose-400/40"
                    }`}
                  >
                    {feature.label}
                  </span>
                  {(feature.sub || feature.meta) && (
                    <span
                      className={`text-[11px] leading-tight ${
                        included ? "text-[#E8F4F7]/45" : "text-[#E8F4F7]/25"
                      }`}
                    >
                      {feature.sub}
                      {feature.sub && feature.meta ? (
                        <span className="text-[#E8F4F7]/25"> · </span>
                      ) : null}
                      {feature.meta ? (
                        <span
                          className={`font-semibold uppercase tracking-wider ${
                            feature.meta.variant === "limited"
                              ? "text-amber-400"
                              : feature.meta.variant === "time"
                                ? "ml-1 rounded-sm bg-amber-400/15 px-1.5 py-px text-amber-300 ring-1 ring-inset ring-amber-400/40"
                                : "text-[#5BC0D8]"
                          }`}
                        >
                          {feature.meta.label}
                        </span>
                      ) : null}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {/* CTA — always pinned to bottom */}
        <div className="mt-auto flex flex-col gap-2 border-t border-[#1B7892]/15 bg-[#03161B]/40 p-6 xl:p-5">
          {/* View full details (opens dialog) */}
          <TierDetailsDialog tier={tier} />

          {tier.isBasic ? (
            <>
              <Button
                asChild
                className={`h-11 w-full gap-2 rounded-lg font-semibold transition-all ${style.button}`}
              >
                <a href={tier.href} target="_blank" rel="noopener noreferrer">
                  {tier.cta}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 w-full gap-2 rounded-lg border-[#1B7892]/40 bg-transparent text-[13px] font-medium text-[#E8F4F7]/80 transition-all hover:border-[#5BC0D8]/60 hover:bg-[#1B7892]/15 hover:text-[#5BC0D8]"
              >
                <a
                  href={ADMIN_TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  {t("header.menu.contact")}
                </a>
              </Button>
            </>
          ) : (
            <Button
              asChild
              className={`h-11 w-full gap-2 rounded-lg font-semibold transition-all ${style.button}`}
            >
              <Link href={tier.href}>
                {tier.cta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* Sheen effect on Popular tier — clipped to inner card */}
        {popular && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          >
            <div className="sheen absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-[#5BC0D8]/25 to-transparent" />
          </div>
        )}
      </div>
    </div>
  )
}
