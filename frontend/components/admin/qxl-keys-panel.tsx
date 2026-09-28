"use client"

/**
 * QxlKeysPanel
 * ------------
 * Lets the admin:
 *   • generate a fresh QXL key for a chosen tier with a chosen reuse
 *     policy (one-time / no-limit / limited-N).
 *   • see every key that exists, newest first, with status, type,
 *     usage counter, and metadata.
 *   • copy a key to clipboard or delete it.
 *
 * Listening is real-time via `onValue` so multiple admin tabs stay
 * in sync automatically.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { onValue, ref, remove, set } from "firebase/database"
import {
  Check,
  Copy,
  Infinity as InfinityIcon,
  KeyRound,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users as UsersIcon,
  Wand2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  KEY_TYPE_LABEL,
  TIER_LABEL,
  type KeyType,
  type QxlKey,
  type Tier,
} from "@/lib/admin-types"
import { getDb } from "@/lib/firebase"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | "unused" | "used"

/** Per-tier QXL key prefix. The full key has the form QXL-<TIER>-XXXX-XXXX. */
const TIER_KEY_PREFIX: Record<Tier, string> = {
  basic: "BASIC",
  smart: "SMART",
  pro: "PRO",
  dominator: "DMTR",
  personal: "PRL",
}

/** Generate a tier-stamped key like "QXL-PRO-AB12-CD34". */
function generateKey(tier: Tier): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const block = (n: number) =>
    Array.from(
      { length: n },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("")
  return `QXL-${TIER_KEY_PREFIX[tier]}-${block(4)}-${block(4)}`
}

