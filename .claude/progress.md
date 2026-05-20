# Progress — LST padel user app

**最後更新**：2026-05-21
**本次 session 範圍**：LST 後台 prototype（從 RFP 到實作完成）
**Commit 數**：本 session 7 個（`6d02aa2` RFP → `61899b3` LST HQ 最後 5 模組）

---

## 今天做了什麼

### Phase 0：RFP 對齊（commit `6d02aa2`）
看完 Figma 後台 `FiTIrluY0PxdBYL7QLRgWm` 整份 backstage canvas + 掃 user app 核心 store（tournamentStore / userProfileStore / bookingStore / courtData / coachData / subscriptionStore / leagueMatchBoardStore）後寫 RFP。Tina 確認兩個關鍵調整：
- ✅ Game 後台直接放進 LST HQ sidebar（不獨立區塊）
- ❌ 前端已無 LST 大会 → 不做 Tournament 管理（包括 Figma 既有的 4 頁店舗大会全部不實作）

### Phase 1：Admin Framework（commit `4c0a794`）
- `src/admin/AdminApp.tsx` + `components/{AdminLayout, AdminSidebar, AdminHeader, AdminPageHeader, DataTable, StatCard, FilterChip, EmptyState}.tsx`
- Mock auth：`adminAuthStore.ts`（localStorage persisted, role-based gate）
- Navigation：LST_NAV_ITEMS 12 項 + STORE_NAV_ITEMS 10 項
- 路由：`/admin/login` / `/admin/lst/dashboard` / `/admin/store/dashboard` + 兩個 wildcard 落到 `AdminPlaceholder`
- AdminLogin 帶 role selector，dashboards 各有 4 StatCards + 2 chart placeholders + activity list

### Phase 2：リーグ管理(commit `7fda2d6`)
LST HQ 新增的核心模組 — 對齊前端 League 功能：
- `LeagueList` `/admin/lst/leagues`（4 StatCards + filter by status/period）
- `LeagueDetail` `/admin/lst/leagues/:id`（基本情報 + 応募者 + 試合結果 + 4-of-4 approvals + chat thread placeholder + 強制取消）
- `LeagueRankings` `/admin/lst/leagues/rankings`（今/前シーズン toggle）
- `LeaguePlayerDetail` `/admin/lst/leagues/players/:userId`（player info + match history + rating 手動調整）
- 2 dialog：`LeagueCancelDialog` + `RatingAdjustDialog`
- **Store additions**：`adminCancelMatch` 加進 leagueMatchBoardStore；`adminAdjustRating` + emitDirectoryChange 加進 tournamentStore（user app 不變）
- `AdminDialog.tsx` 新建（admin 用 fixed inset-0 portal，user app 用的 PhoneMockup scoped dialog 不能用）

### Phase 3a：店舗 base（commit `135745d`）
- `CourtList` + `CourtDetailAdmin` + 3 dialog（New/Edit/Delete）— 用 overlay 模式覆蓋 courtData.ts
- `BookingList` + `BookingDetailAdmin` + 3 dialog（New/Edit/Cancel）+「📦 デモデータをロード」seed
- Store additions：bookingStore.ts 加 admin* mutations + cancelReason / cancelledAt / createdAt 欄位（additive only）

### Phase 3b：店舗 remaining 7 模組（commit `124f438`）
- 売上管理 / 支払い履歴 / スタッフ管理 / シフト管理 / お知らせ配信 / キャンペーン管理 / 管理者プロフィール
- 12 pages + 19 dialogs + 7 mock stores
- 共用 JP labels 收進 `src/admin/lib/storeLabels.ts`

### Phase 4a：LST HQ 加盟店/手数料/会員/コート（commit `0253be1`）
- 加盟店管理 — `AffiliateList` / `AffiliateNew`（dedicated page）/ `AffiliateDetail` + 2 dialog
- 手数料・売上 — `RevenueOverview` 3-tab（概要 mock chart / 加盟店別 / 取引明細）
- 手数料設定 — `FeeSettings` slider + override table + 2 dialog
- 会員管理 — `MemberList` / `MemberDetail` 用 PLAYER_DIRECTORY 12 人 + 3 dialog
- コート管理 (LST) — `LstCourtList` 含**所属加盟店** column + reuse 店舗 dialog
- Tournament store 補 export：`getAllPlayers()`

### Phase 4b：LST HQ 最後 5 模組（commit `61899b3`）
- 予約管理 (LST 跨加盟店) — 含 所属加盟店 column
- 支払い履歴 (LST 跨加盟店) — 同上
- お知らせ配信 (LST HQ) — 多 配信対象 targeting（全/Premium/特定加盟店/特定スキル）
- キャンペーン・イベント管理 (LST HQ) — 跨加盟店分發
- コーチ管理 (LST HQ) — overlay on COACHES
- 12 pages + 10 dialogs

---

## 當前狀態

### Admin prototype 統計
- **122 個 TS/TSX 檔案** under `src/admin/`
- **43 個頁面** + **44 個 dialog** + **23 個 mock store / helper**
- **22 個 sidebar menu items 全部可點**（12 LST + 10 店舗），零個 🚧 placeholder
- `npm run build` clean（2.24s，0 TS errors）— bundle warning 是預期（prototype 沒 code-split）

### 路由
- `/admin/login` — 共用登入頁，role selector 切 LST 本部 / 3 個店舗
- `/admin/lst/*` — 14 條 route，包含 dashboard / affiliates / leagues / members / courts / bookings / payments / announcements / campaigns / coaches / revenue / fees
- `/admin/store/*` — 17 條 route，包含 dashboard / courts / bookings / sales / payments / staff / shifts / announcements / campaigns / profile

