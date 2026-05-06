# Game UX Polish Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Apply 4 follow-up UX adjustments after Round 1 demo: rankings split, invitee CTAs, cancel/replace partner with new search, and GameHome dedupe.

**Architecture:** Single-file changes mostly, with one shared store + notification update. Reuses existing components.

**Spec:** `docs/superpowers/specs/2026-05-06-game-ux-polish-round2-design.md`

**Verification:** `npx tsc --noEmit` clean per task. Dev server at http://localhost:8081/ for visual verification.

---

## Wave 1 (3 parallel)

### Task 1: tournamentStore — search functions + cancel + email/phone

**File:** `src/lib/tournamentStore.ts`

**Changes:**
1. Add `email: string; phone: string;` to `PlayerRef` interface
2. Populate all 12 entries in `PLAYER_DIRECTORY` with email + phone (consistent fake data)
3. Add `searchPlayersByName(query: string): PlayerRef[]` — fuzzy match (whitespace-stripped includes), max 5 results, returns empty if query is empty
4. Add `findPlayerByEmail(email: string): PlayerRef | undefined` — case-insensitive exact match
5. Add `findPlayerByPhone(phone: string): PlayerRef | undefined` — normalize input (strip non-digits) then exact match against normalized phone
6. Remove `findPlayerByName` (single-result version) — confirm no other call sites in repo first via grep
7. Add `cancelMyPendingInvite(entryId: string): { ok: boolean; error?: string }` — validates pending + registrant === CURRENT_USER, sets status="cancelled" + cancelledAt, fires `tournament_partner_cancelled` notification
8. Expose new functions from hook return

**Demo data spec for PLAYER_DIRECTORY** (suggest these patterns):
- 田中 太郎 (user-001): tanaka@example.com / 090-1111-0001
- 佐藤 花子 (user-002): sato.h@example.com / 090-1111-0002
- 鈴木 一郎 (user-003): suzuki@example.com / 090-1111-0003
- 高橋 美咲 (user-004): takahashi@example.com / 090-1111-0004
- 渡辺 健太 (user-005): watanabe@example.com / 090-1111-0005
- 伊藤 愛 (user-006): ito.a@example.com / 090-1111-0006
- 山本 大輝 (user-007): yamamoto@example.com / 090-1111-0007
- 中村 裕子 (user-008): nakamura@example.com / 090-1111-0008
- 吉田 恵 (user-009): yoshida@example.com / 090-1111-0009
- 松本 翔太 (user-010): matsumoto@example.com / 090-1111-0010
- 小林 優 (user-011): kobayashi@example.com / 090-1111-0011
- 加藤 翼 (user-012): kato@example.com / 090-1111-0012

**Verify + commit:**
```bash
npx tsc --noEmit
git add src/lib/tournamentStore.ts
git commit -m "tournamentStore: 3-mode search + cancelMyPendingInvite + email/phone fields"
```

---

### Task 2: notificationStore + Notifications icon for partner_cancelled

**Files:**
- `src/lib/notificationStore.ts`
- `src/pages/Notifications.tsx`

**Changes:**
1. Add `"tournament_partner_cancelled"` to `PushNotification.type` union (insert after `tournament_partner_expired`)
2. Add to ICON_MAP in Notifications.tsx: `tournament_partner_cancelled: { icon: X, color: "text-muted-foreground" }`
3. Confirm `X` icon imported

**Verify + commit:**
```bash
npx tsc --noEmit
git add src/lib/notificationStore.ts src/pages/Notifications.tsx
git commit -m "notificationStore: add tournament_partner_cancelled type + icon"
```

---

### Task 3: GameHome — Rankings pill + remove LiveMonthCard + hero clickable

**File:** `src/pages/GameHome.tsx`

**Changes:**

#### Part A — Rankings pill toggle
1. Add state `const [rankingTab, setRankingTab] = useState<"current" | "last">("current");`
2. In `tab === "ranking"` section, add at top:
```tsx
<div className="inline-flex bg-muted rounded-full p-1 self-start">
  <button
    onClick={() => setRankingTab("current")}
    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
      rankingTab === "current" ? "bg-background shadow text-foreground" : "text-muted-foreground"
    }`}
  >
    即時（{formatYM(thisMonth)}）
  </button>
  <button
    onClick={() => setRankingTab("last")}
    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
      rankingTab === "last" ? "bg-background shadow text-foreground" : "text-muted-foreground"
    }`}
  >
    最終（{formatYM(prevMonth)}）
  </button>
</div>
```
3. Conditionally render only the active ranking list (current OR last), not both stacked

