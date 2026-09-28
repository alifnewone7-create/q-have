"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"
import {
  MoveUpRight,
  BadgeCheck,
  CandlestickChart,
  Crown,
  Film,
  Gauge,
  Layers,
  LayoutGrid,
  Radar,
  Timer,
  type LucideIcon,
} from "lucide-react"

import {
  DAILY_LIMITS,
  TIER_ACCENT,
  TIER_LABEL,
  TIERS,
  CANDLE2_TIME_LIMITS,
  candle2LimitLabel,
  type SignalSystem,
  type Tier,
} from "@/lib/tiers"
import { cn } from "@/lib/utils"
import { useSignalUsage } from "@/hooks/use-signal-usage"
import { use2CandleUsage, formatTime } from "@/hooks/use-2candle-usage"
import { AnimatedIcon } from "@/components/animated-icon"
import {
  SignalShell,
  type SignalShellChildArgs,
} from "@/components/signal/signal-shell"

/* ── palette ── */
const C  = "#7DE3FF"   // cyan
const C2 = "#5BC0D8"   // cyan mid
const T  = "#1B7892"   // teal
const G  = "#F5C16C"   // gold
const GF = "#FCD9A8"   // gold light
const EM = "#34D399"   // emerald

type Holder = SignalShellChildArgs["holder"]

type SystemRow = {
  system: SignalSystem | "chart-2candle"
  href: (token: string) => string
  icon: LucideIcon
  label: string
  badge: string
  unlimited?: boolean
}

const ROOMS: SystemRow[] = [
  { system: "chart-to-signal",    href: t => `/chart-to-signal/${t}`,    icon: CandlestickChart, label: "1m Live Signal",   badge: "1m" },
  { system: "chart-15sec-signal",  href: t => `/chart-15sec-signal/${t}`,  icon: Timer,            label: "15s Burst Signal", badge: "15s" },
  { system: "chart-2candle",      href: t => `/chart-2candle/${t}`,      icon: Film,             label: "2", unlimited: true },
]

/* ═══════════════════════════════════ ROOT ═══════════════════════════════════ */

export function ProfileClient({ code }: { code: string }) {
  return (
    <SignalShell rawCode={code} pageEyebrow="Profile · QXL Account" pageTitle="Your Quotex Live account">
      {({ accessToken, qxlKey, tier, holder }) => (
        <Dashboard accessToken={accessToken} qxlKey={qxlKey} tier={tier} holder={holder} />
      )}
    </SignalShell>
  )
}

/* ════════════════════════════════ DASHBOARD ════════════════════════════════ */

