"use client"

import { useEffect, useState } from "react"
import { Check, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import { LANGUAGES, type Language } from "@/lib/i18n/dictionary"
import { cn } from "@/lib/utils"

/**
 * LanguageSelectPopup
 * --------------------
 * Shows a one-time modal on the user's first visit that asks them to choose
 * their preferred language. Once selected, the choice is persisted via
 * LanguageProvider and the modal won't reappear on future visits.
 */
export function LanguageSelectPopup() {
  const { isSelected, ready, setLanguage, t } = useLanguage()
  // Independently track the user's tentative selection inside the dialog.
  const [pending, setPending] = useState<Language>("en")
  const [open, setOpen] = useState(false)

  // Open the popup only after we've confirmed (post-hydration) that no
  // language preference is stored yet.
  useEffect(() => {
    if (ready && !isSelected) setOpen(true)
  }, [ready, isSelected])

  const handleConfirm = () => {
    setLanguage(pending)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      // Block dismissing without making a choice — user must tap a language + Continue.
      onOpenChange={() => {
        /* no-op — confirm-only flow */
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-[#1B7892]/30 bg-gradient-to-br from-[#03161B] via-[#082935] to-[#03161B] p-0 text-[#E8F4F7] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] sm:max-w-md"
      >
        {/* Decorative top accent line */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5BC0D8]/70 to-transparent"
        />
        {/* Soft top-left teal glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #1B7892 0%, transparent 70%)" }}
        />
        {/* Soft bottom-right cyan glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #5BC0D8 0%, transparent 70%)" }}
        />

        <div className="relative px-7 pb-7 pt-9 sm:px-8 sm:pt-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-xl border border-[#1B7892]/40 bg-[#1B7892]/15 text-[#5BC0D8] shadow-inner shadow-[#5BC0D8]/10">
              <Globe className="size-4" strokeWidth={2.25} />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#5BC0D8]/80">
              {t("lang.popup.eyebrow")}
            </span>
          </div>

          {/* Title */}
          <DialogTitle className="font-display mt-4 text-balance text-2xl leading-tight tracking-wide text-[#E8F4F7] sm:text-[1.65rem]">
            {t("lang.popup.title")}
          </DialogTitle>

          {/* Subtitle */}
          <DialogDescription className="mt-2.5 text-pretty text-[13.5px] leading-relaxed text-[#E8F4F7]/65">
            {t("lang.popup.subtitle")}
          </DialogDescription>

          {/* Options */}
          <div className="mt-7 flex flex-col gap-3">
            {LANGUAGES.map((lang) => {
              const active = pending === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setPending(lang.code)}
                  className={cn(
                    "group relative flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
                    active
                      ? "border-[#5BC0D8]/60 bg-gradient-to-r from-[#1B7892]/22 via-[#1B7892]/12 to-[#03161B]/10 shadow-[0_0_24px_-6px_rgba(91,192,216,0.45)]"
                      : "border-[#1B7892]/22 bg-[#03161B]/55 hover:border-[#5BC0D8]/45 hover:bg-[#1B7892]/12",
                  )}
                  aria-pressed={active}
                >
                  {/* Flag */}
                  <span
                    className={cn(
                      "relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 transition-all",
                      active ? "ring-[#5BC0D8]/60" : "ring-[#1B7892]/30 group-hover:ring-[#5BC0D8]/40",
                    )}
                  >
                    <img
                      src={`https://flagcdn.com/w80/${lang.flag}.png`}
                      alt=""
                      width={44}
                      height={44}
                      className="size-full object-cover"
                    />
                  </span>

                  {/* Labels */}
                  <span className="flex flex-1 flex-col leading-tight">
                    <span className="text-[15px] font-semibold text-[#E8F4F7]">
                      {lang.native}
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#E8F4F7]/55">
                      {lang.label}
                    </span>
                  </span>

                  {/* Checkmark */}
                  <span
                    className={cn(
                      "inline-flex size-7 shrink-0 items-center justify-center rounded-full border transition-all",
                      active
                        ? "border-[#5BC0D8] bg-[#5BC0D8] text-[#03161B] shadow-md shadow-[#5BC0D8]/40"
                        : "border-[#1B7892]/35 bg-transparent text-transparent group-hover:border-[#5BC0D8]/50",
                    )}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>

          {/* Confirm */}
          <Button
            type="button"
            onClick={handleConfirm}
            size="lg"
            className="mt-7 h-12 w-full rounded-xl bg-gradient-to-br from-[#5BC0D8] via-[#2DA9C7] to-[#1B7892] text-base font-semibold text-[#03161B] shadow-[0_8px_28px_-6px_rgba(91,192,216,0.55)] transition-all hover:brightness-110 hover:shadow-[0_10px_36px_-6px_rgba(91,192,216,0.7)]"
          >
            {t("lang.popup.continue")}
          </Button>

          {/* Footnote */}
          <p className="mt-4 text-center text-[11px] text-[#E8F4F7]/45">
            {t("lang.popup.changeLater")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
