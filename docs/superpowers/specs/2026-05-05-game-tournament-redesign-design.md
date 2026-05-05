# Game Tab 重做 + Premium 訂閱模組 — 設計文件

**日期**：2026-05-05
**狀態**：Approved（待寫 plan）
**範疇**：第三個底部 Tab「ゲーム」整體重做為 LST 月度大會機制；新增 Premium 訂閱模組

---

## 1. 背景與目標

### 1.1 現況
目前 Game tab 採「玩家自組隊互相挑戰」模式：
- 玩家自己找夥伴組隊、邀請、成立隊伍（跨週續用）
- 隊伍互相發出比賽邀請、約場地（與 court booking 連動）
- 雙方提交比分 + 雙方確認 → 結算 XP / Points
- 週排名（ISO week）

### 1.2 新機制
LST 主辦的月度大會制：
- LST 後台建立大會：場地、時間、單/雙打、報名上限（8/16/32 隊）
- 用戶端：瀏覽大會 → 一人代表報名（雙打輸入隊友帳號 + 系統驗證隊友 Premium 狀態）
- 比賽結果由 LST 後台輸入；玩家端只讀
- 個人月度積分結算（不是隊伍、不是週）
- 報名資格門檻：月費 ¥500 Premium 會員

### 1.3 為何要做
1. 商業模式落地：Premium 訂閱（¥500/月）成為 LST 變現核心
2. 移除「玩家自組賽事」的高摩擦流程，改為「LST 排好你只要付費報名」
3. 讓既有 XP 累積仍然連動「出場」激勵，但解除「Points 與比賽勝負」的耦合

---

## 2. 計分規則（個人為單位）

| 行為 | 大会積分 | XP（既有系統） |
|---|---|---|
| 出場 1 場 | +10 | +10 |
| 勝場 1 場 | +50 | 0（額外） |
| 單場第 1 名 | +100 | 0 |
| 單場第 2 名 | +50 | 0 |
| 單場第 3 名 | +25 | 0 |

**核心紀律：**
- **大会積分只累計、不扣分**
- **每月 1 號 0:00 重置當月積分（歷史保留）**
- **Points 不再因比賽變動**（保留 booking / coaching / Premium 還元的累積）
- **單打 vs 雙打：每個玩家都拿一樣的個人分**（雙打中代表報名者與隊友各得一份）

---

## 3. 訂閱有效期規則

- 從付費當日起算 **30 天** 自動續訂（不依日曆月）
- 訂閱到期 → 失去報名資格；歷史積分保留
- **歷史成績頁僅顯示「當前訂閱期間」內的紀錄**（取消後再訂閱 → 新訂閱期間從新計算 cutoff）

---

## 4. 系統架構

### 4.1 砍除清單（破壞性變更）

| 項目 | 動作 | 理由 |
|---|---|---|
| `src/lib/gameStore.ts` | **改寫**為 `tournamentStore.ts` | 賽事核心換成 LST 主辦 |
| `src/pages/GameTeamNew.tsx` | **刪除** | 玩家不再組常駐隊 |
| `src/pages/GameTeamDetail.tsx` | **刪除** | 同上 |
| `src/pages/GameMatchNew.tsx` | **刪除** | 玩家不再 propose 比賽 |
| `src/pages/GameMatchDetail.tsx` | **刪除** | LST 後台統一處理 |
| `BookingComplete.tsx` 中 `findSchedulableMatchForBooking` / `notifyOpponentAboutBooking` 邏輯 | **移除** | 大會場地由 LST 排，與 booking 解耦 |
| `MyPage.tsx` menu 「試合履歴 → /game」 | **改為**「大会成績 → /game/my-results」（僅訂閱者顯示） | 對應新模組 |
| `Notifications.tsx` 中 `match_*` 通知類型 | **重新映射**為 `tournament_*`（報名成功 / 結果発表 / 月度ランキング確定） | 對應新事件 |
| `App.tsx` 路由 `/game/team/*`、`/game/match/*` | **刪除** | 配合上方頁面刪除 |

### 4.2 `userProfileStore.ts` 調整

- `points` 欄位保留；移除 `addXpAndPoints` 中 比賽相關的 caller，但函式本身保留給 booking/coaching 用
- 新增 `addXp(xp: number)`：只加 XP，不加 points（給「出場」事件用）
- `xp` 欄位語意：累積出場 XP，不再隨比賽勝負給予

