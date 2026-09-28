"use client"

/**
 * Modal popups used by `GenerateSignalPanel`.
 *
 *   - `WaitWarningPopup`: surfaced when the user taps "Generate Live
 *     Signal" before the current candle has enough seconds left.
 *
 *   - `SignalResultPopup`: success path. Premium minimalistic card —
 *     animated direction badge, shine-clipped headline, hair-thin
 *     gradient dividers, monospace detail rows. The close button starts
 *     as a 3-second countdown displayed *inside* a button shape, then
 *     turns into a real "Close" button. A secondary "How To Take Trade"
 *     button (plain font) opens the trade-guide popup.
 *
 *   - `HowToTakeTradePopup`: step-by-step trade instructions with an
 *     EN ↔ BD language switch (US flag / Bangladesh flag). Steps differ
 *     for the 1-minute system vs the 15-second system.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CircleSlash,
  Clock,
  Languages,
  ListChecks,
  Percent,
  Repeat2,
  Sparkles,
  X,
} from "lucide-react"

import type { SignalDirection, SignalResponse } from "@/lib/signals-client"
import type { SignalSystem } from "@/lib/tiers"
import { matchAllowedMarket } from "@/lib/allowed-markets"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Wait-for-next-candle warning                                              */
/* -------------------------------------------------------------------------- */

type WaitWarningProps = {
  open: boolean
  minRemaining: number
  onClose: () => void
}

