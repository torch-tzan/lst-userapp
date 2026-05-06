# Game UX Polish Round 2 — 設計文件

**日期**：2026-05-06
**狀態**：Approved（待寫 plan）
**範疇**：Round 1 polish 跑 demo 後的 4 個 follow-up 修正
**前置**：建立在 `2026-05-05-game-ux-polish-design.md` 已完成的基礎上

---

## 1. 4 個變更總覽

| ID | 變更 | 觸發痛點 |
|---|---|---|
| A | Rankings tab 加 本月/前月 pill toggle | 兩張表直立疊太長 |
| B | TournamentDetail 對被邀請者顯示 [承諾する][辞退する] CTA | 邀請回覆位置不明確 |
| C | 代表者可取消邀請 + 換隊友（新搜尋規格） | 邀錯人沒辦法改 |
| D | GameHome 移除 LiveMonthCard compact，hero 變 clickable | 兩個卡片講同一件事 |

核心原則（延續 Round 1）：不要太複雜、相似情境共用元件。

---

## 2. A — Rankings 本月/前月 切換

**檔案**：`src/pages/GameHome.tsx` (ranking tab section only)

**設計**：
- 在 ranking tab 內最上方加一組 pill toggle（兩個 button）：
  ```
  [ 即時（今月） ]  [ 最終（先月） ]
  ```
- 預設選「即時（今月）」
- 只顯示對應那張表
- 視覺上不要再用 AnimatedTabs（避免雙層 tab 噪音）— 用簡單 pill button 群組（rounded-full bg toggle）

**Markup pattern**:
```tsx
<div className="inline-flex bg-muted rounded-full p-1">
  <button className={subTab === "current" ? "bg-background shadow text-foreground" : "text-muted-foreground"}>
    即時（{thisMonthLabel}）
  </button>
  <button className={subTab === "last" ? "..." : "..."}>
    最終（{prevMonthLabel}）
  </button>
</div>
```

---

## 3. B — TournamentDetail 對 invitee 加動作 CTA

**檔案**：`src/pages/TournamentDetail.tsx`

**設計**：當 `myEntry.status === "pending_partner_confirmation"` 且 `myEntry.partnerUserId === CURRENT_USER`（我是被邀請的隊友）：

- 移除既有「あなたの承諾待ち」status 純文字顯示
- 改為內容區一張顯眼的「招待カード」：
  ```
  [⏰ 残り XX 時間]
  [招待者: 佐藤 花子 さん]
  [ 承諾する ]   ← primary 全寬
  [ 辞退する ]   ← secondary outline
  ```
- 點「承諾」→ 直接呼叫 `acceptPartnerInvite(entry.id)` + toast「招待を承諾しました」+ 留在頁面（status 變 confirmed）
- 點「辞退」→ navigate `/game/invite/:entryId`（既有頁有 reason picker modal）
- 底部 InnerPageLayout 的 disabled CTA 隱藏（`ctaLabel` 設 undefined）

**邏輯位置**：在現有「myEntry && pending && partnerUserId === CURRENT_USER」分支區塊內整段重做。

---

## 4. C — 取消邀請 + 換隊友 + 搜尋升級

### 4.1 新增 PlayerRef 欄位

`PlayerRef` interface 加：
```ts
interface PlayerRef {
  userId: string;
  name: string;
  email: string;    // 新
  phone: string;    // 新
}
```

`PLAYER_DIRECTORY` 12 人補對應 demo 資料（fake but consistent，例 `tanaka@example.com` / `090-1111-0001`）。

### 4.2 新 store 函式

```ts
// 搜尋（給 autocomplete + 直接查找）
searchPlayersByName(query: string): PlayerRef[]
  // fuzzy match name（去空格 includes），最多回 5 筆
findPlayerByEmail(email: string): PlayerRef | undefined
  // exact match (case-insensitive)
findPlayerByPhone(phone: string): PlayerRef | undefined
  // exact match，比對前先 normalize（去 hyphen / 空格）

// 取消邀請
cancelMyPendingInvite(entryId: string): { ok: boolean; error?: string }
  // 驗證：entry 存在 + status === pending_partner_confirmation + registrantUserId === CURRENT_USER
  // 動作：status → cancelled + cancelledAt 紀錄
  // 通知：寄給原 partner（type: tournament_partner_cancelled）
```

`findPlayerByName` 既有單筆函式廢棄（caller 換成新函式）。

### 4.3 通知新類型

`PushNotification.type` 加 `"tournament_partner_cancelled"`。

ICON_MAP 在 Notifications.tsx 加：
```ts
tournament_partner_cancelled: { icon: X, color: "text-muted-foreground" }
```

Demo seed 不必（Round 2 跑 demo 時用戶會自己觸發）。

### 4.4 TournamentDetail — 代表者 view

當 `myEntry.status === "pending_partner_confirmation"` 且 `registrantUserId === CURRENT_USER`：

- 內容區顯示「パートナー確認待ち (隊友名)」status
- 底部 CTA 替換為「**パートナーを変更する**」（primary，destructive outline 紅邊）
- 點 CTA → `<AlertDialog>` confirm「現在の招待をキャンセルして、再度エントリーします」→ 確定後：
  1. 呼叫 `cancelMyPendingInvite(entry.id)`
  2. Toast「招待を取り消しました」
  3. `navigate('/game/tournament/:id/entry')`