---

## 5. Premium 訂閱模組

### 5.1 `subscriptionStore.ts`（新建）

```ts
type SubscriptionStatus =
  | 'none'              // 從未訂閱
  | 'active'            // 訂閱中
  | 'cancelled_pending' // 已申請取消，到 nextRenewAt 之前仍享特典
  | 'expired';          // 已到期失效

interface PaymentMethod {
  type: 'cc' | 'paypay' | 'apple';
  last4?: string;
  brand?: string;       // 'Visa' | 'Mastercard' | ...
}

interface BillingRecord {
  id: string;
  paidAt: string;        // ISO
  amount: 500;
  status: 'completed';
}

interface SubscriptionState {
  status: SubscriptionStatus;
  startedAt?: string;          // 最新一次活躍週期起點（每次 cancel→re-subscribe 會 reset）
  nextRenewAt?: string;        // = startedAt + 30 days
  cancelledAt?: string;
  paymentMethod?: PaymentMethod;
  history: BillingRecord[];    // 全部歷史（不因取消而清空）
  cancelReason?: string;
}

// 衍生函式
isPremium(): boolean                   // status === 'active' || 'cancelled_pending'
daysUntilRenew(): number
canRegisterTournament(): boolean       // = isPremium()
currentPeriodStartedAt(): string | undefined  // 用來 cutoff 歷史成績
```

### 5.2 訂閱頁面（8 個畫面）

| # | 路由 | 用途 | 狀態 |
|---|---|---|---|
| 1 | `MyPage.tsx`（修改） | 未訂閱：顯示推薦卡片入口 → `/premium/plan`<br>訂閱中：顯示「プラン管理」區塊 → `/premium/manage`，名字旁 Premium badge | 改 |
| 2 | `/premium/plan` | プレミアムプラン頁（特典清單、月額 ¥500、開始 button、條款勾選） | 新 |
| 3 | `/premium/payment-confirm` | ご注文内容の確認（¥455 + 稅 ¥45 = ¥500、支付方式選擇 CC/PayPay/Apple Pay） | 新 |
| 4 | `/premium/welcome` | 訂閱完成歡迎頁（次回更新日 + 已獲得特典） | 新 |
| 5 | `/premium/manage` | プラン管理（current plan、今月特典使用、支払い方法、課金履歴連結、解約 link） | 新 |
| 6 | `/premium/payment-method` | お支払い方法の変更 | 新 |
| 7 | `/premium/billing-history` | 課金履歴（完整列表） | 新 |
| 8 | `/premium/cancel` | 解約の最終確認（理由 checkboxes + 意見 textarea + 確定 button） | 新 |

### 5.3 Demo 預設

預設 `status: 'active'`，`startedAt: 2026-04-29`，`nextRenewAt: 2026-05-29`，`paymentMethod: Mastercard ****3456`，`history: 5 筆 月額 ¥500`。

從 plan 頁的「プレミアムをはじめる」CTA 仍可走完整訂閱流程作為 demo（重新觸發訂閱動作會更新 startedAt → 進入新週期）；解約流程從 `/premium/manage` 進入。

---

## 6. 新 Tournament 模組

### 6.1 `tournamentStore.ts`（新建）

```ts
type TournamentFormat = 'singles' | 'doubles';
type TournamentCapacity = 8 | 16 | 32;
type TournamentStatus =
  | 'upcoming'            // 尚未開放報名
  | 'registration_open'   // 開放報名中
  | 'registration_closed' // 報名截止，比賽未開始
  | 'in_progress'         // 比賽進行中
  | 'completed';          // 結束 + 已發布結果

interface Tournament {
  id: string;
  title: string;
  format: TournamentFormat;
  capacity: TournamentCapacity;
  venue: string;
  scheduledAt: string;          // 比賽開始時間
  registrationDeadline: string;
  status: TournamentStatus;
  entries: TournamentEntry[];
  results?: TournamentResult;
}

interface TournamentEntry {
  id: string;
  tournamentId: string;
  registrantUserId: string;     // 代表報名者
  partnerUserId?: string;       // 雙打才有
  registeredAt: string;
  status: 'confirmed' | 'cancelled';
}

interface MatchRecord {
  round: number;                // 1=首輪、2=複賽、3=半決賽...
  p1UserId: string;
  p2UserId: string;
  p1PartnerId?: string;
  p2PartnerId?: string;
  winnerSide: 1 | 2;
  score: string;                // ex: "6-3"
}

interface TournamentResult {
  rankings: { rank: number; userId: string; partnerId?: string }[];
  matches: MatchRecord[];
}

// 衍生計算（個人月度積分）
computePersonalMonthlyScore(userId: string, yearMonth: string): {
  participation: number;     // 出場場次 × 10
  wins: number;              // 勝場 × 50
  podiumBonus: number;       // Σ (1名 +100, 2名 +50, 3名 +25)
  total: number;
  // 細項清單（給 my-results 頁用）
  tournaments: { tournamentId, title, date, played, won, finalRank, score }[]
}

computeMonthlyRanking(yearMonth: string): {
  userId, name, score, played, won, bestRank
}[]
```

