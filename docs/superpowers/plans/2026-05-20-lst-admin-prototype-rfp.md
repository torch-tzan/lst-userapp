# LST 後台 Prototype — RFP（範圍說明書）

> **這份文件是 RFP（Request for Proposal），不是 step-by-step 實作 plan。**
> 目的：在動手寫 code 之前，先把「要做什麼／不做什麼／怎麼分階段／欄位怎麼對齊 user app」一次釐清。
> Tina 看完後給回饋（紅字標的 6 個決策點是關鍵），我會基於回饋產出對應的實作 plan（依 writing-plans skill 格式，含 task 級 step-by-step）。

**作成日**：2026-05-20
**對應 user app**：`~/Projects/clients/2026-04-lst-userapp/` (HEAD `1948d79`)
**Figma 來源**：`FiTIrluY0PxdBYL7QLRgWm`（node `106:258`，整份 backstage canvas）
**客戶交付 deadline**：2026-09 客戶測試

---

## 1. Goal（最終產出長什麼樣子）

建立一份 **LST 後台 prototype web UI**，內容包含：

- (A) **LST 站方總部後台**（HQ）— 跨加盟店的母管理介面（Figma `106:9179 LST` section）
  - 內含 **リーグ管理** 模組（NEW — 對齊前端 League 功能）
- (B) **企業・店舗 後台**（店舗側）— 單一加盟店自己的管理介面（Figma `106:2834 企業・店舗` section）

「Prototype」定義：**可點擊、看得到所有畫面、用 mock data，不接後端**。等於 user app 目前的做法（in-memory store + reseed on reload）。後續再接 Supabase。

### ⛔ 已從 scope 移除（2026-05-20 Tina 確認）

- 大会（Tournament）管理功能 — **前端 GameHome 已只剩リーグ + 順位 tab**，Tournament UI 已拆，admin 不需要管理
- 店舗端 `店舗大会管理` / `店舗大会詳細` / `大会開催申請` / `大会開催申請ダイアログ`（Figma `106:8598 / 8825 / 9095 / 9157`）— 不實作
- 「Game 後台」**不是獨立區塊**，直接放進 LST HQ sidebar 作為一個 menu item「リーグ管理」

---

## 2. Scope 與排除項

### ✅ In Scope（這次要做）

| 項目 | 頁面數估計 | 來源 |
|------|----------|------|
| LST HQ 後台（含 リーグ管理） | ~30 主畫面 + ~10 dialog + リーグ NEW 4 頁 | Figma `106:9179` + 本 RFP §5 |
| 店舗後台 | ~26 主畫面 + ~15 dialog（已扣除 4 頁 大会） | Figma `106:2834` |
| Mock data store | 對齊 user app 既有 store（§4） | 直接 import 既有 store |
| 路由 / 排版基底（Sidebar + Header + Table layout） | 1 layout + 多個 reusable 元件 | shadcn/ui |

### ❌ Out of Scope（這次不做，未來再說）

- 與 Supabase 串接、真實 auth、真實 RLS
- 後端 API endpoint、Edge Function
- 多語系（先全日文，跟 Figma 一致）
- Push 通知（管理端 web push）
- 帳號權限細節（roles / scopes — 只做 mock 切換）
- 響應式 mobile 後台版（Figma 是 1440px desktop only）

---

## 3. 技術架構決策

### 🔴 **決策 1（最關鍵）**：後台要放哪裡？

| 選項 | 說明 | 我的推薦 |
|------|------|---------|
| **A. 同 repo 新增 `/admin/*` 路由** | App.tsx 增加 admin 路由，跳過 PhoneMockup 包裝、改用 AdminLayout | ⭐ 推薦 — 共用 shadcn/ui + Tailwind + types，最快出 prototype |
| B. 同 repo 但拆 entry（`index.html` + `admin.html`） | Vite multi-page，部署兩個 URL | 過度工程 |
| C. 開新 repo `lst-adminapp` | 完全獨立部署 | 之後要接 API 時可考慮，prototype 階段沒必要 |

