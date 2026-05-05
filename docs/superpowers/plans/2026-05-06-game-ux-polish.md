# Game Tab UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正第一版 Game tab 的 4 個 UX 痛點：賽事詳情豐富化、隊友確認流程、成績頁優化（年度 accordion + 徽章）、GameHome 整合 LiveMonthCard。

**Architecture:** 在既有 `tournamentStore` 上加狀態（`pending_partner_confirmation` + 邀請 metadata + 內容 fields），抽出 4 個 `src/components/game/` 共用元件（LiveMonthCard / MonthRecapCard / TrophyChip / PendingInviteBanner），重做 GameHome / TournamentDetail / TournamentEntry / MyResults 的視覺結構。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + lucide-react + react-router-dom v6 + useSyncExternalStore（既有 in-memory store pattern）

**Spec:** `docs/superpowers/specs/2026-05-05-game-ux-polish-design.md`

**Verification model:** UI demo project, no backend. 每個 Task 結束驗證：`npx tsc --noEmit` clean + 視覺驗證（dev server 已在 port 8081）。

**Files this plan touches:**
- Modify: `src/lib/tournamentStore.ts`（加 metadata fields + 新 status + 4 新 store 函式）
- Modify: `src/lib/notificationStore.ts`（加 4 個 tournament_partner_* 類型）
- Modify: `src/pages/GameHome.tsx`（加 PendingInviteBanner + LiveMonthCard 區塊）
- Modify: `src/pages/TournamentDetail.tsx`（加 hero + 內容 sections + pending status 顯示）
- Modify: `src/pages/TournamentEntry.tsx`（toast + 流程文案）
- Modify: `src/pages/MyResults.tsx`（重做：LiveMonthCard + 徽章 + 年度 accordion）
- Modify: `src/pages/Notifications.tsx`（4 新 type 對映 + ICON_MAP）
- Modify: `src/App.tsx`（加 /game/invite/:entryId）
- Create: `src/pages/InviteConfirm.tsx`
- Create: `src/components/game/LiveMonthCard.tsx`
- Create: `src/components/game/MonthRecapCard.tsx`
- Create: `src/components/game/TrophyChip.tsx`
- Create: `src/components/game/PendingInviteBanner.tsx`
- Create: `src/lib/tournamentBadges.ts`（auto-derive 徽章邏輯）

---

## Phase A — Tournament Detail 豐富化（Tasks 1-2）

### Task 1: 擴充 `tournamentStore.ts` 加 metadata fields + demo data

**Files:**
- Modify: `src/lib/tournamentStore.ts`

- [ ] **Step 1: 修改 `Tournament` interface**

打開 `src/lib/tournamentStore.ts`，找到 `Tournament` interface（約在 type 定義區），在末尾加 4 個 optional 欄位：

```ts
export interface Tournament {
  id: string;
  title: string;
  format: TournamentFormat;
  capacity: TournamentCapacity;
  venue: string;
  scheduledAt: string;
  registrationDeadline: string;
  status: TournamentStatus;
  entries: TournamentEntry[];
  results?: TournamentResult;
  // ── new optional fields ──
  heroImageUrl?: string;
  description?: string;
  accessInfo?: string;
  contactInfo?: string;
}
```

- [ ] **Step 2: 在 `buildInitialState` 中為 4 場 demo 大會加豐富資料**

找到 `buildInitialState` 函式內的 `completedTournament`、`openTournament`、`inProgressTournament`、`upcomingTournament` 物件，在每個物件中加入下面對應的 metadata。

**`completedTournament`** — 加：
```ts
heroImageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=450&fit=crop",
description: "毎月恒例のシングルストーナメント。\n初級〜上級まで実力に応じてご参加いただけます。\n試合形式は8名による単一エリミネーションです。",
accessInfo: "JR 東京駅 八重洲口 徒歩7分\n地下駐車場あり（100台、有料）",
contactInfo: "LST 本店 03-1234-5678\nlst-tournament@example.co.jp",
```

**`openTournament`** — 加：
```ts
heroImageUrl: "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=800&h=450&fit=crop",
description: "ペアで挑む月例ダブルス大会。\nお馴染みのパートナーとチームを組んでご参加ください。\n16ペアの単一エリミネーション形式です。",
accessInfo: "東京メトロ 渋谷駅 徒歩5分\nビル 5F LST 本店コートB",
contactInfo: "LST 本店 03-1234-5678",
```

**`inProgressTournament`** — 加：
```ts
heroImageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&h=450&fit=crop",
description: "西支店主催のダブルス交流戦。\nレベル制限なし、楽しむことを重視した雰囲気の大会です。",
accessInfo: "西武新宿線 上石神井駅 徒歩10分\nLST 西支店コート1",
contactInfo: "LST 西支店 042-345-6789",
```

**`upcomingTournament`** — 加：
```ts
heroImageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=450&fit=crop",
description: "5月最大のシングルストーナメント。\n32名定員、3週間にわたる本格大会。\nランキング上位入賞で月間積分大幅獲得。",
accessInfo: "JR 東京駅 八重洲口 徒歩7分\nLST 本店コートA",
contactInfo: "LST 本店 03-1234-5678",
```

- [ ] **Step 3: TS 驗證**

```bash
cd /Users/tinatzan/Projects/clients/2026-04-lst-userapp && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/tournamentStore.ts
git commit -m "tournamentStore: add hero image + description + access + contact fields with demo data"
```

---

### Task 2: 重做 `TournamentDetail.tsx`（hero 圖 + 內容 sections）

**Files:**
- Modify: `src/pages/TournamentDetail.tsx`

**注意：本 task 只加 hero 圖 + 3 個內容 sections，不動 myEntry/status 邏輯。Pending status UI 由 Task 7 在 status type 擴充後再 patch。**

- [ ] **Step 1: 整段重寫 TournamentDetail.tsx**

整段覆蓋 `src/pages/TournamentDetail.tsx`：