### 6.2 GameHome.tsx 重做（3-Tab）

| Tab | 名稱 | 內容（訂閱者） | 內容（未訂閱） |
|---|---|---|---|
| 1 | **大会** | Hero：當月個人總分 + 即時排名<br>大會列表卡片（依 status 分區） | 同左，但卡片上「報名」CTA 灰且顯示「プレミアム限定」label |
| 2 | **マイエントリー** | 已報名 / 進行中 / 已完成的賽事 | 空狀態 + 訂閱引導 |
| 3 | **ランキング** | 當月即時 + 上月最終排名（podium + 自己周邊 7 名） | 同左（不限訂閱） |

### 6.3 子頁面

| 路由 | 用途 | 訂閱限制 |
|---|---|---|
| `/game/tournament/:id` | 賽事詳情（場地、時間、賽制、報名狀況、bracket + 名次 if completed） | 全部可見；報名 CTA 僅訂閱者可點 |
| `/game/tournament/:id/entry` | 報名頁（雙打：輸入隊友帳號 → 驗證 Premium → 確認） | 僅訂閱者進入 |
| `/game/my-results` | 歷年歷月個人成績卡列表 + 細項 | 僅訂閱者進入；只顯示 currentPeriodStartedAt 之後的紀錄 |

---

## 7. 通知類型對映

| 舊（gameStore） | 新（tournamentStore） |
|---|---|
| `team_invite` | 廢除 |
| `team_invite_accepted` | 廢除 |
| `match_proposed` | 廢除 |
| `match_accepted` | 廢除 |
| `match_cancelled` | 廢除 |
| `match_confirm_request` | 廢除 |
| `match_disputed` | 廢除 |
| `match_settled` | 廢除 |
| `match_venue_booked` | 廢除 |
| — | `tournament_registration_confirmed`（報名成功） |
| — | `tournament_partner_invalid`（隊友未訂閱，報名未成立） |
| — | `tournament_starting_soon`（賽事 24h 前提醒） |
| — | `tournament_results_published`（結果發布 + 個人成績） |
| — | `monthly_ranking_finalized`（月度排名結算） |

---

## 8. 頁面導航圖（高階）

```
BottomNav: 検索 / 予約 / ゲーム / メッセージ / マイページ

ゲーム (/game)
├─ Tab 大会
│   └─ 賽事卡 → /game/tournament/:id
│       └─ 報名 button (僅 Premium) → /game/tournament/:id/entry
│           └─ 完成 → 回賽事詳情 + toast
├─ Tab マイエントリー（Premium 限定）
└─ Tab ランキング

マイページ (/mypage)
├─ User card (名字 + Premium badge if 訂閱中)
├─ Points card
├─ Coupons / 予約履歴 / コーチング履歴 / 評価履歴
├─ 大会成績 → /game/my-results  (僅訂閱者顯示)
├─ プラン管理區塊
│   ├─ 未訂閱 → /premium/plan → /premium/payment-confirm → /premium/welcome
│   └─ 訂閱中 → /premium/manage
│       ├─ /premium/payment-method
│       ├─ /premium/billing-history
│       └─ /premium/cancel
└─ 設定 / ログアウト
```

---

## 9. Demo 資料

### 9.1 訂閱
- 預設 `active`，加入日 2026-04-29，下次續訂 2026-05-29
- 課金履歴 5 筆（2025-12-29 / 2026-01-29 / 2026-02-29 / 2026-03-29 / 2026-04-29）
- 支付方式：Mastercard \*\*\*\*3456