### Mock data 策略
直接 import user app store 當 source of truth：
- `bookingStore.ts` — admin 直接讀寫 user app booking（雙向綁定）
- `tournamentStore.ts` — admin 改 rating 立刻反映到 user app
- `leagueMatchBoardStore.ts` — admin 強制取消 match 立刻反映
- `courtData.ts` / `coachData.ts` — 用 overlay 模式（admin 加的 court / coach 暫存在 admin overlay store，不汙染 user app）
- 沒對應 store 的（売上 / 支払い / スタッフ / シフト / お知らせ / キャンペーン / 加盟店）— admin 端有自己的 mock store

### user-app 影響評估
- `bookingStore.ts` — 加 admin* exports + 3 個 optional 欄位（cancelReason / cancelledAt / createdAt）— 不破壞既有 caller
- `tournamentStore.ts` — 加 `adminAdjustRating` + `emitDirectoryChange` + export `getAllPlayers`
- `leagueMatchBoardStore.ts` — 加 `adminCancelMatch` export
- 其他 user app 檔案：**未動**

### 設計關鍵決策
- 後台同 repo `/admin/*`（不分 entry）— 共用 shadcn + types，最快出 prototype
- Admin 頁面**不**用 `PhoneMockup` 包，AdminLayout 自己處理 desktop 1440px 排版
- 共用元件全部走 `<AdminDialog>` / `<AdminLayout>` / `<DataTable>` / `<StatCard>` / `<FilterChip>` 一致模式
- LST HQ 跨加盟店列表都有 **所属加盟店** column（bookingAffiliateLink / paymentAffiliateLink 用 deterministic hash mapping）

---

## 卡在哪裡 / 待確認

### 🔵 客戶面客（Tina review 後才能確認）
1. **Figma 對齊細節** — admin 視覺風格目前是「shadcn 預設 + 暗藍 sidebar」，沒逐頁對 Figma 像素細節
2. **缺失欄位** — RFP §4 標的 5 個欄位（`Player.registeredAt` / `lastLoginAt` / `Court.storeId` / `Booking.userId` / `Booking.paymentMethod`）目前用 mock / hash 補。等 user app schema 補完後可拿掉
3. **管理員權限分層** — 目前只有 `lst` vs `store` 兩種 role；正式版可能需要 owner / staff / 受付 等細分

### 🟡 已知 prototype 限制
- Bundle 1.35MB（gzip 379KB）— 沒 code-split（prototype OK，正式版要 manual chunk）
- Profile name/avatar 編輯後不 persist（adminAuthStore 只存 role + email + storeName）
- Shift カレンダー tab 是 placeholder 文字「📅 カレンダー表示は今後実装」
- CSV エクスポート 全部是 toast mock，沒真的下載

---

## 下次要繼續做什麼

### 高優先（如果要動）
1. **逐頁對 Figma 像素細節** — 目前是 shadcn 預設 + 一致 layout，但每個元件的 spacing / colors 沒對 Figma
2. **接 Supabase** — 把 admin 端的 mock store 換成 Supabase + RLS（這時就要決定 schema）
3. **加 auth 真正的權限分層** — owner / staff / 受付

### 中優先
4. 加 Figma 既有的 dialog 細節（CSV エクスポート 確認 / 各種削除確認 / 退会確認等 — 現在是簡化版）
5. 加 dashboard 真的 chart（recharts 已裝）
6. 加 ログイン error / パスワードリセット 完整流程

### 低優先
7. 多語系（日 → 中 → 英）
8. 響應式 mobile admin（Figma 是 1440px desktop only）

---

## 重要檔案路徑

```
docs/superpowers/plans/
└── 2026-05-20-lst-admin-prototype-rfp.md   # 本 session 的 RFP

src/admin/                                     # 全部 admin 程式碼
├── AdminApp.tsx
├── components/
│   ├── AdminLayout / Sidebar / Header / PageHeader / DataTable / StatCard / FilterChip / EmptyState / AdminDialog / SegmentedTabs.tsx
│   └── dialogs/                              # 44 個 dialog
├── lib/
│   ├── adminAuthStore.ts                     # 模擬登入
│   ├── navigation.ts                         # LST_NAV_ITEMS + STORE_NAV_ITEMS
│   ├── storeLabels.ts / lstLabels.ts         # JP labels + badge classes
│   ├── leagueLabels.ts / bookingLabels.ts
│   └── admin*Store.ts                        # 各模組 mock store（overlay 模式）
└── pages/
    ├── AdminLogin.tsx
    ├── AdminPlaceholder.tsx                  # 防呆 — 應該不會被命中了
    ├── lst/                                  # 12 模組（含 リーグ管理 NEW）
    │   ├── LstDashboard.tsx
    │   ├── affiliates / coaches / courts / bookings / payments / members /
    │   ├── revenue / fees / announcements / campaigns / leagues /
    └── store/                                # 10 模組
        ├── StoreDashboard.tsx
        └── courts / bookings / sales / payments / staff / shifts /
            announcements / campaigns / profile

src/lib/                                       # user app 既有 store（admin 直接 import）
├── bookingStore.ts                            # +admin* mutations
├── tournamentStore.ts                         # +adminAdjustRating +getAllPlayers
├── leagueMatchBoardStore.ts                   # +adminCancelMatch
└── ...（其他未動）
```

---

**End of progress.md**
