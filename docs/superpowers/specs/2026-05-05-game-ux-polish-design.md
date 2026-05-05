# Game Tab UX Polish — 設計文件

**日期**：2026-05-05
**狀態**：Approved（待寫 plan）
**範疇**：Game tab 4 個 UX 痛點修正（賽事詳情豐富化 / 隊友確認流程 / 成績頁優化 / GameHome 整合）
**前置**：建立在 `2026-05-05-game-tournament-redesign-design.md` 已實作完成的基礎上

---

## 1. 背景

第一版 Game tab 完成後跑 demo，發現 4 個 UX 落差：

1. **賽事詳情頁太陽春** — 只有時間/場地/上限 4 行，沒有圖、沒有介紹，「想參加」感不足
2. **代表者送出邀請後，隊友毫不知情** — 系統直接把對方加入 entry，但對方沒同意過
3. **大會成績頁直立疊太長** — 本月+本訂閱期間每月都展開所有細節，下拉很長
4. **MyPage 大会成績比 Game tab 還吸引人** — Game 入口 hero 只有 3 個小數字，但 `/game/my-results` 有積分卡 / 出場勝率 / 賽事細項，落差大

核心原則（用戶 2026-05-05 確立）：
- **不要弄太複雜，客戶一開始也不會做太完整**
- 相似情境共用頁面/元件以保持一致性

---

## 2. 設計方向：「Highlight + Hall」（Direction A）

### 2.1 兩種情緒模式
- **「進行中」（Live）**：動感配色 + CTA 提示（「あと 50 点で 3 位」）→ 進場誘因
- **「過去」（Hall）**：靜態 + 成就感 trophy + 月份 recap → 看了心情好

### 2.2 共用元件
`LiveMonthCard`：本月 live 卡 — 同時用在 GameHome 入口（精簡版）+ MyResults 頂部（完整版）。

---

## 3. 變更詳細（4 個 phase）

### Phase A — 賽事詳情頁豐富化

**改動：`src/lib/tournamentStore.ts`** — 在 `Tournament` interface 加 4 個 optional 欄位（後台未來上稿用，demo 階段 hard-code）：

```ts
interface Tournament {
  // ... existing fields
  heroImageUrl?: string;       // Unsplash 圖
  description?: string;        // 賽事簡介（多段，markdown 不必，純 plain text 用 \n\n 分段）
  accessInfo?: string;         // 場地交通描述
  contactInfo?: string;        // 主辦聯絡（電話/email）
}
```

**改動：`src/pages/TournamentDetail.tsx`** — 加 5 個 section：

```
[Hero 圖] (16:9, full-bleed)
[標題 + status badge + 賽事 meta]
[時間 / 場地 / 賽制 / 上限]   ← 既有
[賽事について]                ← description (新)
[アクセス]                    ← accessInfo (新)
[お問い合わせ]                ← contactInfo (新)
[エントリー狀態 / Premium gating]  ← 既有
[完賽結果（bracket + ranking）]  ← 既有，僅 completed 顯示
[CTA]                         ← 既有
```

如果 optional 欄位 undefined，section 不渲染（避免空 section）。

**Demo 資料**：4 場大會都加 heroImageUrl（Unsplash padel/squash 主題）+ description + accessInfo + contactInfo。

**Unsplash URL pattern**：`https://images.unsplash.com/photo-{id}?w=800&h=450&fit=crop` — 選 4 張不同球場/比賽圖。

---

### Phase B — 隊友確認流程

**改動：`src/lib/tournamentStore.ts`**

`TournamentEntry.status` 新增 `pending_partner_confirmation`：

```ts
status: "pending_partner_confirmation" | "confirmed" | "cancelled" | "declined";
```

加欄位：
```ts
interface TournamentEntry {
  // ... existing
  invitedAt?: string;          // = registeredAt for doubles when first sent
  expiresAt?: string;          // = min(invitedAt + 72h, tournament.registrationDeadline)
  partnerRespondedAt?: string;
  partnerDeclineReason?: string;
}
```

新 store 函式：
```ts
acceptPartnerInvite(entryId: string)
declinePartnerInvite(entryId: string, reason?: string)
getPendingInvitesForUser(userId: string): TournamentEntry[]  // 我被邀請、待回應
getMySentPendingInvites(): TournamentEntry[]                  // 我發出、隊友待回應
```

**狀態機**：

```
代表者點「エントリーを確定する」
  ↓
單打：直接 confirmed
雙打：pending_partner_confirmation
       ↓ 72h / 截止前 deadline
       ├─ 隊友 accept → confirmed（隊友收到「確認完了」通知，代表者也收到）
       ├─ 隊友 decline → cancelled（代表者收到通知 + reason）
       └─ 超時無回應 → cancelled（reason="無回應"，雙方收到通知）
```

**Demo 場景**：

