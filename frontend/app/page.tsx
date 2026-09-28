"use client"

import Link from "next/link"
import {
  ArrowRight,
  Award,
  Crown,
  Gem,
  Globe,
  Headset,
  MessageCircle,
  Signal,
  Timer,
  Trophy,
  Flame,
  Info,
  ChevronRight,
  UserCheck,
  Layers,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { AnimatedIcon } from "@/components/animated-icon"
import { LockedOtcChart } from "@/components/locked-otc-chart"
import { MarketTicker } from "@/components/market-ticker"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Testimonials } from "@/components/testimonials"
import { FaqSection } from "@/components/faq-section"
import { FounderSection } from "@/components/founder-section"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"
import { useMemo } from "react"

const QUOTEX_SIGNUP_URL = "https://market-qx.pro/sign-up/?lid=1506771"
const ADMIN_TELEGRAM_URL = "https://t.me/Mushfiq2615"

/* =========================================================================
   HOME PAGE — Teal Onyx (teal #1B7892 + black gradient luxury theme)
   Color system (5 total):
     #000000  onyx black            — primary surface
     #061418  deep ink              — second surface tier
     #1B7892  brand teal            — primary accent
     #5BC0D8  teal light            — highlight / hover
     #E8F4F7  ivory mist            — body text
   ========================================================================= */

export default function HomePage() {
  return (
    <div
      className="flex min-h-screen flex-col text-[#E8F4F7] antialiased"
      style={{
        background:
          "linear-gradient(180deg, #000000 0%, #03161B 28%, #082935 58%, #0E4A5C 82%, #1B7892 100%)",
      }}
    >
      <Hero />
      <MarketTicker />
      <FeatureSection />
      <PricingSection />
      <Testimonials />
      <FounderSection />
      <FaqSection />
      <SiteFooter />
    </div>
  )
}

/* =========================================================================
   HERO SECTION
   ========================================================================= */