```tsx
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, getPlayer } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { Calendar, MapPin, Users, Trophy, Diamond, Lock, Phone, Train, Info } from "lucide-react";

function formatDateTimeJP(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const ROUND_LABEL: Record<number, string> = {
  1: "1回戦",
  2: "準決勝",
  3: "決勝",
  4: "決勝",
};

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTournament } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();

  const t = id ? getTournament(id) : undefined;

  if (!t) {
    return (
      <InnerPageLayout title="大会詳細">
        <p className="text-center text-sm text-muted-foreground">大会が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const myEntry = t.entries.find(
    (e) => e.status === "confirmed" &&
      (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
  );
  const isOpen = t.status === "registration_open";
  const canRegister = isOpen && !myEntry && t.entries.length < t.capacity;

  const handleEntry = () => {
    if (!isPremium) {
      navigate("/premium/plan");
      return;
    }
    navigate(`/game/tournament/${t.id}/entry`);
  };

  return (
    <InnerPageLayout
      title="大会詳細"
      ctaLabel={
        myEntry
          ? "エントリー済"
          : !isOpen
          ? undefined
          : !canRegister
          ? "定員に達しました"
          : isPremium
          ? "エントリーする"
          : "プレミアム会員になってエントリー"
      }
      ctaDisabled={!!myEntry || !canRegister}
      onCtaClick={handleEntry}
    >
      {/* Hero image */}
      {t.heroImageUrl && (
        <div className="-mx-[20px] -mt-6 mb-4 aspect-video bg-muted overflow-hidden">
          <img src={t.heroImageUrl} alt={t.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title + meta */}
      <div className="mb-4">
        <p className="text-base font-bold text-foreground">{t.title}</p>
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            {formatDateTimeJP(t.scheduledAt)}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {t.venue}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            {t.format === "singles" ? "シングルス" : "ダブルス"} / 上限 {t.capacity} 枠
          </p>
        </div>
        {isOpen && (
          <div className="bg-muted rounded-[6px] p-2 mt-3 text-[11px] text-foreground">
            エントリー受付中：{t.entries.length} / {t.capacity}　
            締切 {formatDateTimeJP(t.registrationDeadline)}
          </div>
        )}
        {myEntry && (
          <div className="bg-primary/10 text-primary rounded-[6px] p-2 mt-3 text-[11px] font-bold flex items-center gap-1">
            <Diamond className="w-3 h-3" />
            エントリー済
            {myEntry.partnerUserId && ` ・ パートナー: ${getPlayer(myEntry.partnerUserId)?.name ?? "—"}`}
          </div>
        )}
      </div>

      {/* Description */}
      {t.description && (
        <section className="mb-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-muted-foreground" />
            大会について
          </p>
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{t.description}</p>
        </section>
      )}

      {/* Access */}
      {t.accessInfo && (
        <section className="mb-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Train className="w-4 h-4 text-muted-foreground" />
            アクセス
          </p>
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{t.accessInfo}</p>
        </section>
      )}

      {/* Contact */}
      {t.contactInfo && (
        <section className="mb-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-muted-foreground" />
            お問い合わせ
          </p>
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{t.contactInfo}</p>
        </section>
      )}

      {/* Premium gating notice for non-premium */}
      {isOpen && !isPremium && (
        <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex gap-2 mb-4">
          <Lock className="w-5 h-5 text-accent-yellow flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground">プレミアム会員限定</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              月額 ¥500 のプレミアム会員になると大会エントリーが可能になります。
            </p>
          </div>
        </div>
      )}

      {/* Completed: bracket + rankings */}
      {t.status === "completed" && t.results && (
        <>
          <p className="text-sm font-bold text-foreground mt-2 mb-2 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            最終結果
          </p>
          <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden mb-4">
            {t.results.rankings.map((r) => {
              const isMine = r.userId === CURRENT_USER || r.partnerId === CURRENT_USER;
              const player = getPlayer(r.userId);
              const partner = r.partnerId ? getPlayer(r.partnerId) : undefined;
              return (
                <div key={r.rank} className={`p-3 flex items-center gap-3 ${isMine ? "bg-primary/5" : ""}`}>
                  <div className="w-8 text-center font-bold text-sm text-muted-foreground">{r.rank}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMine ? "text-primary" : "text-foreground"}`}>
                      {player?.name ?? r.userId}
                      {partner && ` × ${partner.name}`}
                      {isMine && <span className="text-[10px] ml-1">（自分）</span>}
                    </p>
                  </div>
                  {r.rank <= 3 && (
                    <Trophy
                      className={`w-4 h-4 ${
                        r.rank === 1 ? "text-yellow-600" : r.rank === 2 ? "text-gray-400" : "text-amber-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm font-bold text-foreground mb-2">対戦記録</p>
          <div className="space-y-1.5 mb-4">
            {t.results.matches.map((m, i) => {
              const p1 = getPlayer(m.p1UserId)?.name ?? m.p1UserId;
              const p2 = getPlayer(m.p2UserId)?.name ?? m.p2UserId;
              const winner = m.winnerSide === 1 ? p1 : p2;
              return (
                <div key={i} className="bg-card border border-border rounded-[6px] p-2.5 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-muted-foreground">{ROUND_LABEL[m.round]}</span>
                  <span className="text-foreground flex-1 mx-2 text-center">{p1} vs {p2}</span>
                  <span className="text-foreground font-bold">{m.score}</span>
                  <span className="text-[10px] text-primary ml-2">勝: {winner.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </InnerPageLayout>
  );
};

export default TournamentDetail;
```

Pending UI 留待 Task 7（在 status type 擴充後再 patch）。

- [ ] **Step 2: TS 驗證 + commit**

```bash
npx tsc --noEmit
git add src/pages/TournamentDetail.tsx
git commit -m "TournamentDetail: hero image + description/access/contact sections"
```

---

## Phase B — 隊友確認流程（Tasks 3-7）

### Task 3: tournamentStore 加 partner-confirmation 狀態 + functions

**Files:**
- Modify: `src/lib/tournamentStore.ts`

- [ ] **Step 1: 修改 `TournamentEntry` interface**

打開 `src/lib/tournamentStore.ts`，找到 `TournamentEntry` interface，改為：

```ts
export interface TournamentEntry {
  id: string;
  tournamentId: string;
  registrantUserId: string;
  partnerUserId?: string;
  registeredAt: string;
  status: "pending_partner_confirmation" | "confirmed" | "cancelled" | "declined";
  invitedAt?: string;
  expiresAt?: string;
  partnerRespondedAt?: string;
  partnerDeclineReason?: string;
}
```

- [ ] **Step 2: 加常數 + helper**

在 `tournamentStore.ts` 最上方常數區（POINTS_PODIUM 之後）加：

```ts
export const PARTNER_INVITE_HOURS = 72;
```

在 `getPlayer` 之後加 helper：

```ts
function computeExpiresAt(invitedAt: string, registrationDeadline: string): string {
  const expireFrom72h = new Date(invitedAt);
  expireFrom72h.setHours(expireFrom72h.getHours() + PARTNER_INVITE_HOURS);
  const deadline = new Date(registrationDeadline);
  return (expireFrom72h < deadline ? expireFrom72h : deadline).toISOString();
}
```

- [ ] **Step 3: 改寫 `registerForTournament`**

找到 `registerForTournament` 函式，改為：

```ts
const registerForTournament = useCallback(
  (tournamentId: string, partnerUserId?: string): { ok: boolean; error?: string } => {
    const t = state.tournaments.find((x) => x.id === tournamentId);
    if (!t) return { ok: false, error: "大会が見つかりません" };
    if (t.status !== "registration_open") return { ok: false, error: "現在エントリーを受け付けていません" };
    if (t.format === "doubles" && !partnerUserId) return { ok: false, error: "パートナーを指定してください" };
    if (partnerUserId && !PREMIUM_USERS.has(partnerUserId)) {
      return { ok: false, error: "パートナーがプレミアム会員ではないため、エントリーできません" };
    }
    if (t.entries.length >= t.capacity) return { ok: false, error: "定員に達しました" };

    const now = new Date().toISOString();
    const isDoubles = t.format === "doubles";
    const entry: TournamentEntry = {
      id: `e-${Date.now()}`,
      tournamentId,
      registrantUserId: CURRENT_USER,
      partnerUserId,
      registeredAt: now,
      status: isDoubles ? "pending_partner_confirmation" : "confirmed",
      ...(isDoubles && {
        invitedAt: now,
        expiresAt: computeExpiresAt(now, t.registrationDeadline),
      }),
    };
    state = {
      ...state,
      tournaments: state.tournaments.map((x) =>
        x.id === tournamentId ? { ...x, entries: [...x.entries, entry] } : x
      ),
    };
    emit();

    if (isDoubles) {
      addNotification({
        type: "tournament_partner_invited",
        title: "大会の招待が届きました",
        message: `田中 太郎さんから「${t.title}」への招待が届きました。${PARTNER_INVITE_HOURS}時間以内に回答してください。`,
      });
    } else {
      addNotification({
        type: "tournament_registration_confirmed",
        title: "大会のエントリーが完了しました",
        message: `${t.title}のエントリーを受け付けました。`,
      });
    }
    return { ok: true };
  },
  []
);
```

- [ ] **Step 4: 加 4 個新 functions**

在 `registerForTournament` 之後加：

```ts
const acceptPartnerInvite = useCallback((entryId: string): { ok: boolean; error?: string } => {
  let foundTournament: Tournament | undefined;
  state = {
    ...state,
    tournaments: state.tournaments.map((t) => {
      const idx = t.entries.findIndex(
        (e) => e.id === entryId && e.status === "pending_partner_confirmation"
      );
      if (idx < 0) return t;
      foundTournament = t;
      const updated = [...t.entries];
      updated[idx] = {
        ...updated[idx],
        status: "confirmed",
        partnerRespondedAt: new Date().toISOString(),
      };
      return { ...t, entries: updated };
    }),
  };
  if (!foundTournament) return { ok: false, error: "招待が見つかりません" };
  emit();
  addNotification({
    type: "tournament_partner_accepted",
    title: "パートナーが招待を承諾しました",
    message: `${foundTournament.title} のエントリーが確定しました。`,
  });
  return { ok: true };
}, []);

const declinePartnerInvite = useCallback(
  (entryId: string, reason?: string): { ok: boolean; error?: string } => {
    let foundTournament: Tournament | undefined;
    state = {
      ...state,
      tournaments: state.tournaments.map((t) => {
        const idx = t.entries.findIndex(
          (e) => e.id === entryId && e.status === "pending_partner_confirmation"
        );
        if (idx < 0) return t;
        foundTournament = t;
        const updated = [...t.entries];
        updated[idx] = {
          ...updated[idx],
          status: "cancelled",
          partnerRespondedAt: new Date().toISOString(),
          partnerDeclineReason: reason,
        };
        return { ...t, entries: updated };
      }),
    };
    if (!foundTournament) return { ok: false, error: "招待が見つかりません" };
    emit();
    addNotification({
      type: "tournament_partner_declined",
      title: "パートナーが招待を辞退しました",
      message: `${foundTournament.title} のエントリーがキャンセルされました。${reason ? `理由: ${reason}` : ""}`,
    });
    return { ok: true };
  },
  []
);

const getEntry = useCallback((entryId: string) => {
  for (const t of data.tournaments) {
    const e = t.entries.find((x) => x.id === entryId);
    if (e) return { entry: e, tournament: t };
  }
  return undefined;
}, [data.tournaments]);

const getPendingInvitesForUser = useCallback(() => {
  const result: { entry: TournamentEntry; tournament: Tournament }[] = [];
  for (const t of data.tournaments) {
    for (const e of t.entries) {
      if (e.status === "pending_partner_confirmation" && e.partnerUserId === CURRENT_USER) {
        result.push({ entry: e, tournament: t });
      }
    }
  }
  return result;
}, [data.tournaments]);
```

- [ ] **Step 5: 暴露新 functions**

找到 hook return 物件，將 `registerForTournament` 那一行附近的物件改為：

```ts
return {
  ...data,
  getTournament,
  getMyEntries,
  registerForTournament,
  acceptPartnerInvite,
  declinePartnerInvite,
  getEntry,
  getPendingInvitesForUser,
  getCompletedTournaments,
  computeMyMonthlyScore: (ym: string) => computePersonalMonthlyScore(CURRENT_USER, ym, data.tournaments),
  computeRanking: (ym: string) => computeMonthlyRanking(ym, data.tournaments),
};
```

- [ ] **Step 6: 在 `getMyEntries` 中也包含 pending 狀態**

找到 `getMyEntries`，改為：

```ts
const getMyEntries = useCallback(() => {
  return data.tournaments
    .filter((t) =>
      t.entries.some(
        (e) =>
          (e.status === "confirmed" || e.status === "pending_partner_confirmation") &&
          (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
      )
    );
}, [data.tournaments]);
```

- [ ] **Step 7: 修改 demo data — 把 `openTournament` 中既有 entries 都加上 `status: "confirmed"` (already done) — 只要確保新 status type 沒 break 既有 demo**

既有 demo data 都有 `status: "confirmed"`，不用改。

加 1 場新 demo `t-pending-invite`，在 `buildInitialState` 中加（在 `upcomingTournament` 之後、`return` 之前）：

```ts
const in10days = new Date(now.getTime() + 10 * 86400000).toISOString();
const in9days = new Date(now.getTime() + 9 * 86400000).toISOString();
const inviteSentAt = new Date(now.getTime() - 24 * 3600000).toISOString(); // 24h ago

const pendingInviteTournament: Tournament = {
  id: "t-pending-invite",
  title: "5月度 ダブルストーナメント",
  format: "doubles",
  capacity: 8,
  venue: "LST 西支店コート2",
  scheduledAt: in10days,
  registrationDeadline: in9days,
  status: "registration_open",
  heroImageUrl: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&h=450&fit=crop",
  description: "西支店主催のダブルストーナメント。\n気軽にご参加ください。",
  accessInfo: "西武新宿線 上石神井駅 徒歩10分\nLST 西支店コート2",
  contactInfo: "LST 西支店 042-345-6789",
  entries: [
    {
      id: "e-pi1",
      tournamentId: "t-pending-invite",
      registrantUserId: "user-002",
      partnerUserId: CURRENT_USER,
      registeredAt: inviteSentAt,
      status: "pending_partner_confirmation",
      invitedAt: inviteSentAt,
      expiresAt: computeExpiresAt(inviteSentAt, in9days),
    },
  ],
};
```

並把 `pendingInviteTournament` 加到 `return` 的 `tournaments` array：

```ts
return {
  tournaments: [
    inProgressTournament,
    openTournament,
    pendingInviteTournament,  // ← 新
    upcomingTournament,
    completedTournament,
  ],
};
```

- [ ] **Step 8: TS 驗證 + commit**

```bash
npx tsc --noEmit
git add src/lib/tournamentStore.ts
git commit -m "tournamentStore: pending_partner_confirmation status + accept/decline + 72h expiry + demo invite tournament"
```

---

### Task 4: notificationStore 加 4 個 partner_* 通知類型

**Files:**
- Modify: `src/lib/notificationStore.ts`

- [ ] **Step 1: 修改 type union**

打開 `src/lib/notificationStore.ts`，找到 `PushNotification.type` union，加 4 個新 type：

```ts
type:
  | "booking_confirmed"
  | "booking_rejected"
  | "lesson_started"
  | "lesson_completed"
  | "change_approved"
  | "change_rejected"
  | "booking_cancelled"
  | "online_link"
  | "review_request"
  | "tournament_registration_confirmed"
  | "tournament_partner_invited"
  | "tournament_partner_accepted"
  | "tournament_partner_declined"
  | "tournament_partner_expired"
  | "tournament_starting_soon"
  | "tournament_results_published"
  | "monthly_ranking_finalized";
```

- [ ] **Step 2: 在 seed 加 1 筆 partner_invited demo notification**

找到 `seedDemoNotifications` 內 `demoNotifs` array，找到 `tournament_results_published` 那筆，**之前**插入：

```ts
{
  type: "tournament_partner_invited",
  title: "大会の招待が届きました",
  message: "佐藤 花子さんから「5月度 ダブルストーナメント」への招待が届きました。72時間以内に回答してください。",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  read: false,
},
```

- [ ] **Step 3: TS 驗證 + commit**

```bash
npx tsc --noEmit
git add src/lib/notificationStore.ts
git commit -m "notificationStore: add 4 tournament_partner_* notification types + invite demo"
```

---

### Task 5: 建立 `PendingInviteBanner` 元件

**Files:**
- Create: `src/components/game/PendingInviteBanner.tsx`

- [ ] **Step 1: 建立資料夾 + 元件**

```bash
mkdir -p /Users/tinatzan/Projects/clients/2026-04-lst-userapp/src/components/game
```

寫入 `src/components/game/PendingInviteBanner.tsx`：

```tsx
import { useNavigate } from "react-router-dom";
import { useTournamentStore, getPlayer } from "@/lib/tournamentStore";
import { Mail, Clock } from "lucide-react";

function hoursUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 3600000));
}

const PendingInviteBanner = () => {
  const navigate = useNavigate();
  const { getPendingInvitesForUser } = useTournamentStore();
  const invites = getPendingInvitesForUser();

  if (invites.length === 0) return null;

  return (
    <div className="px-[20px] mb-3 space-y-2">
      {invites.map(({ entry, tournament }) => {
        const inviter = getPlayer(entry.registrantUserId)?.name ?? entry.registrantUserId;
        const remaining = entry.expiresAt ? hoursUntil(entry.expiresAt) : 0;
        return (
          <button
            key={entry.id}
            onClick={() => navigate(`/game/invite/${entry.id}`)}
            className="w-full bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex items-start gap-2 text-left hover:bg-accent-yellow/15 transition-colors"
          >
            <Mail className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">
                {inviter}さんから「{tournament.title}」への招待
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                残り {remaining} 時間
              </p>
            </div>
            <span className="text-[10px] font-bold text-accent-yellow flex-shrink-0">確認 ›</span>
          </button>
        );
      })}
    </div>
  );
};

export default PendingInviteBanner;
```

- [ ] **Step 2: TS + commit**

```bash
npx tsc --noEmit
git add src/components/game/PendingInviteBanner.tsx
git commit -m "Add PendingInviteBanner component"
```

---

### Task 6: 建立 `InviteConfirm.tsx` 頁面 + 路由

**Files:**
- Create: `src/pages/InviteConfirm.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 建立 InviteConfirm.tsx**

寫入 `src/pages/InviteConfirm.tsx`：

```tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, getPlayer } from "@/lib/tournamentStore";
import { Calendar, MapPin, Users, Clock, AlertCircle } from "lucide-react";

function formatDateTimeJP(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function hoursUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 3600000));
}