**預設走 A**。理由：欄位對齊最直接（直接 import `tournamentStore.ts`），shadcn/ui 已裝好 30+ 元件，省下重建時間。

⚠️ 副作用：`vite build` bundle 會變大 — prototype 期不在乎；正式版再拆。

### ✅ **決策 2（Tina 已確認 2026-05-20）**：Game 後台位置

**結論：直接放進 LST HQ sidebar，作為一個 menu item「リーグ管理」。不獨立區塊。店舗側不做。**

- 前端已拆掉 LST 大会 UI（GameHome 現只有「リーグ」+「順位」兩 tab）
- 店舗側 Figma 雖有 4 頁 大会，**不實作**
- LST HQ 新增 1 個 sidebar item「リーグ管理」，包含 4 個畫面（詳見 §5）

### 🔴 **決策 3**：Mock data 用既有 store 還是新建？

| 選項 | 說明 |
|------|------|
| **A. 直接 import user app store** | 例 admin 的 `予約管理` 直接讀 `bookingStore.ts` |
| B. 新建 admin-side mock store | 完全獨立，事後對齊 |

**推薦 A**。理由：「核對 user app 欄位確保一致」最強的方式是**同一份 source of truth**。Tina 改 user app 欄位時 admin 也跟著改，不會 drift。

副作用：admin 看到的「會員列表」=「user app 既有 player directory」(12 人) — demo 階段夠用，正式版前再擴。

---

## 4. 欄位對照表（user app ↔ admin）

> 這是 RFP 最重要的章節。**所有 admin table 的欄位必須對齊既有 store。**
> 若 Figma 設計的欄位 user app 沒有 → 用 `[Tina 請確認]` 標籤先佔位，等 Tina 補。

### 4.1 会員管理（LST HQ）/ 会員管理（店舗）

| Figma 欄位（推測） | user app store | type 欄位 | 備註 |
|-------------------|---------------|----------|------|
| 会員ID | `tournamentStore.PARTNER_DIRECTORY` | `userId` | 內部 ID |
| 表示ID | 同上 | `displayId` | `LST-AB12CD` 格式 |
| 名前 | 同上 / `userProfileStore` | `name` | |
| メール | 同上 | `email` | |
| 電話 | 同上 | `phone` | |
| スキルレベル | `tournamentStore.PARTNER_DIRECTORY` | `skillLevel` | beginner / intermediate / advanced |
| レーティング | 同上 | `rating` | ELO 1400-2200+ |
| ティア | 計算 | `getRankTier(rating)` | bronze→master |
| Premium 状態 | `subscriptionStore` | `status` | active / cancelled_pending / expired / none |
| ポイント残高 | `userProfileStore` | `points` | |
| XP | 同上 | `xp` | |
| 登録日 | ❌ **無** | — | `[Tina 請確認]` 是否要加（player 加入日期） |
| 最終ログイン | ❌ **無** | — | `[Tina 請確認]` 是否要加 |
| 退会状態 | ❌ **無** | — | `[Tina 請確認]` user app 沒退会機制 |

### 4.2 コート管理（LST HQ / 店舗共用）

| Figma 欄位 | user app store | type 欄位 | 備註 |
|-----------|---------------|----------|------|
| コートID | `courtData.COURTS` | `id` | |
| 名前 | 同上 | `name` | 場館名 |
| コート名 | 同上 | `courtName` | 該場館內第 X 號 |
| 種別 | 同上 | `courtType` | 屋外ハード / 室内 / ... |
| 料金/h | 同上 | `price` | |
| 状態（公開/非公開） | 同上 | `available` | |
| 住所 | `CourtDetail` | `address` | |
| 設備 | 同上 | `amenities` | 字串陣列 |
| 装備品（追加） | 同上 | `equipment` | hourly / perUse |
| 外部リンク | 同上 | `externalLinks` | map / globe / list |
| 所属店舗 | ❌ **無** | — | `[Tina 請確認]` user app 沒「coat 屬於哪個加盟店」欄位 — admin 需要加 |
| 画像 | 同上 | `image` | URL or import |

