"use client"

/**
 * Resolve the URL access token (the `[code]` segment on every protected
 * route) into a full session — the linked QXL key, the holder, the tier
 * and the bound deviceId.
 *
 * Triple gate
 * -----------
 * 1. Format check          — `qxl-` + 16+ hex chars
 * 2. Browser binding check — localStorage must hold the same token
 * 3. Firebase truth check  — `/access_tokens/{token}` must exist AND
 *                            its `deviceId` must equal localStorage's
 *
 * Failing any gate produces an `invalid` state that the SignalShell
 * uses to redirect the visitor back to `/activate-account`.
 */

import { useEffect, useState } from "react"
import { onValue, ref } from "firebase/database"

import { getDb } from "@/lib/firebase"
import { asTier, type Tier } from "@/lib/tiers"
import { isValidTokenFormat, readClientSession } from "@/lib/access-tokens"

export type AccessSession =
  | { state: "loading" }
  | {
      state: "invalid"
      reason: "format" | "not-found" | "wrong-device" | "error"
    }
  | {
      state: "ok"
      token: string
      qxlKey: string
      tier: Tier
      holder: { fullName?: string; username?: string } | null
      deviceId: string
    }

export function useAccessSession(
  rawToken: string | null | undefined,
): AccessSession {
  const [session, setSession] = useState<AccessSession>({ state: "loading" })

  useEffect(() => {
    const token = (rawToken ?? "").trim().toLowerCase()

    // 1) Format gate.
    if (!token || !isValidTokenFormat(token)) {
      setSession({ state: "invalid", reason: "format" })
      return
    }

    // 2) Browser-binding gate. If this browser doesn't have the token
    //    in its localStorage, the visitor must have followed a shared
    //    link — refuse access without even hitting Firebase.
    const local = readClientSession()
    if (!local || local.token.toLowerCase() !== token) {
      setSession({ state: "invalid", reason: "wrong-device" })
      return
    }

    // 3) Firebase truth gate. We subscribe rather than read once so
    //    if an admin revokes the token we drop access live.
    const r = ref(getDb(), `access_tokens/${token}`)
    const unsub = onValue(
      r,
      (snap) => {
        if (!snap.exists()) {
          setSession({ state: "invalid", reason: "not-found" })
          return
        }
        const record = snap.val() as {
          qxlKey?: string
          deviceId?: string
          tier?: string
          fullName?: string
          username?: string
        }
        if (!record.deviceId || record.deviceId !== local.deviceId) {
          setSession({ state: "invalid", reason: "wrong-device" })
          return
        }
        setSession({
          state: "ok",
          token,
          qxlKey: record.qxlKey ?? "",
          tier: asTier(record.tier),
          holder: {
            fullName: record.fullName,
            username: record.username,
          },
          deviceId: record.deviceId,
        })
      },
      (err) => {
        console.log("[v0] [access-session] lookup error:", err)
        setSession({ state: "invalid", reason: "error" })
      },
    )
    return () => unsub()
  }, [rawToken])

  return session
}
