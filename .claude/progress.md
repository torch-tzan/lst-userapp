# Progress — LST padel user app

**最後更新**：2026-05-06
**本次 session 範圍**：Game 模組 + Premium 訂閱完整實作 + 多輪 UX polish + 會議對齊調整
**Commit 數**：60 個（base `ce388f3` → HEAD `37e0ae7`）
**Dev server**：`localhost:8081`（reload 自動重置 mock data）

---

## 今天做了什麼

### Phase 1：Game 模組整體重做（Round 0）
從「玩家自組隊互戰」改為「LST 月度大會 + Premium 訂閱」機制。
- 建立 `subscriptionStore.ts`（30 天月費自動續訂）
- 建立 `tournamentStore.ts`（月度大會 + 個人積分）
- 8 個 Premium 訂閱頁（plan / payment-confirm / welcome / manage / payment-method / billing-history / cancel）
- 重寫 GameHome（3 tab：大会 / マイエントリー / ランキング）
- 砍掉舊 gameStore + 5 個玩家自組隊頁面
- 解耦 BookingComplete 對 game 的依賴
- 通知類型重命名（`team_*` / `match_*` → `tournament_*`）

### Phase 2：UX Polish Round 1
- TournamentDetail 加 hero 圖（Unsplash）+ 賽事介紹/交通/聯絡 sections
- 雙打邀請進入 `pending_partner_confirmation` 狀態，72h 倒計時
- GameHome banner + 通知 + InviteConfirm 頁三個入口
- MyResults 重做：LiveMonthCard + Trophy section + 年度 accordion
- GameHome 加 LiveMonthCard compact 區塊（Premium only）

### Phase 3：UX Polish Round 2
- Rankings 加 本月/前月 pill toggle
- 被邀請者進 TournamentDetail 看 [承諾][辞退] CTA（不藏在 status 文字）
- 代表者可取消邀請換隊友（confirm dialog → cancelMyPendingInvite → 跳 entry 頁）
- TournamentEntry 加 3-mode 搜尋（姓名 autocomplete / メール / 電話 exact）

### Phase 4：客戶內部會議對齊
基於 2026-05-06 會議逐字稿（plan 寫在 `~/.claude/plans/game-app-kind-hoare.md`）：
- 移除 podium bonus（簡化為「勝場 +50、敗場 +10」）
- 找隊友改成 **user-ID 系統**（移除姓名/email/電話搜尋；MyPage 顯示 `LST-AB12CD` 可複製）
- MyResults 顯示**全部歷史**（不再 cutoff 訂閱期間）
- 年份改**下拉選單**（不是 accordion）
- 移除 Trophy section（成就系統延後）
- 移除 GameHome 頂部 banner，改 Tab badge 顯示未處理邀請數
- 比分輸入確認由 LST 後台處理（玩家端只讀）

### Phase 5：細節 polish
- MyResults 改成扁平 + 月份點進新頁 `/game/my-results/:yearMonth`（MonthDetail）
- マイエントリー card 加 entry-state badge（招待 / 確認待ち / 確定）+ 多場 demo
- main.tsx reseed notifications on every load（reload 重置 mock）
- Toast scope 到 phone mockup 內（不是瀏覽器右下角）
- MyEntryCard 視覺差異化（actionable 黃粗邊框 + 「タップして確認」hint vs passive 灰色）
- 邀請接受按鈕改左右排（高度更緊湊）
- 積分公式修正：勝 +50 vs 敗 +10 互斥（不疊加）

---

## 當前狀態

### 主要架構
- `src/lib/subscriptionStore.ts` — Premium 訂閱（startedAt 2025-12-29，nextRenewAt 2026-05-29，5 筆 billing history）
- `src/lib/tournamentStore.ts` — 12 player directory（含 displayId）+ 9 場 demo 大會（4 進行中 + 5 歷月 completed）
- `src/lib/notificationStore.ts` — 17 種通知類型 + reseed on load
- 4 個共用 game 元件：`LiveMonthCard`、`MyEntryCard`、（已刪 `MonthRecapCard`、`TrophyChip`、`PendingInviteBanner`、`tournamentBadges`）

### 頁面
**Premium 流**：`/premium/plan` → `/premium/payment-confirm` → `/premium/welcome` → `/premium/manage` →（`/premium/payment-method` / `/premium/billing-history` / `/premium/cancel`）

**Game 流**：`/game`（hero + 3 tab）→ `/game/tournament/:id`（賽事詳情，含 invitee/inviter 動作 CTA）→ `/game/tournament/:id/entry`（user-ID 輸入）→ `/game/invite/:entryId`（邀請確認頁）

**成績**：`/game/my-results`（年份下拉 + 月份列表）→ `/game/my-results/:yearMonth`（月度細項 + 賽事列表）