### 9.2 大會（4 場展示各種 status）
- T1：**進行中**（雙打 16 隊、今日下午）
- T2：**報名中**（單打 8 隊、5 月 12 日、deadline 5 月 10 日）→ 可走完整報名 demo
- T3：**即將舉辦**（雙打 32 隊、5 月 25 日、尚未開放報名）
- T4：**已結束**（單打 8 隊、4 月 28 日、自己得第 2 名）→ 顯示完整 bracket

### 9.3 個人積分（5 月當月）
- 出場 3 場 → +30
- 勝 5 場 → +250
- 1 場第 2 名 → +50
- **合計 330 分**

### 9.4 月度排名（5 月即時）
12 人，自己第 4 名

### 9.5 上月排名（4 月最終）
12 人，自己第 5 名（podium 顯示前 3）

### 9.6 歷月成績（my-results）
- 2026-04 月（最終）：總分 390、出場 4 場大會、6 勝 4 敗、最高名次 第 2
- 2026-05 月（即時）：總分 330、出場 3 場大會、5 勝 1 敗、最高名次 第 2

---

## 10. 工作步驟

| # | 範疇 | 可獨立 demo |
|---|---|---|
| 1 | Premium 訂閱模組（store + 8 頁面 + MyPage 整合） | ✅ |
| 2 | 拆除舊 Game（刪 5 檔 + BookingComplete 解耦 + Notifications 改名 + App.tsx 砍路由） | ❌ 中間態 |
| 3 | 新 Tournament 模組（store + GameHome 重寫 + 3 個新頁面 + 月度積分計算 + my-results） | ✅ |
| 4 | 整合測試 + polish（未訂閱 vs Premium 兩條 user journey） | ✅ |

順序：1 → 2 → 3 → 4。Step 1 完成後可獨立 commit + 驗收。

---

## 11. 風險與決策紀錄

| 風險 / 取捨 | 決定 |
|---|---|
| 「歷史成績只顯示當前訂閱期間」會讓重新訂閱者損失過去資料的呈現 | 接受（為了 Premium 價值差異化）。內部 store 仍保留所有歷史 |
| 一場大會內個人「出場場次」、「勝場數」、「名次」三個獨立計分 | 是。例如 8 隊單淘汰中冠軍出場 3 場 → 30 + 150 + 100 = 280 分 |
| BookingComplete 解耦後，玩家如何知道哪場 booking 對應哪場大會 | 不需要。LST 排場地，玩家不在 court booking 系統內為大會約場 |
| 雙打報名時隊友未訂閱 → 提報名失敗訊息但保留代表者已輸入的資料 | 是。引導對方先訂閱再回來報名 |
| 既有 profile.xp 是否要清零再上線 | 不清。目前 demo 為 0 起算，無歷史 |
| Premium 訂閱「自動續訂」是否做到日曆模擬 | demo 不做真實扣款；nextRenewAt 是 startedAt + 30 天的固定計算，不會自動跳下一期 |

---

## 12. 驗收標準

- [ ] 未訂閱者打開 ゲーム tab 可看 4 場 demo 大會、即時月度排名、上月最終排名
- [ ] 未訂閱者點報名 → 引導去 `/premium/plan`
- [ ] 未訂閱者 MyPage 看不到「大会成績」入口
- [ ] 完整跑一次：MyPage 訂閱卡片 → /premium/plan → /premium/payment-confirm → /premium/welcome → MyPage 顯示 Premium badge + プラン管理
- [ ] 完整跑一次：MyPage プラン管理 → /premium/cancel → 確定 → MyPage 卡片變未訂閱（demo 用立即生效）
- [ ] 訂閱者可走完雙打報名流程：選大會 → 輸入隊友帳號 → 驗證 → 確認
- [ ] 訂閱者點 マイエントリー Tab 可看到自己報名的賽事
- [ ] 訂閱者點 已結束 賽事可看到 bracket + 自己名次
- [ ] 訂閱者點 MyPage「大会成績」可看到當月與歷月卡片
- [ ] BookingComplete 已不再出現 game match prompt UI
- [ ] Notifications 不再出現 `match_*` 類型，改為 `tournament_*`
- [ ] 既有 booking / coaching / review 流程沒有 regression