export function WaitWarningPopup({ open, minRemaining, onClose }: WaitWarningProps) {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wait-warning-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-amber-400/40 bg-[#03161B]/95 p-5 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] sm:p-6"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(251, 191, 36, 0.18), transparent 60%), #03161B",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
        />
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/15 text-amber-300">
          <AlertTriangle className="size-5 glow-soft" aria-hidden strokeWidth={2.3} />
        </div>
        <h2
          id="wait-warning-title"
          className="font-display text-[17px] tracking-wide text-[#E8F4F7] sm:text-[19px]"
        >
          <span className="font-normal">Wait for the</span>{" "}
          <span className="italic text-amber-300">next candle</span>
        </h2>
        <p className="mt-2 text-pretty text-[12.5px] leading-relaxed text-[#E8F4F7]/75 sm:text-[13.5px]">
          {`Live signals require at least ${minRemaining}s remaining on the current candle. Please wait for the running candle to close before tapping generate.`}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl border border-amber-400/45 bg-amber-400/10 text-[13.5px] font-semibold tracking-[0.01em] text-amber-200 transition-colors hover:bg-amber-400/20 hover:text-amber-100"
        >
          Yes, understand
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Signal result popup                                                       */
/* -------------------------------------------------------------------------- */

type SignalResultProps = {
  open: boolean
  result: SignalResponse | null
  period: number
  system: SignalSystem
  onClose: () => void
}

export function SignalResultPopup({
  open,
  result,
  period,
  system,
  onClose,
}: SignalResultProps) {
  const [countdown, setCountdown] = useState(3)
  const [howToOpen, setHowToOpen] = useState(false)

  // Freeze the entry time at popup-open.
  const frozenEntryRef = useRef<number | null>(null)
  const entryAt = useMemo(() => {
    if (!open || !result) {
      frozenEntryRef.current = null
      return 0
    }
    if (frozenEntryRef.current == null) {
      frozenEntryRef.current = nextCandleStart(period)
    }
    return frozenEntryRef.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, result])

  // 3-second countdown before the close button becomes interactive.
  useEffect(() => {
    if (!open) {
      setCountdown(3)
      setHowToOpen(false)
      return
    }
    setCountdown(3)
    const started = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const elapsed = (t - started) / 1000
      const remaining = Math.max(0, 3 - elapsed)
      setCountdown(remaining)
      if (remaining > 0) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open])

  if (!open || !result) return null

  const direction = result.direction
  const entryTimeLabel = formatTime(entryAt)
  const directionLabel = directionToUpDown(direction)
  const durationLabel = formatDuration(period)
  const showEntryTime = period >= 60
  const isCall = direction === "CALL"
  const isPut = direction === "PUT"

  const tones = isCall
    ? {
        glow: "rgba(52, 211, 153, 0.20)",
        ring: "border-emerald-400/35",
        accent: "text-emerald-300",
        accentSoft: "text-emerald-200/75",
        iconCls:
          "text-emerald-300 bg-emerald-400/12 border-emerald-400/35 shadow-[0_0_24px_-6px_rgba(52,211,153,0.55)]",
        ringDot: "bg-emerald-400",
      }
    : isPut
      ? {
          glow: "rgba(248, 113, 113, 0.20)",
          ring: "border-rose-400/35",
          accent: "text-rose-300",
          accentSoft: "text-rose-200/75",
          iconCls:
            "text-rose-300 bg-rose-400/12 border-rose-400/35 shadow-[0_0_24px_-6px_rgba(248,113,113,0.55)]",
          ringDot: "bg-rose-400",
        }
      : {
          glow: "rgba(125, 227, 255, 0.18)",
          ring: "border-[#1B7892]/40",
          accent: "text-[#7DE3FF]",
          accentSoft: "text-[#7DE3FF]/75",
          iconCls:
            "text-[#7DE3FF] bg-[#7DE3FF]/12 border-[#5BC0D8]/35 shadow-[0_0_24px_-6px_rgba(91,192,216,0.5)]",
          ringDot: "bg-[#7DE3FF]",
        }

  const DirIcon = isCall ? ArrowUpRight : isPut ? ArrowDownRight : CircleSlash
  const ready = countdown <= 0
  const countdownDisplay = Math.ceil(countdown)
  const market = formatMarket(result.asset)

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signal-result-title"
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6"
      >
        <div
          className={cn(
            "relative my-auto w-full max-w-md overflow-hidden rounded-[20px] border bg-[#03161B]/95 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-7",
            tones.ring,
          )}
          style={{
            background: `radial-gradient(ellipse 90% 65% at 50% 0%, ${tones.glow}, transparent 65%), #03161B`,
          }}
        >
          {/* Hairline highlight at top */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
          {/* Subtle inner ring for depth */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/[0.04]"
          />

          {/* Eyebrow row — Live signal pulse */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-[#E8F4F7]/65 sm:text-[10.5px]">
              <span className="relative inline-flex size-1.5">
                <span
                  className={cn(
                    "absolute inset-0 rounded-full opacity-70 live-dot",
                    tones.ringDot,
                  )}
                />
                <span
                  className={cn("relative inline-flex size-1.5 rounded-full", tones.ringDot)}
                />
              </span>
              Live Signal
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-[#E8F4F7]/40 sm:text-[10px]">
              {durationLabel}
            </span>
          </div>

          {/* Hero row — direction badge + market */}
          <div className="mt-4 flex items-center gap-3.5 sm:gap-4">
            <span
              className={cn(
                "relative flex size-14 items-center justify-center rounded-2xl border sm:size-16",
                tones.iconCls,
              )}
            >
              <DirIcon
                className="size-6 icon-pulse glow-soft sm:size-7"
                strokeWidth={2.4}
                aria-hidden
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <h2
                id="signal-result-title"
                className="truncate font-display text-[20px] leading-tight tracking-wide sm:text-[24px]"
              >
                <span className="text-shine-teal">{market.base}</span>
                {market.suffix && (
                  <>
                    {" "}
                    <span className={cn("italic", tones.accentSoft)}>{market.suffix}</span>
                  </>
                )}
              </h2>
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] sm:text-[11px]",
                  isCall &&
                    "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
                  isPut && "border-rose-400/40 bg-rose-400/10 text-rose-200",
                  !isCall &&
                    !isPut &&
                    "border-[#5BC0D8]/40 bg-[#5BC0D8]/10 text-[#7DE3FF]",
                )}
              >
                <DirIcon className="size-3" strokeWidth={2.6} aria-hidden />
                {directionLabel}
              </span>
            </div>
          </div>

          {/* Hair divider */}
          <span
            aria-hidden
            className="my-4 block h-px w-full bg-gradient-to-r from-transparent via-[#1B7892]/45 to-transparent sm:my-5"
          />

          {/* Trade details — 2-up grid */}
          <dl className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {showEntryTime && (
              <DetailRow label="Entry Time" value={entryTimeLabel} mono valueClass={tones.accent} />
            )}
          <DetailRow label="Direction" value={directionLabel} valueClass={tones.accent} />
          {!showEntryTime && (
            <DetailRow
              label="Market"
              value={market.suffix ? `${market.base} ${market.suffix}` : market.base}
            />
          )}
          {showEntryTime && (
            <DetailRow
              label="Market"
              value={market.suffix ? `${market.base} ${market.suffix}` : market.base}
            />
          )}
            <DetailRow label="Duration" value={durationLabel} />
          </dl>

          {/* Trade-in next candle banner */}
          <p className="mt-4 text-center font-mono text-[10.5px] uppercase tracking-[0.28em] text-[#E8F4F7]/70 sm:text-[11.5px]">
            Trade in <span className={cn("normal-case italic tracking-wide", tones.accent)}>next candle</span>
          </p>

          {/* Trade rules footer */}
          <div className="mt-4 flex flex-col gap-1.5 rounded-xl border border-[#1B7892]/30 bg-[#03171E]/55 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-5">
            <span className="inline-flex items-center justify-center gap-1.5 text-[11px] text-[#E8F4F7]/85 sm:text-[12px]">
              <Percent
                className="size-3.5 shrink-0 text-[#7DE3FF] icon-drift"
                aria-hidden
                strokeWidth={2.4}
              />
              <span>
                Use <span className="font-semibold text-[#E8F4F7]">1/2% capital</span> per trade
              </span>
            </span>
            <span aria-hidden className="hidden h-3 w-px bg-[#1B7892]/40 sm:block" />
            <span className="inline-flex items-center justify-center gap-1.5 text-[11px] text-[#E8F4F7]/85 sm:text-[12px]">
              <Repeat2
                className="size-3.5 shrink-0 text-[#7DE3FF] icon-drift"
                aria-hidden
                strokeWidth={2.4}
              />
              <span>
                <span className="font-semibold text-[#E8F4F7]">1 MtG</span> must
              </span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setHowToOpen(true)}
              className="group relative inline-flex h-11 w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-[#5BC0D8]/40 bg-[#5BC0D8]/10 px-3 text-[13px] font-medium tracking-[0.01em] text-[#7DE3FF] transition-colors hover:bg-[#5BC0D8]/20 sm:text-[13.5px]"
            >
              <BookOpen
                className="size-4 transition-transform duration-300 group-hover:-rotate-6"
                aria-hidden
                strokeWidth={2.3}
              />
              How To Take Trade
            </button>

            <button
              type="button"
              autoFocus={ready}
              onClick={ready ? onClose : undefined}
              disabled={!ready}
              aria-live="polite"
              className={cn(
                "relative inline-flex h-11 w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl border text-[13.5px] font-semibold tracking-[0.02em] transition-all disabled:cursor-not-allowed",
                isCall &&
                  "border-emerald-400/45 bg-emerald-400/10 text-emerald-200 enabled:hover:bg-emerald-400/20",
                isPut &&
                  "border-rose-400/45 bg-rose-400/10 text-rose-200 enabled:hover:bg-rose-400/20",
                !isCall &&
                  !isPut &&
                  "border-[#5BC0D8]/45 bg-[#5BC0D8]/10 text-[#7DE3FF] enabled:hover:bg-[#5BC0D8]/20",
              )}
            >
              {ready ? (
                <>
                  <X className="size-4" aria-hidden strokeWidth={2.4} />
                  Close
                </>
              ) : (
                <>
                  <Clock
                    className="size-4 opacity-90 icon-tilt"
                    aria-hidden
                    strokeWidth={2.3}
                  />
                  <span className="font-mono tabular-nums">{countdownDisplay}s</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <HowToTakeTradePopup
        open={howToOpen}
        system={system}
        onClose={() => setHowToOpen(false)}
      />
    </>
  )
}

function DetailRow({
  label,
  value,
  valueClass,
  mono = true,
}: {
  label: string
  value: string
  valueClass?: string
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border border-[#1B7892]/30 bg-[#03171E]/55 px-3 py-2.5">
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-[#E8F4F7]/55 sm:text-[10px] sm:tracking-[0.28em]">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 truncate text-[13px] tabular-nums text-[#E8F4F7] sm:text-[14.5px]",
          mono ? "font-mono" : "font-display tracking-wide",
          valueClass,
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  How-To-Take-Trade popup                                                   */
/* -------------------------------------------------------------------------- */

type HowToProps = {
  open: boolean
  system: SignalSystem
  onClose: () => void
}

type Lang = "en" | "bn"

type Step = { en: string; bn: string }

const STEPS_1M: Step[] = [
  {
    en: "Select 1 Minute Timeframe.",
    bn: "১ মিনিট টাইমফ্রেম সিলেক্ট করুন।",
  },
  {
    en: "Select Time — when your entry time arrives, take the entry at that exact time.",
    bn: "টাইম সিলেক্ট করুন — আপনার এন্ট্রি টাইম এলে ঠিক ওই সময়ে এন্ট্রি নিন।",
  },
  {
    en: "Take the trade in the direction the signal tells you to.",
    bn: "যে দিকে ট্রেড নিতে বলা হবে ঠিক সেই দিকেই ট্রেড নিন।",
  },
]

const STEPS_15S: Step[] = [
  {
    en: "Select 15 Second Timeframe.",
    bn: "১৫ সেকেন্ড টাইমফ্রেম সিলেক্ট করুন।",
  },
  {
    en: "Select Timer — 15 Second. When your entry time arrives, take the entry at that exact time.",
    bn: "টাইমার সিলেক্ট করুন — ১৫ সেকেন্ড। আপনার এন্ট্রি টাইম এলে ঠিক ওই সময়ে এন্ট্রি নিন।",
  },
  {
    en: "Take the trade in the direction the signal tells you to.",
    bn: "যে দিকে ট্রেড নিতে বলা হবে ঠিক সেই দিকেই ট্রেড নিন।",
  },
]

const COPY = {
  en: {
    eyebrow: "Trade Guide",
    title: "How To Take Trade",
    capital: "Use 1/2% capital per trade",
    mtg: "1 MtG must",
    ok: "OK, got it",
  },
  bn: {
    eyebrow: "ট্রেড গাইড",
    title: "ট্রেড যেভাবে নিবেন",
    capital: "প্রতিটি ট্রেডে ১/২% ক্যাপিটাল ব্যবহার করুন",
    mtg: "১ MtG অবশ্যই",
    ok: "ঠিক আছে",
  },
} as const

function HowToTakeTradePopup({ open, system, onClose }: HowToProps) {
  const [lang, setLang] = useState<Lang>("en")

  useEffect(() => {
    if (!open) setLang("en")
  }, [open])

  if (!open) return null

  const steps = system === "chart-15sec-signal" ? STEPS_15S : STEPS_1M
  const copy = COPY[lang]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-trade-title"
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/80 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6"
    >
      <div
        className="relative my-auto w-full max-w-md overflow-hidden rounded-[20px] border border-[#5BC0D8]/35 bg-[#03161B]/95 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-7"
        style={{
          background:
            "radial-gradient(ellipse 90% 65% at 50% 0%, rgba(125, 227, 255, 0.16), transparent 65%), #03161B",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7DE3FF]/55 to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/[0.04]"
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#5BC0D8]/40 bg-[#5BC0D8]/12 text-[#7DE3FF] shadow-[0_0_24px_-6px_rgba(91,192,216,0.55)] sm:size-13">
              <ListChecks
                className="size-5 icon-pulse glow-soft sm:size-[22px]"
                aria-hidden
                strokeWidth={2.3}
              />
              <Sparkles
                className="absolute -right-1 -top-1 size-3 text-[#7DE3FF]/85 icon-drift"
                aria-hidden
                strokeWidth={2.4}
              />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#7DE3FF]/85 sm:text-[10.5px]">
                {copy.eyebrow}
              </span>
              <h2
                id="how-to-trade-title"
                className="truncate font-display text-[19px] leading-tight tracking-wide sm:text-[22px]"
              >
                <span className="text-shine-teal-accent">{copy.title}</span>
              </h2>
            </div>
          </div>

          <LangSwitch lang={lang} onChange={setLang} />
        </div>

        {/* Hair divider */}
        <span
          aria-hidden
          className="my-4 block h-px w-full bg-gradient-to-r from-transparent via-[#1B7892]/45 to-transparent sm:my-5"
        />

        {/* Steps */}
        <ol className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <li
              key={i}
              className="group flex items-start gap-3 rounded-xl border border-[#1B7892]/30 bg-[#03171E]/55 px-3 py-2.5 transition-colors hover:border-[#5BC0D8]/40"
            >
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg border border-[#5BC0D8]/40 bg-[#5BC0D8]/10 font-mono text-[11.5px] font-semibold text-[#7DE3FF] transition-colors group-hover:bg-[#5BC0D8]/20">
                {i + 1}
              </span>
              <p className="text-pretty text-[12.5px] leading-relaxed text-[#E8F4F7]/90 sm:text-[13.5px]">
                {lang === "en" ? step.en : step.bn}
              </p>
            </li>
          ))}
        </ol>

        {/* Footer rules */}
        <div className="mt-4 flex flex-col gap-1.5 rounded-xl border border-[#1B7892]/30 bg-[#03171E]/55 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-5">
          <span className="inline-flex items-center justify-center gap-1.5 text-[11.5px] text-[#E8F4F7]/85 sm:text-[12px]">
            <Repeat2
              className="size-3.5 shrink-0 text-[#7DE3FF] icon-drift"
              aria-hidden
              strokeWidth={2.4}
            />
            <span className="font-medium text-[#E8F4F7]">{copy.mtg}</span>
          </span>
          <span aria-hidden className="hidden h-3 w-px bg-[#1B7892]/40 sm:block" />
          <span className="inline-flex items-center justify-center gap-1.5 text-[11.5px] text-[#E8F4F7]/85 sm:text-[12px]">
            <Percent
              className="size-3.5 shrink-0 text-[#7DE3FF] icon-drift"
              aria-hidden
              strokeWidth={2.4}
            />
            <span>{copy.capital}</span>
          </span>
        </div>

        {/* OK */}
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#5BC0D8]/45 bg-[#5BC0D8]/10 text-[13.5px] font-semibold tracking-[0.02em] text-[#7DE3FF] transition-colors hover:bg-[#5BC0D8]/20"
        >
          {copy.ok}
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Language switch (US flag ↔ BD flag)                                       */
/* -------------------------------------------------------------------------- */

function LangSwitch({
  lang,
  onChange,
}: {
  lang: Lang
  onChange: (l: Lang) => void
}) {
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#1B7892]/40 bg-[#03171E]/65 p-1"
    >
      <Languages
        className="ml-1 size-3 text-[#7DE3FF]/70"
        aria-hidden
        strokeWidth={2.4}
      />
      <button
        type="button"
        onClick={() => onChange("en")}
        aria-pressed={lang === "en"}
        aria-label="English"
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded-full px-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] transition-colors",
          lang === "en"
            ? "bg-[#5BC0D8]/15 text-[#7DE3FF] ring-1 ring-inset ring-[#5BC0D8]/45"
            : "text-[#E8F4F7]/55 hover:text-[#E8F4F7]/85",
        )}
      >
        <UsFlag className="size-3.5" />
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange("bn")}
        aria-pressed={lang === "bn"}
        aria-label="Bangla"
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded-full px-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] transition-colors",
          lang === "bn"
            ? "bg-[#5BC0D8]/15 text-[#7DE3FF] ring-1 ring-inset ring-[#5BC0D8]/45"
            : "text-[#E8F4F7]/55 hover:text-[#E8F4F7]/85",
        )}
      >
        <BdFlag className="size-3.5" />
        BD
      </button>
    </div>
  )
}

function UsFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 14"
      className={cn("shrink-0 overflow-hidden rounded-[2px]", className)}
      aria-hidden
    >
      <rect width="20" height="14" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11, 13].map((y) => (
        <rect key={y} y={y} width="20" height="1" fill="#FFFFFF" />
      ))}
      <rect width="9" height="7" fill="#3C3B6E" />
    </svg>
  )
}

function BdFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 14"
      className={cn("shrink-0 overflow-hidden rounded-[2px]", className)}
      aria-hidden
    >
      <rect width="20" height="14" fill="#006A4E" />
      <circle cx="9" cy="7" r="3.6" fill="#F42A41" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function nextCandleStart(period: number): number {
  const nowSec = Math.floor(Date.now() / 1000)
  const next = Math.ceil((nowSec + 1) / period) * period
  return next
}

function formatTime(unixSec: number): string {
  const d = new Date(unixSec * 1000)
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  const ss = String(d.getSeconds()).padStart(2, "0")
  return `${hh}:${mm}:${ss}`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} second`
  const m = Math.round(seconds / 60)
  return m === 1 ? "1 minute" : `${m} minutes`
}

function directionToUpDown(d: SignalDirection): string {
  if (d === "CALL") return "UP"
  if (d === "PUT") return "DOWN"
  return "NEUTRAL"
}

/**
 * Format a backend symbol into a clean display label + "(OTC)" suffix.
 *
 * The backend is inconsistent: sometimes it sends the symbol with the
 * `_otc` suffix (e.g. `EURUSD_otc`) and sometimes the bare ticker
 * (e.g. `EURUSD`). This app only ever issues signals on OTC markets, so
 * we always render the "(OTC)" tag — the question is only how to derive
 * a user-friendly *base* (e.g. "EUR/USD" or "Bitcoin") from whatever
 * the backend returned.
 *
 * Strategy:
 *   1. Strip a trailing `_otc` (case-insensitive) from the symbol.
 *   2. Try to resolve it against the allow-list (with `_otc` re-appended
 *      so `matchAllowedMarket`'s OTC-gate is satisfied) to get a curated
 *      label like "EUR/USD (OTC)" or "Bitcoin (OTC)".
 *   3. If found, peel "(OTC)" off the curated label and use the rest as
 *      the base.
 *   4. Otherwise, fall back to inserting a `/` between two 3-letter halves
 *      of a 6-char forex ticker, or just upper-case the raw symbol.
 */
function formatMarket(symbol: string): { base: string; suffix: string } {
  if (!symbol) return { base: "—", suffix: "" }
  const stripped = symbol.replace(/_otc$/i, "")
  const lookupSymbol = symbol.toLowerCase().endsWith("_otc")
    ? symbol
    : `${stripped}_otc`
  const entry = matchAllowedMarket(lookupSymbol)
  if (entry) {
    const base = entry.label.replace(/\s*\(OTC\)\s*$/i, "").trim()
    return { base, suffix: "(OTC)" }
  }
  // Fallback: prettify a bare 6-letter forex ticker like "EURUSD" -> "EUR/USD".
  if (/^[A-Za-z]{6}$/.test(stripped)) {
    const upper = stripped.toUpperCase()
    return { base: `${upper.slice(0, 3)}/${upper.slice(3)}`, suffix: "(OTC)" }
  }
  return { base: stripped.toUpperCase(), suffix: "(OTC)" }
}
