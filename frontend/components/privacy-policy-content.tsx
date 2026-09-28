"use client"

import Link from "next/link"
import {
  CalendarDays,
  Database,
  Eye,
  FileWarning,
  GitBranch,
  Lock,
  MessageCircle,
  ScrollText,
  ShieldCheck,
  UserCog,
} from "lucide-react"

import { useLanguage } from "@/components/language-provider"

/* -------------------------------------------------------------------------- */
/*  Privacy Policy — full page content.                                       */
/*  Dark teal aesthetic that matches the rest of the site.                    */
/* -------------------------------------------------------------------------- */
export function PrivacyPolicyContent() {
  const { t } = useLanguage()

  // The seven numbered sections — driven by dictionary keys.
  const sections = [
    { icon: Database, key: "1" },
    { icon: Eye, key: "2" },
    { icon: Lock, key: "3" },
    { icon: GitBranch, key: "4" },
    { icon: UserCog, key: "5" },
    { icon: FileWarning, key: "6" },
    { icon: ScrollText, key: "7" },
  ] as const

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="relative isolate overflow-hidden pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        {/* Backdrop layers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(91,192,216,0.18),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(27,120,146,0.22),transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5BC0D8]/40 to-transparent"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 px-5 text-center sm:px-8">
          {/* Plaque */}
          <span className="inline-flex items-center gap-2 rounded-full border border-[#5BC0D8]/35 bg-gradient-to-b from-[#0A2530]/80 to-[#03161B]/80 px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.26em] text-[#5BC0D8] shadow-[inset_0_1px_0_rgba(125,227,255,0.18),0_8px_22px_-12px_rgba(91,192,216,0.45)] backdrop-blur-md">
            <ShieldCheck className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
            {t("privacy.badge")}
          </span>

          {/* Title */}
          <h1 className="font-display text-balance text-[32px] leading-[1.15] tracking-wide sm:text-[44px] lg:text-[56px]">
            <span className="text-[#E8F4F7]">{t("privacy.title.1")}</span>{" "}
            <span className="font-serif italic font-medium bg-gradient-to-r from-[#7DE3FF] via-[#5BC0D8] to-[#1B7892] bg-clip-text text-transparent">
              {t("privacy.title.2")}
            </span>
          </h1>

          {/* Diamond divider */}
          <div aria-hidden className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#5BC0D8]/55" />
            <span className="size-1.5 rotate-45 bg-[#5BC0D8] shadow-[0_0_10px_rgba(91,192,216,0.7)]" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#5BC0D8]/55" />
          </div>

          {/* Subtitle */}
          <p className="max-w-2xl text-pretty text-[15px] leading-relaxed text-[#E8F4F7]/72 sm:text-[16px]">
            {t("privacy.subtitle")}
          </p>

          {/* Last updated chip */}
          <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-[#1B7892]/40 bg-[#03161B]/60 px-3.5 py-1.5 text-[12px] text-[#E8F4F7]/70 backdrop-blur-sm">
            <CalendarDays className="size-3.5 text-[#5BC0D8]" strokeWidth={2.2} aria-hidden />
            <span className="font-semibold uppercase tracking-[0.14em] text-[#5BC0D8]">
              {t("privacy.lastUpdated")}
            </span>
            <span className="text-[#E8F4F7]/85">
              {t("privacy.lastUpdated.value")}
            </span>
          </div>
        </div>
      </section>

      {/* ───────────── Body ───────────── */}
      <section className="relative pb-24 sm:pb-28 lg:pb-32">
        <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
          {/* Legal disclosure card — the centerpiece, called out distinctly */}
          <article className="relative overflow-hidden rounded-2xl border border-[#5BC0D8]/40 bg-gradient-to-b from-[#04212A]/85 via-[#031C24]/85 to-[#02161D]/85 p-6 shadow-[0_14px_50px_-14px_rgba(91,192,216,0.5)] ring-1 ring-[#5BC0D8]/20 backdrop-blur-sm sm:p-8 lg:p-10">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#5BC0D8] to-transparent"
            />

            <div className="flex items-start gap-4 sm:gap-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#1B7892]/25 text-[#5BC0D8] ring-1 ring-inset ring-[#5BC0D8]/30 sm:size-14">
                <ShieldCheck className="size-5 sm:size-6" strokeWidth={2} aria-hidden />
              </span>
              <div className="flex flex-col gap-3">
                <h2 className="font-display text-xl tracking-wide text-[#E8F4F7] sm:text-2xl lg:text-[26px]">
                  {t("privacy.legal.title")}
                </h2>
                <p className="text-pretty text-[14.5px] leading-[1.75] text-[#E8F4F7]/80 sm:text-[15px]">
                  {t("privacy.legal.body")}
                </p>
              </div>
            </div>
          </article>

          {/* Numbered sections grid */}
          <div className="mt-10 flex flex-col gap-4 sm:mt-14 sm:gap-5">
            {sections.map((s, idx) => (
              <article
                key={s.key}
                className="group relative overflow-hidden rounded-2xl border border-[#1B7892]/30 bg-[#03161B]/65 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-[#5BC0D8]/45 sm:p-6 lg:p-7"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5BC0D8]/35 to-transparent"
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                  {/* Numbered icon column */}
                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-start sm:gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#1B7892]/20 text-[#5BC0D8] ring-1 ring-inset ring-[#5BC0D8]/25 sm:size-11">
                      <s.icon className="size-4 sm:size-[18px]" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5BC0D8]/70">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Content column */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="font-display text-lg tracking-wide text-[#E8F4F7] sm:text-xl">
                      {t(`privacy.section.${s.key}.title`)}
                    </h3>
                    <p className="text-pretty text-[14.5px] leading-[1.75] text-[#E8F4F7]/75 sm:text-[15px]">
                      {t(`privacy.section.${s.key}.body`)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Contact CTA panel */}
          <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-[#1B7892]/35 bg-gradient-to-br from-[#0A2530]/70 to-[#03161B]/70 p-6 backdrop-blur-sm sm:mt-14 sm:flex-row sm:items-center sm:gap-6 sm:p-7">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-lg tracking-wide text-[#E8F4F7] sm:text-xl">
                {t("privacy.contact.title")}
              </h3>
              <p className="text-[14px] text-[#E8F4F7]/70 sm:text-[14.5px]">
                {t("privacy.contact.body")}
              </p>
            </div>

            <Link
              href="https://t.me/Mushfiq2615"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-12 w-full shrink-0 items-center justify-center gap-2.5 rounded-xl border border-[#1B7892]/55 bg-[#03161B]/70 px-6 font-medium text-[#E8F4F7] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5BC0D8]/70 hover:bg-[#0A2530]/85 hover:shadow-[0_10px_28px_-10px_rgba(91,192,216,0.55)] active:translate-y-0 sm:w-auto"
            >
              <span className="relative flex size-4 items-center justify-center">
                <span
                  aria-hidden
                  className="absolute inline-flex size-full animate-ping rounded-full bg-[#5BC0D8]/55"
                />
                <MessageCircle
                  className="relative size-4 shrink-0 text-[#5BC0D8] transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"
                  strokeWidth={2.5}
                  aria-hidden
                />
              </span>
              <span className="text-[14.5px] transition-colors group-hover:text-[#5BC0D8] sm:text-[15px]">
                {t("privacy.contact.cta")}
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