1. **自己當代表**：報名 t-open → 看 entry 進入 pending 狀態（代表者視角）
2. **自己被邀**：seed 1 筆現有 pending invite（user-002 邀請我參加另一場 demo doubles tournament，需要新增 1 場 demo tournament）
3. **以時間 mock 過期 / 已接受**：seed 1 筆已 confirmed 的 entry 顯示成功狀態

**通知**（4 個新類型）：
- `tournament_partner_invited`（你被邀請）
- `tournament_partner_accepted`（你的邀請被接受）— 給代表者
- `tournament_partner_declined`（你的邀請被拒絕）— 給代表者
- `tournament_partner_expired`（邀請超時）— 給雙方

**Game tab banner**：GameHome 頂部（hero 之上）若 `getPendingInvitesForUser` 有資料，顯示一條黃色 banner：

```
[!] 山田 太郎さんから「5月度 ダブルス大会」の招待
    残り 48時間  [辞退] [承諾]
```

點「承諾」→ confirm → 跳轉 `/game/tournament/:id`
點「辞退」→ 開 modal 選 reason → cancel

**也加在 Notifications 頁** — 點通知跳到一個專屬「招待確認頁」`/game/invite/:entryId`，內容含：
- 賽事卡（賽事名 / 時間 / 場地 / 代表者）
- 過期倒計時
- [辞退] [承諾] 雙 CTA

入口（雙重）：
1. Notifications 頁卡片 → `/game/invite/:id`
2. Game tab banner → 直接 inline action（不跳頁）

**TournamentEntry.tsx 流程小調整**：
- 雙打成功 submit 後 toast「パートナーに招待を送信しました」+ navigate 回賽事詳情，賽事詳情顯示「パートナー確認待ち」狀態（不是「エントリー済」）

---

### Phase C — 成績頁優化（`/game/my-results`）

**整體 layout**：

```
[Sticky Header: 大会成績]

[LiveMonthCard]                  ← 共用元件，本月 live + CTA
  - 今月積分: 330
  - 即時順位: 4位 (↑1 from last week)
  - 出場: 3回
  - CTA: 「あと 50 点で 3 位」

[獲得トロフィー]                 ← 新 section（小卡橫滑）
  🥈 準優勝 ×1
  🎯 初出場 ×1
  (demo 階段這 2 個有實際資料；其他先不顯示，避免空殼)

[年度成績]                       ← 年度 accordion
  ▼ 2026年  (X 大会 / X 積分 / 最高 X 位)
    ├─ 2026年5月 [今月 badge] 330  → 點月份展開細項
    └─ 2026年4月 (recap)        390  → 點月份展開細項
  ▶ 2025年  (collapsed by default)
```

**月份 recap 卡（精簡版，預設收合）**：

```
2026年4月  最終       [Trophy 🥈]
            390 積分
[展開 ›]
```

點「展開」才顯示：
- 出場/勝率/最高名次（3 column stat 區）
- 賽事細項（賽事名 + 個別積分，可點進賽事詳情）

**砍掉**：原本「不分階層直接展開所有月所有賽事」的疊長 layout。

**徽章 auto-derive 規則**（從現有 `tournaments` data）：
- 🥇 優勝（rank=1）：count rankings where userId === self && rank === 1
- 🥈 準優勝（rank=2）：rank === 2
- 🥉 第三位（rank=3）：rank === 3
- 🎯 初出場：第一次出場（demo data 算）
- 之後可加：🔥 月間ベスト（不在 demo 範圍）、📅 連続出場 ×N（不在 demo 範圍）

**為什麼徽章先 demo 2 個？** 用戶要求「不要太複雜」+ 客戶一開始也不會塞滿，2 個就足以表達設計意圖。

---

### Phase D — GameHome 整合（hero 與 tab 之間）

**新區塊**：在 GameHome `Hero` 與 `AnimatedTabs` 之間插入：

```tsx
{isPremium && (
  <div className="px-[20px] mt-4">
    <button onClick={() => navigate("/game/my-results")} className="w-full">
      <LiveMonthCard variant="compact" />
    </button>
  </div>
)}
```

`LiveMonthCard variant="compact"` 顯示：
- 本月積分大字 + 順位 + 「成績を見る ›」link

`LiveMonthCard variant="full"` 顯示在 MyResults 頂部，含 CTA「あと X 点で Y 位」

**為什麼沒在 hero 裡面取代 3 stats？** 用戶選 (b)「獨立 section 在 hero 與 tab 之間」— 保留 hero 的訂閱狀態 footer，新區塊更聚焦在「我的進度」。

**未訂閱者**：不顯示這個區塊（reading 過去成績是 Premium 福利）。

---

## 4. 共用元件清單

| 元件 | 用在 | Variant | 責任 |
|---|---|---|---|
| `LiveMonthCard` | GameHome / MyResults | `compact` / `full` | 顯示本月積分+順位+CTA |
| `MonthRecapCard` | MyResults 內 | — | 過去月份 recap（含 expand） |
| `TrophyChip` | MyResults 內 | — | 單一徽章顯示 |
| `PendingInviteBanner` | GameHome 頂部 | — | 黃色 banner 顯示待回應邀請 |