function Hero() {
  const { t } = useLanguage()
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background gradient mesh — soft teal glows on black */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(27,120,146,0.55), transparent), radial-gradient(ellipse 55% 35% at 100% 0%, rgba(91,192,216,0.22), transparent), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(27,120,146,0.20), transparent)",
        }}
      />

      {/* Subtle teal grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(91,192,216,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(91,192,216,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Top accent line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5BC0D8]/50 to-transparent"
      />

      <SiteHeader onDark />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-5 pb-16 pt-28 sm:px-8 sm:pt-36 lg:gap-16 lg:pb-24">
        {/* Hero copy */}
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Badge */}
          <div className="fade-up fade-up-1 inline-flex items-center gap-2.5 rounded-full border border-[#1B7892]/50 bg-[#1B7892]/15 px-4 py-2 backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5BC0D8] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#5BC0D8]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5BC0D8]">
              {t("hero.badge")}
            </span>
          </div>

          {/* Headline — teal shine on dark surface */}
          <h1 className="fade-up fade-up-2 font-display max-w-4xl text-balance text-4xl leading-[1.15] tracking-wide sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-shine-teal">{t("hero.title.1")}</span>{" "}
            <span className="text-shine-teal-accent font-serif italic font-medium">
              {t("hero.title.2")}
            </span>{" "}
            <span className="text-shine-teal">{t("hero.title.3")}</span>
          </h1>

          {/* Subheadline */}
          <p className="fade-up fade-up-3 max-w-2xl text-pretty font-serif text-lg italic leading-relaxed text-[#E8F4F7]/80 sm:text-xl">
            {t("hero.subtitle")}
          </p>

        </div>

        {/* Chart container */}
        <div className="fade-up fade-up-3 relative mx-auto w-full max-w-5xl">
          {/* Glow effect behind chart */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-3xl opacity-70 blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(27,120,146,0.45), transparent 70%)",
            }}
          />

          {/* Chart frame — deep ink surface with teal ring */}
          <div className="relative overflow-hidden rounded-2xl border border-[#1B7892]/30 bg-[#03161B]/95 shadow-2xl shadow-[#1B7892]/20 ring-1 ring-[#5BC0D8]/10 backdrop-blur-sm">
            {/* Chart header — professional terminal-style bar */}
            <div className="border-b border-[#1B7892]/25 bg-gradient-to-b from-[#062029]/80 to-transparent">
              <div className="flex flex-wrap items-stretch justify-between gap-3 px-4 py-3 sm:px-5">
                {/* Left: pair identity */}
                <div className="flex items-center gap-3">
                  {/* Stacked country flags — USD (United States) + BRL (Brazil) */}
                  <div className="relative flex items-center">
                    <img
                      src="https://flagcdn.com/w80/us.png"
                      alt="United States flag"
                      width={36}
                      height={36}
                      className="size-9 rounded-full object-cover shadow-md ring-2 ring-[#03161B]"
                    />
                    <img
                      src="https://flagcdn.com/w80/br.png"
                      alt="Brazil flag"
                      width={36}
                      height={36}
                      className="-ml-3 size-9 rounded-full object-cover shadow-md ring-2 ring-[#03161B]"
                    />
                  </div>

                  <div className="flex flex-col leading-tight">
                    <span className="font-mono text-sm font-semibold tracking-tight text-[#E8F4F7] sm:text-base">
                      {t("hero.chart.pair")} <span className="text-[#5BC0D8]">{t("hero.chart.otc")}</span>
                    </span>
                    <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#E8F4F7]/55 sm:text-[11px]">
                      {t("hero.chart.pairName")}
                    </span>
                  </div>
                </div>

                {/* Right: status cluster */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="hidden items-center gap-1.5 rounded-md border border-[#1B7892]/30 bg-[#082935]/60 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-[#E8F4F7]/70 sm:inline-flex">
                    <Timer className="size-3 text-[#5BC0D8]/80" aria-hidden />
                    1m
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#5BC0D8]/40 bg-[#1B7892]/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#5BC0D8]">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5BC0D8] opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-[#5BC0D8]" />
                    </span>
                    {t("hero.chart.live")}
                  </span>
                </div>
              </div>

            </div>

            {/* Chart area */}
            <div className="h-[280px] w-full sm:h-[360px] lg:h-[420px]">
              <LockedOtcChart />
            </div>
          </div>
        </div>

        {/*
          Divider — softly separates the chart from the CTA cluster so the
          Activate Account button never visually merges with the chart card.
          Visible on both mobile and desktop with the same gentle teal gradient.
        */}
        <div
          aria-hidden
          className="fade-up fade-up-4 relative mx-auto flex w-full max-w-3xl items-center justify-center"
        >
          <span className="h-px w-full bg-gradient-to-r from-transparent via-[#1B7892]/45 to-transparent" />
          <span className="absolute size-1.5 rounded-full bg-[#5BC0D8] shadow-[0_0_12px_rgba(91,192,216,0.7)]" />
        </div>

        {/* CTA section — sits directly below the USD/BRL chart card */}
        <div className="fade-up fade-up-4 mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-5">
            {/*
              PRIMARY — Activate Account
              · Premium teal gradient pill
              · CONTINUOUS shine sweep (cta-shine) + breathing glow halo (cta-pulse)
              · UserCheck icon badge — account-activation semantic
              · Responsive sizing: h-13 mobile → h-15 desktop, scaled padding & text
            */}
            <Link
              href="/activate-account"
              aria-label={t("hero.cta.activate")}
              className="group relative inline-flex h-13 w-full items-center justify-center overflow-hidden rounded-xl font-semibold tracking-[0.01em] text-[#03161B] cta-pulse transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:h-14 sm:w-auto lg:h-15"
              style={{
                background:
                  "linear-gradient(135deg, #7DE3FF 0%, #5BC0D8 35%, #2EA5C0 65%, #1B7892 100%)",
              }}
            >
              {/* Top highlight gloss for premium glassy feel */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"
              />
              {/* Bottom inner shadow for depth */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A1A22]/15 to-transparent"
              />
              {/* CONTINUOUS shine sweep — runs forever */}
              <span
                aria-hidden
                className="cta-shine pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/65 to-transparent"
              />

              <span className="relative flex items-center justify-center gap-2.5 px-6 sm:gap-3 sm:px-9 lg:px-11">
                {/* Icon badge — circular onyx puck with UserCheck for account-activation semantic */}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#03161B]/85 text-[#5BC0D8] shadow-[0_0_0_1px_rgba(255,255,255,0.22)_inset] sm:size-8 lg:size-9">
                  <UserCheck className="size-3.5 sm:size-4 lg:size-[18px]" strokeWidth={2.5} />
                </span>
                <span className="text-[15px] sm:text-base lg:text-[17px]">
                  {t("hero.cta.activate")}
                </span>
                <ArrowRight
                  className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 sm:size-[18px] lg:size-5"
                  strokeWidth={2.5}
                />
              </span>
            </Link>

            {/*
              SECONDARY — Features (jumps to #pricing)
              · Fully-rounded capsule shape — distinct silhouette from the
              ·   rectangular Activate pill so the two CTAs read as a pair,
              ·   not duplicates.
              · Glass surface with double-ring border for a refined accent.
              · Sized to match the primary CTA on each breakpoint.
            */}
            <Link
              href="#pricing"
              aria-label={t("hero.cta.features")}
              className="group relative inline-flex h-13 w-full items-center justify-center overflow-hidden rounded-full border border-[#1B7892]/50 bg-[#03161B]/55 font-medium text-[#E8F4F7] shadow-[inset_0_0_0_1px_rgba(91,192,216,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5BC0D8]/70 hover:bg-[#0A2530]/75 hover:shadow-[inset_0_0_0_1px_rgba(91,192,216,0.18),0_10px_28px_-10px_rgba(91,192,216,0.5)] active:translate-y-0 sm:h-14 sm:w-auto lg:h-15"
            >
              {/* Soft top hairline accent — follows the capsule curve */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#5BC0D8]/55 to-transparent"
              />

              <span className="relative flex items-center justify-center gap-2.5 px-6 sm:gap-3 sm:px-9 lg:px-11">
                {/* Icon — Layers conveys "stacked features / capabilities" */}
                <Layers
                  className="size-4 shrink-0 text-[#5BC0D8] transition-transform duration-300 group-hover:scale-110 sm:size-[18px] lg:size-5"
                  strokeWidth={2.5}
                />
                <span className="text-[15px] transition-colors group-hover:text-[#5BC0D8] sm:text-base lg:text-[17px]">
                  {t("hero.cta.features")}
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-[#E8F4F7]/65 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#5BC0D8] sm:size-[18px] lg:size-5"
                  strokeWidth={2.5}
                />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* =========================================================================
   FEATURES SECTION
   ========================================================================= */

type FeatureTone = "teal" | "cyan" | "gold" | "ivory"

type FeatureItem = {
  number: string
  icon: typeof Timer
  tone: FeatureTone
  eyebrow: string
  title: string
  description: string
  metric?: { value: string; label: string }
  layout: "hero" | "stat" | "card" | "wide"
}

function buildFeatures(t: (k: string) => string): FeatureItem[] {
  return [
    {
      number: "01",
      icon: Timer,
      tone: "cyan",
      eyebrow: t("feature.1.eyebrow"),
      title: t("feature.1.title"),
      description: t("feature.1.desc"),
      metric: { value: t("feature.1.metric.value"), label: t("feature.1.metric.label") },
      layout: "hero",
    },
    {
      number: "02",
      icon: Signal,
      tone: "teal",
      eyebrow: t("feature.2.eyebrow"),
      title: t("feature.2.title"),
      description: t("feature.2.desc"),
      metric: { value: t("feature.2.metric.value"), label: t("feature.2.metric.label") },
      layout: "stat",
    },
    {
      number: "03",
      icon: Globe,
      tone: "gold",
      eyebrow: t("feature.3.eyebrow"),
      title: t("feature.3.title"),
      description: t("feature.3.desc"),
      metric: { value: t("feature.3.metric.value"), label: t("feature.3.metric.label") },
      layout: "card",
    },
    {
      number: "04",
      icon: Headset,
      tone: "ivory",
      eyebrow: t("feature.4.eyebrow"),
      title: t("feature.4.title"),
      description: t("feature.4.desc"),
      layout: "wide",
    },
  ]
}

const LAYOUT_CLASS: Record<FeatureItem["layout"], string> = {
  hero: "lg:col-span-2 lg:row-span-2",
  stat: "lg:col-span-2 lg:row-span-1",
  card: "lg:col-span-1 lg:row-span-1",
  wide: "lg:col-span-1 lg:row-span-1",
}

function FeatureSection() {
  const { t } = useLanguage()
  const features = useMemo(() => buildFeatures(t), [t])
  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-32">
      {/* Background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Soft teal radial glow rising from bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at 50% 100%, rgba(27,120,146,0.32), transparent)",
          }}
        />
        {/* Subtle grid overlay for premium texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(91,192,216,1) 1px, transparent 1px), linear-gradient(90deg, rgba(91,192,216,1) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* Top corner accent */}
        <div
          className="absolute -left-32 top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #1B7892 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* Section header */}
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Tagline above pill */}
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#5BC0D8]/60" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#5BC0D8]/80">
              {t("feature.tagline")}
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#5BC0D8]/60" />
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[#1B7892]/40 bg-[#03161B]/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5BC0D8] backdrop-blur-sm">
            {t("feature.badge")}
          </span>

          <h2 className="font-display max-w-3xl text-balance text-3xl leading-[1.15] tracking-wide sm:text-4xl lg:text-[3.25rem]">
            <span className="text-[#E8F4F7]">{t("feature.title.1")}</span>{" "}
            <span className="font-serif italic font-medium bg-gradient-to-r from-[#1B7892] via-[#5BC0D8] to-[#1B7892] bg-clip-text text-transparent">
              {t("feature.title.2")}
            </span>
          </h2>

          <p className="max-w-2xl text-pretty font-serif text-lg italic text-[#E8F4F7]/70 sm:text-xl">
            {t("feature.subtitle")}
          </p>
        </div>

        {/* Bento grid */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
          {features.map((feature) => (
            <FeatureCard key={feature.number} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature }: { feature: FeatureItem }) {
  const { t } = useLanguage()
  const isHero = feature.layout === "hero"

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-[#1B7892]/25 bg-gradient-to-br from-[#03161B]/85 via-[#082935]/65 to-[#03161B]/85 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#5BC0D8]/55 hover:shadow-[0_0_36px_-8px_rgba(91,192,216,0.45)]",
        LAYOUT_CLASS[feature.layout],
        isHero ? "p-7 sm:p-8 lg:p-10" : "p-6 lg:p-7",
      )}
    >
      {/* Top accent bar — gradient line, brightens on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5BC0D8]/70 to-transparent opacity-30 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Number watermark */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute font-serif italic font-bold text-[#1B7892]/[0.09] transition-all duration-300 group-hover:text-[#5BC0D8]/[0.16]",
          isHero
            ? "right-6 top-2 text-[7rem] leading-none lg:text-[10rem]"
            : "right-3 top-1 text-[4.5rem] leading-none lg:text-[5.5rem]",
        )}
      >
        {feature.number}
      </span>

      {/* Hover radial glow from top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(91,192,216,0.18), transparent 70%)",
        }}
      />

      {/* Corner sparkle dot */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 bottom-4 size-1.5 rounded-full bg-[#5BC0D8]/40 shadow-[0_0_12px_rgba(91,192,216,0.6)] transition-all duration-300 group-hover:bg-[#5BC0D8] group-hover:shadow-[0_0_18px_rgba(91,192,216,0.95)]"
      />

      {/* Content */}
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center gap-3">
          <AnimatedIcon
            icon={feature.icon}
            tone={feature.tone}
            size={isHero ? "lg" : "md"}
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5BC0D8]/75">
            {feature.eyebrow}
          </span>
        </div>

        <h3
          className={cn(
            "mt-5 font-semibold text-[#E8F4F7]",
            isHero ? "text-2xl lg:text-[1.75rem]" : "text-lg lg:text-xl",
          )}
        >
          {feature.title}
        </h3>

        {feature.metric && (
          <div
            className={cn(
              "flex items-baseline gap-2",
              isHero ? "mt-6" : "mt-3",
            )}
          >
            <span
              className={cn(
                "font-display font-bold bg-gradient-to-b from-[#7DE3FF] to-[#3BAAC4] bg-clip-text text-transparent",
                isHero
                  ? "text-5xl lg:text-6xl"
                  : "text-3xl lg:text-[2.5rem]",
              )}
            >
              {feature.metric.value}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#E8F4F7]/55">
              {feature.metric.label}
            </span>
          </div>
        )}

        <p
          className={cn(
            "leading-relaxed text-[#E8F4F7]/70",
            isHero ? "mt-5 max-w-md text-[15px] lg:text-base" : "mt-3 text-sm",
          )}
        >
          {feature.description}
        </p>

        {/* Hero-only footer treatment */}
        {isHero && (
          <div className="mt-auto pt-7">
            <div className="h-px w-full bg-gradient-to-r from-[#1B7892]/50 via-[#1B7892]/20 to-transparent" />
            <p className="mt-4 text-[10px] uppercase tracking-[0.26em] text-[#5BC0D8]/75">
              {t("feature.1.footer")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================================
   PRICING SECTION
   ========================================================================= */

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

function PricingSection() {
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
