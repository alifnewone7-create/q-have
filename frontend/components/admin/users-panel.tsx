"use client"

/**
 * UsersPanel — admin view of every activated user.
 *
 * Backed by Firebase RTDB at `/access_tokens` (one row per activated
 * browser session). Each row links the holder's name and username to:
 *   • the QXL key they used
 *   • the tier embedded in that key
 *   • the access token issued for the session (truncated)
 *   • the deviceId fingerprint (truncated)
 *   • when activation happened
 *   • the user-agent string at activation time
 *
 * Two destructive admin actions:
 *   • Revoke session  — deletes the access_tokens row, forcing the
 *     browser to fail the deviceId truth check on its next request.
 *     Useful to reset a stuck session.
 *   • Delete row      — removes the audit row entirely.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { onValue, ref, remove } from "firebase/database"
import {
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Fingerprint,
  KeyRound,
  Loader2,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TIER_LABEL as ADMIN_TIER_LABEL,
  type AccessToken,
  type Tier as AdminTier,
} from "@/lib/admin-types"
import { getDb } from "@/lib/firebase"
import { cn } from "@/lib/utils"

type TierFilter = "all" | AdminTier

export function UsersPanel() {
  const [users, setUsers] = useState<AccessToken[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<TierFilter>("all")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Which user row is currently expanded. Mirrors the click-to-expand
  // pattern from ``purchases-panel.tsx``: only one row at a time so
  // the page doesn't grow unbounded on long lists. ``null`` means the
  // detail card is hidden for every row.
  const [expandedToken, setExpandedToken] = useState<string | null>(null)
  // Three-step confirmation flow for "Delete all users". Wiping every
  // ``access_tokens`` row is irreversible and locks every active
  // browser session out of their dashboard, so we stage the intent in
  // three deliberate gates: ``"warn"`` (impact summary) → ``"type"``
  // (admin must literally type ``DELETE ALL``) → ``"final"`` (last
  // confirm). Closing the modal at any stage fully resets to ``null``.
  const [bulkStep, setBulkStep] = useState<
    null | "warn" | "type" | "final"
  >(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const bulkPrimaryRef = useRef<HTMLButtonElement | null>(null)

  // Subscribe to /access_tokens.
  useEffect(() => {
    const r = ref(getDb(), "access_tokens")
    const unsub = onValue(
      r,
      (snap) => {
        const value = snap.val() as Record<string, AccessToken> | null
        const list: AccessToken[] = value
          ? Object.entries(value).map(([id, v]) => ({ ...v, id }))
          : []
        // Newest first.
        list.sort((a, b) => (b.activatedAt ?? 0) - (a.activatedAt ?? 0))
        setUsers(list)
        setLoading(false)
      },
      (err) => {
        console.log("[v0] access_tokens listener error:", err)
        setError("Could not load activations. Check Firebase rules / network.")
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  const stats = useMemo(() => {
    let basic = 0
    let smart = 0
    let pro = 0
    let dominator = 0
    let personal = 0
    for (const u of users) {
      if (u.tier === "basic") basic++
      else if (u.tier === "pro") pro++
      else if (u.tier === "dominator") dominator++
      else if (u.tier === "personal") personal++
      else smart++
    }
    return { total: users.length, basic, smart, pro, dominator, personal }
  }, [users])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (tierFilter !== "all" && u.tier !== tierFilter) return false
      if (!q) return true
      return (
        (u.fullName ?? "").toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q) ||
        (u.qxlKey ?? "").toLowerCase().includes(q) ||
        (u.token ?? "").toLowerCase().includes(q)
      )
    })
  }, [users, search, tierFilter])

  async function copy(value: string, fieldId: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(fieldId)
      window.setTimeout(
        () =>
          setCopiedField((curr) => (curr === fieldId ? null : curr)),
        1400,
      )
    } catch (err) {
      console.log("[v0] copy failed:", err)
    }
  }

  async function handleDelete(u: AccessToken) {
    if (!u.token) return
    if (
      !window.confirm(
        `Permanently delete this audit row for @${u.username}?\n\nThis only removes the activation record from the Users panel — it does NOT free the QXL key.`,
      )
    ) {
      return
    }
    await remove(ref(getDb(), `access_tokens/${u.token}`)).catch(() => undefined)
  }

  /**
   * Wipes the entire ``/access_tokens`` node in a single Firebase
   * write. Only callable after the admin has cleared all three gates
   * of the bulk-delete modal — the modal owns the gating, this
   * function just performs the destructive action.
   *
   * Note: this does not touch ``/qxl_keys`` rows, so the underlying
   * keys remain claimed (matches the per-row ``handleDelete`` policy).
   */
  async function handleDeleteAll() {
    setError(null)
    setBulkDeleting(true)
    try {
      // Single ``remove`` of the parent path is atomic and far cheaper
      // than iterating per-row.
      await remove(ref(getDb(), "access_tokens"))
      setBulkStep(null)
    } catch (err) {
      console.log("[v0] bulk users delete failed:", err)
      setError("Could not delete all users. Try again.")
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ------- Stats strip ------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Activated" value={stats.total} accent="#5BC0D8" />
        <StatCard label="Basic" value={stats.basic} accent="#cbd5e1" />
        <StatCard label="Smart" value={stats.smart} accent="#34d399" />
        <StatCard label="Pro" value={stats.pro} accent="#7DE3FF" />
        <StatCard label="Dominator" value={stats.dominator} accent="#fbbf24" />
        <StatCard label="Personal" value={stats.personal} accent="#c4b5fd" />
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
            placeholder="Search name, username, QXL key, token…"
            className="h-11 border-white/15 bg-white/[0.04] pl-10 text-white placeholder:text-white/35"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Select
            value={tierFilter}
            onValueChange={(v) => setTierFilter(v as TierFilter)}
          >
            <SelectTrigger className="h-11 flex-1 border-white/15 bg-white/[0.04] text-white sm:w-44 sm:flex-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="smart">Smart</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="dominator">Dominator</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
          {/*
            Bulk delete trigger. Icon-only square on mobile (keeps the
            row compact alongside the filter dropdown), expands to icon
            + label at ``sm:`` breakpoints. Disabled when there are no
            users so the modal can't open with a 0-impact summary.
          */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setBulkStep("warn")}
            disabled={users.length === 0}
            aria-label="Delete all users"
            title="Delete all users"
            className="h-11 shrink-0 border-rose-400/30 bg-rose-400/10 px-3 text-rose-200 hover:bg-rose-400/20 disabled:opacity-40 sm:px-4"
          >
            <Trash2 className="size-4 sm:mr-2" aria-hidden />
            <span className="hidden sm:inline">Delete all</span>
          </Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
        >
          {error}
        </p>
      )}

      {/* ------- Users list ------- */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-white/55">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading activations…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              users.length === 0
                ? "No activations yet"
                : "No users match your filter"
            }
            description={
              users.length === 0
                ? "Once a customer activates a QXL key from the public site, their session will appear here."
                : "Try clearing the search or switching the tier filter."
            }
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((u) => (
              <UserRow
                key={u.token}
                user={u}
                expanded={expandedToken === u.token}
                onToggle={() =>
                  setExpandedToken((curr) =>
                    curr === u.token ? null : u.token,
                  )
                }
                onDelete={() => handleDelete(u)}
                onCopy={(value, fieldId) => copy(value, fieldId)}
                copiedField={copiedField}
              />
            ))}
          </ul>
        )}
      </div>

      {/*
        ------- Three-step bulk delete modal -------
        Hand-rolled (no Radix Dialog) to keep this panel drop-in. Any
        close path (backdrop / Esc / Cancel) fully resets ``bulkStep``
        to ``null``, otherwise the next open could skip earlier gates.
      */}
      {bulkStep !== null && (
        <BulkDeleteModal
          step={bulkStep}
          total={users.length}
          deleting={bulkDeleting}
          onAdvance={(next) => setBulkStep(next)}
          onConfirm={handleDeleteAll}
          onClose={() => {
            if (bulkDeleting) return
            setBulkStep(null)
          }}
          primaryRef={bulkPrimaryRef}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Row                                                                       */
/* -------------------------------------------------------------------------- */

function UserRow({
  user: u,
  expanded,
  onToggle,
  onDelete,
  onCopy,
  copiedField,
}: {
  user: AccessToken
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onCopy: (value: string, fieldId: string) => void
  copiedField: string | null
}) {
  const browserName = parseBrowser(u.userAgent ?? "")
  const initial = (u.fullName?.[0] || u.username?.[0] || "?").toUpperCase()
  const tierLabel = ADMIN_TIER_LABEL[u.tier] ?? u.tier

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/*
          Click-to-expand header. Mirrors ``PurchaseRow`` in
          ``purchases-panel.tsx`` — entire identity block is the
          toggle, with a chevron on the right that rotates 180° when
          open. ``aria-expanded`` exposes state to assistive tech.
        */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`user-details-${u.token}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition hover:opacity-90"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#5BC0D8]/20 via-[#1B7892]/20 to-[#03161B]/60 text-sm font-bold text-[#7DE3FF] ring-1 ring-inset ring-[#5BC0D8]/35">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">
                {u.fullName || "Anonymous"}
              </p>
              <TierBadge tier={u.tier} label={tierLabel} />
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/55">
              <span className="font-mono">@{u.username || "—"}</span>
              <span className="text-white/25">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3" aria-hidden />
                {formatDate(u.activatedAt)}
              </span>
              {browserName && (
                <>
                  <span className="text-white/25">·</span>
                  <span>{browserName}</span>
                </>
              )}
            </p>
          </div>

          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-white/55 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
          >
            <Trash2 className="size-3.5" aria-hidden />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>

      {expanded && (
        <div
          id={`user-details-${u.token}`}
          className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-2 sm:gap-3 sm:p-4"
        >
          <DetailRow
            icon={<KeyRound className="size-3.5" aria-hidden />}
            label="QXL Key"
            value={u.qxlKey}
            fieldId={`${u.token}-key`}
            onCopy={onCopy}
            copiedField={copiedField}
            mono
          />
          <DetailRow
            icon={<UserRound className="size-3.5" aria-hidden />}
            label="Access token"
            value={u.token}
            fieldId={`${u.token}-tok`}
            onCopy={onCopy}
            copiedField={copiedField}
            mono
            truncate
          />
          <DetailRow
            icon={<Fingerprint className="size-3.5" aria-hidden />}
            label="Device ID"
            value={u.deviceId}
            fieldId={`${u.token}-dev`}
            onCopy={onCopy}
            copiedField={copiedField}
            mono
            truncate
          />
          <DetailRow
            icon={<Clock3 className="size-3.5" aria-hidden />}
            label="Activated at"
            value={formatDateLong(u.activatedAt)}
            fieldId={`${u.token}-time`}
            onCopy={onCopy}
            copiedField={copiedField}
          />
        </div>
      )}
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*  UI bits                                                                   */
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

function TierBadge({ tier, label }: { tier: AdminTier; label: string }) {
  const styles: Record<AdminTier, string> = {
    basic: "border-slate-400/30 bg-slate-400/10 text-slate-200",
    smart: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    pro: "border-[#5BC0D8]/40 bg-[#1B7892]/15 text-[#7DE3FF]",
    dominator: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    personal: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
        styles[tier],
      )}
    >
      {label}
    </Badge>
  )
}

function DetailRow({
  icon,
  label,
  value,
  fieldId,
  onCopy,
  copiedField,
  mono,
  truncate,
}: {
  icon: React.ReactNode
  label: string
  value: string
  fieldId: string
  onCopy: (value: string, fieldId: string) => void
  copiedField: string | null
  mono?: boolean
  truncate?: boolean
}) {
  const copied = copiedField === fieldId
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
        <span className="text-[#5BC0D8]">{icon}</span>
        {label}
      </p>
      <button
        type="button"
        onClick={() => onCopy(value, fieldId)}
        disabled={!value}
        className={cn(
          "group flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-white/85 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50",
          mono && "font-mono tracking-wide",
        )}
      >
        <span className={cn("min-w-0 flex-1", truncate ? "truncate" : "")}>
          {value || "—"}
        </span>
        <span
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded text-white/45 transition",
            copied ? "text-emerald-300" : "group-hover:text-white",
          )}
          aria-hidden
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </span>
      </button>
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/5 text-white/55">
        <Users className="size-5" aria-hidden />
      </span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="max-w-sm text-pretty text-xs text-white/55">{description}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Bulk delete modal                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Three-step bulk-delete confirmation modal.
 *
 * Step 1 (``"warn"``): impact summary — admin sees the total count
 *   and a warning. CTA advances to ``"type"``.
 * Step 2 (``"type"``): admin must literally type ``DELETE ALL`` into
 *   the input. CTA stays disabled until the phrase matches exactly,
 *   then advances to ``"final"``.
 * Step 3 (``"final"``): last confirmation gate. CTA fires the actual
 *   delete via ``onConfirm``.
 *
 * The component is purely presentational: it owns the typing state
 * locally (resets per-mount), but emits all destructive intent up via
 * ``onAdvance`` / ``onConfirm`` / ``onClose``.
 */
function BulkDeleteModal({
  step,
  total,
  deleting,
  onAdvance,
  onConfirm,
  onClose,
  primaryRef,
}: {
  step: "warn" | "type" | "final"
  total: number
  deleting: boolean
  onAdvance: (next: "type" | "final") => void
  onConfirm: () => void
  onClose: () => void
  primaryRef: React.MutableRefObject<HTMLButtonElement | null>
}) {
  const [typed, setTyped] = useState("")
  const REQUIRED = "DELETE ALL"
  const typedOk = typed.trim().toUpperCase() === REQUIRED

  // Reset the typed phrase whenever the user goes back / re-enters
  // step 2 — otherwise a stale match would let them skip gate 2 on a
  // future open.
  useEffect(() => {
    if (step !== "type") setTyped("")
  }, [step])

  // Lock body scroll + ``Esc`` to close.
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

  // Move keyboard focus to the primary CTA on every step transition so
  // ``Enter`` keeps progressing the flow (except on step 2 where we
  // want focus in the input — handled separately).
  useEffect(() => {
    if (step !== "type") primaryRef.current?.focus()
  }, [step, primaryRef])

  const stepIndex = step === "warn" ? 1 : step === "type" ? 2 : 3
  const isFinal = step === "final"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-users-title"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl border border-white/10 bg-[#03161B] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.65)] sm:rounded-2xl sm:p-6">
        {/* Step pips */}
        <div className="mb-4 flex items-center gap-1.5" aria-hidden>
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                i < stepIndex
                  ? "bg-rose-400/80"
                  : i === stepIndex
                    ? isFinal
                      ? "bg-rose-400"
                      : "bg-amber-300"
                    : "bg-white/10",
              )}
            />
          ))}
        </div>

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
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Step {stepIndex} of 3
            </p>
            <h3
              id="bulk-users-title"
              className="mt-1 font-serif text-lg font-semibold text-white"
            >
              {step === "warn"
                ? "Delete all users?"
                : step === "type"
                  ? "Type to confirm"
                  : "Last chance"}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/65">
              {step === "warn" ? (
                <>
                  This will{" "}
                  <span className="text-rose-200">permanently remove</span>{" "}
                  every activation record (
                  <span className="font-mono font-semibold text-white">
                    {total}
                  </span>{" "}
                  total). Active browser sessions will lose access to their
                  dashboard on the next request.
                </>
              ) : step === "type" ? (
                <>
                  Type{" "}
                  <span className="font-mono font-semibold text-rose-200">
                    {REQUIRED}
                  </span>{" "}
                  below to enable the next step. This is intentional friction
                  — the action cannot be undone.
                </>
              ) : (
                <>
                  About to delete{" "}
                  <span className="font-mono font-semibold text-white">
                    {total}
                  </span>{" "}
                  user records. This is the final confirmation.
                </>
              )}
            </p>
          </div>
        </div>

        {step === "type" && (
          <div className="mt-4">
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder={REQUIRED}
              className={cn(
                "h-11 border-white/15 bg-white/[0.04] font-mono tracking-widest text-white placeholder:text-white/30",
                typedOk &&
                  "border-emerald-400/40 bg-emerald-400/5 text-emerald-100",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && typedOk) onAdvance("final")
              }}
            />
          </div>
        )}

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
            ref={primaryRef}
            type="button"
            disabled={
              deleting || (step === "type" && !typedOk)
            }
            onClick={() => {
              if (step === "warn") onAdvance("type")
              else if (step === "type") onAdvance("final")
              else onConfirm()
            }}
            className={cn(
              "h-11 font-semibold sm:h-10",
              isFinal
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : "bg-amber-400 text-[#03161B] hover:bg-amber-300",
              "disabled:cursor-not-allowed disabled:opacity-50",
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

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatDate(ts: number) {
  if (!ts) return "—"
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDateLong(ts: number) {
  if (!ts) return "—"
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * Best-effort browser/OS extraction from a UA string. Avoids heavy deps;
 * we just want a rough hint like "Chrome on iPhone" or "Firefox on
 * Windows" for the row subtitle.
 */
function parseBrowser(ua: string): string {
  if (!ua) return ""
  let browser = ""
  if (/edg\//i.test(ua)) browser = "Edge"
  else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) browser = "Chrome"
  else if (/firefox\//i.test(ua)) browser = "Firefox"
  else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browser = "Safari"
  else if (/opera\//i.test(ua) || /opr\//i.test(ua)) browser = "Opera"

  let os = ""
  if (/iphone|ipad|ipod/i.test(ua)) os = "iOS"
  else if (/android/i.test(ua)) os = "Android"
  else if (/windows/i.test(ua)) os = "Windows"
  else if (/mac os x/i.test(ua)) os = "macOS"
  else if (/linux/i.test(ua)) os = "Linux"

  if (browser && os) return `${browser} on ${os}`
  return browser || os || ""
}
