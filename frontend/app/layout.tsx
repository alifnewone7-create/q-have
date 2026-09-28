import type { Metadata, Viewport } from "next"
import {
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  IM_Fell_Double_Pica_SC,
  New_Rocker,
  Oswald,
  Quintessential,
  Roboto,
} from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { LanguageProvider } from "@/components/language-provider"
import { LanguageSelectPopup } from "@/components/language-popup"
import { PurchaseNotice } from "@/components/purchase-notice"
import { UpgradeNotice } from "@/components/upgrade-notice"
import { ConsoleSilencer } from "@/components/console-silencer"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

/**
 * Luxury body font — scoped to the Activate Account flow only.
 * IM Fell Double Pica SC is a refined, antique small-caps serif drawn from
 * John Fell's 17th-century type — gives the activation page a "membership
 * certificate" feel that pairs naturally with the gem / unlock motifs.
 * Only weight 400 + normal style are published on Google Fonts.
 */
const imFellPicaSc = IM_Fell_Double_Pica_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-im-fell",
  display: "swap",
})

const quintessential = Quintessential({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-quintessential",
  display: "swap",
})
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

/**
 * Google Roboto — used as the primary typeface on the Profile page.
 * Loads both upright and italic so `italic` utility classes pick up
 * the correct Roboto Italic cut rather than a synthesized slant.
 */
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-roboto",
  display: "swap",
})

/**
 * Google New Rocker — decorative blackletter-style display font.
 * Used selectively on the Profile page for headline accents, tier
 * labels, and large stat numerals to give the page a luxe, crested
 * "membership card" feel while body copy stays in clean sans.
 */
const newRocker = New_Rocker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-new-rocker",
  display: "swap",
})

/**
 * Google Oswald — primary typeface on the Profile page.
 * Loaded across all weights so utility classes and inline styles
 * pick up the right cut. Numerals stay on New Rocker for accent.
 */
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Quotex Live — Premium Signals & Live Charts",
  description:
    "Premium signals from Quotex OTC market live and live charts.",
  generator: "v0.app",
  // Branded share image used by social platforms (OpenGraph) and Twitter
  // when a Quotex Live link is unfurled. The asset is the official logo
  // (white "Quotex / LIVE" wordmark + candlestick emblem on black) saved
  // at /public/og-image.png so it ships with the static build.
  openGraph: {
    title: "Quotex Live — Premium Signals & Live Charts",
    description:
      "Premium signals from Quotex OTC market live and live charts.",
    images: [
      {
        url: "/og-image.png",
        alt: "Quotex Live",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quotex Live — Premium Signals & Live Charts",
    description:
      "Premium signals from Quotex OTC market live and live charts.",
    images: ["/og-image.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${imFellPicaSc.variable} ${quintessential.variable} ${cormorant.variable} ${roboto.variable} ${newRocker.variable} ${oswald.variable} bg-background`}
    >
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ConsoleSilencer />
        <LanguageProvider>
          {children}
          <LanguageSelectPopup />
          <PurchaseNotice />
          <UpgradeNotice />
        </LanguageProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
