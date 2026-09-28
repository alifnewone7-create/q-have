"use client"

/**
 * Minimal brand loader — a small spinner only, no logo image.
 *
 * Two modes:
 *  - `variant="overlay"` — fixed full-screen overlay with the brand
 *    backdrop, used while redirecting from /activate-account.
 *  - `variant="inline"` — fits into a normal page section, used by the
 *    profile shell while verifying the saved session.
 */

import { cn } from "@/lib/utils"

type BrandLoaderProps = {
  variant?: "overlay" | "inline"
  className?: string
}

export function BrandLoader({ variant = "overlay", className }: BrandLoaderProps) {
  const wrapperClass =
    variant === "overlay"
      ? "fixed inset-0 z-[100] flex items-center justify-center bg-[#03161B]"
      : "flex min-h-[55vh] w-full items-center justify-center"

  return (
    <div
      className={cn(wrapperClass, className)}
      role="status"
      aria-label="Loading"
    >
      <span
        aria-hidden
        className="block size-8 animate-spin rounded-full border-2 border-[#5BC0D8]/20 border-t-[#5BC0D8]"
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}