### 4.3 予約管理

| Figma 欄位 | user app store | type 欄位 | 備註 |
|-----------|---------------|----------|------|
| 予約ID | `bookingStore.StoredBooking` | `id` | |
| 種別 | 同上 | `type` | court / coach |
| ステータス | 同上 | `status` | upcoming / completed / cancelled / failed / pending_confirmation / change_pending / in_progress |
| 会員 | ❌ **無 booker reference** | — | 🔴 `[Tina 請確認]` user app booking 沒有 `userId` 欄位（單裝置假設）— admin 需要加 |
| コート | 同上 | `courtName` + `courtSubName` | |
| コーチ | 同上 | `coachName` | type=coach 時 |
| 日付 / 時間 | 同上 | `date` + `startTime` + `endTime` | |
| 料金 | 同上 | `totalPrice` | |
| モード | 同上 | `mode` | solo / standard |
| 装備品 | 同上 | `equipment` | array |
| 関連大会 | 同上 | `eventId` + `teamId` | 大会報名連動的 court booking |
| Reschedule | 同上 | `rescheduleUsed` + `pendingChange*` | |
| 評価 | 同上 | `rating` | |

### 4.4 支払い履歴

| Figma 欄位 | user app store | type 欄位 | 備註 |
|-----------|---------------|----------|------|
| 支払いID | `subscriptionStore.BillingRecord` | `id` | |
| 会員 | ❌ **無** | — | 🔴 `[Tina 請確認]` BillingRecord 沒有 userId |
| 種別 | ❌ **無** | — | 🔴 user app 只有 Premium 月費；admin 需要區分（予約決済 / Premium / 大会エントリー） |
| 金額 | 同上 | `amount` | 目前固定 500 |
| 状態 | 同上 | `status` | completed |
| 支払い日 | 同上 | `paidAt` | |
| 返金状態 | ❌ **無** | — | Figma 有「返金確認」dialog，user app store 沒設計這個 |

### 4.5 ~~大会管理~~ — **不實作（Tina 2026-05-20 確認移除）**

### 4.6 リーグ管理（NEW — LST HQ 新增 sidebar item）

| 欄位 | user app store | type 欄位 |
|------|---------------|----------|
| 試合ID | `leagueMatchBoardStore.PostedMatch` | `id` |
| 主催者 | 同上 | `hostUserId` |
| 希望日時 | 同上 | `desiredDate` |
| 希望会場 | 同上 | `preferredVenue` |
| 説明 | 同上 | `description` |
| 希望レベル | 同上 | `desiredSkillLevel` |
| 応募数 | 同上 | `applications.length` |
| ステータス | 同上 | `status` | open / filled / completed / cancelled |
| 比分 | 同上 | `result.score` | |
| 4-of-4 承認 | 同上 | `result.approvals` | |

---

## 5. リーグ管理 設計（NEW — LST HQ 新增模組）

> **背景**：前端 GameHome 改成 2-tab（リーグ + 順位），所有遊戲活動都跑在「リーグ募集 → 應徵 → 比賽 → 4-of-4 比分批准」這條流程。
> 後台需求 = 看得到所有公開募集、能介入仲裁（取消明顯異常的、修改比分糾紛、調整 player rating）+ 看 season 排行榜。

### 5.1 LST HQ「リーグ管理」模組（4 個畫面 + 2 dialog）

| 畫面 | 路徑 | 內容 |
|------|------|------|
| リーグ募集一覧 | `/admin/lst/leagues` | 所有 `PostedMatch` 列表 — filter by 状態（open / filled / completed / cancelled）+ 日期 + 主催者 + 地區 |
| リーグ詳細 | `/admin/lst/leagues/:id` | 募集資訊 + 應徵者列表 + chat thread 預覽 + 比分結果（含 4-of-4 approvals 狀態） + 主催者操作紀錄 |
| シーズン順位 | `/admin/lst/leagues/rankings` | 當季 / 前季排行榜（player + rating + tier + PP） — 來自 `tournamentStore.computeSeasonalRanking` |
| プレイヤー詳細（rating 調整） | `/admin/lst/leagues/players/:userId` | 單一 player 的 rating / tier / League 戰績 + **手動調整 rating** 按鈕（管理員仲裁用） |
| Dialog：試合キャンセル（管理者） | modal | 強制取消某場 match（標記 cancelled、加 reason） |
| Dialog：rating 手動調整 | modal | 輸入新 rating 值 + 理由 → 寫 audit log |