### Demo Mock
- 訂閱：active，付費歷史 5 筆（2025-12 ~ 2026-04）
- 大會（5月）：3 場進行中/開放 + 1 場有 user 為被邀請者 + 1 場 user 為代表者(pending) + 1 場 user 已確定（單打） + 1 場 user 已確定（雙打）
- 大會（歷月 completed）：12月 第3名、1月 冠軍、2月 第4名、3月 亞軍、4月 亞軍
- 通知：每次 reload 自動 reseed
- 用戶 displayId：`LST-AB12CD`（user-001 田中太郎）

### 設計關鍵決策
- 不做社群功能（user-to-user 訊息、profile、陌生人搜尋） — 排除在這次年內交付
- LST 後台輸入比分（玩家端只讀）
- 訂閱期間以 `startedAt` 為單一節點（取消後不立即生效，到 nextRenewAt 才轉 expired）
- 個人 displayId 為邀請唯一 channel

---

## 卡在哪裡 / 待確認

### 🔵 客戶面客當天（明天）才能確認的
1. **比分公式新解讀是否客戶接受** — 「勝 +50、敗 +10」互斥；冠軍小 bracket 比亞軍大 bracket 積分少（4-隊雙打冠軍 100 vs 8-隊單打亞軍 160）
2. **是否堅持要社群功能** — 若堅持要 user-to-user 訊息，工程方需追加一個月開發、報價單重做（卡琳處理）
3. **後台介面**（LST admin）尚未開發 — 這次只做了用戶端

### 🟡 已知小議題（未必要動）
- MonthDetail 「参加」欄 label 在新公式下意義 = 敗場 × 10。如果客戶覺得詞不達意，可考慮改「敗北」或「出場（敗）」
- AnimatedTabs badge 在 my-entries Tab 顯示紅圓 — 一致性已驗證
- `tournament_partner_expired` notification type 存在但 demo 不真的觸發過期計時（純 UI 顯示倒計時）

### 🟢 文件
- 設計 spec：`docs/superpowers/specs/2026-05-05-game-tournament-redesign-design.md`、`...polish-design.md`、`...round2-design.md`
- 實作 plan：`docs/superpowers/plans/2026-05-05-game-tournament-redesign.md`、`2026-05-06-game-ux-polish.md`、`2026-05-06-game-ux-polish-round2.md`
- 客戶會議對齊 plan：`~/.claude/plans/game-app-kind-hoare.md`

---

## 下次要繼續做什麼

### 高優先（明天 / 客戶會議後）
1. 客戶會議結果出來後，依會議結論調整：
   - 若客戶接受簡化版 → 確認用戶端已對齊、繼續處理 LST 後台
   - 若客戶堅持社群功能 → 卡琳重做報價、第二階段排
2. **LST 後台介面**：依會議結論開始設計（大會 CRUD、報名管理、比分輸入）
3. **Wireframe / Figma 整理**：把 60 個 commit 的最終狀態同步到 Figma flow，給工程方做 spec（之前 Cloud 那包遺失了，需要重做）

### 中優先
4. 比分結果公布後的個人通知細節（push notification 文案 + 連動）
5. 月底自動結算邏輯（demo 階段沒做計時器）
6. PLAYER_DIRECTORY 移到後台管理

### 低優先 / 後續
7. 成就系統（trophy）— 如果客戶後續要加再做
8. Push 通知整合（demo 用 in-app notification 模擬）
9. App store 上架前的可訪問性 audit（aria 標籤、tab order）

---

## 重要檔案路徑

```
src/
├── lib/
│   ├── subscriptionStore.ts        # 訂閱
│   ├── tournamentStore.ts          # 大會核心
│   └── notificationStore.ts        # 通知
├── pages/
│   ├── GameHome.tsx                # 第三 Tab 主頁
│   ├── TournamentDetail.tsx        # 賽事詳情（含 invitee/inviter CTA）
│   ├── TournamentEntry.tsx         # 報名（user-ID 輸入）
│   ├── InviteConfirm.tsx           # 邀請確認頁（被邀請者）
│   ├── MyResults.tsx               # 大会成績（年份下拉）
│   ├── MonthDetail.tsx             # 月度成績細項
│   ├── MyPage.tsx                  # 含 マイID 顯示
│   └── (Premium 8 頁)
└── components/
    ├── PhoneMockup.tsx             # Toast 已 scope 到此
    ├── ui/toast.tsx                # ToastViewport absolute 定位
    └── game/
        ├── LiveMonthCard.tsx       # MyResults 用
        └── MyEntryCard.tsx         # マイエントリー Tab card（含視覺差異）
```

---

**End of progress.md**