function Dashboard({ accessToken, qxlKey, tier, holder }: {
  accessToken: string; qxlKey: string; tier: Tier; holder: Holder
}) {
  return (
    <div
      className="-mt-6 flex flex-col gap-8 pb-4 sm:mt-0"
      style={{ fontFamily: "var(--font-quintessential), 'Quintessential', serif" }}
    >
      {/* Hero */}
      <Section label="Account Overview" hideIcon hideLabel hideLine>
        <HeroCard tier={tier} holder={holder} />
      </Section>

      {/* 2-col: quota + benefits */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Section icon={Gauge} label="Daily Quota">
          <QuotaCard tier={tier} accessToken={accessToken} />
        </Section>
        <Section icon={Crown} label="Plan Benefits">
          <BenefitsCard tier={tier} />
        </Section>
      </div>

      {/* Rooms */}
      <Section icon={LayoutGrid} label="Trading Rooms">
        <RoomsCard accessToken={accessToken} qxlKey={qxlKey} tier={tier} />
      </Section>

      {/* Ledger */}
      <Section icon={Layers} label="Plan Comparison">
        <LedgerCard activeTier={tier} />
      </Section>
    </div>
  )
}

/* ══════════════════════════ SECTION WRAPPER ════════════════════════════════ */

function Section({ icon: Icon, label, children, hideIcon, hideLabel, hideLine }: { icon?: LucideIcon; label: string; children: React.ReactNode; hideIcon?: boolean; hideLabel?: boolean; hideLine?: boolean }) {
  const showHeader = (!hideIcon && Icon) || !hideLabel || !hideLine
  const hideAll = hideIcon && hideLabel && hideLine
  return (
    <section className="flex flex-col gap-3.5">
      {/* Label row */}
      {showHeader && (
        <div className="flex items-center gap-3 px-0.5">
          {!hideIcon && Icon && (
            <div
              className="grid size-6 shrink-0 place-items-center rounded-md"
              style={{ background: `${T}35`, border: `1px solid ${T}50` }}
            >
              <Icon className="size-3" style={{ color: C2 }} strokeWidth={2.2} aria-hidden />
            </div>
          )}
          {!hideLabel && (
            <span
              className="text-[10px] font-bold uppercase tracking-[0.44em]"
              style={{ color: `${C2}80` }}
            >
              {label}
            </span>
          )}
          {!hideLine && (
            <div
              className="h-px flex-1"
              aria-hidden
              style={{ background: `linear-gradient(90deg, ${T}45, transparent)` }}
            />
          )}
        </div>
      )}
      {/* Spacer to maintain gap when header is fully hidden */}
      {hideAll && <div className="h-0" aria-hidden />}
      {children}
    </section>
  )
}

/* ═════════════════════════════ CARD SHELL ══════════════════════════════════ */

/**
 * Base card — gradient border + glass surface + top shine + glow.
 * Every profile card is built on top of this shell.
 */
function Card({
  children,
  className,
  accent = "cyan",
  style,
  as: As = "div",
}: {
  children: React.ReactNode
  className?: string
  accent?: "cyan" | "gold" | "emerald" | "duo" | "muted"
  style?: React.CSSProperties
  as?: "div" | "section" | "article"
}) {
  const border: Record<string, string> = {
    cyan:    `linear-gradient(145deg, ${C}50 0%, ${T}30 40%, ${C}35 100%)`,
    gold:    `linear-gradient(145deg, ${G}55 0%, ${T}28 45%, ${G}40 100%)`,
    emerald: `linear-gradient(145deg, ${EM}50 0%, ${T}25 45%, ${EM}35 100%)`,
    duo:     `linear-gradient(145deg, ${C}48 0%, ${G}45 50%, ${C}40 100%)`,
    muted:   `linear-gradient(145deg, ${T}40 0%, ${T}20 100%)`,
  }
  const glow: Record<string, string> = {
    cyan:    `radial-gradient(ellipse 65% 45% at 5% 5%, ${C}0F 0%, transparent 60%)`,
    gold:    `radial-gradient(ellipse 65% 45% at 95% 5%, ${G}0D 0%, transparent 60%)`,
    emerald: `radial-gradient(ellipse 65% 45% at 5% 95%, ${EM}0C 0%, transparent 60%)`,
    duo:     `radial-gradient(ellipse 75% 50% at 50% 0%, ${C}0B 0%, ${G}09 55%, transparent 100%)`,
    muted:   "none",
  }
  const shine: Record<string, string> = {
    cyan:    `linear-gradient(90deg, transparent 15%, ${C}50 50%, transparent 85%)`,
    gold:    `linear-gradient(90deg, transparent 15%, ${G}52 50%, transparent 85%)`,
    emerald: `linear-gradient(90deg, transparent 15%, ${EM}48 50%, transparent 85%)`,
    duo:     `linear-gradient(90deg, transparent 5%, ${C}44 35%, ${G}44 65%, transparent 95%)`,
    muted:   `linear-gradient(90deg, transparent 15%, ${T}30 50%, transparent 85%)`,
  }

  return (
    <div
      className="rounded-2xl p-px"
      style={{ background: border[accent] }}
    >
      <As
        className={cn(
          "relative overflow-hidden rounded-[15px] backdrop-blur-xl",
          "shadow-[0_24px_48px_-16px_rgba(0,0,0,0.65)]",
          className,
        )}
        style={{
          background: `${glow[accent]}, #030F14`,
          ...style,
        }}
      >
        {/* Top-edge shine */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: shine[accent] }}
        />
        {children}
      </As>
    </div>
  )
}

/* ═══════════════════════════ CARD HEAD ═════��═══════════════════════════════ */