### 5.2 店舗端 — 不新增 Game 模組

（Figma `店舗大会管理` / `店舗大会詳細` / `大会開催申請` / `大会開催申請ダイアログ` 全部不實作）

---

## 6. Phasing（建議分 4 階段，依序交付）

### 🟢 Phase 1：基底 + 店舗最小可看版（預計 1-2 個 session）

目的：建立 `AdminLayout`（Sidebar + Header + Content area），驗證技術架構可行。

交付：
- `/admin/store/login` — 登入頁
- `/admin/store/dashboard` — 店舗 dashboard（mock 數據卡）
- `/admin/store/courts` — コート管理一覧
- `/admin/store/bookings` — 予約管理一覧
- Sidebar 導航結構完成（其他項目顯示但點進去顯示 placeholder）

**Phase 1 結束後 Tina 看一次，確認視覺 / 互動方向。**

### 🟡 Phase 2：店舗後台補齊（預計 2-3 個 session）

- 残りの店舗ページ（売上管理 / 支払い履歴 / スタッフ管理 / シフト管理 / お知らせ / キャンペーン / 管理者プロフィール）
- 所有 detail / edit / dialog
- 對齊 user app 欄位（§4 標記的 `[Tina 請確認]` 欄位先用 mock，Tina 看 review 時補正）

### 🟠 Phase 3：LST HQ 後台（預計 3-4 個 session）

- ダッシュボード / 加盟店一覧 / 加盟店詳細 / 新規加盟店追加
- 手数料・売上 / 手数料設定
- 会員管理 / 会員詳細
- コート管理 / 予約管理 / 支払い履歴（與店舗共用組件，但 scope 是「跨加盟店」）
- お知らせ配信 / キャンペーン管理
- コーチ管理 / コーチ詳細 / コーチ追加 / 店舗コーチ管理

### 🔵 Phase 4：リーグ管理（預計 1-2 個 session）

- §5.1 的 4 個畫面 + 2 dialog
- 直接 import `leagueMatchBoardStore` + `tournamentStore`（rating / season）
- 「手動調整 rating」寫入 user app store，前端立即可見

---

## 7. 🔴 給 Tina 的剩餘決策點（4 個，§3 決策 2 已確認）

1. **§3 決策 1：後台放哪裡？** → 預設方案 A（同 repo `/admin/*`）OK 嗎？
2. **§3 決策 3：Mock data 直接 import user app store** → OK 還是要拆開？
3. **§4 欄位缺失** → 下列欄位 user app 是否要補（若補，我們同時更新 user app stores）：
   - `Player.registeredAt`（會員 登録日）
   - `Player.lastLoginAt`（最終ログイン）
   - `Court.storeId`（コート 所属店舗）
   - `Booking.userId`（予約 booker reference）
   - `Booking.paymentMethod`（予約 决済方式 / 金流種別）
4. **§6 Phasing** → 4 階段順序 OK 嗎？還是想先做 リーグ管理（Phase 4 拉到 Phase 2）？

**時程**：9 月客戶測試 = 全部 prototype 點得起來、demo 流程順暢即可（不需 production polish）。

---

## 8. Next step

收到 Tina 對 §7 的 6 個回答後，我會：

1. 把這份 RFP 的決策結果存到 `.claude/decisions.md`
2. 依答案產出 `docs/superpowers/plans/2026-05-20-admin-prototype-phase1.md`（writing-plans skill 格式，含 step-by-step + 每步 commit）
3. 開始實作 Phase 1（基底 + 店舗 4 頁）

---

**End of RFP**