const DECLINE_REASONS = [
  "予定が合わない",
  "他の大会に参加予定",
  "今回は見送ります",
  "その他",
];

const InviteConfirm = () => {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { getEntry, acceptPartnerInvite, declinePartnerInvite } = useTournamentStore();

  const found = entryId ? getEntry(entryId) : undefined;
  const [showDecline, setShowDecline] = useState(false);
  const [reason, setReason] = useState<string>("");

  if (!found) {
    return (
      <InnerPageLayout title="招待確認">
        <p className="text-center text-sm text-muted-foreground">招待が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const { entry, tournament } = found;
  const inviter = getPlayer(entry.registrantUserId);
  const remaining = entry.expiresAt ? hoursUntil(entry.expiresAt) : 0;

  if (entry.status !== "pending_partner_confirmation") {
    return (
      <InnerPageLayout title="招待確認">
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-sm text-muted-foreground">
            この招待は既に処理済みです（{entry.status === "confirmed" ? "承諾済" : "辞退済"}）
          </p>
          <button
            onClick={() => navigate(`/game/tournament/${tournament.id}`)}
            className="text-xs text-primary font-bold mt-3"
          >
            大会詳細へ ›
          </button>
        </div>
      </InnerPageLayout>
    );
  }

  const handleAccept = () => {
    const r = acceptPartnerInvite(entry.id);
    if (r.ok) navigate(`/game/tournament/${tournament.id}`);
  };

  const handleDecline = () => {
    if (!reason) return;
    declinePartnerInvite(entry.id, reason);
    navigate("/game");
  };

  return (
    <InnerPageLayout title="招待確認">
      <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex gap-2 mb-4">
        <Clock className="w-5 h-5 text-accent-yellow flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground">残り {remaining} 時間</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {entry.expiresAt && `${formatDateTimeJP(entry.expiresAt)}までに回答してください`}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[8px] p-4 mb-4">
        <p className="text-[11px] text-muted-foreground">招待者</p>
        <p className="text-sm font-bold text-foreground mt-0.5">{inviter?.name ?? entry.registrantUserId} さん</p>
        <div className="border-t border-border mt-3 pt-3">
          <p className="text-base font-bold text-foreground">{tournament.title}</p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateTimeJP(tournament.scheduledAt)}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              {tournament.venue}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              {tournament.format === "singles" ? "シングルス" : "ダブルス"} / 上限 {tournament.capacity} 枠
            </p>
          </div>
        </div>
      </div>

      {!showDecline ? (
        <div className="space-y-2">
          <button
            onClick={handleAccept}
            className="w-full h-12 rounded-[8px] bg-primary text-primary-foreground font-bold"
          >
            承諾してエントリーする
          </button>
          <button
            onClick={() => setShowDecline(true)}
            className="w-full h-12 rounded-[8px] border border-border bg-background text-foreground font-bold"
          >
            辞退する
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-[8px] p-4">
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            辞退理由を選択してください
          </p>
          <div className="space-y-2 mb-3">
            {DECLINE_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2 px-3 py-3 border rounded-[8px] cursor-pointer ${
                  reason === r ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <input
                  type="radio"
                  name="decline-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-foreground">{r}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleDecline}
            disabled={!reason}
            className="w-full h-12 rounded-[8px] bg-destructive text-destructive-foreground font-bold disabled:opacity-40 mb-2"
          >
            辞退を確定する
          </button>
          <button
            onClick={() => { setShowDecline(false); setReason(""); }}
            className="w-full h-10 rounded-[8px] border border-border bg-background text-foreground text-sm font-bold"
          >
            キャンセル
          </button>
        </div>
      )}
    </InnerPageLayout>
  );
};

export default InviteConfirm;
```

- [ ] **Step 2: 加 import + route 到 App.tsx**

打開 `src/App.tsx`，在 `MyResults` import 之後加：

```tsx
import InviteConfirm from "./pages/InviteConfirm.tsx";
```

在 `<Route path="/game/my-results" element={<MyResults />} />` 之後加：

```tsx
<Route path="/game/invite/:entryId" element={<InviteConfirm />} />
```

- [ ] **Step 3: TS + commit**

```bash
npx tsc --noEmit
git add src/pages/InviteConfirm.tsx src/App.tsx
git commit -m "Add /game/invite/:entryId page for partner invitation accept/decline"
```

---

### Task 7: GameHome 加 PendingInviteBanner + TournamentDetail 補 pending status UI + Notifications ICON_MAP 補新類型

**Files:**
- Modify: `src/pages/GameHome.tsx`
- Modify: `src/pages/TournamentDetail.tsx`
- Modify: `src/pages/TournamentEntry.tsx`
- Modify: `src/pages/Notifications.tsx`

- [ ] **Step 1: GameHome 加 banner**

打開 `src/pages/GameHome.tsx`，加 import：

```tsx
import PendingInviteBanner from "@/components/game/PendingInviteBanner";
```

找到 `<header className="bg-gray-5 py-3 pb-[120px]">` 那段（hero header），在它的 closing `</header>` 之後、`{/* Hero */}` 之前插入：

```tsx
        <PendingInviteBanner />
```

注意 banner 應該在 hero 卡之上。但 hero 卡用 `-mt-[100px]` 把 hero 拉到 header 上重疊。讓我們把 banner 放在 hero 卡之後（hero 的 `</div>` 之後）：

找到第一個 `<div className="-mt-[100px] relative z-10 px-[20px]">`...`</div>` 的閉合，在 `</div>` 之後、`{/* LiveMonthCard 區塊 */}` 或 `<div className="mt-5">` 之前，插入：

```tsx
        <div className="mt-4">
          <PendingInviteBanner />
        </div>
```

- [ ] **Step 2: TournamentDetail 加 pending status 顯示**

打開 `src/pages/TournamentDetail.tsx`。

找到既有的 `myEntry` find：
```ts
const myEntry = t.entries.find(
  (e) => e.status === "confirmed" &&
    (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
);
```

改為：
```ts
const myEntry = t.entries.find(
  (e) =>
    (e.status === "confirmed" || e.status === "pending_partner_confirmation") &&
    (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
);
```

找到 CTA `ctaLabel`：
```ts
ctaLabel={
  myEntry
    ? "エントリー済"
    ...
}
```

改為：
```ts
ctaLabel={
  myEntry
    ? myEntry.status === "pending_partner_confirmation"
      ? "パートナー確認待ち"
      : "エントリー済"
    : !isOpen
    ? undefined
    : !canRegister
    ? "定員に達しました"
    : isPremium
    ? "エントリーする"
    : "プレミアム会員になってエントリー"
}
```

找到既有的 `myEntry &&` 那個顯示 `エントリー済` 的 div block，把整段改為兩個 div：

```tsx
{myEntry && myEntry.status === "confirmed" && (
  <div className="bg-primary/10 text-primary rounded-[6px] p-2 mt-3 text-[11px] font-bold flex items-center gap-1">
    <Diamond className="w-3 h-3" />
    エントリー済
    {myEntry.partnerUserId && ` ・ パートナー: ${getPlayer(myEntry.partnerUserId)?.name ?? "—"}`}
  </div>
)}
{myEntry && myEntry.status === "pending_partner_confirmation" && (
  <div className="bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 rounded-[6px] p-2 mt-3 text-[11px] font-bold flex items-center gap-1">
    <Clock className="w-3 h-3" />
    {myEntry.registrantUserId === CURRENT_USER
      ? `パートナー確認待ち (${getPlayer(myEntry.partnerUserId ?? "")?.name ?? "—"})`
      : "あなたの承諾待ち"}
  </div>
)}
```

加 `Clock` 到 lucide imports。

- [ ] **Step 3: TournamentEntry 改成功 toast + 文案調整**

打開 `src/pages/TournamentEntry.tsx`。找到 `submit` 函式：

```ts
const submit = () => {
  setError(null);
  const result = registerForTournament(t.id, isDoubles ? partner?.userId : undefined);
  if (!result.ok) {
    setError(result.error ?? "エントリーに失敗しました");
    return;
  }
  navigate(`/game/tournament/${t.id}`);
};
```

改為：

```ts
const submit = () => {
  setError(null);
  const result = registerForTournament(t.id, isDoubles ? partner?.userId : undefined);
  if (!result.ok) {
    setError(result.error ?? "エントリーに失敗しました");
    return;
  }
  toast({
    title: isDoubles ? "パートナーに招待を送信しました" : "エントリーが完了しました",
    description: isDoubles ? "72時間以内にパートナーが承諾すると確定します" : undefined,
  });
  navigate(`/game/tournament/${t.id}`);
};
```

加 import：

```tsx
import { useToast } from "@/components/ui/use-toast";
```

並在 component 開頭加：

```tsx
const { toast } = useToast();
```

- [ ] **Step 4: Notifications.tsx ICON_MAP 補新類型**

打開 `src/pages/Notifications.tsx`，找到 ICON_MAP 物件，加 4 個 entries（用既有的 icon 為主）：

```ts
tournament_partner_invited: { icon: Mail, color: "text-accent-yellow" },
tournament_partner_accepted: { icon: Check, color: "text-primary" },
tournament_partner_declined: { icon: X, color: "text-destructive" },
tournament_partner_expired: { icon: Clock, color: "text-muted-foreground" },
```

確認 `Mail`, `Check`, `X`, `Clock` 都已在 lucide imports；如缺則加。

- [ ] **Step 5: TS + commit**

```bash
npx tsc --noEmit
git add src/pages/GameHome.tsx src/pages/TournamentDetail.tsx src/pages/TournamentEntry.tsx src/pages/Notifications.tsx
git commit -m "Wire partner-invite flow: GameHome banner + pending status UI + entry toast + notification icons"
```

---

## Phase C+D — 成績頁優化 + GameHome 整合（Tasks 8-12）

### Task 8: 建立 `tournamentBadges.ts` (auto-derive 徽章)

**Files:**
- Create: `src/lib/tournamentBadges.ts`

- [ ] **Step 1: 寫入 `tournamentBadges.ts`**

```ts
import type { Tournament } from "@/lib/tournamentStore";

export type BadgeType = "champion" | "runner_up" | "third_place" | "first_entry";

export interface Badge {
  type: BadgeType;
  label: string;
  emoji: string;
  count: number;
  description: string;
}

const LABEL: Record<BadgeType, { label: string; emoji: string; description: string }> = {
  champion: { label: "優勝", emoji: "🥇", description: "1位" },
  runner_up: { label: "準優勝", emoji: "🥈", description: "2位入賞" },
  third_place: { label: "第3位", emoji: "🥉", description: "3位入賞" },
  first_entry: { label: "初出場", emoji: "🎯", description: "初めての参加" },
};

export function deriveUserBadges(userId: string, tournaments: Tournament[]): Badge[] {
  const completed = tournaments.filter((t) => t.status === "completed" && t.results);
  const counts: Record<BadgeType, number> = {
    champion: 0,
    runner_up: 0,
    third_place: 0,
    first_entry: 0,
  };

  let participated = 0;
  for (const t of completed) {
    const isMine = t.entries.some(
      (e) => e.status === "confirmed" && (e.registrantUserId === userId || e.partnerUserId === userId)
    );
    if (!isMine) continue;
    participated++;
    const myRank = t.results!.rankings.find((r) => r.userId === userId || r.partnerId === userId);
    if (myRank?.rank === 1) counts.champion++;
    else if (myRank?.rank === 2) counts.runner_up++;
    else if (myRank?.rank === 3) counts.third_place++;
  }

  if (participated >= 1) counts.first_entry = 1;

  const result: Badge[] = [];
  (Object.keys(counts) as BadgeType[]).forEach((type) => {
    if (counts[type] > 0) {
      result.push({
        type,
        label: LABEL[type].label,
        emoji: LABEL[type].emoji,
        count: counts[type],
        description: LABEL[type].description,
      });
    }
  });
  return result;
}
```

- [ ] **Step 2: TS + commit**

```bash
npx tsc --noEmit
git add src/lib/tournamentBadges.ts
git commit -m "Add tournamentBadges: auto-derive user achievement badges from completed tournaments"
```

---

### Task 9: 建立 `TrophyChip` 元件

**Files:**
- Create: `src/components/game/TrophyChip.tsx`

- [ ] **Step 1: 寫入 `src/components/game/TrophyChip.tsx`**

```tsx
import type { Badge } from "@/lib/tournamentBadges";

interface Props {
  badge: Badge;
}

const TrophyChip = ({ badge }: Props) => (
  <div className="flex-shrink-0 w-[88px] bg-card border border-border rounded-[8px] p-3 text-center">
    <div className="text-2xl">{badge.emoji}</div>
    <p className="text-[11px] font-bold text-foreground mt-1">{badge.label}</p>
    <p className="text-[10px] text-primary font-bold mt-0.5">×{badge.count}</p>
    <p className="text-[9px] text-muted-foreground mt-0.5">{badge.description}</p>
  </div>
);

export default TrophyChip;
```

- [ ] **Step 2: TS + commit**

```bash
npx tsc --noEmit
git add src/components/game/TrophyChip.tsx
git commit -m "Add TrophyChip component"
```

---

### Task 10: 建立 `LiveMonthCard` 共用元件

**Files:**
- Create: `src/components/game/LiveMonthCard.tsx`

- [ ] **Step 1: 寫入 `src/components/game/LiveMonthCard.tsx`**

```tsx
import { ChevronRight, TrendingUp } from "lucide-react";

interface Props {
  variant: "compact" | "full";
  yearMonthLabel: string;        // ex: "2026年5月"
  totalScore: number;
  rank: number | null;
  played: number;
  cta?: string;                  // ex: "あと 50 点で 3 位"  (only used in full variant)
  onClick?: () => void;          // compact 變成 button
}

const LiveMonthCard = ({ variant, yearMonthLabel, totalScore, rank, played, cta, onClick }: Props) => {
  if (variant === "compact") {
    const inner = (
      <div className="bg-card border border-border rounded-[8px] p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground">{yearMonthLabel} の成績</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-primary">{totalScore}</span>
            <span className="text-[11px] text-muted-foreground">積分</span>
            {rank !== null && (
              <span className="text-xs font-bold text-foreground ml-1">{rank}位</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">出場 {played} 試合</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    );
    return onClick ? (
      <button onClick={onClick} className="w-full text-left">{inner}</button>
    ) : inner;
  }

  // full variant
  return (
    <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5">
      <p className="text-[11px] opacity-80">{yearMonthLabel}（進行中）</p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-4xl font-bold text-primary">{totalScore}</span>
        <span className="text-sm opacity-80">積分</span>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <div>
          <p className="text-[10px] opacity-70">即時順位</p>
          <p className="text-base font-bold">{rank !== null ? `${rank}位` : "—"}</p>
        </div>
        <div className="w-px h-8 bg-white/20" />
        <div>
          <p className="text-[10px] opacity-70">出場</p>
          <p className="text-base font-bold">{played} 試合</p>
        </div>
      </div>
      {cta && (
        <div className="bg-primary/20 rounded-[6px] p-2 mt-4 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <p className="text-[11px] font-bold text-primary">{cta}</p>
        </div>
      )}
    </div>
  );
};

export default LiveMonthCard;
```

- [ ] **Step 2: TS + commit**

```bash
npx tsc --noEmit
git add src/components/game/LiveMonthCard.tsx
git commit -m "Add LiveMonthCard component (compact + full variants)"
```

---

### Task 11: 建立 `MonthRecapCard` 元件

**Files:**
- Create: `src/components/game/MonthRecapCard.tsx`

- [ ] **Step 1: 寫入 `src/components/game/MonthRecapCard.tsx`**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import type { PersonalMonthlyScore } from "@/lib/tournamentStore";

interface Props {
  score: PersonalMonthlyScore;
  isCurrent?: boolean;
}

function formatYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

const MonthRecapCard = ({ score, isCurrent }: Props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const trophy = score.bestRank === 1 ? "🥇" : score.bestRank === 2 ? "🥈" : score.bestRank === 3 ? "🥉" : null;

  return (
    <div className="bg-card border border-border rounded-[8px] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-foreground">{formatYM(score.yearMonth)}</p>
            {isCurrent && (
              <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">今月</span>
            )}
            {trophy && <span className="text-base">{trophy}</span>}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            出場 {score.tournaments.length} 大会 ・ {score.won}勝{score.played - score.won}敗
            {score.bestRank ? ` ・ 最高 ${score.bestRank}位` : ""}
          </p>
        </div>
        <p className="text-lg font-bold text-primary">{score.total}</p>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-3 bg-muted/20">
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="bg-card rounded-[6px] p-2">
              <p className="text-[10px] text-muted-foreground">参加</p>
              <p className="text-sm font-bold text-foreground">+{score.participation}</p>
            </div>
            <div className="bg-card rounded-[6px] p-2">
              <p className="text-[10px] text-muted-foreground">勝利</p>
              <p className="text-sm font-bold text-foreground">+{score.wins}</p>
            </div>
            <div className="bg-card rounded-[6px] p-2">
              <p className="text-[10px] text-muted-foreground">入賞</p>
              <p className="text-sm font-bold text-foreground">+{score.podiumBonus}</p>
            </div>
          </div>
          {score.tournaments.length > 0 && (
            <div className="space-y-1.5">
              {score.tournaments.map((tt) => (
                <button
                  key={tt.tournamentId}
                  onClick={() => navigate(`/game/tournament/${tt.tournamentId}`)}
                  className="w-full bg-card rounded-[6px] p-2 text-left flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1">
                      {tt.title}
                      {tt.finalRank && tt.finalRank <= 3 && (
                        <Trophy className={`w-3 h-3 ${tt.finalRank === 1 ? "text-yellow-600" : tt.finalRank === 2 ? "text-gray-400" : "text-amber-700"}`} />
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tt.matchesPlayed}試合 {tt.matchesWon}勝
                      {tt.finalRank ? ` ・ 最終 ${tt.finalRank}位` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">+{tt.score}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthRecapCard;
```

- [ ] **Step 2: TS + commit**

```bash
npx tsc --noEmit
git add src/components/game/MonthRecapCard.tsx
git commit -m "Add MonthRecapCard component (collapsible past-month recap)"
```

---

### Task 12: 重做 `MyResults.tsx` + GameHome 加 LiveMonthCard 區塊

**Files:**
- Modify: `src/pages/MyResults.tsx`
- Modify: `src/pages/GameHome.tsx`

- [ ] **Step 1: 重寫 MyResults.tsx**

整段覆蓋 `src/pages/MyResults.tsx` 為：

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, computePersonalMonthlyScore } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { deriveUserBadges } from "@/lib/tournamentBadges";
import LiveMonthCard from "@/components/game/LiveMonthCard";
import MonthRecapCard from "@/components/game/MonthRecapCard";
import TrophyChip from "@/components/game/TrophyChip";
import { Diamond, ChevronDown, ChevronUp } from "lucide-react";

function yearMonthsBetween(startIso: string, endDate: Date): string[] {
  const start = new Date(startIso);
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months.reverse();
}

function formatYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

function nextRankCta(currentRank: number | null, currentScore: number, currentRanking: { score: number; userId: string }[]): string | undefined {
  if (currentRank === null || currentRank <= 3) return undefined;
  const targetIdx = 2; // 3位
  const targetScore = currentRanking[targetIdx]?.score ?? 0;
  const diff = targetScore - currentScore;
  if (diff <= 0) return undefined;
  return `あと ${diff} 点で 3位`;
}

const MyResults = () => {
  const navigate = useNavigate();
  const { tournaments, computeRanking } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();
  const periodStart = sub.currentPeriodStartedAt();

  if (!isPremium || !periodStart) {
    return (
      <InnerPageLayout title="大会成績">
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
          <Diamond className="w-8 h-8 text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">大会成績はプレミアム会員限定です</p>
          <button
            onClick={() => navigate("/premium/plan")}
            className="text-xs text-primary font-bold mt-1"
          >
            プレミアム登録 ›
          </button>
        </div>
      </InnerPageLayout>
    );
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const months = yearMonthsBetween(periodStart, now);
  const monthScores = months.map((ym) => computePersonalMonthlyScore(CURRENT_USER, ym, tournaments));
  const liveScore = monthScores.find((s) => s.yearMonth === thisMonth);
  const pastMonths = monthScores.filter((s) => s.yearMonth !== thisMonth && (s.tournaments.length > 0 || s.total > 0));

  const ranking = computeRanking(thisMonth);
  const myRank = ranking.findIndex((r) => r.userId === CURRENT_USER);
  const cta = liveScore ? nextRankCta(myRank >= 0 ? myRank + 1 : null, liveScore.total, ranking) : undefined;

  const badges = deriveUserBadges(CURRENT_USER, tournaments);

  // year grouping
  const yearGroups = new Map<string, typeof pastMonths>();
  for (const s of pastMonths) {
    const year = s.yearMonth.slice(0, 4);
    if (!yearGroups.has(year)) yearGroups.set(year, []);
    yearGroups.get(year)!.push(s);
  }
  const years = [...yearGroups.keys()].sort((a, b) => b.localeCompare(a));
  const currentYear = String(now.getFullYear());
  const [openYears, setOpenYears] = useState<Set<string>>(new Set([currentYear]));
  const toggleYear = (y: string) => {
    const next = new Set(openYears);
    next.has(y) ? next.delete(y) : next.add(y);
    setOpenYears(next);
  };

  return (
    <InnerPageLayout title="大会成績">
      <p className="text-[11px] text-muted-foreground mb-3">
        プレミアム会員期間（{new Date(periodStart).getFullYear()}年
        {new Date(periodStart).getMonth() + 1}月{new Date(periodStart).getDate()}日〜）の成績
      </p>

      {/* Live this-month card */}
      {liveScore && (
        <div className="mb-5">
          <LiveMonthCard
            variant="full"
            yearMonthLabel={formatYM(liveScore.yearMonth)}
            totalScore={liveScore.total}
            rank={myRank >= 0 ? myRank + 1 : null}
            played={liveScore.played}
            cta={cta}
          />
        </div>
      )}

      {/* Trophy section */}
      {badges.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-bold text-foreground mb-2">獲得トロフィー</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-[20px] px-[20px]">
            {badges.map((b) => (
              <TrophyChip key={b.type} badge={b} />
            ))}
          </div>
        </div>
      )}

      {/* Year accordion */}
      {pastMonths.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">過去の参加記録はまだありません</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-bold text-foreground mb-2">年度成績</p>
          <div className="space-y-3">
            {years.map((year) => {
              const months = yearGroups.get(year)!;
              const totalScore = months.reduce((sum, s) => sum + s.total, 0);
              const totalTournaments = months.reduce((sum, s) => sum + s.tournaments.length, 0);
              const bestRank = months.reduce<number | null>(
                (best, s) => (s.bestRank !== null && (best === null || s.bestRank < best) ? s.bestRank : best),
                null
              );
              const isOpen = openYears.has(year);
              return (
                <div key={year} className="bg-card border border-border rounded-[8px] overflow-hidden">
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{year}年</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        出場 {totalTournaments} 大会 ・ 累計 {totalScore} 積分
                        {bestRank ? ` ・ 最高 ${bestRank}位` : ""}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="border-t border-border p-3 bg-muted/10 space-y-2">
                      {months.map((s) => (
                        <MonthRecapCard key={s.yearMonth} score={s} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </InnerPageLayout>
  );
};

export default MyResults;
```

- [ ] **Step 2: GameHome 加 LiveMonthCard 區塊**

打開 `src/pages/GameHome.tsx`。

加 import：

```tsx
import LiveMonthCard from "@/components/game/LiveMonthCard";
```

找到 hero 區塊的閉合 `</div>` (第一個 `<div className="-mt-[100px] relative z-10 px-[20px]">` 的閉合) 和 banner div （Task 7 加的）之後。

確認位置：hero 結束 → PendingInviteBanner → LiveMonthCard → AnimatedTabs

在 PendingInviteBanner 那段之後、`<div className="mt-5">` (AnimatedTabs 容器) 之前插入：

```tsx
{isPremium && (
  <div className="px-[20px] mt-3">
    <LiveMonthCard
      variant="compact"
      yearMonthLabel={formatYM(thisMonth)}
      totalScore={myScore.total}
      rank={myCurrentRank >= 0 ? myCurrentRank + 1 : null}
      played={myScore.played}
      onClick={() => navigate("/game/my-results")}
    />
  </div>
)}
```

`myScore.played` 是 `PersonalMonthlyScore` interface 中的 `played` 欄位（matches played），確認 GameHome 有正確 destructure。

- [ ] **Step 3: TS + commit**

```bash
npx tsc --noEmit
git add src/pages/MyResults.tsx src/pages/GameHome.tsx
git commit -m "MyResults: LiveMonthCard + trophy section + year accordion + recap cards; GameHome: inline LiveMonthCard compact"
```

---

## Final: Task 13 — 整合驗證

### Task 13: End-to-end verification

**Files:** all touched in this plan

- [ ] **Step 1: TS + build clean**

```bash
cd /Users/tinatzan/Projects/clients/2026-04-lst-userapp
npx tsc --noEmit
npx vite build
```

Both must pass clean.

- [ ] **Step 2: Visual verification check list**

Dev server already running at http://localhost:8081/. Open各路徑確認：

**`/game`**：
- Hero 之下 / Tab 之上：黃色 banner「佐藤 花子さんから...」（pending invite）
- Banner 之下：LiveMonthCard compact 顯示積分 + 順位 + chevron right

**`/game/tournament/t-completed`**：
- 頂部有 hero 圖（Unsplash）
- 標題 + 時間/場地/上限
- 大会について / アクセス / お問い合わせ 3 個 section
- 完賽 ranking + 對戰記錄

**`/game/tournament/t-pending-invite`**：
- 頂部 hero 圖
- 在「エントリー受付中」之下顯示黃色「あなたの承諾待ち」
- CTA 隱藏（因為已經是 invitee）

**`/game/invite/{entry-id-of-pending-invite}`**：
- 倒計時 banner
- 招待者卡片 + 賽事卡
- 承諾 / 辞退 雙 button
- 點 辞退 → reason radio + 確定

**自己當代表者測試**：
- 從 `/game/tournament/t-open` 點 CTA → entry 頁
- 輸入「山本 大輝」（user-007 是 Premium）→ 確定
- toast「パートナーに招待を送信しました」
- 跳回 detail 頁顯示「パートナー確認待ち (山本 大輝)」
- 進 マイエントリー Tab 看到該賽事

**`/game/my-results`**：
- 頂部 LiveMonthCard full 版（黑底）顯示本月積分 + CTA「あと X 点で 3 位」（如果有）
- 中間 獲得トロフィー：🥈 準優勝 ×1、🎯 初出場 ×1
- 下方 年度成績：2026年 accordion 預設展開，內含 4月 recap 卡（折疊）
- 點 recap 卡 → 展開 stats + 賽事

**通知頁**：
- 出現「大会の招待が届きました」(unread)
- 點開可導航到對應頁面

- [ ] **Step 3: 沒問題就 commit final marker**

如果有 polish 修正：

```bash
git add -A
git commit -m "Polish UX after end-to-end verification"
```

如果沒問題就跳過。

---

## Self-Review

### Spec coverage check
- ✅ Phase A 賽事詳情豐富化 → Tasks 1, 2 + Task 7 step 2 (pending UI patch)
- ✅ Phase B 隊友確認流程：
  - 狀態機 → Task 3
  - 通知類型 → Task 4
  - Banner → Tasks 5, 7
  - InviteConfirm 頁 → Task 6
  - TournamentEntry toast → Task 7
- ✅ Phase C+D 成績頁 + GameHome 整合：
  - 徽章 derive → Task 8
  - 共用元件 → Tasks 9, 10, 11
  - MyResults 重做 → Task 12
  - GameHome 整合 → Task 12

### Placeholder scan
- ✅ 沒有 TBD / TODO / fill-in-later
- ✅ Step「實際我們會在 Task 3 加 type」這類過渡語句在最終版已移除（簡化版 only 加 hero + sections，pending UI 改在 Task 7）

### Type consistency
- ✅ `pending_partner_confirmation` 一致使用
- ✅ `acceptPartnerInvite` / `declinePartnerInvite` / `getEntry` / `getPendingInvitesForUser` 簽名一致
- ✅ `Badge` interface 在 tournamentBadges.ts 定義，TrophyChip 直接 import
- ✅ `LiveMonthCard` props interface 在 Task 10 定義，Tasks 12 兩處使用一致

### 風險紀錄（再確認）
- ⚠️ 超時自動 cancel 不做計時器（demo 用 mock）— 既有 plan 不需 timer 實作
- ⚠️ 月份 recap 卡內 trophy emoji 與 trophy section 的 emoji 重複（前者在月份卡標題，後者是 chip）— 不算 bug，視覺上是好事（雙重提示）

---

**End of Plan.**