### 4.5 TournamentEntry — 3 mode 搜尋

**設計**：在現有「パートナーの氏名を入力」區塊上方加一組 3-pill toggle：

```
[姓名]  [メール]  [電話]    ← 預設「姓名」
```

#### 姓名 mode（預設）
- 輸入時即時呼叫 `searchPlayersByName(query)` → dropdown 顯示符合者（最多 5 筆）
- 每筆顯示：名字 + Premium 狀態（badge）
- 點選一筆 → 填入該人為當前 partner，dropdown 關閉
- 不點選 dropdown 則持續顯示直到輸入清空

#### メール mode
- 輸入時即時 `findPlayerByEmail(query)` → 找到 → 觸發確認卡（綠 / 黃警告）；找不到 → 「該当するユーザーが見つかりません」
- 不顯示 dropdown（隱私）

#### 電話 mode
- 同上，但用 `findPlayerByPhone`，比對前 normalize

#### 共用
- 不論哪種 mode 找到 partner，下方都顯示同一張驗證卡（Premium ✓ / 自分 ✗ / 未找到 / 非Premium 警告）
- 切換 mode → 清空輸入 + dropdown + partner state

---

## 5. D — GameHome 移除重複，hero clickable

**檔案**：`src/pages/GameHome.tsx`

**改動**：
1. 完全移除 `LiveMonthCard variant="compact"` 的整個 `{isPremium && (...)}` 區塊
2. 移除 `import LiveMonthCard from "@/components/game/LiveMonthCard"`（GameHome 不再用）
3. orange hero 卡（含 3 stat 格 + footer）整張變 button：
   - 訂閱者：`<button onClick={() => navigate("/game/my-results")}>` 包住 stats 區
   - 非訂閱者：保留現況（不 clickable，footer 「プレミアム登録 ›」維持原行為）
4. footer 區（黑底）保持為 sub-area：訂閱者顯示「プレミアム会員 / エントリー可能」（不 clickable，因 hero 已是 button），非訂閱者保留現況

**LiveMonthCard 元件本身不刪**（MyResults 還在用 full variant）。

**注意**：button click propagation 不會影響 footer link（非訂閱者 footer 內 `<button>` 是 separate sibling），但訂閱者整 hero 是 button 就 OK。

---

## 6. 工作步驟

| # | 範疇 | 檔案 | 可獨立 commit |
|---|---|---|---|
| 1 | tournamentStore — search functions + cancelMyPendingInvite + email/phone fields + PLAYER_DIRECTORY data | `src/lib/tournamentStore.ts` | ✅ |
| 2 | notificationStore + Notifications icon | `src/lib/notificationStore.ts` + `src/pages/Notifications.tsx` | ✅ |
| 3 | GameHome — A (ranking pill) + D (remove LiveMonthCard, hero button) | `src/pages/GameHome.tsx` | ✅ |
| 4 | TournamentDetail — B (invitee CTAs) + C-UI (パートナーを変更する) | `src/pages/TournamentDetail.tsx` | ✅（依賴 #1 + #2 commit）|
| 5 | TournamentEntry — 3-mode search + autocomplete | `src/pages/TournamentEntry.tsx` | ✅（依賴 #1）|

並行：1+2+3 → 4+5。2 個 wave。

---

## 7. 驗收標準

- [ ] Ranking tab 顯示 pill toggle，預設「即時（今月）」，切到「最終（先月）」顯示前月
- [ ] 自己被邀請時，TournamentDetail 顯示倒計時 + [承諾する][辞退する] 兩個按鈕
- [ ] 點「承諾する」→ 留在頁面 + toast + status 變 confirmed
- [ ] 點「辞退する」→ 跳到 InviteConfirm 頁
- [ ] 自己當代表者時，TournamentDetail 底部 CTA 為「パートナーを変更する」
- [ ] 點 → confirm dialog → 確定後跳到 entry 頁
- [ ] Entry 頁顯示 3-pill mode toggle
- [ ] 姓名 mode 輸入時顯示 autocomplete dropdown
- [ ] メール / 電話 mode 不顯示 dropdown，exact match 直接出驗證卡
- [ ] 切換 mode → 清空輸入
- [ ] GameHome 不再有 LiveMonthCard compact 區塊
- [ ] GameHome orange hero 卡（訂閱者）整張可點 → 跳到 `/game/my-results`
- [ ] 非訂閱者 hero 不 clickable，「プレミアム登録 ›」link 仍可用

---

## 8. 風險與決策

| 取捨 | 決定 |
|---|---|
| autocomplete dropdown 顯示 Premium 狀態 | 顯示（避免用戶選了非 Premium 才知道） |
| 取消邀請後是否強制 navigate to entry 頁 | 是（用戶說「取消邀請換人」是一個動作） |
| 電話 normalize 規則 | 去掉 hyphen + 空格，僅保留數字比對 |
| email mode 的大小寫 | toLowerCase 比對 |
| GameHome hero 整張 clickable 的 a11y | 用 button 元素 + 保留 footer 內既有 plan link 可點（用戶在 footer 區點 link 不會誤觸 hero） |

---

**End of Design.**
