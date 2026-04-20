

# 組隊截止自動配對 + 完整時間管理

## 概要

在大會的 `team_forming` 階段加入截止時間，截止後系統自動將未組隊者隨機配對。奇數時最後一人由系統標記為「待主辦安排」。全流程包含倒數提醒、自動配對邏輯、通知。

## 資料結構改動

### `src/lib/eventStore.ts`

- `EventFee` 新增 `teamFormingDeadline: string`（組隊截止時間，介於 `registrationDeadline` 和 `eventDate` 之間）
- 為 Event 5 設定 `teamFormingDeadline: "2026-05-14"`（報名截止 5/10，大會 5/17）
- 新增方法 `autoMatchUnpairedEntries(eventId: string)`：
  - 取得該大會所有未組隊的 entries
  - 隨機打亂後兩兩配對，呼叫 `createTeam()`
  - 奇數時最後一人標記 `entry.waitingForAssignment = true`
  - 為每位被自動配對的人發送 `team_auto_matched` 通知
  - 落單者發送 `team_waiting_assignment` 通知
- `EventEntry` 新增可選欄位 `waitingForAssignment?: boolean`

### 通知類型擴充 (`src/lib/notificationStore.ts`)

- 新增 type：`team_auto_matched`、`team_waiting_assignment`、`team_deadline_reminder`

## UI 改動

### `src/pages/TeamFormation.tsx`

- 頂部顯示組隊截止倒數：
  ```text
  ┌─────────────────────────────┐
  │ ⏰ チーム編成締切：5月14日   │
  │    残り 28日                 │
  └─────────────────────────────┘
  ```
- 截止後（模擬）顯示「チーム編成は締め切りました。未編成の方は自動でチームが組まれます。」
- 落單者（`waitingForAssignment`）顯示特殊狀態：「主催者によるチーム編成をお待ちください」

### `src/pages/GameHome.tsx`

- 大會卡片上，`team_forming` 狀態且接近截止（3天內）時顯示紅色警告 badge「締切間近」
- 截止已過但尚未開賽的卡片，按鈕從「チームを組む」改為灰色「チーム確認」

## 自動配對的 Demo 資料

- 新增一個 Event 6 或利用 Event 4，設定 `teamFormingDeadline` 已過期
- 預設該大會有 7 名未組隊者 → 系統自動配對 3 組 + 1 人待安排
- 用戶可在出場履歷或大會頁看到自動配對結果

## 改動檔案總覽

| 檔案 | 改動 |
|------|------|
| `src/lib/eventStore.ts` | `EventFee` 加 `teamFormingDeadline`、`EventEntry` 加 `waitingForAssignment`、新增 `autoMatchUnpairedEntries()` |
| `src/lib/notificationStore.ts` | 新增 3 種通知 type |
| `src/pages/TeamFormation.tsx` | 截止倒數 UI、截止後狀態、落單者狀態 |
| `src/pages/GameHome.tsx` | 接近截止的警告 badge、截止後按鈕變化 |