放在 `src/components/game/`（建立此資料夾）。

---

## 5. 路由變更

**新增**：
- `/game/invite/:entryId` → `InviteConfirm.tsx`（被邀請者用，非雙打代表者用）

**現況保留**：
- `/game`（GameHome — 本次新增 banner + LiveMonthCard）
- `/game/tournament/:id`（TournamentDetail — 本次擴充 hero + content blocks）
- `/game/tournament/:id/entry`（TournamentEntry — 流程小調整）
- `/game/my-results`（MyResults — 整體重做）

---

## 6. Demo 資料調整

### 6.1 Tournament store 變更
4 場既有大會都加 heroImageUrl + description + accessInfo + contactInfo（hard-coded）。

新增 1 場大會 `t-pending-invite`（讓自己當被邀請者 demo）：
- 雙打 / registration_open / 5月15日
- entries 中含 1 筆 entry：registrant=user-002 (佐藤 花子)、partner=CURRENT_USER、status=pending_partner_confirmation、expiresAt=now+48h
- 觸發 GameHome banner + Notifications 出現

「自己當代表者」的 pending 狀態 demo 不需要 seed — 用戶在 demo 中自己跑「t-open 雙打 → 輸入山本 大輝（user-007, Premium）→ 確定」流程，即可即時看到自己發出邀請後的 pending 狀態。

### 6.2 Notifications seed
新增 4 筆通知對映新類型：
- `tournament_partner_invited`（佐藤さんから招待）
- `tournament_partner_accepted`（demo: 過去某次成功的）
- `tournament_partner_expired`（demo: 過去某次過期的）
- 既有 3 筆 tournament_* 保留

---

## 7. 工作步驟

| # | Phase | 範疇 | 可獨立 demo |
|---|---|---|---|
| 1 | A | TournamentDetail 豐富化 + store 加 4 欄位 + demo data | ✅ |
| 2 | B | 隊友確認流程 — store 狀態機 + acceptPartnerInvite/declinePartnerInvite + 通知類型 + Banner + InviteConfirm 頁 + TournamentEntry 流程 | ✅ |
| 3 | C+D | LiveMonthCard 共用元件 + MyResults 重做 + GameHome 整合 + Trophy section + 年度 accordion | ✅ |

執行順序 1 → 2 → 3。

---

## 8. 驗收標準

### Phase A
- [ ] TournamentDetail 顯示 hero 圖（Unsplash）+ 4 個內容 section
- [ ] 4 場 demo 大會都有圖+介紹
- [ ] 沒填的 optional 欄位不渲染空 section

### Phase B
- [ ] 自己報名雙打 → entry 進入 pending_partner_confirmation
- [ ] 賽事詳情頁顯示「パートナー確認待ち」 status
- [ ] GameHome banner 顯示 1 筆「我被邀請」（demo data）
- [ ] Notifications 顯示 1 筆 tournament_partner_invited
- [ ] 點 banner「承諾」→ entry 變 confirmed + toast
- [ ] 點 banner「辞退」→ modal 選 reason → entry cancelled
- [ ] InviteConfirm 頁可獨立透過 `/game/invite/:id` 進入

### Phase C+D
- [ ] GameHome hero 下方顯示 LiveMonthCard compact 版（訂閱者才有）
- [ ] LiveMonthCard 點下去跳 `/game/my-results`
- [ ] MyResults 頂部顯示 LiveMonthCard full 版含 CTA
- [ ] 獲得トロフィー section 顯示 🥈 + 🎯 兩個徽章（demo）
- [ ] 年度 accordion 預設展開 2026 年，2025 年收合
- [ ] 月份 recap 卡預設收合，點才展開細項
- [ ] 整體頁面長度比第一版短

### 跨 Phase
- [ ] TypeScript clean
- [ ] vite build clean
- [ ] 既有功能（訂閱流程 / 報名單打 / 排名 Tab）沒 regression

---

## 9. 風險與決策

| 取捨 | 決定 |
|---|---|
| 隊友超時自動 cancel — 是否真做計時器 | demo 階段不做 setTimeout 自動觸發；用戶看到 expiresAt 倒計時 UI 即可。Mock 一筆「已過期」demo data 表達 |
| 徽章 demo 兩個 vs 全部 6 個 | 兩個（用戶「不要太複雜」原則） |
| LiveMonthCard 點下去 modal vs 跳頁 | 跳頁（簡單，且 /game/my-results 已是 hub） |
| GameHome 新區塊在 hero 內 vs hero 與 tab 間 | hero 與 tab 間（用戶選 b） |
| MyPage 大会成績入口保留 | 保留（用戶確認，且日後有歷年場景） |
| InviteConfirm vs banner 雙入口的衝突 | 兩條路最後操作都呼叫 store 同函式（acceptPartnerInvite / declinePartnerInvite），UI 各自執行，狀態以 store 為準 |

---

**End of Design.**