function CardHead({
  icon: Icon, tone, eyebrow, title, titleAccent, right,
}: {
  icon: LucideIcon
  tone: "cyan" | "teal" | "gold" | "emerald" | "ivory"
  eyebrow: string
  title: string
  titleAccent?: string
  right?: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 border-b pb-5 mb-6"
      style={{ borderColor: `${T}22` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <AnimatedIcon icon={Icon} tone={tone} size="md" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.42em]"
            style={{ color: `${C2}70` }}
          >
            {eyebrow}
          </span>
          <h2 className="text-[20px] font-extrabold leading-tight tracking-[-0.01em] text-[#E8F4F7] sm:text-[22px]">
            {title}
            {titleAccent && (
              <span
                className="ml-2 text-[24px] font-normal leading-none sm:text-[26px]"
                style={{ color: C2, fontFamily: "var(--font-quintessential), 'Quintessential', serif" }}
              >
                {titleAccent}
              </span>
            )}
          </h2>
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

/* ═══════════════════════════ HERO CARD ═════════════════════════════════════ */

function HeroCard({ tier, holder }: { tier: Tier; holder: Holder }) {
  const accent = TIER_ACCENT[tier]

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/12 bg-[#03161B]/55 ring-1 ring-[#5BC0D8]/12 transition-all duration-300 hover:border-[#5BC0D8]/45 hover:shadow-[0_0_18px_-4px_rgba(91,192,216,0.55)]"
    >
      {/* Subtle inner top highlight for premium feel */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.07] to-transparent"
      />
      
      {/* Animated shine sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-full top-0 h-full w-1/2 skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-all duration-700 group-hover:left-[150%]"
      />

      {/* Ambient streak */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent.from} 0%, transparent 70%)` }}
      />

      <div className="relative p-5 sm:p-7">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-7">

          {/* Avatar — animated, mirrors the mobile sidebar trigger language */}
          <div className="group relative shrink-0">
            {/* Outer blurred conic halo */}
            <div
              aria-hidden
              className="absolute -inset-[5px] rounded-full opacity-70 blur-xl"
              style={{ background: `conic-gradient(from 0deg, ${accent.from}, ${G}, ${accent.to}, ${accent.from})` }}
            />
            {/* Pulsing ping ring — same "I'm interactive" cue as the mobile menu button */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-[6px] rounded-full border opacity-70 animate-ping"
              style={{
                borderColor: `${accent.from}66`,
                animationDuration: "2.6s",
              }}
            />
            {/* Static accent ring with soft inner/outer glow */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-[4px] rounded-full border transition-all duration-300 group-hover:scale-[1.02]"
              style={{
                borderColor: `${accent.from}55`,
                boxShadow: `0 0 22px -4px ${accent.ring}, inset 0 0 10px ${accent.from}22`,
              }}
            />
            {/* Conic gradient ring (masked) */}
            <div
              aria-hidden
              className="absolute -inset-[3px] rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${accent.from}, ${G}, ${accent.to}, ${accent.from})`,
                padding: "2px",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            {/* Avatar image */}
            <div
              className="relative size-[88px] overflow-hidden rounded-full ring-[3px] ring-[#020D12] transition-transform duration-300 group-hover:scale-[1.02] sm:size-[116px]"
              style={{ boxShadow: `0 0 28px -4px ${accent.ring}` }}
            >
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${accent.from}55, ${accent.to}45)` }}
              />
              <Image
                src="/images/profile.png"
                alt={holder?.fullName ? `${holder.fullName} avatar` : "Trader avatar"}
                fill
                sizes="(min-width: 640px) 116px, 88px"
                priority
                className="relative object-cover"
              />
            </div>
            {/* Live status dot — "online" indicator, mirrors the hamburger */}
            <span
              aria-hidden
              className="absolute bottom-1 right-1 grid size-3.5 place-items-center rounded-full border-2 border-[#020D12] bg-[#34D399] sm:size-4 sm:bottom-1.5 sm:right-1.5"
              style={{ boxShadow: `0 0 10px ${EM}99` }}
            >
              <span className="block size-1.5 rounded-full bg-[#34D399] animate-pulse" />
            </span>
          </div>

          {/* Identity */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 text-center sm:text-left">

            {/* Verified line */}
            <div className="flex items-center justify-center gap-1.5 sm:justify-start">
              <BadgeCheck className="size-3.5" style={{ color: EM }} strokeWidth={2.5} aria-hidden />
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.38em]"
                style={{ color: `${EM}CC` }}
              >
                Verified Member
              </span>
            </div>

            {/* Name — home page hero shine + italic accent combo */}
            <h1 className="text-balance text-[32px] font-normal leading-[1.05] tracking-wide sm:text-[38px] lg:text-[46px]">
              {(() => {
                const full = (holder?.fullName || "Unnamed Trader").trim()
                const parts = full.split(/\s+/)
                const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : full
                const last  = parts.length > 1 ? parts[parts.length - 1] : ""
                return (
                  <>
                    <span
                      className="text-shine-teal"
                      style={{ fontFamily: "var(--font-quintessential), 'Quintessential', serif" }}
                    >
                      {first}
                    </span>
                    {last && (
                      <>
                        {" "}
                        <span
                          className="text-shine-teal-accent italic font-medium"
                          style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
                        >
                          {last}
                        </span>
                      </>
                    )}
                  </>
                )
              })()}
            </h1>

            {/* Tier chip - Parallelogram shape */}
            <div className="mt-1 flex items-center justify-center sm:justify-start">
              <div
                className="relative inline-flex items-center gap-2.5 px-4 py-2 sm:gap-3 sm:px-5 sm:py-2.5"
                style={{
                  background: `linear-gradient(135deg, ${accent.from}20, ${accent.to}12)`,
                  clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)",
                  boxShadow: `0 0 20px -6px ${accent.ring}`,
                }}
              >
                {/* Inner border effect for parallelogram */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-[1px]"
                  style={{
                    background: `linear-gradient(135deg, ${accent.from}12, ${accent.to}08)`,
                    clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)",
                    border: `1px solid ${accent.from}40`,
                  }}
                />
                <Crown className="relative size-4 sm:size-5" style={{ color: accent.from }} strokeWidth={2} aria-hidden />
                <div className="relative flex items-center gap-2 sm:gap-2.5">
                  <span
                    className="text-[8px] font-semibold uppercase tracking-[0.2em] sm:text-[9px]"
                    style={{ color: `${GF}70` }}
                  >
                    Membership
                  </span>
                  <span
                    className="h-3 w-px sm:h-4"
                    style={{ background: `${accent.from}40` }}
                    aria-hidden
                  />
                  <span
                    className="badge-shine relative overflow-hidden text-[16px] font-normal leading-tight tracking-tight sm:text-[20px]"
                    style={{ color: "#E8F4F7", fontFamily: "var(--font-quintessential), 'Quintessential', serif" }}
                  >
                    {TIER_LABEL[tier]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════ QUOTA CARD ═════════════════════════════════ */

function QuotaCard({ tier, accessToken }: { tier: Tier; accessToken: string }) {
  const oneM     = useSignalUsage(accessToken, tier, "chart-to-signal")
  const fiveS    = useSignalUsage(accessToken, tier, "chart-15sec-signal")
  // 2 Candle Ahead usage (only for Smart, Pro, Dominator)
  const candle2  = use2CandleUsage(accessToken, tier, false) // false = not actively using
  const accent   = TIER_ACCENT[tier]

  const totals = useMemo(() => {
    const used      = oneM.count + fiveS.count
    const limit     = oneM.limit + fiveS.limit
    const pct       = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
    return { used, limit, pct }
  }, [oneM.count, oneM.limit, fiveS.count, fiveS.limit])

  const low = totals.limit > 0 && (totals.limit - (oneM.count + fiveS.count)) <= Math.max(2, Math.round(totals.limit * 0.1))

  /* SVG ring */
  const R    = 54
  const CIRC = 2 * Math.PI * R
  const dash = (totals.pct / 100) * CIRC

  const bars = [
    { key: "1m",   count: oneM.count,  limit: oneM.limit,  color: C },
    { key: "15s",  count: fiveS.count, limit: fiveS.limit, color: GF },
  ]

  // Check if tier has 2candle time limit
  const has2CandleLimit = !candle2.isUnlimited

  return (
    <Card accent={low ? "gold" : "cyan"} as="section">
      <div className="p-5 sm:p-6">
        <CardHead
          icon={Gauge}
          tone={low ? "gold" : "cyan"}
          eyebrow="Usage Today"
          title="Daily"
          titleAccent="Quota"
          right={
            low ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em]"
                style={{ borderColor: "#FBBF2450", background: "#FBBF2410", color: "#FCD34D" }}
              >
                <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
                Low
              </span>
            ) : null
          }
        />

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          {/* Ring gauge */}
          <div className="relative mx-auto sm:mx-0 shrink-0">
            <svg viewBox="0 0 144 144" className="size-36 -rotate-90" aria-hidden>
              <defs>
                <linearGradient id="qg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor={accent.from} />
                  <stop offset="50%"  stopColor={GF} />
                  <stop offset="100%" stopColor={accent.to} />
                </linearGradient>
                <filter id="qf">
                  <feGaussianBlur stdDeviation="2" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* Track */}
              <circle cx="72" cy="72" r={R} fill="none" stroke={`${T}28`} strokeWidth="10" />
              {/* Fill */}
              <circle
                cx="72" cy="72" r={R} fill="none"
                stroke="url(#qg)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRC - dash}`}
                filter="url(#qf)"
                className="transition-[stroke-dasharray] duration-700 ease-out"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span className="text-[8.5px] font-bold uppercase tracking-[0.28em]" style={{ color: `${C2}70` }}>Used</span>
              <span
                className="text-[40px] font-normal leading-none tracking-tight text-[#E8F4F7]"
                style={{ fontFamily: "var(--font-new-rocker), serif" }}
              >
                {totals.used}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold font-rocker"
                style={{ background: `${G}18`, color: GF, border: `1px solid ${G}38` }}
              >
                {Math.round(totals.pct)}%
              </span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="flex flex-1 flex-col gap-3.5 w-full">
            {bars.map(b => {
              const pct = b.limit > 0 ? Math.min(100, (b.count / b.limit) * 100) : 0
              return (
                <div key={b.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.20em] text-[#E8F4F7]/65">
                      <span aria-hidden className="size-2 rounded-sm" style={{ background: b.color }} />
                      {b.key}
                    </span>
                    <span className="text-[12px] font-bold tabular-nums font-rocker text-[#E8F4F7]/75">
                      {b.count}
                      <span className="font-normal text-[#E8F4F7]/30"> / {b.limit}</span>
                    </span>
                  </div>
                  <div
                    className="h-[7px] w-full overflow-hidden rounded-full"
                    style={{ background: `${T}22` }}
                    role="progressbar"
                    aria-valuemin={0} aria-valuemax={b.limit} aria-valuenow={b.count}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${b.color}, ${b.color}88)`,
                        boxShadow: `0 0 8px 0 ${b.color}65`,
                      }}
                    />
                  </div>
                </div>
              )
            })}

            {/* 2 Candle Ahead progress - only for Smart, Pro, Dominator */}
            {has2CandleLimit && (
              <div className="flex flex-col gap-1.5 mt-1 pt-3 border-t" style={{ borderColor: `${T}22` }}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.20em] text-[#E8F4F7]/65">
                    <span aria-hidden className="size-2 rounded-sm" style={{ background: EM }} />
                    2 Candle Ahead
                  </span>
                  <span className="text-[12px] font-bold tabular-nums text-[#E8F4F7]/75">
                    <span className="font-mono" style={{ color: EM }}>
                      {formatTime(candle2.remainingSeconds, true)}
                    </span>
                    <span className="font-normal text-[#E8F4F7]/30"> left</span>
                  </span>
                </div>
                <div
                  className="h-[7px] w-full overflow-hidden rounded-full"
                  style={{ background: `${T}22` }}
                  role="progressbar"
                  aria-valuemin={0} aria-valuemax={candle2.limitSeconds} aria-valuenow={candle2.usedSeconds}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${candle2.limitSeconds > 0 ? Math.min(100, (candle2.usedSeconds / candle2.limitSeconds) * 100) : 0}%`,
                      background: `linear-gradient(90deg, ${EM}, ${EM}88)`,
                      boxShadow: `0 0 8px 0 ${EM}65`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-[#E8F4F7]/40">
                  <span>Used: {formatTime(candle2.usedSeconds, true)}</span>
                  <span>Limit: {candle2LimitLabel(tier)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ══════════════════════════ BENEFITS CARD ══════════════════════════════════ */

function BenefitsCard({ tier }: { tier: Tier }) {
  const accent = TIER_ACCENT[tier]
  const limits = DAILY_LIMITS[tier]

  const perks = [
    { label: "1m Live",     value: `${limits["chart-to-signal"]} / day`,     color: C },
    { label: "15s Burst",   value: `${limits["chart-15sec-signal"]} / day`,   color: GF },
    ...(tier === "basic"
      ? []
      : [{ label: "2 Candle Ahead", value: candle2LimitLabel(tier), color: EM }]),
    { label: "Activation",  value: "1 Device",                              color: EM },
    { label: "Quota Reset", value: "6:00 AM BD (UTC+6)",                   color: EM },
  ]

  return (
    <Card
      accent="gold"
      as="section"
      style={{ background: `radial-gradient(ellipse 75% 55% at 5% 5%, ${accent.from}12 0%, transparent 55%), #030F14` }}
    >
      <div className="p-5 sm:p-6">
        <CardHead
          icon={Crown}
          tone="gold"
          eyebrow={`${TIER_LABEL[tier]} plan`}
          title="Plan"
          titleAccent="Benefits"
          right={
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em]"
              style={{ borderColor: `${accent.from}50`, background: `${accent.from}12`, color: accent.from }}
            >
              Active
            </span>
          }
        />

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {perks.map(p => (
            <li
              key={p.label}
              className="relative flex items-center justify-between overflow-hidden rounded-xl border px-4 py-3"
              style={{ borderColor: `${T}22`, background: "rgba(2,9,14,0.50)" }}
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] rounded-r" style={{ background: p.color, opacity: 0.7 }} />
              <span className="pl-2 text-[13px] font-semibold text-[#E8F4F7]/80">{p.label}</span>
              <span className="text-[12px] font-bold tabular-nums" style={{ color: p.color }}>
                {(() => {
                  // Render any leading numeric portion of `p.value` in
                  // New Rocker; the trailing copy stays in the body font.
                  const m = String(p.value).match(/^(\d[\d.,:]*)(.*)$/)
                  if (!m) return p.value
                  return (
                    <>
                      <span className="font-rocker">{m[1]}</span>
                      {m[2]}
                    </>
                  )
                })()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

/* ══════════════════════════ ROOMS CARD ═════════════════════════════════════ */

function RoomsCard({ accessToken, qxlKey, tier }: { accessToken: string; qxlKey: string; tier: Tier }) {
  return (
    <Card accent="emerald" as="section">
      <div className="p-5 sm:p-6">
        <CardHead
          icon={Radar}
          tone="cyan"
          eyebrow="Signal Systems"
          title="QX Trading"
          titleAccent="Tools"
        />
        <ul className="grid gap-5 sm:grid-cols-2 sm:gap-3">
          {ROOMS.map(row =>
            row.system === "chart-2candle"
              ? <RoomUnlimited key={row.system} row={row} accessToken={accessToken} image={{ src: "/images/2candle.png", alt: "2 Candle Ahead — see two candles earlier" }} />
              : row.unlimited
              ? <RoomUnlimited key={row.system} row={row} accessToken={accessToken} />
              : row.system === "chart-to-signal"
                ? <RoomLiveImage key={row.system} row={row} accessToken={accessToken} src="/images/1m-live-signal.png" alt="1m Live Signal — live Quotex chart preview" accent={C} />
                : row.system === "chart-15sec-signal"
                ? <RoomLiveImage key={row.system} row={row} accessToken={accessToken} src="/images/15s-burst-signal.png" alt="15s Burst Signal — live Quotex chart preview" accent={EM} />
                : <RoomLive key={row.system} row={row} accessToken={accessToken} qxlKey={qxlKey} tier={tier} />
          )}
        </ul>
      </div>
    </Card>
  )
}

/**
 * Split a card label into a leading "lead" word/number and a trailing
 * "tail" phrase. Returns the lead in white normal Quintessential and the
 * tail in italic Cormorant, tinted with the brand cyan — giving the
 * normal + italic / white + website-color mix used across cards.
 */
function CardTitle({ label }: { label: string }) {
  const trimmed = label.trim()
  const firstSpace = trimmed.indexOf(" ")
  const lead = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)
  const tail = firstSpace === -1 ? "" : trimmed.slice(firstSpace + 1)
  return (
    <p className="truncate text-[16px] font-medium leading-tight text-balance sm:text-[19px]">
      <span
        className="text-[#E8F4F7]"
        style={{ fontFamily: "var(--font-quintessential), 'Quintessential', serif" }}
      >
        {lead}
      </span>
      {tail && (
        <>
          {" "}
          <span
            className="italic font-medium"
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              color: "#5BC0D8",
            }}
          >
            {tail}
          </span>
        </>
      )}
    </p>
  )
}

function RoomLiveImage({
  row,
  accessToken,
  src,
  alt,
  accent,
}: {
  row: SystemRow
  accessToken: string
  src: string
  alt: string
  accent: string
}) {
  return (
    <li>
      <Link
        href={row.href(accessToken)}
        className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border p-3 shadow-[0_0_20px_-8px_rgba(91,192,216,0.15)] transition-all duration-200 hover:-translate-y-0.5 sm:gap-3.5 sm:p-3.5 sm:shadow-none"
        style={{
          borderColor: `${accent}40`,
          background: `linear-gradient(135deg, rgba(3,15,20,0.85) 0%, rgba(3,15,20,0.6) 100%)`,
        }}
      >
        {/* Hover glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 40px -12px ${accent}38` }}
        />

        {/* Hero image */}
        <div
          className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border bg-[#02090E]"
          style={{ borderColor: `${accent}26` }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            priority={false}
          />
          {/* Bottom fade for legibility on the CTA below */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#03161B]/80 via-[#03161B]/30 to-transparent"
          />
        </div>

        {/* CTA below image */}
        <RoomCTA label="Open Tool" color={accent} />
      </Link>
    </li>
  )
}

function RoomUnlimited({
  row,
  accessToken,
  image,
}: {
  row: SystemRow
  accessToken: string
  image?: { src: string; alt: string }
}) {
  return (
    <li>
      <Link
        href={row.href(accessToken)}
        className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-[#F5C16C]/30 p-3.5 shadow-[0_0_20px_-8px_rgba(245,193,108,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F5C16C]/45 sm:gap-4 sm:p-4 sm:shadow-none"
        style={{
          borderColor: `${G}33`,
          background: `linear-gradient(135deg, rgba(3,15,20,0.85) 0%, rgba(3,15,20,0.6) 100%)`,
        }}
      >
        {/* Subtle gold glow on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 40px -12px ${G}40` }}
        />

        {image && (
          <div
            className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border bg-[#02090E]"
            style={{ borderColor: `${G}26` }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#03161B]/80 via-[#03161B]/30 to-transparent"
            />
          </div>
        )}

        <RoomCTA label="Open Tool" color={G} />
      </Link>
    </li>
  )
}

function RoomLive({
  row,
  accessToken,
  qxlKey: _qxlKey,
  tier: _tier,
  image,
}: {
  row: SystemRow
  accessToken: string
  qxlKey: string
  tier: Tier
  image?: { src: string; alt: string }
}) {
  const accent = C

  return (
    <li>
      <Link
        href={row.href(accessToken)}
        className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-[#5BC0D8]/30 p-3.5 shadow-[0_0_20px_-8px_rgba(91,192,216,0.15)] transition-all duration-200 hover:-translate-y-0.5 sm:gap-4 sm:p-4 sm:shadow-none"
        style={{
          background: `linear-gradient(135deg, rgba(3,15,20,0.85) 0%, rgba(3,15,20,0.6) 100%)`,
        }}
      >
        {/* Hover glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 40px -12px ${accent}38` }}
        />

        {image && (
          <div
            className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border bg-[#02090E]"
            style={{ borderColor: `${accent}26` }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#03161B]/80 via-[#03161B]/30 to-transparent"
            />
          </div>
        )}

        <RoomCTA label="Open Tool" color={accent} />
      </Link>
    </li>
  )
}

function RoomCTA({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="relative mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-[#03161B]/55 px-3 py-1.5 text-[12px] font-medium ring-1 ring-[#5BC0D8]/12 transition-all duration-200 group-hover:border-[#5BC0D8]/45 group-hover:shadow-[0_0_14px_-4px_rgba(91,192,216,0.45)] sm:gap-2 sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-[13px]"
      style={{
        color: "#E8F4F7",
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Subtle inner highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/[0.06] to-transparent sm:rounded-t-xl"
      />
      <span className="relative tracking-tight">{label}</span>
      <MoveUpRight
        className="relative size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:size-4"
        strokeWidth={2.25}
        style={{ color }}
        aria-hidden
      />
    </div>
  )
}

/* ══════════════════════════ LEDGER CARD ════════════════════════════════════ */

// Tiers to show in comparison (exclude Personal)
const COMPARISON_TIERS: Tier[] = ["basic", "smart", "pro", "dominator"]

function LedgerCard({ activeTier }: { activeTier: Tier }) {
  return (
    <Card accent="duo" as="section">
      <div className="p-5 sm:p-6">
        <CardHead
          icon={Layers}
          tone="gold"
          eyebrow="All Plans"
          title="Daily"
          titleAccent="Limits"
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-separate border-spacing-y-2">
            <thead>
              <tr>
                {["Plan", "1m", "15s", "2 Candle"].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "pb-1.5 text-[9px] font-bold uppercase tracking-[0.30em]",
                      i === 0 ? "text-left pl-4" : "text-right pr-4",
                    )}
                    style={{ color: `${C2}65` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_TIERS.map(t => {
                const isActive = t === activeTier
                const a = TIER_ACCENT[t]
                return (
                  <tr
                    key={t}
                    className="align-middle"
                    style={{
                      background: isActive
                        ? `linear-gradient(90deg, ${a.from}14, ${a.from}08, transparent)`
                        : "rgba(2,9,14,0.40)",
                    }}
                  >
                    {/* Plan name */}
                    <td
                      className="rounded-l-xl border-y border-l py-3 pl-4"
                      style={{ borderColor: isActive ? `${a.from}30` : `${T}1E` }}
                    >
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={
                          isActive
                            ? { background: `linear-gradient(135deg, ${a.from}, ${a.to})`, color: a.fg, boxShadow: `0 0 12px -4px ${a.ring}` }
                            : { border: `1px solid ${T}30`, color: "#E8F4F7AA" }
                        }
                      >
                        {isActive && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-current opacity-75" />}
                        {TIER_LABEL[t]}
                      </span>
                    </td>

                    {/* Signal limits - 1m and 15s */}
                    {(["chart-to-signal", "chart-15sec-signal"] as SignalSystem[]).map((sys) => (
                      <td
                        key={sys}
                        className="border-y py-3 pr-4 text-right text-[13px] font-bold tabular-nums font-rocker"
                        style={{
                          borderColor: isActive ? `${a.from}30` : `${T}1E`,
                          color: isActive ? C : "#E8F4F7AA",
                        }}
                      >
                        {DAILY_LIMITS[t][sys]}
                      </td>
                    ))}

                    {/* 2 Candle Ahead limit — hidden for basic */}
                    <td
                      className="rounded-r-xl border-y border-r py-3 pr-4 text-right text-[12px] font-bold"
                      style={{
                        borderColor: isActive ? `${a.from}30` : `${T}1E`,
                        color: isActive ? EM : "#E8F4F7AA",
                      }}
                    >
                      {t === "basic" ? (
                        <span className="text-[#E8F4F7]/25">—</span>
                      ) : (
                        candle2LimitLabel(t)
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}