#### Part D — Remove LiveMonthCard region + hero clickable
1. Remove the `{isPremium && (<div className="px-[20px] mt-3"><LiveMonthCard variant="compact" .../></div>)}` block
2. Remove `import LiveMonthCard from "@/components/game/LiveMonthCard";`
3. Wrap the orange hero stats area in a button when `isPremium`:
```tsx
{isPremium ? (
  <button
    onClick={() => navigate("/game/my-results")}
    className="w-full text-left rounded-[12px] overflow-hidden shadow-lg bg-primary text-primary-foreground"
  >
    <div className="px-5 py-4">
      {/* same stats grid */}
    </div>
    <div className="bg-foreground px-5 py-2.5 flex items-center justify-between text-[11px] text-primary-foreground">
      <span className="flex items-center gap-1">
        <Diamond className="w-3 h-3 text-primary" />
        プレミアム会員
      </span>
      <span>エントリー可能</span>
    </div>
  </button>
) : (
  <div className="rounded-[12px] overflow-hidden shadow-lg bg-primary text-primary-foreground">
    <div className="px-5 py-4">
      {/* same stats grid */}
    </div>
    <div className="bg-foreground px-5 py-2.5 flex items-center justify-between text-[11px] text-primary-foreground">
      <span className="flex items-center gap-1">
        <Lock className="w-3 h-3" />
        一般会員
      </span>
      <button onClick={() => navigate("/premium/plan")} className="text-primary font-bold">
        プレミアム登録 ›
      </button>
    </div>
  </div>
)}
```
(extract stats grid to a constant or duplicate; either is fine for this scope)

**Verify + commit:**
```bash
npx tsc --noEmit
git add src/pages/GameHome.tsx
git commit -m "GameHome: rankings pill toggle + remove LiveMonthCard duplicate + hero clickable for Premium"
```

---

## Wave 2 (2 parallel, after Wave 1)

### Task 4: TournamentDetail — invitee CTAs + cancel/replace for inviter

**File:** `src/pages/TournamentDetail.tsx`

**Changes:**

1. Add `useToast` import + `const { toast } = useToast();`
2. Add `useState` for cancel confirm dialog: `const [showCancelDialog, setShowCancelDialog] = useState(false);`
3. Get from store: `const { acceptPartnerInvite, cancelMyPendingInvite, getTournament } = useTournamentStore();`
4. Compute `isInvitee = myEntry?.status === "pending_partner_confirmation" && myEntry.partnerUserId === CURRENT_USER`
5. Compute `isInviter = myEntry?.status === "pending_partner_confirmation" && myEntry.registrantUserId === CURRENT_USER`

#### Invitee CTA replaces status text + bottom CTA

When `isInvitee`:
- Replace the existing "あなたの承諾待ち" status block with an invite card section showing:
  - Header: countdown ⏰ remaining hours
  - Body: 招待者: ${inviter.name} さん
  - Buttons:
    - Primary `承諾する` → `acceptPartnerInvite(myEntry.id)` + `toast({ title: "招待を承諾しました" })` (stay on page)
    - Secondary outline `辞退する` → `navigate('/game/invite/' + myEntry.id)`
- Set `ctaLabel={undefined}` (hide bottom CTA)

#### Inviter cancel/replace