export function QxlKeysPanel() {
  const [keys, setKeys] = useState<QxlKey[]>([])
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<Tier>("basic")
  const [keyType, setKeyType] = useState<KeyType>("one_time")
  const [userLimit, setUserLimit] = useState("5")
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Two-step confirmation flow for "Delete all keys". The bulk delete
  // is destructive and irreversible, so we never wire it to a single
  // ``window.confirm`` — the admin must explicitly progress from
  // ``"first"`` → ``"second"`` → final action. Closing the modal at
  // any point fully resets back to ``null``. See ``handleDeleteAll``.
  const [bulkConfirm, setBulkConfirm] = useState<null | "first" | "second">(
    null,
  )
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const bulkConfirmButtonRef = useRef<HTMLButtonElement | null>(null)

  // Subscribe to /qxl_keys.
  useEffect(() => {
    const r = ref(getDb(), "qxl_keys")
    const unsub = onValue(
      r,
      (snap) => {
        const value = snap.val() as Record<string, QxlKey> | null
        const list: QxlKey[] = value
          ? Object.entries(value).map(([id, v]) => ({ ...v, id }))
          : []
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        setKeys(list)
        setLoading(false)
      },
      (err) => {
        console.log("[v0] qxl_keys listener error:", err)
        setError("Could not load keys. Check Firebase rules / network.")
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return keys.filter((k) => {
      if (statusFilter !== "all" && k.status !== statusFilter) return false
      if (!q) return true
      return (
        k.key.toLowerCase().includes(q) ||
        k.tier.toLowerCase().includes(q) ||
        (k.usedBy?.username ?? "").toLowerCase().includes(q) ||
        (k.usedBy?.fullName ?? "").toLowerCase().includes(q)
      )
    })
  }, [keys, search, statusFilter])

  const stats = useMemo(() => {
    let unused = 0
    let used = 0
    for (const k of keys) {
      if (k.status === "used") used++
      else unused++
    }
    return { total: keys.length, unused, used }
  }, [keys])

  async function handleCreate() {
    setError(null)

    let parsedLimit = 0
    if (keyType === "limited") {
      // Strict numeric validation — must be a positive integer.
      if (!/^\d+$/.test(userLimit) || Number(userLimit) <= 0) {
        setError("User limit must be a whole number greater than 0.")
        return
      }
      parsedLimit = Number(userLimit)
    }

    setCreating(true)
    try {
      const newKey = generateKey(tier)
      // Build the payload; only include `userLimit` for "limited"
      // keys so we don't bloat one-time / no-limit rows.
      const payload: QxlKey = {
        key: newKey,
        tier,
        keyType,
        usageCount: 0,
        status: "unused",
        createdAt: Date.now(),
        source: "manual",
      }
      if (keyType === "limited") payload.userLimit = parsedLimit

      await set(ref(getDb(), `qxl_keys/${newKey}`), payload)
    } catch (err) {
      console.log("[v0] create key failed:", err)
      setError("Could not create key. Try again.")
    } finally {
      setCreating(false)
    }
  }

  async function handleCopy(k: QxlKey) {
    if (!k.id) return
    try {
      await navigator.clipboard.writeText(k.key)
      setCopiedId(k.id)
      setTimeout(() => setCopiedId((curr) => (curr === k.id ? null : curr)), 1400)
    } catch (err) {
      console.log("[v0] copy failed:", err)
    }
  }

  async function handleDelete(k: QxlKey) {
    if (!k.id) return
    if (!window.confirm(`Delete key ${k.key}? This cannot be undone.`)) return
    await remove(ref(getDb(), `qxl_keys/${k.id}`))
  }

  /**
   * Wipes the entire ``/qxl_keys`` node in a single Firebase write.
   * Only callable after the admin has cleared the two-step modal —
   * the caller is responsible for advancing ``bulkConfirm`` from
   * ``"first"`` to ``"second"`` before invoking this handler.
   */
  async function handleDeleteAll() {
    setError(null)
    setBulkDeleting(true)
    try {
      // Single ``remove`` of the parent path is atomic and far cheaper
      // than iterating per-key — a list of 500 keys still resolves in
      // one round-trip.
      await remove(ref(getDb(), "qxl_keys"))
      setBulkConfirm(null)
    } catch (err) {
      console.log("[v0] bulk delete failed:", err)
      setError("Could not delete all keys. Try again.")
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ------- Stats strip ------- */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={stats.total} accent="#5BC0D8" />
        <StatCard label="Unused" value={stats.unused} accent="#34d399" />
        <StatCard label="Used" value={stats.used} accent="#fbbf24" />
      </div>

      {/* ------- Generate card ------- */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Wand2 className="size-4 text-[#5BC0D8]" aria-hidden />
          <h2 className="font-serif text-lg font-semibold text-white">
            Generate new QXL key
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,160px)_minmax(0,160px)_minmax(0,140px)_minmax(0,1fr)] lg:items-end">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="tier-select"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65"
            >
              Tier
            </Label>
            <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
              <SelectTrigger
                id="tier-select"
                className="h-11 border-white/15 bg-white/[0.04] text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="smart">Smart</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="dominator">Dominator</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="key-type-select"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65"
            >
              Key Type
            </Label>
            <Select
              value={keyType}
              onValueChange={(v) => setKeyType(v as KeyType)}
            >
              <SelectTrigger
                id="key-type-select"
                className="h-11 border-white/15 bg-white/[0.04] text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One Time</SelectItem>
                <SelectItem value="no_limit">No Limit</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {keyType === "limited" ? (
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="user-limit"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65"
              >
                Users
              </Label>
              <Input
                id="user-limit"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={userLimit}
                onChange={(e) => {
                  // Strip non-digits so the field truly only accepts numbers.
                  const next = e.target.value.replace(/[^\d]/g, "")
                  setUserLimit(next)
                }}
                placeholder="e.g. 5"
                className="h-11 border-white/15 bg-white/[0.04] text-white placeholder:text-white/35"
              />
            </div>
          ) : (
            <div className="hidden lg:block" aria-hidden />
          )}

          <Button
            onClick={handleCreate}
            disabled={creating}
            className="h-11 w-full bg-[#5BC0D8] font-semibold text-[#03161B] hover:bg-[#7DE3FF] sm:col-span-2 lg:col-span-1 lg:w-auto"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <Plus className="mr-2 size-4" aria-hidden />
                Generate key
              </>
            )}
          </Button>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-white/55">
          <span className="text-white/80">One Time</span> expires after a
          single activation. <span className="text-white/80">No Limit</span>{" "}
          stays active for unlimited users until you delete it.{" "}
          <span className="text-white/80">Limited</span> caps the number of
          distinct users who can activate before the key expires.
        </p>
      </div>

      {/* ------- Search + filter ------- */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search key, tier, username…"
            className="h-11 border-white/15 bg-white/[0.04] pl-10 text-white placeholder:text-white/35"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-11 flex-1 border-white/15 bg-white/[0.04] text-white sm:w-44 sm:flex-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="unused">Unused only</SelectItem>
              <SelectItem value="used">Used only</SelectItem>
            </SelectContent>
          </Select>
          {/*
            Bulk-delete trigger. Renders as a square icon-only button on
            mobile to keep the row compact, and expands to icon+label
            on ``sm:`` breakpoints. Disabled when there are no keys to
            avoid a no-op confirmation modal. The two-step modal lives
            below the panel.
          */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setBulkConfirm("first")}
            disabled={keys.length === 0}
            aria-label="Delete all keys"
            title="Delete all keys"
            className="h-11 shrink-0 border-rose-400/30 bg-rose-400/10 px-3 text-rose-200 hover:bg-rose-400/20 disabled:opacity-40 sm:px-4"
          >
            <Trash2 className="size-4 sm:mr-2" aria-hidden />
            <span className="hidden sm:inline">Delete all</span>
          </Button>
        </div>
      </div>

      {/* ------- Error ------- */}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
        >
          {error}
        </p>
      )}

      {/* ------- Keys list ------- */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-white/55">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading keys…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={keys.length === 0 ? "No keys yet" : "No keys match your filter"}
            description={
              keys.length === 0
                ? "Generate your first QXL key using the form above."
                : "Try clearing the search or switching the status filter."
            }
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((k) => (
              <li
                key={k.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#5BC0D8]/20 via-[#1B7892]/20 to-[#03161B]/60 text-[#7DE3FF] ring-1 ring-inset ring-[#5BC0D8]/30">
                    <KeyRound className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-semibold tracking-[0.04em] text-white">
                      {k.key}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/55">
                      <span className="uppercase tracking-wider">
                        {TIER_LABEL[k.tier] ?? k.tier}
                      </span>
                      <span className="text-white/25">·</span>
                      <span>{formatDate(k.createdAt)}</span>
                      {k.usedBy?.username && (
                        <>
                          <span className="text-white/25">·</span>
                          <span>last used by @{k.usedBy.username}</span>
                        </>
                      )}
                      {k.source === "purchase" && (
                        <>
                          <span className="text-white/25">·</span>
                          <span className="text-emerald-300/85">
                            from purchase
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <KeyTypeBadge k={k} />
                  <StatusBadge status={k.status} />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(k)}
                    className="border-white/15 bg-white/[0.04] text-white/85 hover:bg-white/10"
                  >
                    {copiedId === k.id ? (
                      <>
                        <Check className="mr-1.5 size-3.5" aria-hidden />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 size-3.5" aria-hidden />
                        Copy
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(k)}
                    className="border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/*
        ------- Bulk delete two-step confirmation -------
        We hand-roll the modal instead of pulling in Radix Dialog so
        this panel stays drop-in for existing admin pages. Closing via
        backdrop, ``Esc``, or "Cancel" always resets ``bulkConfirm`` to
        ``null``, which is critical: if it stayed at ``"second"``, the
        next time the modal opened it would skip the first warning and
        land directly on the irreversible-action screen.
      */}
      {bulkConfirm !== null && (
        <BulkDeleteModal
          step={bulkConfirm}
          total={keys.length}
          deleting={bulkDeleting}
          onAdvance={() => setBulkConfirm("second")}
          onConfirm={handleDeleteAll}
          onClose={() => {
            if (bulkDeleting) return
            setBulkConfirm(null)
          }}
          confirmButtonRef={bulkConfirmButtonRef}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Small UI bits                                                             */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
      style={{ boxShadow: `inset 0 1px 0 ${accent}22` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
        {label}
      </p>
      <p
        className="mt-1.5 font-mono text-2xl font-semibold tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: QxlKey["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
        status === "unused"
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-amber-400/30 bg-amber-400/10 text-amber-200",
      )}
    >
      {status}
    </Badge>
  )
}

function KeyTypeBadge({ k }: { k: QxlKey }) {
  // Default to "one_time" so legacy keys (where the field is missing)
  // render with their effective behaviour rather than appearing unset.
  const type = k.keyType ?? "one_time"
  const label = KEY_TYPE_LABEL[type]
  const used = k.usageCount ?? 0

  if (type === "no_limit") {
    return (
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1 border-[#5BC0D8]/40 bg-[#1B7892]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7DE3FF]"
      >
        <InfinityIcon className="size-3" aria-hidden />
        {label}
      </Badge>
    )
  }
  if (type === "limited") {
    return (
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1 border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200"
      >
        <UsersIcon className="size-3" aria-hidden />
        {label} {used}/{k.userLimit ?? 0}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-slate-400/30 bg-slate-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200"
    >
      {label}
    </Badge>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/5 text-white/55">
        <KeyRound className="size-5" aria-hidden />
      </span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="max-w-sm text-pretty text-xs text-white/55">{description}</p>
    </div>
  )
}

/**
 * Two-step bulk-delete confirmation modal.
 *
 * Step 1 (``"first"``): warns that the action will wipe every key.
 *   Primary CTA advances to step 2; secondary CTA cancels.
 * Step 2 (``"second"``): final irreversible-action prompt. Primary
 *   CTA fires the actual delete; secondary CTA cancels.
 *
 * The component is purely presentational — it owns no destructive
 * state of its own and emits intent via ``onAdvance``/``onConfirm``/
 * ``onClose``.
 */
function BulkDeleteModal({
  step,
  total,
  deleting,
  onAdvance,
  onConfirm,
  onClose,
  confirmButtonRef,
}: {
  step: "first" | "second"
  total: number
  deleting: boolean
  onAdvance: () => void
  onConfirm: () => void
  onClose: () => void
  confirmButtonRef: React.MutableRefObject<HTMLButtonElement | null>
}) {
  // Lock body scroll while the modal is open and listen for ``Esc``.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !deleting) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [deleting, onClose])

  // Move keyboard focus to the primary CTA whenever ``step`` flips so
  // the admin can confirm via ``Enter`` without re-targeting the mouse.
  useEffect(() => {
    confirmButtonRef.current?.focus()
  }, [step, confirmButtonRef])

  const isFinal = step === "second"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-title"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        // Close only when the backdrop itself is clicked, never on
        // bubbled clicks from inside the modal panel.
        if (e.target === e.currentTarget && !deleting) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl border border-white/10 bg-[#03161B] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.65)] sm:rounded-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              isFinal
                ? "bg-rose-500/15 text-rose-200 ring-rose-400/40"
                : "bg-amber-400/10 text-amber-200 ring-amber-400/30",
            )}
          >
            <ShieldAlert className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              id="bulk-delete-title"
              className="font-serif text-lg font-semibold text-white"
            >
              {isFinal ? "Are you absolutely sure?" : "Delete all QXL keys?"}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/65">
              {isFinal ? (
                <>
                  This will <span className="text-rose-200">permanently</span>{" "}
                  remove all{" "}
                  <span className="font-mono font-semibold text-white">
                    {total}
                  </span>{" "}
                  keys from the database. Active users will lose access
                  immediately. This action cannot be undone.
                </>
              ) : (
                <>
                  You&apos;re about to delete{" "}
                  <span className="font-mono font-semibold text-white">
                    {total}
                  </span>{" "}
                  keys. We&apos;ll ask one more time before anything is
                  removed.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="h-11 border-white/15 bg-white/[0.04] text-white hover:bg-white/10 sm:h-10"
          >
            Cancel
          </Button>
          <Button
            ref={confirmButtonRef}
            type="button"
            onClick={isFinal ? onConfirm : onAdvance}
            disabled={deleting}
            className={cn(
              "h-11 font-semibold sm:h-10",
              isFinal
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : "bg-amber-400 text-[#03161B] hover:bg-amber-300",
            )}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Deleting…
              </>
            ) : isFinal ? (
              <>
                <Trash2 className="mr-2 size-4" aria-hidden />
                Yes, delete all {total}
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatDate(ts: number) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