When `isInviter`:
- Keep existing "パートナー確認待ち (隊友名)" status display
- Set `ctaLabel="パートナーを変更する"` + `ctaDisabled={false}` + `onCtaClick={() => setShowCancelDialog(true)}`
- Add `<AlertDialog>` at end of return:
```tsx
<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>パートナーを変更しますか？</AlertDialogTitle>
      <AlertDialogDescription>
        現在の招待をキャンセルして、再度エントリーします。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>戻る</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => {
          if (myEntry) {
            const r = cancelMyPendingInvite(myEntry.id);
            if (r.ok) {
              toast({ title: "招待を取り消しました" });
              navigate(`/game/tournament/${t.id}/entry`);
            }
          }
        }}
      >
        変更する
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
- Add AlertDialog imports

**Verify + commit:**
```bash
npx tsc --noEmit
git add src/pages/TournamentDetail.tsx
git commit -m "TournamentDetail: invitee accept/decline CTAs + inviter cancel/replace partner flow"
```

---

### Task 5: TournamentEntry — 3-mode search + autocomplete

**File:** `src/pages/TournamentEntry.tsx`

**Changes:**

1. Replace `findPlayerByName` import with new functions:
```tsx
import { useTournamentStore, searchPlayersByName, findPlayerByEmail, findPlayerByPhone, PREMIUM_USERS, CURRENT_USER, getPlayer } from "@/lib/tournamentStore";
```
(verify these are top-level exports from tournamentStore — adjust if Task 1 exposed them via hook only)

2. Replace single `partnerName` state with mode + query + selected partner:
```tsx
type SearchMode = "name" | "email" | "phone";
const [mode, setMode] = useState<SearchMode>("name");
const [query, setQuery] = useState("");
const [selectedPartner, setSelectedPartner] = useState<PlayerRef | undefined>(undefined);
```

3. Compute matches by mode:
```tsx
const nameMatches = mode === "name" && query.trim() ? searchPlayersByName(query.trim()) : [];
const emailMatch = mode === "email" && query.trim() ? findPlayerByEmail(query.trim()) : undefined;
const phoneMatch = mode === "phone" && query.trim() ? findPlayerByPhone(query.trim()) : undefined;
const partner = selectedPartner ?? (mode === "name" ? undefined : (emailMatch ?? phoneMatch));
```

4. JSX for mode pills (above input):
```tsx
<div className="inline-flex bg-muted rounded-full p-1 mb-2">
  {(["name", "email", "phone"] as const).map((m) => (
    <button
      key={m}
      onClick={() => { setMode(m); setQuery(""); setSelectedPartner(undefined); }}
      className={`px-3 py-1.5 rounded-full text-xs font-bold ${
        mode === m ? "bg-background shadow text-foreground" : "text-muted-foreground"
      }`}
    >
      {m === "name" ? "姓名" : m === "email" ? "メール" : "電話"}
    </button>
  ))}
</div>
```

5. Input with mode-specific placeholder:
```tsx
<input
  type={mode === "email" ? "email" : mode === "phone" ? "tel" : "text"}
  value={query}
  onChange={(e) => { setQuery(e.target.value); setSelectedPartner(undefined); }}
  placeholder={
    mode === "name" ? "パートナーの氏名を入力（例：佐藤 花子）" :
    mode === "email" ? "パートナーのメールアドレス" :
    "パートナーの電話番号"
  }
  className="w-full bg-card border border-border rounded-[8px] p-3 text-sm text-foreground"
/>
```

6. For name mode, show autocomplete dropdown when matches > 0 and not already selected:
```tsx
{mode === "name" && !selectedPartner && nameMatches.length > 0 && (
  <div className="bg-card border border-border rounded-[8px] mt-1 divide-y divide-border overflow-hidden">
    {nameMatches.map((p) => {
      const isPremium = PREMIUM_USERS.has(p.userId);
      return (
        <button
          key={p.userId}
          onClick={() => { setSelectedPartner(p); setQuery(p.name); }}
          className="w-full p-3 flex items-center justify-between hover:bg-muted/50 text-left"
        >
          <span className="text-sm text-foreground">{p.name}</span>
          {isPremium ? (
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">プレミアム</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">一般</span>
          )}
        </button>
      );
    })}
  </div>
)}
```

7. Verification card (existing logic) consumes `partner` (from step 3); reuse the existing 4 states (self / OK / not premium / not found).
   - For name mode: only show verification card when `selectedPartner` is set (otherwise dropdown is the affordance)
   - For email/phone mode: show verification card when `query.trim()` non-empty (single match attempt)

8. canSubmit logic adjusted to use computed `partner`.

9. submit() unchanged — still calls `registerForTournament(t.id, isDoubles ? partner?.userId : undefined)`.

**Verify + commit:**
```bash
npx tsc --noEmit
git add src/pages/TournamentEntry.tsx
git commit -m "TournamentEntry: 3-mode search (name autocomplete + email/phone exact)"
```

---

## Final: T6 verification

After all 5 tasks complete:
1. `npx tsc --noEmit` clean
2. `npx vite build` clean
3. Visual smoke test on dev server (port 8081):
   - `/game` ranking tab — pill toggle切換
   - `/game/tournament/t-pending-invite` — invitee CTAs
   - `/game/tournament/t-open` (with self as inviter after submitting an invite) — cancel button + dialog
   - `/game/tournament/t-open/entry` — 3-mode search
   - `/game` — orange hero clickable, no LiveMonthCard
4. Spec compliance + code quality review

---

**End of Plan.**
