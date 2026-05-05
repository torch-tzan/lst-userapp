# Game Tab + Premium 訂閱模組 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將第三個 Tab「ゲーム」從「玩家自組隊互戰」整體改為「LST 月度大會 + Premium 訂閱（¥500/月）」機制，並新增 8 頁訂閱模組。

**Architecture:** 採 useSyncExternalStore 為基底新建 `subscriptionStore` 與 `tournamentStore`（取代既有 `gameStore`）；UI 共用既有 `InnerPageLayout` / `PhoneMockup` / `BottomNav` pattern；個人月度積分為 derived computation（不是儲存欄位），由 store 函式即時計算。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui + react-router-dom v6 + lucide-react icons + useSyncExternalStore（in-memory store with closure-bound state）

**Spec:** `docs/superpowers/specs/2026-05-05-game-tournament-redesign-design.md`

**Verification model:** This is a UI demo project (no backend). 所有「測試」均為 `bun run dev` 啟動後手動 click-through 驗證。每個 Task 結束都要 `bun run build` 確認沒有 TS 錯誤。

---

## Phase 1 — Premium 訂閱模組（Tasks 1-7）

### Task 1: 建立 `subscriptionStore.ts`

**Files:**
- Create: `src/lib/subscriptionStore.ts`

- [ ] **Step 1: 建立 store 檔案**

整段寫入 `src/lib/subscriptionStore.ts`：

```ts
import { useCallback, useSyncExternalStore } from "react";

export type SubscriptionStatus = "none" | "active" | "cancelled_pending" | "expired";

export interface PaymentMethod {
  type: "cc" | "paypay" | "apple";
  last4?: string;
  brand?: string;
}

export interface BillingRecord {
  id: string;
  paidAt: string;
  amount: 500;
  status: "completed";
}

interface SubscriptionState {
  status: SubscriptionStatus;
  startedAt?: string;
  nextRenewAt?: string;
  cancelledAt?: string;
  paymentMethod?: PaymentMethod;
  history: BillingRecord[];
  cancelReason?: string;
}

function addDaysISO(dateIso: string, days: number): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function buildInitialState(): SubscriptionState {
  // Demo: 預設 active，加入日 2026-04-29
  const startedAt = "2026-04-29T00:00:00.000Z";
  return {
    status: "active",
    startedAt,
    nextRenewAt: addDaysISO(startedAt, 30),
    paymentMethod: { type: "cc", brand: "Mastercard", last4: "3456" },
    history: [
      { id: "bill-1", paidAt: "2025-12-29T00:00:00.000Z", amount: 500, status: "completed" },
      { id: "bill-2", paidAt: "2026-01-29T00:00:00.000Z", amount: 500, status: "completed" },
      { id: "bill-3", paidAt: "2026-02-28T00:00:00.000Z", amount: 500, status: "completed" },
      { id: "bill-4", paidAt: "2026-03-29T00:00:00.000Z", amount: 500, status: "completed" },
      { id: "bill-5", paidAt: "2026-04-29T00:00:00.000Z", amount: 500, status: "completed" },
    ],
  };
}

let state: SubscriptionState = buildInitialState();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

export function useSubscription() {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  const isPremium = useCallback(() => {
    return data.status === "active" || data.status === "cancelled_pending";
  }, [data.status]);

  const daysUntilRenew = useCallback(() => {
    if (!data.nextRenewAt) return 0;
    const ms = new Date(data.nextRenewAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 86400000));
  }, [data.nextRenewAt]);

  const currentPeriodStartedAt = useCallback(() => data.startedAt, [data.startedAt]);

  const subscribePremium = useCallback((method: PaymentMethod) => {
    const startedAt = new Date().toISOString();
    const newBilling: BillingRecord = {
      id: `bill-${Date.now()}`,
      paidAt: startedAt,
      amount: 500,
      status: "completed",
    };
    state = {
      status: "active",
      startedAt,
      nextRenewAt: addDaysISO(startedAt, 30),
      paymentMethod: method,
      history: [...state.history, newBilling],
    };
    emit();
  }, []);

  const updatePaymentMethod = useCallback((method: PaymentMethod) => {
    state = { ...state, paymentMethod: method };
    emit();
  }, []);

  const cancelPremium = useCallback((reason?: string) => {
    state = {
      ...state,
      status: "cancelled_pending",
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
    };
    emit();
  }, []);

  // Demo helper: 立即將狀態切到 expired（測未訂閱畫面用）
  const expireNow = useCallback(() => {
    state = { ...state, status: "expired" };
    emit();
  }, []);

  return {
    ...data,
    isPremium,
    daysUntilRenew,
    currentPeriodStartedAt,
    subscribePremium,
    updatePaymentMethod,
    cancelPremium,
    expireNow,
  };
}
```

- [ ] **Step 2: TypeScript 編譯驗證**

```bash
cd /Users/tinatzan/Projects/clients/2026-04-lst-userapp && bun run build
```

Expected: `vite build` 成功，沒有 TS 錯誤。

- [ ] **Step 3: Commit**

```bash
git add src/lib/subscriptionStore.ts
git commit -m "Add subscriptionStore: Premium membership state with 30-day renewal"
```

---

### Task 2: 建立 `/premium/plan` 頁（特典介紹 + 開始 button）

**Files:**
- Create: `src/pages/PremiumPlan.tsx`
- Modify: `src/App.tsx`（加 import + route）

- [ ] **Step 1: 建立 PremiumPlan.tsx**

寫入 `src/pages/PremiumPlan.tsx`：

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Diamond, AlertCircle } from "lucide-react";

const BENEFITS = [
  {
    title: "ポイント還元率アップ",
    desc: "100円ごとに 3pt → 5pt（約1.7倍）\n予約・コーチング・ゲーム全てに適用",
  },
  {
    title: "コーチ動画レビュー無料",
    desc: "月1回、専用クーポンを自動配布",
  },
  {
    title: "ゲーム参加でボーナスポイント",
    desc: "月例大会の参加・勝利で追加ポイント",
  },
];

const PremiumPlan = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <InnerPageLayout
      title="プレミアムプラン"
      ctaLabel="プレミアムをはじめる"
      ctaDisabled={!agreed}
      onCtaClick={() => navigate("/premium/payment-confirm")}
    >
      {/* Hero */}
      <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5 mb-6">
        <Diamond className="w-6 h-6 text-primary mb-2" />
        <p className="text-sm opacity-80">もっと楽しく、もっとお得に。</p>
        <p className="text-2xl font-bold mt-1">プレミアム会員</p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-bold text-primary">¥500</span>
          <span className="text-sm opacity-80">/ 月（税込）</span>
        </div>
        <p className="text-xs opacity-70 mt-2">いつでも解約可能</p>
      </div>

      <p className="text-sm font-bold text-foreground mb-3">プレミアム特典</p>
      <div className="space-y-3 mb-6">
        {BENEFITS.map((b, i) => (
          <div key={i} className="bg-card border border-border rounded-[8px] p-4 flex gap-3">
            <Diamond className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">{b.title}</p>
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-accent-yellow flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground">自動更新について</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            毎月同日に自動更新されます。マイページからいつでも解約可能です。
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-5 h-5 accent-primary"
        />
        <span className="text-xs text-foreground">利用規約・プライバシーポリシーに同意する</span>
      </label>
      <p className="text-[10px] text-muted-foreground text-center mb-2">
        タップすると利用規約に同意したものとみなします
      </p>
    </InnerPageLayout>
  );
};

export default PremiumPlan;
```

- [ ] **Step 2: 在 App.tsx 加 import 和 route**

在 `src/App.tsx` 既有 imports 區（約 line 53 NotFound import 之前）插入：

```tsx
import PremiumPlan from "./pages/PremiumPlan.tsx";
```

在 `<Route path="*" element={<NotFound />} />` 上方插入：

```tsx
<Route path="/premium/plan" element={<PremiumPlan />} />
```

- [ ] **Step 3: 視覺驗證**

```bash
bun run dev
```

打開 `http://localhost:5173/premium/plan`，確認：
- 黑色 hero 卡顯示「プレミアム会員 ¥500 / 月」
- 3 張特典卡片
- 黃色提醒框
- 同意 checkbox（未勾選時 CTA 為灰）
- 勾選後 CTA「プレミアムをはじめる」可點 → 跳到 `/premium/payment-confirm`（會 404，下一個 Task 補）

- [ ] **Step 4: Commit**

```bash
git add src/pages/PremiumPlan.tsx src/App.tsx
git commit -m "Add /premium/plan page: benefits intro + monthly fee CTA"
```

---

### Task 3: 建立 `/premium/payment-confirm` 與 `/premium/welcome` 頁

**Files:**
- Create: `src/pages/PremiumPaymentConfirm.tsx`
- Create: `src/pages/PremiumWelcome.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 建立 PremiumPaymentConfirm.tsx**

寫入 `src/pages/PremiumPaymentConfirm.tsx`：

```tsx
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription, type PaymentMethod } from "@/lib/subscriptionStore";
import { CreditCard, Smartphone, Apple, ChevronRight } from "lucide-react";

const PremiumPaymentConfirm = () => {
  const navigate = useNavigate();
  const { subscribePremium } = useSubscription();

  const choose = (method: PaymentMethod) => {
    subscribePremium(method);
    navigate("/premium/welcome");
  };

  const PaymentRow = ({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    sub,
    onClick,
  }: {
    icon: typeof CreditCard;
    iconBg: string;
    iconColor: string;
    title: string;
    sub: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-[8px] p-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
    >
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );

  return (
    <InnerPageLayout title="ご注文内容の確認">
      <div className="bg-card border border-border rounded-[8px] p-4 mb-6">
        <p className="text-sm font-bold text-foreground">ご注文内容</p>
        <p className="text-sm text-foreground mt-3">プレミアム会員プラン</p>
        <p className="text-[11px] text-muted-foreground">月額自動更新</p>

        <div className="border-t border-border mt-3 pt-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">月額料金</span>
            <span className="text-foreground">¥455</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">消費税（10%）</span>
            <span className="text-foreground">¥45</span>
          </div>
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-foreground">合計（税込）</span>
          <div>
            <span className="text-2xl font-bold text-foreground">¥500</span>
            <span className="text-sm text-muted-foreground">/ 月</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">お支払い方法を選択してください</p>
      <div className="space-y-2.5">
        <PaymentRow
          icon={CreditCard}
          iconBg="bg-muted"
          iconColor="text-foreground"
          title="クレジットカード"
          sub="Visa / Mastercard / JCB / AMEX"
          onClick={() => choose({ type: "cc", brand: "Mastercard", last4: "3456" })}
        />
        <PaymentRow
          icon={Smartphone}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          title="PayPay"
          sub="PayPay残高から支払い"
          onClick={() => choose({ type: "paypay" })}
        />
        <PaymentRow
          icon={Apple}
          iconBg="bg-muted"
          iconColor="text-foreground"
          title="Apple Pay"
          sub="Face ID / Touch IDで簡単決済"
          onClick={() => choose({ type: "apple" })}
        />
      </div>
    </InnerPageLayout>
  );
};

export default PremiumPaymentConfirm;
```

- [ ] **Step 2: 建立 PremiumWelcome.tsx**

寫入 `src/pages/PremiumWelcome.tsx`：

```tsx
import { useNavigate } from "react-router-dom";
import PhoneMockup from "@/components/PhoneMockup";
import { useSubscription } from "@/lib/subscriptionStore";
import { useUserProfile } from "@/lib/userProfileStore";
import { Check, Diamond } from "lucide-react";

const formatJP = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const PremiumWelcome = () => {
  const navigate = useNavigate();
  const { nextRenewAt } = useSubscription();
  const { profile } = useUserProfile();

  return (
    <PhoneMockup>
      <div className="flex flex-col h-full bg-gray-5 text-primary-foreground p-6">
        <div className="flex-1 flex flex-col items-center justify-start pt-12">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-primary/40" />
            <div className="absolute inset-4 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-10 h-10 text-primary-foreground" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center">
            ようこそ、<br />
            <span className="text-primary">プレミアム会員へ。</span>
          </h1>
          <p className="text-sm opacity-80 mt-3 text-center">
            特典が今すぐご利用いただけます。
          </p>

          <div className="w-full bg-white/10 rounded-[8px] p-4 mt-10">
            <div className="flex items-center gap-3 mb-3">
              <Diamond className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm font-bold">プレミアム会員</p>
                <p className="text-[11px] opacity-70">{profile.name} 様</p>
              </div>
            </div>
            <div className="border-t border-white/20 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="opacity-70">次回更新日</span>
                <span>{formatJP(nextRenewAt)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-70">月額</span>
                <span className="text-primary font-bold">¥500（税込）</span>
              </div>
            </div>
          </div>

          <p className="text-sm font-bold mt-8 mb-3">獲得した特典</p>
          <div className="w-full space-y-2">
            <div className="bg-white/10 rounded-[8px] p-3 flex gap-3">
              <Diamond className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">ポイント還元 5pt / 100円</p>
                <p className="text-[11px] opacity-70 mt-0.5">本日の予約から適用されます</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-[8px] p-3 flex gap-3">
              <Diamond className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">無料レビュークーポン × 1枚</p>
                <p className="text-[11px] opacity-70 mt-0.5">クーポン一覧に追加されました</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/mypage")}
          className="w-full h-14 rounded-[8px] bg-primary text-primary-foreground font-bold mt-8"
        >
          ホームに戻る
        </button>
      </div>
    </PhoneMockup>
  );
};

export default PremiumWelcome;
```

- [ ] **Step 3: App.tsx 加 imports 和 routes**

在 `src/App.tsx` imports 區加：

```tsx
import PremiumPaymentConfirm from "./pages/PremiumPaymentConfirm.tsx";
import PremiumWelcome from "./pages/PremiumWelcome.tsx";
```

在 NotFound route 上方加：

```tsx
<Route path="/premium/payment-confirm" element={<PremiumPaymentConfirm />} />
<Route path="/premium/welcome" element={<PremiumWelcome />} />
```

- [ ] **Step 4: 視覺驗證**

```bash
bun run dev
```

從 `/premium/plan` 勾選同意 → CTA → 進到 `/premium/payment-confirm`，看到合計 ¥500 + 3 個支付選項 → 點任一支付 → 跳到 `/premium/welcome` 顯示恭喜畫面 + 次回更新日 → 點「ホームに戻る」回到 mypage。

- [ ] **Step 5: Commit**

```bash
git add src/pages/PremiumPaymentConfirm.tsx src/pages/PremiumWelcome.tsx src/App.tsx
git commit -m "Add /premium/payment-confirm + /premium/welcome flow"
```

---

### Task 4: 建立 `/premium/manage` 頁（プラン管理）

**Files:**
- Create: `src/pages/PremiumManage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 建立 PremiumManage.tsx**

寫入 `src/pages/PremiumManage.tsx`：

```tsx
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription } from "@/lib/subscriptionStore";
import { Diamond, ChevronRight, Check } from "lucide-react";

const formatJP = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const PremiumManage = () => {
  const navigate = useNavigate();
  const { status, startedAt, nextRenewAt, paymentMethod, history } = useSubscription();

  const isActive = status === "active" || status === "cancelled_pending";
  const recentHistory = [...history].reverse().slice(0, 3);

  return (
    <InnerPageLayout title="プラン管理">
      {/* Current plan */}
      <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Diamond className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs text-primary opacity-80">現在のプラン</p>
              <p className="text-xl font-bold mt-0.5">プレミアム会員</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {status === "cancelled_pending" ? "解約予定" : "利用中"}
          </span>
        </div>
        <div className="border-t border-white/20 mt-4 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="opacity-70">月額</span>
            <span>¥500（税込）</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="opacity-70">次回更新日</span>
            <span>{formatJP(nextRenewAt)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="opacity-70">加入日</span>
            <span>{formatJP(startedAt)}</span>
          </div>
        </div>
      </div>

      {/* This month usage */}
      <p className="text-sm font-bold text-foreground mb-2">今月の特典利用状況</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[11px] text-muted-foreground">獲得ポイント</p>
          <p className="text-xl font-bold text-foreground mt-1">+420 <span className="text-xs">pt</span></p>
          <p className="text-[10px] text-green-600 mt-0.5">通常会員より +168pt</p>
        </div>
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[11px] text-muted-foreground">使用クーポン</p>
          <p className="text-xl font-bold text-foreground mt-1">¥2,000</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">レビュー無料券 ×1 利用</p>
        </div>
      </div>
      <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex items-center gap-2 mb-6">
        <Check className="w-4 h-4 text-accent-yellow flex-shrink-0" />
        <p className="text-[11px] text-foreground">
          月会費以上の特典をご利用中です<br />¥500 → ¥2,420 相当の還元
        </p>
      </div>

      {/* Payment method */}
      <p className="text-sm font-bold text-foreground mb-2">お支払い方法</p>
      <div className="bg-card border border-border rounded-[8px] p-4 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-orange-600">{paymentMethod?.brand?.[0] ?? "?"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{paymentMethod?.brand ?? "未設定"}</p>
          <p className="text-[11px] text-muted-foreground">
            **** **** **** {paymentMethod?.last4 ?? "----"}
          </p>
        </div>
        <button
          onClick={() => navigate("/premium/payment-method")}
          className="text-xs font-bold text-primary"
        >
          変更 ›
        </button>
      </div>

      {/* Billing history (preview) */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-foreground">課金履歴</p>
        <button
          onClick={() => navigate("/premium/billing-history")}
          className="text-xs font-bold text-primary"
        >
          すべて表示 ›
        </button>
      </div>
      <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden mb-6">
        {recentHistory.map((b) => (
          <div key={b.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">{formatJP(b.paidAt)}</p>
              <p className="text-[11px] text-muted-foreground">プレミアム会員（月額）</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">¥{b.amount}</span>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">完了</span>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits checklist */}
      <p className="text-sm font-bold text-foreground mb-2">特典の確認</p>
      <div className="bg-card border border-border rounded-[8px] p-4 space-y-2 mb-6">
        {[
          { label: "ポイント還元 5pt / 100円", state: "利用中" },
          { label: "月1回 コーチレビュー無料", state: "残 1枚" },
          { label: "月例ゲーム ボーナスポイント", state: "利用中" },
          { label: "人気時間帯の優先予約枠", state: "利用中" },
        ].map((b, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs text-foreground">{b.label}</span>
            </div>
            <span className={`text-xs ${b.state === "利用中" ? "text-green-600" : "text-muted-foreground"}`}>
              {b.state}
            </span>
          </div>
        ))}
      </div>

      {/* Cancel link */}
      {isActive && status !== "cancelled_pending" && (
        <div className="text-center">
          <button
            onClick={() => navigate("/premium/cancel")}
            className="text-sm text-destructive font-bold underline"
          >
            プレミアムを解約する
          </button>
          <p className="text-[10px] text-muted-foreground mt-1">
            解約しても、{formatJP(nextRenewAt)}までは特典をご利用いただけます
          </p>
        </div>
      )}
    </InnerPageLayout>
  );
};

export default PremiumManage;
```

- [ ] **Step 2: App.tsx 加 import + route**

```tsx
import PremiumManage from "./pages/PremiumManage.tsx";
```

```tsx
<Route path="/premium/manage" element={<PremiumManage />} />
```

- [ ] **Step 3: 視覺驗證**

打開 `/premium/manage` 直接驗證（demo 預設 active），確認：
- 黑色 hero 顯示「現在のプラン プレミアム会員 利用中」+ 月額/次回更新日/加入日
- 「今月の特典利用状況」2 個卡 + 黃色提醒
- 「お支払い方法」Mastercard ****3456
- 「課金履歴」3 筆預覽
- 「特典の確認」4 項
- 底部「プレミアムを解約する」link（紅色）

- [ ] **Step 4: Commit**

```bash
git add src/pages/PremiumManage.tsx src/App.tsx
git commit -m "Add /premium/manage page: plan status + usage + benefits + cancel link"
```

---

### Task 5: 建立 `/premium/payment-method` 與 `/premium/billing-history` 頁

**Files:**
- Create: `src/pages/PremiumPaymentMethod.tsx`
- Create: `src/pages/PremiumBillingHistory.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 建立 PremiumPaymentMethod.tsx**

寫入 `src/pages/PremiumPaymentMethod.tsx`：

```tsx
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription, type PaymentMethod } from "@/lib/subscriptionStore";
import { CreditCard, Smartphone, Apple, ChevronRight } from "lucide-react";

const PremiumPaymentMethod = () => {
  const navigate = useNavigate();
  const { updatePaymentMethod } = useSubscription();

  const choose = (method: PaymentMethod) => {
    updatePaymentMethod(method);
    navigate(-1);
  };

  const Row = ({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    sub,
    onClick,
  }: {
    icon: typeof CreditCard;
    iconBg: string;
    iconColor: string;
    title: string;
    sub: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-[8px] p-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
    >
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );

  return (
    <InnerPageLayout title="お支払い方法の変更">
      <p className="text-xs text-muted-foreground mb-3">お支払い方法を選択してください</p>
      <div className="space-y-2.5">
        <Row
          icon={CreditCard}
          iconBg="bg-muted"
          iconColor="text-foreground"
          title="クレジットカード"
          sub="Visa / Mastercard / JCB / AMEX"
          onClick={() => choose({ type: "cc", brand: "Mastercard", last4: "3456" })}
        />
        <Row
          icon={Smartphone}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          title="PayPay"
          sub="PayPay残高から支払い"
          onClick={() => choose({ type: "paypay" })}
        />
        <Row
          icon={Apple}
          iconBg="bg-muted"
          iconColor="text-foreground"
          title="Apple Pay"
          sub="Face ID / Touch IDで簡単決済"
          onClick={() => choose({ type: "apple" })}
        />
      </div>
    </InnerPageLayout>
  );
};

export default PremiumPaymentMethod;
```

- [ ] **Step 2: 建立 PremiumBillingHistory.tsx**

寫入 `src/pages/PremiumBillingHistory.tsx`：

```tsx
import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription } from "@/lib/subscriptionStore";

const formatJP = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const PremiumBillingHistory = () => {
  const { history } = useSubscription();
  const sorted = [...history].sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  return (
    <InnerPageLayout title="課金履歴">
      <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
        {sorted.map((b) => (
          <div key={b.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{formatJP(b.paidAt)}</p>
              <p className="text-[11px] text-muted-foreground">プレミアム会員（月額）</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">¥{b.amount}</span>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">完了</span>
            </div>
          </div>
        ))}
      </div>
    </InnerPageLayout>
  );
};

export default PremiumBillingHistory;
```

- [ ] **Step 3: App.tsx 加 imports + routes**

```tsx
import PremiumPaymentMethod from "./pages/PremiumPaymentMethod.tsx";
import PremiumBillingHistory from "./pages/PremiumBillingHistory.tsx";
```

```tsx
<Route path="/premium/payment-method" element={<PremiumPaymentMethod />} />
<Route path="/premium/billing-history" element={<PremiumBillingHistory />} />
```

- [ ] **Step 4: 視覺驗證**

從 `/premium/manage` 點「変更」→ payment-method 頁；點「すべて表示」→ billing-history 頁。確認 5 筆課金歷史按日期降序排列。

- [ ] **Step 5: Commit**

```bash
git add src/pages/PremiumPaymentMethod.tsx src/pages/PremiumBillingHistory.tsx src/App.tsx
git commit -m "Add /premium/payment-method + /premium/billing-history pages"
```

---

### Task 6: 建立 `/premium/cancel` 頁

**Files:**
- Create: `src/pages/PremiumCancel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 建立 PremiumCancel.tsx**

寫入 `src/pages/PremiumCancel.tsx`：

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription } from "@/lib/subscriptionStore";
import { AlertCircle } from "lucide-react";

const formatJP = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const REASONS = [
  "利用頻度が少なくなった",
  "料金が高いと感じた",
  "特典に魅力を感じない",
  "他のサービスを利用するため",
  "アプリの使い勝手が悪い",
  "その他",
];

const PremiumCancel = () => {
  const navigate = useNavigate();
  const { nextRenewAt, cancelPremium } = useSubscription();
  const [reasons, setReasons] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const toggle = (r: string) => {
    const next = new Set(reasons);
    next.has(r) ? next.delete(r) : next.add(r);
    setReasons(next);
  };

  const submit = () => {
    if (!confirmed) return;
    const reasonText = [...reasons].join(", ") + (comment ? ` | ${comment}` : "");
    cancelPremium(reasonText);
    navigate("/mypage");
  };

  return (
    <InnerPageLayout title="解約の最終確認">
      <div className="bg-destructive/5 border border-destructive/30 rounded-[8px] p-3 flex gap-2 mb-6">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-destructive">解約後について</p>
          <p className="text-[11px] text-foreground mt-1 leading-relaxed">
            {formatJP(nextRenewAt)}まで特典をご利用いただけます。
            <br />
            翌日以降、自動的に一般会員になります。
            <br />
            残ポイントはそのままご利用可能です。
          </p>
        </div>
      </div>

      <p className="text-sm font-bold text-foreground">解約理由をお聞かせください</p>
      <p className="text-[11px] text-muted-foreground mt-1 mb-3">
        サービス改善のため、ぜひご協力ください（任意）
      </p>
      <div className="space-y-2 mb-4">
        {REASONS.map((r) => {
          const checked = reasons.has(r);
          return (
            <label
              key={r}
              className={`flex items-center gap-2 px-3 py-3 border rounded-[8px] cursor-pointer ${
                checked ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(r)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">{r}</span>
            </label>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="ご意見・ご要望（任意）&#10;サービス改善の参考にさせていただきます。&#10;よろしければご記入ください。"
        className="w-full min-h-[100px] bg-card border border-border rounded-[8px] p-3 text-xs text-foreground mb-4 resize-none"
      />

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <span className="text-xs text-foreground">解約に関する注意事項を確認しました</span>
      </label>

      <button
        onClick={submit}
        disabled={!confirmed}
        className="w-full h-12 rounded-[8px] bg-destructive text-destructive-foreground font-bold disabled:opacity-40 mb-2"
      >
        解約を確定する
      </button>
      <button
        onClick={() => navigate(-1)}
        className="w-full h-12 rounded-[8px] border border-border bg-background text-foreground font-bold"
      >
        キャンセルして戻る
      </button>
    </InnerPageLayout>
  );
};

export default PremiumCancel;
```

- [ ] **Step 2: App.tsx 加 import + route**

```tsx
import PremiumCancel from "./pages/PremiumCancel.tsx";
```

```tsx
<Route path="/premium/cancel" element={<PremiumCancel />} />
```

- [ ] **Step 3: 視覺驗證**

從 `/premium/manage` 點「プレミアムを解約する」進到 cancel 頁，勾選理由 + 確認 checkbox → 點「解約を確定する」回到 mypage。再次進入 `/premium/manage` 應看到 status badge 顯示「解約予定」+ 底部「プレミアムを解約する」link 隱藏。

- [ ] **Step 4: Commit**

```bash
git add src/pages/PremiumCancel.tsx src/App.tsx
git commit -m "Add /premium/cancel page with reason survey"
```

---

### Task 7: MyPage 整合 Premium（badge + 入口卡片 + プラン管理區塊）

**Files:**
- Modify: `src/pages/MyPage.tsx`

- [ ] **Step 1: 整段重寫 MyPage.tsx**

整段覆蓋 `src/pages/MyPage.tsx`：

```tsx
import { useState } from "react";
import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";
import { Separator } from "@/components/ui/separator";
import { History, Star, Trophy, Lock, Diamond, ChevronRight } from "lucide-react";
import { useUserProfile } from "@/lib/userProfileStore";
import { useSubscription } from "@/lib/subscriptionStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  ExternalLink,
  Globe,
  GraduationCap,
  LogOut,
  Ticket,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const formatJP = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const MyPage = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const sub = useSubscription();
  const [showLogout, setShowLogout] = useState(false);
  const isPremium = sub.isPremium();

  const handleLogout = () => {
    setShowLogout(false);
    navigate("/login");
  };

  return (
    <PhoneMockup bottomNav={<BottomNav active={4} />}>
      <div className="flex flex-col h-full bg-background">
        <div className="flex-shrink-0 sticky top-0 z-30 bg-background">
          <div className="px-[20px] pt-4 pb-3 relative flex items-center justify-center">
            <h1 className="text-xl font-bold text-foreground">マイページ</h1>
            <button
              onClick={() => navigate("/notifications")}
              className="absolute right-[20px] w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
            </button>
          </div>
          <Separator />
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {/* User profile */}
          <button onClick={() => navigate("/profile/edit")} className="w-full text-left">
            <div className="px-[20px] pt-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground">{profile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1 mt-1.5 bg-gray-5 text-primary text-[10px] font-bold px-2 py-0.5 rounded">
                      <Diamond className="w-3 h-3" />
                      プレミアム
                    </span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </button>

          {/* Points card */}
          <div className="px-[20px] mb-4">
            <div className="bg-gray-5 rounded-[8px] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-foreground/60 font-medium">保有ポイント</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-primary">{profile.points.toLocaleString()}</span>
                  <span className="text-sm font-medium text-primary-foreground/70">pt</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/points/history")}
                className="bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-[4px]"
              >
                履歴を見る
              </button>
            </div>
          </div>

          {/* Premium recommendation card (未訂閱者) */}
          {!isPremium && (
            <div className="px-[20px] mb-4">
              <button
                onClick={() => navigate("/premium/plan")}
                className="w-full bg-gray-5 rounded-[8px] p-5 text-left"
              >
                <p className="text-xs text-primary font-bold">プレミアム会員になりませんか？</p>
                <p className="text-base font-bold text-primary-foreground mt-1">
                  特典で、もっとお得に楽しもう。
                </p>
                <ul className="text-[11px] text-primary-foreground/80 mt-3 space-y-0.5">
                  <li>・ポイント還元 3pt → <span className="text-primary font-bold">5pt</span></li>
                  <li>・月1回 コーチレビュー無料クーポン</li>
                  <li>・月例ゲームのボーナスポイント</li>
                </ul>
                <div className="bg-primary text-primary-foreground text-center py-2.5 rounded-[6px] mt-3 text-sm font-bold">
                  月額 ¥500 で始める
                </div>
              </button>
            </div>
          )}

          <Separator />

          {/* Standard menu */}
          <button
            onClick={() => navigate("/coupons")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Ticket className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">クーポン</span>
            <span className="text-xs text-muted-foreground">2枚利用可能</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/bookings/past")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <History className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">予約履歴</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/coaching-history")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <GraduationCap className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">コーチング履歴</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/reviews")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Star className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">評価履歴</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          {isPremium && (
            <button
              onClick={() => navigate("/game/my-results")}
              className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
            >
              <Trophy className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">大会成績</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          )}

          {/* Plan management section (訂閱者) */}
          {isPremium && (
            <>
              <Separator />
              <p className="px-[20px] pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                プラン管理
              </p>
              <div className="px-[20px] pb-2">
                <button
                  onClick={() => navigate("/premium/manage")}
                  className="w-full bg-gray-5 rounded-[8px] p-4 flex items-center gap-3 text-left"
                >
                  <Diamond className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-foreground">プレミアム会員</p>
                    <p className="text-[11px] text-primary-foreground/70 mt-0.5">
                      次回更新：{formatJP(sub.nextRenewAt)}（¥500）
                    </p>
                  </div>
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded">
                    管理
                  </span>
                </button>
              </div>
            </>
          )}

          <Separator />

          <p className="px-[20px] pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
            設定
          </p>
          <button
            onClick={() => navigate("/notification-settings")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">通知設定</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/password-change")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Lock className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">パスワード変更</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/language")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">言語切替</span>
            <span className="text-xs text-muted-foreground">日本語</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/related-sites")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">関連サイト</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>

          <Separator />
          <button
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="flex-1 text-sm font-medium text-destructive">ログアウト</span>
          </button>

          <p className="text-center text-[10px] text-muted-foreground mt-6">PADEL BASE v1.0.0</p>
        </div>
      </div>

      <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
        <AlertDialogContent className="rounded-[8px] max-w-[320px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">ログアウト</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              ログアウトしてもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[4px]">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground rounded-[4px]"
            >
              ログアウト
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PhoneMockup>
  );
};

export default MyPage;
```

- [ ] **Step 2: 視覺驗證**

啟動 dev server，到 mypage：
- 預設訂閱中：名字下方有「プレミアム」badge；不顯示推薦卡；顯示「プラン管理」區塊（黑色卡）+「大会成績」menu 項目
- 經 `/premium/cancel` → 確定後，狀態變 `cancelled_pending`：プラン管理仍顯示，但 isPremium() 仍為 true（demo 用立即生效顯示效果）
- 為了測未訂閱畫面，可在瀏覽器 console 執行 `useSubscription` 不容易，改在 PremiumCancel 流程後加一行 `expireNow()` call 或用 hard-coded 方式測試（先不加，保留 demo 預設 active 即可）

- [ ] **Step 3: Commit**

```bash
git add src/pages/MyPage.tsx
git commit -m "MyPage: integrate Premium badge + entry card + plan management section"
```

---

## Phase 2 — 拆除舊 Game（Task 8）

### Task 8: 刪除舊 Game 頁面、解耦 BookingComplete、清理 Notifications

**Files:**
- Delete: `src/pages/GameHome.tsx`（先暫不刪，下個 Phase 重寫，這裡只移除 routes）
- Delete: `src/pages/GameTeamNew.tsx`
- Delete: `src/pages/GameTeamDetail.tsx`
- Delete: `src/pages/GameMatchNew.tsx`
- Delete: `src/pages/GameMatchDetail.tsx`
- Delete: `src/lib/gameStore.ts`
- Modify: `src/pages/BookingComplete.tsx`（移除 game prompt 邏輯）
- Modify: `src/lib/notificationStore.ts`（更新 type 聯集 + seed 清理）
- Modify: `src/App.tsx`（砍 game routes）

- [ ] **Step 1: 刪除 5 個舊檔案**

```bash
cd /Users/tinatzan/Projects/clients/2026-04-lst-userapp
rm src/pages/GameTeamNew.tsx \
   src/pages/GameTeamDetail.tsx \
   src/pages/GameMatchNew.tsx \
   src/pages/GameMatchDetail.tsx \
   src/lib/gameStore.ts
```

GameHome.tsx 暫時保留（下個 Phase 會整段重寫），但要先把它砍空變 stub 才能讓 build 通過：

整段覆蓋 `src/pages/GameHome.tsx`：

```tsx
import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";

const GameHome = () => (
  <PhoneMockup bottomNav={<BottomNav active={2} />}>
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      準備中
    </div>
  </PhoneMockup>
);

export default GameHome;
```

- [ ] **Step 2: 解耦 BookingComplete**

打開 `src/pages/BookingComplete.tsx`，找到並移除：
- import `useGameStore` 那一行
- destructure `findSchedulableMatchForBooking, getTeam, notifyOpponentAboutBooking`
- 整段 `useEffect` 計算 matchPrompt 的程式碼
- JSX 中渲染 matchPrompt 的整塊 UI
- 所有 `match`, `matchPrompt`, `hasMatchPrompt` 相關 state

具體執行：

```bash
grep -n "gameStore\|matchPrompt\|findSchedulable\|notifyOpponent\|getTeam\b" src/pages/BookingComplete.tsx
```

針對列出的每一行，檢視並刪除（或刪除整段邏輯）。完成後檢查：

```bash
bun run build
```

如有 TS 錯誤照提示修正。

- [ ] **Step 3: 更新 notificationStore.ts type 聯集**

打開 `src/lib/notificationStore.ts`，將 `PushNotification.type` 聯集改為：

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
  | "tournament_partner_invalid"
  | "tournament_starting_soon"
  | "tournament_results_published"
  | "monthly_ranking_finalized";
```

並且把 seed 中所有 `team_*` / `match_*` 類型的 demo 通知整批移除（`team_invite`, `team_invite_accepted`, `team_invite_declined`, `team_disbanded`, `team_auto_matched`, `team_waiting_assignment`, `team_deadline_reminder`, `match_*`），改加 1-2 筆 `tournament_*` demo：

在 demoNotifs array 找到第一筆 `team_invite` 那塊，連同其他 team/match 類型整批替換為（保留位置，順序大致按時間遞減）：

```ts
{
  type: "tournament_results_published",
  title: "大会の結果が発表されました",
  message: "4月度 シングルス大会で第2位を獲得しました（+50積分）。",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  read: false,
},
{
  type: "tournament_registration_confirmed",
  title: "大会のエントリーが完了しました",
  message: "5月度 ダブルス大会（5/12）のエントリーを受け付けました。",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  read: true,
},
{
  type: "monthly_ranking_finalized",
  title: "4月度ランキングが確定しました",
  message: "あなたの順位は5位です。今月もチャレンジしましょう。",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  read: true,
},
```

- [ ] **Step 4: App.tsx 砍 game-related routes**

打開 `src/App.tsx`，刪除：

```tsx
import GameTeamNew from "./pages/GameTeamNew.tsx";
import GameTeamDetail from "./pages/GameTeamDetail.tsx";
import GameMatchNew from "./pages/GameMatchNew.tsx";
import GameMatchDetail from "./pages/GameMatchDetail.tsx";
```

刪除 routes：

```tsx
<Route path="/game/team/new" element={<GameTeamNew />} />
<Route path="/game/team/:id" element={<GameTeamDetail />} />
<Route path="/game/match/new" element={<GameMatchNew />} />
<Route path="/game/match/:id" element={<GameMatchDetail />} />
```

保留：`<Route path="/game" element={<GameHome />} />`

- [ ] **Step 5: 檢查 Notifications.tsx 對 game 通知類型的 reference**

```bash
grep -n "team_\|match_\|matchId\|invitationId" src/pages/Notifications.tsx
```

如果 Notifications.tsx 內有依賴這些 type 的 switch / icon mapping，要刪除 / 改名為 tournament_*。最少要做到 build pass + 既有 navigation 不壞。

- [ ] **Step 6: Build 驗證**

```bash
bun run build
```

Expected: 成功，沒有 TS 錯誤。

- [ ] **Step 7: 視覺驗證**

`bun run dev`：
- BookingComplete：完成 booking 後不再有「相手に場地を通知」的卡片
- Notifications：列表內沒有 team/match 相關通知，改成 tournament 相關
- 點 BottomNav 第 3 顆 ゲーム → 顯示「準備中」 stub

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Remove old Game module: delete team/match pages, decouple BookingComplete, rename notifications to tournament_*"
```

---

## Phase 3 — Tournament 模組（Tasks 9-13）

### Task 9: 建立 `tournamentStore.ts`

**Files:**
- Create: `src/lib/tournamentStore.ts`

- [ ] **Step 1: 寫入完整 store**

整段寫入 `src/lib/tournamentStore.ts`：

```ts
import { useCallback, useSyncExternalStore } from "react";
import { addNotification } from "@/lib/notificationStore";

export const CURRENT_USER = "user-001";
export const POINTS_PARTICIPATION = 10;
export const POINTS_WIN = 50;
export const POINTS_PODIUM = { 1: 100, 2: 50, 3: 25 } as const;

export type TournamentFormat = "singles" | "doubles";
export type TournamentCapacity = 8 | 16 | 32;
export type TournamentStatus =
  | "upcoming"
  | "registration_open"
  | "registration_closed"
  | "in_progress"
  | "completed";

export interface PlayerRef {
  userId: string;
  name: string;
}

export interface TournamentEntry {
  id: string;
  tournamentId: string;
  registrantUserId: string;
  partnerUserId?: string;
  registeredAt: string;
  status: "confirmed" | "cancelled";
}

export interface MatchRecord {
  round: number; // 1=R1, 2=QF, 3=SF, 4=F
  p1UserId: string;
  p2UserId: string;
  p1PartnerId?: string;
  p2PartnerId?: string;
  winnerSide: 1 | 2;
  score: string;
}

export interface TournamentResult {
  rankings: { rank: number; userId: string; partnerId?: string }[];
  matches: MatchRecord[];
}

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
}

const PLAYER_DIRECTORY: PlayerRef[] = [
  { userId: CURRENT_USER, name: "田中 太郎" },
  { userId: "user-002", name: "佐藤 花子" },
  { userId: "user-003", name: "鈴木 一郎" },
  { userId: "user-004", name: "高橋 美咲" },
  { userId: "user-005", name: "渡辺 健太" },
  { userId: "user-006", name: "伊藤 愛" },
  { userId: "user-007", name: "山本 大輝" },
  { userId: "user-008", name: "中村 裕子" },
  { userId: "user-009", name: "吉田 恵" },
  { userId: "user-010", name: "松本 翔太" },
  { userId: "user-011", name: "小林 優" },
  { userId: "user-012", name: "加藤 翼" },
];

export const PREMIUM_USERS = new Set([
  CURRENT_USER,
  "user-002",
  "user-003",
  "user-005",
  "user-006",
  "user-007",
  "user-008",
  "user-010",
]);

export function findPlayerByName(query: string): PlayerRef | undefined {
  return PLAYER_DIRECTORY.find(
    (p) => p.name.replace(/\s/g, "").includes(query.replace(/\s/g, ""))
  );
}

export function getPlayer(userId: string): PlayerRef | undefined {
  return PLAYER_DIRECTORY.find((p) => p.userId === userId);
}

interface StoreState {
  tournaments: Tournament[];
}

function buildInitialState(): StoreState {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString();
  const in7days = new Date(now.getTime() + 7 * 86400000).toISOString();
  const in5days = new Date(now.getTime() + 5 * 86400000).toISOString();
  const in20days = new Date(now.getTime() + 20 * 86400000).toISOString();
  const in15days = new Date(now.getTime() + 15 * 86400000).toISOString();
  const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString();

  // 已結束的大會：自己得第 2 名
  const completedTournament: Tournament = {
    id: "t-completed",
    title: "4月度 シングルス大会",
    format: "singles",
    capacity: 8,
    venue: "LST 本店コートA",
    scheduledAt: lastWeek,
    registrationDeadline: lastWeek,
    status: "completed",
    entries: [
      { id: "e-c1", tournamentId: "t-completed", registrantUserId: CURRENT_USER, registeredAt: lastWeek, status: "confirmed" },
      ...["user-002","user-003","user-005","user-006","user-007","user-010","user-008"].map((u, i) => ({
        id: `e-c${i+2}`, tournamentId: "t-completed", registrantUserId: u, registeredAt: lastWeek, status: "confirmed" as const,
      })),
    ],
    results: {
      rankings: [
        { rank: 1, userId: "user-010" },
        { rank: 2, userId: CURRENT_USER },
        { rank: 3, userId: "user-006" },
        { rank: 4, userId: "user-003" },
      ],
      matches: [
        // R1
        { round: 1, p1UserId: CURRENT_USER, p2UserId: "user-008", winnerSide: 1, score: "6-2" },
        { round: 1, p1UserId: "user-006", p2UserId: "user-007", winnerSide: 1, score: "6-3" },
        { round: 1, p1UserId: "user-010", p2UserId: "user-005", winnerSide: 1, score: "6-1" },
        { round: 1, p1UserId: "user-003", p2UserId: "user-002", winnerSide: 1, score: "6-4" },
        // SF
        { round: 2, p1UserId: CURRENT_USER, p2UserId: "user-006", winnerSide: 1, score: "6-3" },
        { round: 2, p1UserId: "user-010", p2UserId: "user-003", winnerSide: 1, score: "6-2" },
        // F
        { round: 3, p1UserId: CURRENT_USER, p2UserId: "user-010", winnerSide: 2, score: "4-6" },
      ],
    },
  };

  // 報名中（雙打 16 隊）
  const openTournament: Tournament = {
    id: "t-open",
    title: "5月度 ダブルス大会",
    format: "doubles",
    capacity: 16,
    venue: "LST 本店コートB",
    scheduledAt: in7days,
    registrationDeadline: in5days,
    status: "registration_open",
    entries: [
      { id: "e-o1", tournamentId: "t-open", registrantUserId: "user-002", partnerUserId: "user-003", registeredAt: now.toISOString(), status: "confirmed" },
      { id: "e-o2", tournamentId: "t-open", registrantUserId: "user-005", partnerUserId: "user-006", registeredAt: now.toISOString(), status: "confirmed" },
      { id: "e-o3", tournamentId: "t-open", registrantUserId: "user-007", partnerUserId: "user-008", registeredAt: now.toISOString(), status: "confirmed" },
    ],
  };

  // 進行中
  const inProgressTournament: Tournament = {
    id: "t-progress",
    title: "5月度 ダブルス交流戦",
    format: "doubles",
    capacity: 16,
    venue: "LST 西支店コート1",
    scheduledAt: today,
    registrationDeadline: today,
    status: "in_progress",
    entries: [],
  };

  // 即將舉辦
  const upcomingTournament: Tournament = {
    id: "t-upcoming",
    title: "5月度 シングルストーナメント",
    format: "singles",
    capacity: 32,
    venue: "LST 本店コートA",
    scheduledAt: in20days,
    registrationDeadline: in15days,
    status: "upcoming",
    entries: [],
  };

  return {
    tournaments: [
      inProgressTournament,
      openTournament,
      upcomingTournament,
      completedTournament,
    ],
  };
}

let state: StoreState = buildInitialState();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

/* ── Personal scoring ── */

function yearMonthOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface PersonalMonthlyScore {
  yearMonth: string;
  participation: number;
  wins: number;
  podiumBonus: number;
  total: number;
  played: number;
  won: number;
  bestRank: number | null;
  tournaments: {
    tournamentId: string;
    title: string;
    date: string;
    matchesPlayed: number;
    matchesWon: number;
    finalRank: number | null;
    score: number;
  }[];
}

export function computePersonalMonthlyScore(
  userId: string,
  yearMonth: string,
  tournaments: Tournament[]
): PersonalMonthlyScore {
  const inMonth = tournaments.filter(
    (t) => t.status === "completed" && yearMonthOf(t.scheduledAt) === yearMonth && t.results
  );
  let participation = 0;
  let wins = 0;
  let podiumBonus = 0;
  let played = 0;
  let won = 0;
  let bestRank: number | null = null;
  const list: PersonalMonthlyScore["tournaments"] = [];

  for (const t of inMonth) {
    const entry = t.entries.find(
      (e) => e.status === "confirmed" && (e.registrantUserId === userId || e.partnerUserId === userId)
    );
    if (!entry) continue;
    participation += POINTS_PARTICIPATION;

    let mPlayed = 0;
    let mWon = 0;
    for (const m of t.results!.matches) {
      const onSide1 = m.p1UserId === userId || m.p1PartnerId === userId;
      const onSide2 = m.p2UserId === userId || m.p2PartnerId === userId;
      if (!onSide1 && !onSide2) continue;
      mPlayed++;
      const isWin = (onSide1 && m.winnerSide === 1) || (onSide2 && m.winnerSide === 2);
      if (isWin) mWon++;
    }
    wins += mWon * POINTS_WIN;
    played += mPlayed;
    won += mWon;

    const ranking = t.results!.rankings.find(
      (r) => r.userId === userId || r.partnerId === userId
    );
    let podium = 0;
    let finalRank: number | null = null;
    if (ranking) {
      finalRank = ranking.rank;
      if (bestRank == null || ranking.rank < bestRank) bestRank = ranking.rank;
      if (ranking.rank === 1) podium = POINTS_PODIUM[1];
      else if (ranking.rank === 2) podium = POINTS_PODIUM[2];
      else if (ranking.rank === 3) podium = POINTS_PODIUM[3];
    }
    podiumBonus += podium;

    const tScore = POINTS_PARTICIPATION + mWon * POINTS_WIN + podium;
    list.push({
      tournamentId: t.id,
      title: t.title,
      date: t.scheduledAt,
      matchesPlayed: mPlayed,
      matchesWon: mWon,
      finalRank,
      score: tScore,
    });
  }

  return {
    yearMonth,
    participation,
    wins,
    podiumBonus,
    total: participation + wins + podiumBonus,
    played,
    won,
    bestRank,
    tournaments: list,
  };
}

export interface MonthlyRankingRow {
  userId: string;
  name: string;
  score: number;
  played: number;
  won: number;
  bestRank: number | null;
}

export function computeMonthlyRanking(
  yearMonth: string,
  tournaments: Tournament[]
): MonthlyRankingRow[] {
  const allUserIds = new Set<string>();
  tournaments.forEach((t) => {
    if (yearMonthOf(t.scheduledAt) !== yearMonth) return;
    t.entries.forEach((e) => {
      if (e.status !== "confirmed") return;
      allUserIds.add(e.registrantUserId);
      if (e.partnerUserId) allUserIds.add(e.partnerUserId);
    });
  });

  const rows: MonthlyRankingRow[] = [];
  for (const uid of allUserIds) {
    const s = computePersonalMonthlyScore(uid, yearMonth, tournaments);
    const player = getPlayer(uid);
    rows.push({
      userId: uid,
      name: player?.name ?? uid,
      score: s.total,
      played: s.played,
      won: s.won,
      bestRank: s.bestRank,
    });
  }
  return rows.sort((a, b) => b.score - a.score || b.won - a.won);
}

/* ── Hook ── */

export function useTournamentStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  const getTournament = useCallback((id: string) => {
    return data.tournaments.find((t) => t.id === id);
  }, [data.tournaments]);

  const getMyEntries = useCallback(() => {
    return data.tournaments
      .filter((t) =>
        t.entries.some(
          (e) =>
            e.status === "confirmed" &&
            (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
        )
      );
  }, [data.tournaments]);

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

      const entry: TournamentEntry = {
        id: `e-${Date.now()}`,
        tournamentId,
        registrantUserId: CURRENT_USER,
        partnerUserId,
        registeredAt: new Date().toISOString(),
        status: "confirmed",
      };
      state = {
        ...state,
        tournaments: state.tournaments.map((x) =>
          x.id === tournamentId ? { ...x, entries: [...x.entries, entry] } : x
        ),
      };
      emit();
      addNotification({
        type: "tournament_registration_confirmed",
        title: "大会のエントリーが完了しました",
        message: `${t.title}のエントリーを受け付けました。`,
      });
      return { ok: true };
    },
    []
  );

  const getCompletedTournaments = useCallback(
    (sinceIso?: string) => {
      return data.tournaments
        .filter((t) => t.status === "completed")
        .filter((t) => !sinceIso || t.scheduledAt >= sinceIso)
        .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
    },
    [data.tournaments]
  );

  return {
    ...data,
    getTournament,
    getMyEntries,
    registerForTournament,
    getCompletedTournaments,
    computeMyMonthlyScore: (ym: string) => computePersonalMonthlyScore(CURRENT_USER, ym, data.tournaments),
    computeRanking: (ym: string) => computeMonthlyRanking(ym, data.tournaments),
  };
}
```

- [ ] **Step 2: Build 驗證**

```bash
bun run build
```

Expected: 成功。

- [ ] **Step 3: Commit**

```bash
git add src/lib/tournamentStore.ts
git commit -m "Add tournamentStore: monthly tournament scoring + player directory + 4 demo tournaments"
```

---

### Task 10: 重寫 GameHome.tsx（3-Tab 主畫面）

**Files:**
- Modify: `src/pages/GameHome.tsx`

- [ ] **Step 1: 整段重寫 GameHome.tsx**

整段覆蓋 `src/pages/GameHome.tsx`：

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";
import AnimatedTabs from "@/components/AnimatedTabs";
import { useTournamentStore, CURRENT_USER, type Tournament } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { Trophy, Calendar, MapPin, ChevronRight, Diamond, Lock, Users } from "lucide-react";

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function previousYearMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "近日開催",
  registration_open: "エントリー受付中",
  registration_closed: "受付終了",
  in_progress: "開催中",
  completed: "終了",
};

const STATUS_CLS: Record<string, string> = {
  upcoming: "bg-muted text-muted-foreground",
  registration_open: "bg-primary/10 text-primary",
  registration_closed: "bg-accent-yellow/10 text-accent-yellow",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-muted text-muted-foreground",
};

const GameHome = () => {
  const navigate = useNavigate();
  const { tournaments, getMyEntries, computeMyMonthlyScore, computeRanking } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();

  const [tab, setTab] = useState("tournaments");

  const thisMonth = currentYearMonth();
  const prevMonth = previousYearMonth();

  const myScore = computeMyMonthlyScore(thisMonth);
  const myEntries = getMyEntries();
  const currentRanking = computeRanking(thisMonth);
  const lastRanking = computeRanking(prevMonth);
  const myCurrentRank = currentRanking.findIndex((r) => r.userId === CURRENT_USER);

  const upcomingAndOpen = tournaments.filter((t) =>
    ["upcoming", "registration_open", "in_progress"].includes(t.status)
  );
  const completed = tournaments.filter((t) => t.status === "completed");

  const TABS = [
    { key: "tournaments", label: "大会" },
    { key: "my-entries", label: "マイエントリー" },
    { key: "ranking", label: "ランキング" },
  ];

  const TournamentCard = ({ t }: { t: Tournament }) => (
    <button
      onClick={() => navigate(`/game/tournament/${t.id}`)}
      className="w-full bg-card border border-border rounded-[8px] p-4 text-left hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_CLS[t.status]}`}>
          {STATUS_LABEL[t.status]}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">
          {t.format === "singles" ? "シングルス" : "ダブルス"} / {t.capacity}枠
        </span>
      </div>
      <p className="text-sm font-bold text-foreground">{t.title}</p>
      <div className="mt-2 space-y-0.5">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDateTime(t.scheduledAt)}
        </p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {t.venue}
        </p>
        {t.status === "registration_open" && (
          <p className="text-[11px] text-primary font-bold flex items-center gap-1 mt-1.5">
            <Users className="w-3 h-3" />
            {t.entries.length} / {t.capacity} エントリー済
          </p>
        )}
      </div>
    </button>
  );

  return (
    <PhoneMockup bottomNav={<BottomNav active={2} />}>
      <div className="bg-background pb-4">
        <header className="bg-gray-5 py-3 pb-[120px]">
          <div className="flex items-center justify-center px-[20px]">
            <h1 className="text-lg font-bold text-primary-foreground">ゲーム</h1>
          </div>
        </header>

        {/* Hero */}
        <div className="-mt-[100px] relative z-10 px-[20px]">
          <div className="rounded-[12px] overflow-hidden shadow-lg bg-primary text-primary-foreground">
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium opacity-80">{formatYM(thisMonth)}（今月）</p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                  <p className="text-[9px] text-muted-foreground">今月積分</p>
                  <p className="text-base font-bold text-primary">{myScore.total}</p>
                </div>
                <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                  <p className="text-[9px] text-muted-foreground">即時順位</p>
                  <p className="text-base font-bold text-primary">
                    {myCurrentRank >= 0 ? `${myCurrentRank + 1}位` : "—"}
                  </p>
                </div>
                <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                  <p className="text-[9px] text-muted-foreground">出場</p>
                  <p className="text-base font-bold text-foreground">{myScore.tournaments.length}回</p>
                </div>
              </div>
            </div>
            <div className="bg-foreground px-5 py-2.5 flex items-center justify-between text-[11px] text-primary-foreground">
              {isPremium ? (
                <>
                  <span className="flex items-center gap-1">
                    <Diamond className="w-3 h-3 text-primary" />
                    プレミアム会員
                  </span>
                  <span>エントリー可能</span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    一般会員
                  </span>
                  <button onClick={() => navigate("/premium/plan")} className="text-primary font-bold">
                    プレミアム登録 ›
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <AnimatedTabs tabs={TABS} activeKey={tab} onChange={setTab} className="px-[20px]" />
        </div>

        <div className="px-[20px] mt-4 space-y-5">
          {tab === "tournaments" && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground">開催予定・受付中</p>
                {upcomingAndOpen.map((t) => <TournamentCard key={t.id} t={t} />)}
              </div>
              {completed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">過去の大会</p>
                  {completed.map((t) => <TournamentCard key={t.id} t={t} />)}
                </div>
              )}
            </>
          )}

          {tab === "my-entries" && (
            <>
              {!isPremium && (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
                  <Diamond className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">マイエントリーはプレミアム会員限定です</p>
                  <button
                    onClick={() => navigate("/premium/plan")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-bold mt-1"
                  >
                    プレミアム登録 ›
                  </button>
                </div>
              )}
              {isPremium && myEntries.length === 0 && (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
                  <p className="text-xs text-muted-foreground">エントリー中の大会はありません</p>
                </div>
              )}
              {isPremium && myEntries.map((t) => <TournamentCard key={t.id} t={t} />)}
            </>
          )}

          {tab === "ranking" && (
            <>
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">{formatYM(thisMonth)} 即時ランキング</p>
                </div>
              </div>
              {currentRanking.length === 0 ? (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
                  <p className="text-xs text-muted-foreground">今月のデータはまだありません</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                  {currentRanking.slice(0, 10).map((r, i) => {
                    const isMine = r.userId === CURRENT_USER;
                    return (
                      <div key={r.userId} className={`p-3 flex items-center gap-3 ${isMine ? "bg-primary/5" : ""}`}>
                        <div className="w-8 text-center font-bold text-sm text-muted-foreground">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isMine ? "text-primary" : "text-foreground"}`}>
                            {r.name}{isMine && <span className="text-[10px] ml-1">（自分）</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{r.played}試合 {r.won}勝</p>
                        </div>
                        <p className="text-sm font-bold text-primary">{r.score}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mt-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">{formatYM(prevMonth)} 最終ランキング</p>
                </div>
              </div>
              {lastRanking.length === 0 ? (
                <div className="bg-muted/30 border border-border rounded-[8px] p-4 text-center">
                  <p className="text-xs text-muted-foreground">先月のデータはありません</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                  {lastRanking.slice(0, 10).map((r, i) => {
                    const isMine = r.userId === CURRENT_USER;
                    return (
                      <div key={r.userId} className={`p-3 flex items-center gap-3 ${isMine ? "bg-primary/5" : ""}`}>
                        <div className="w-8 text-center font-bold text-sm text-muted-foreground">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isMine ? "text-primary" : "text-foreground"}`}>
                            {r.name}{isMine && <span className="text-[10px] ml-1">（自分）</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{r.played}試合 {r.won}勝</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">{r.score}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PhoneMockup>
  );
};

export default GameHome;
```

- [ ] **Step 2: 視覺驗證**

`bun run dev` → 點 BottomNav 第 3 顆ゲーム：
- Hero 顯示「今月積分 / 即時順位 / 出場回數」
- 底部 footer 因預設訂閱顯示「プレミアム会員 エントリー可能」
- Tab 1「大会」：列出 4 場 demo 大會（進行中 / 報名中 / 即將舉辦 / 已結束）
- Tab 2「マイエントリー」：訂閱者顯示空狀態（demo 預設未報名 open 大會）
- Tab 3「ランキング」：當月即時 + 上月最終，每張 row 含順位、名字、score

- [ ] **Step 3: Commit**

```bash
git add src/pages/GameHome.tsx
git commit -m "Rewrite GameHome: 3-tab tournament listing + monthly ranking + Premium gating"
```

---

### Task 11: 建立 `/game/tournament/:id` 賽事詳情頁

**Files:**
- Create: `src/pages/TournamentDetail.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 建立 TournamentDetail.tsx**

寫入 `src/pages/TournamentDetail.tsx`：

```tsx
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, getPlayer } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { Calendar, MapPin, Users, Trophy, Diamond, Lock } from "lucide-react";

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
      <div className="bg-card border border-border rounded-[8px] p-4 mb-4">
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

- [ ] **Step 2: App.tsx 加 import + route**

```tsx
import TournamentDetail from "./pages/TournamentDetail.tsx";
```

```tsx
<Route path="/game/tournament/:id" element={<TournamentDetail />} />
```

- [ ] **Step 3: 視覺驗證**

從 GameHome 點各種 status 的賽事卡片：
- 進行中 / 即將舉辦：CTA 不顯示
- 報名中：CTA 顯示「エントリーする」（訂閱者）；解約後再來看會變「プレミアム会員になってエントリー」
- 已結束：底部顯示完整 ranking + 對戰記錄；自己的列高亮

- [ ] **Step 4: Commit**

```bash
git add src/pages/TournamentDetail.tsx src/App.tsx
git commit -m "Add /game/tournament/:id detail page with bracket + rankings"
```

---

### Task 12: 建立 `/game/tournament/:id/entry` 報名頁

**Files:**
- Create: `src/pages/TournamentEntry.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 建立 TournamentEntry.tsx**

寫入 `src/pages/TournamentEntry.tsx`：

```tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, findPlayerByName, PREMIUM_USERS, getPlayer, CURRENT_USER } from "@/lib/tournamentStore";
import { useUserProfile } from "@/lib/userProfileStore";
import { Check, X, AlertCircle, Diamond } from "lucide-react";

const TournamentEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTournament, registerForTournament } = useTournamentStore();
  const { profile } = useUserProfile();

  const t = id ? getTournament(id) : undefined;
  const [partnerName, setPartnerName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!t) {
    return (
      <InnerPageLayout title="エントリー">
        <p className="text-center text-sm text-muted-foreground">大会が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const isDoubles = t.format === "doubles";
  const partner = partnerName.trim() ? findPlayerByName(partnerName.trim()) : undefined;
  const partnerIsPremium = partner ? PREMIUM_USERS.has(partner.userId) : undefined;
  const partnerIsSelf = partner?.userId === CURRENT_USER;
  const canSubmit = !isDoubles || (!!partner && partnerIsPremium && !partnerIsSelf);

  const submit = () => {
    setError(null);
    const result = registerForTournament(t.id, isDoubles ? partner?.userId : undefined);
    if (!result.ok) {
      setError(result.error ?? "エントリーに失敗しました");
      return;
    }
    navigate(`/game/tournament/${t.id}`);
  };

  return (
    <InnerPageLayout
      title="エントリー確認"
      ctaLabel="エントリーを確定する"
      ctaDisabled={!canSubmit}
      onCtaClick={submit}
    >
      <div className="bg-card border border-border rounded-[8px] p-4 mb-4">
        <p className="text-sm font-bold text-foreground">{t.title}</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {t.format === "singles" ? "シングルス" : "ダブルス"} / {t.capacity}枠
        </p>
      </div>

      <p className="text-sm font-bold text-foreground mb-2">代表者</p>
      <div className="bg-card border border-border rounded-[8px] p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Diamond className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{profile.name}</p>
          <p className="text-[11px] text-primary font-bold">プレミアム会員</p>
        </div>
      </div>

      {isDoubles && (
        <>
          <p className="text-sm font-bold text-foreground mb-2">パートナー</p>
          <input
            type="text"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="パートナーの氏名を入力（例：佐藤 花子）"
            className="w-full bg-card border border-border rounded-[8px] p-3 text-sm text-foreground mb-2"
          />

          {partner && partnerIsSelf && (
            <div className="bg-destructive/5 border border-destructive/30 rounded-[8px] p-3 flex items-center gap-2 mb-2">
              <X className="w-4 h-4 text-destructive" />
              <p className="text-xs text-destructive">自分自身は指定できません</p>
            </div>
          )}

          {partner && !partnerIsSelf && partnerIsPremium && (
            <div className="bg-primary/5 border border-primary/30 rounded-[8px] p-3 flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">{partner.name}</p>
                <p className="text-[11px] text-primary">プレミアム会員 / エントリー可能</p>
              </div>
            </div>
          )}

          {partner && !partnerIsSelf && !partnerIsPremium && (
            <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-accent-yellow flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">
                  {partner.name} さんはプレミアム会員ではありません
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  パートナーがプレミアム会員でないとエントリーできません。<br />
                  相手にプレミアム登録を依頼してください。
                </p>
              </div>
            </div>
          )}

          {partnerName.trim() && !partner && (
            <div className="bg-muted border border-border rounded-[8px] p-3 text-xs text-muted-foreground mb-2">
              該当するユーザーが見つかりません
            </div>
          )}
        </>
      )}

      {error && (
        <div className="bg-destructive/5 border border-destructive/30 rounded-[8px] p-3 text-xs text-destructive mt-2">
          {error}
        </div>
      )}
    </InnerPageLayout>
  );
};

export default TournamentEntry;
```

- [ ] **Step 2: App.tsx 加 import + route**

```tsx
import TournamentEntry from "./pages/TournamentEntry.tsx";
```

```tsx
<Route path="/game/tournament/:id/entry" element={<TournamentEntry />} />
```

- [ ] **Step 3: 視覺驗證**

從報名中的雙打大會 (`/game/tournament/t-open`) 點 CTA → entry 頁：
- 上方代表者卡片
- 輸入「佐藤 花子」→ 顯示綠色「プレミアム会員 / エントリー可能」
- 輸入「中村」（user-008 是 Premium，按全部 PREMIUM_USERS 設定要查表）→ 看是否 Premium
- 輸入「吉田 恵」（user-009 不在 PREMIUM_USERS）→ 顯示黃色警告
- 輸入「田中 太郎」→ 紅色「自分自身は指定できません」
- 隨意輸入「ABC」→ 顯示「該当するユーザーが見つかりません」
- 確認可以後點 CTA → 回到 detail 頁顯示「エントリー済」

- [ ] **Step 4: Commit**

```bash
git add src/pages/TournamentEntry.tsx src/App.tsx
git commit -m "Add /game/tournament/:id/entry: doubles partner Premium verification"
```

---

### Task 13: 建立 `/game/my-results` 個人成績頁

**Files:**
- Create: `src/pages/MyResults.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 建立 MyResults.tsx**

寫入 `src/pages/MyResults.tsx`：

```tsx
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, computePersonalMonthlyScore } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { Trophy, Calendar, Diamond } from "lucide-react";

function yearMonthsBetween(startIso: string, endDate: Date): string[] {
  const start = new Date(startIso);
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months.reverse(); // 最新月在最上面
}

function formatYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

const MyResults = () => {
  const navigate = useNavigate();
  const { tournaments } = useTournamentStore();
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

  const months = yearMonthsBetween(periodStart, new Date());
  const cards = months
    .map((ym) => computePersonalMonthlyScore(CURRENT_USER, ym, tournaments))
    .filter((s) => s.tournaments.length > 0 || s.total > 0);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <InnerPageLayout title="大会成績">
      <p className="text-[11px] text-muted-foreground mb-3">
        プレミアム会員期間（{new Date(periodStart).getFullYear()}年
        {new Date(periodStart).getMonth() + 1}月{new Date(periodStart).getDate()}日〜）の成績を表示しています
      </p>

      {cards.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">まだ大会の参加記録がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((s) => (
            <div key={s.yearMonth} className="bg-card border border-border rounded-[8px] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {formatYM(s.yearMonth)}
                  {s.yearMonth === thisMonth && (
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                      今月
                    </span>
                  )}
                </p>
                <p className="text-2xl font-bold text-primary">{s.total}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-[6px] p-2">
                  <p className="text-[10px] text-muted-foreground">出場</p>
                  <p className="text-sm font-bold text-foreground">{s.tournaments.length} 回</p>
                </div>
                <div className="bg-muted/50 rounded-[6px] p-2">
                  <p className="text-[10px] text-muted-foreground">勝率</p>
                  <p className="text-sm font-bold text-foreground">
                    {s.played === 0 ? "—" : `${Math.round((s.won / s.played) * 100)}%`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{s.won}勝{s.played - s.won}敗</p>
                </div>
                <div className="bg-muted/50 rounded-[6px] p-2">
                  <p className="text-[10px] text-muted-foreground">最高名次</p>
                  <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                    {s.bestRank ? (
                      <>
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                        {s.bestRank}位
                      </>
                    ) : "—"}
                  </p>
                </div>
              </div>

              {s.tournaments.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {s.tournaments.map((tt) => (
                    <button
                      key={tt.tournamentId}
                      onClick={() => navigate(`/game/tournament/${tt.tournamentId}`)}
                      className="w-full bg-muted/30 rounded-[6px] p-2 text-left flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{tt.title}</p>
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
          ))}
        </div>
      )}
    </InnerPageLayout>
  );
};

export default MyResults;
```

- [ ] **Step 2: App.tsx 加 import + route**

```tsx
import MyResults from "./pages/MyResults.tsx";
```

```tsx
<Route path="/game/my-results" element={<MyResults />} />
```

- [ ] **Step 3: 視覺驗證**

從 MyPage menu 點「大会成績」（訂閱者才有此 entry）→ 看到月份卡片：
- 4 月卡（已完成的賽事，自己第 2 名 → +280 分）
- 5 月卡（沒有 completed tournament 在 5 月，所以可能是空 list 或被過濾）

修正預期：因為 demo 唯一的 completed tournament 是「上週」（4 月），所以 my-results 看到的會是 4 月那張卡 + 該大會明細。如果今天日期是 5 月初則沒有 5 月卡顯示。

- [ ] **Step 4: Commit**

```bash
git add src/pages/MyResults.tsx src/App.tsx
git commit -m "Add /game/my-results: monthly personal score cards (Premium-gated, period-scoped)"
```

---

## Phase 4 — 整合驗證（Task 14）

### Task 14: End-to-End 驗證 + polish

**Files:**
- Modify: any file as needed for fixes

- [ ] **Step 1: User Journey A（未訂閱者）測試**

人為先把預設改成未訂閱：在 `src/lib/subscriptionStore.ts` `buildInitialState` 暫時改 `status: "expired"` 並把 `startedAt`/`nextRenewAt`/`paymentMethod` 改成 undefined。然後 `bun run dev`：

1. MyPage：
   - 名字下無 Premium badge ✓
   - 顯示「プレミアム会員になりませんか？」推薦卡片 ✓
   - 不顯示「大会成績」menu ✓
   - 不顯示「プラン管理」section ✓
2. ゲーム tab：
   - Hero footer 顯示「一般会員 / プレミアム登録 ›」 ✓
   - Tab「大会」：所有大會卡片可見 ✓
   - Tab「マイエントリー」：顯示「プレミアム会員限定」引導 ✓
   - Tab「ランキング」：可看 ✓
3. 點報名中的賽事 → CTA 變「プレミアム会員になってエントリー」 → 點 → 跳到 `/premium/plan` ✓
4. `/game/my-results`：顯示「大会成績はプレミアム会員限定です」+ 引導 ✓

通過後**還原**：`status: "active"` + 完整資料（如 Task 1 原始版本）。

- [ ] **Step 2: User Journey B（訂閱者）測試**

`bun run dev`：

1. MyPage：Premium badge ✓ / プラン管理區塊 ✓ / 大会成績 menu ✓
2. 點推薦卡片… 等等這時候沒推薦卡，從沒「再訂閱」流程進入。改用：點 マイページ→プラン管理→解約 → 確定
3. 解約後狀態變 `cancelled_pending`，仍 isPremium → 維持訂閱者畫面（demo 設計）
4. 進到 ゲーム → Tab 大会 → 點報名中賽事 → CTA「エントリーする」 → entry 頁 → 輸入「佐藤 花子」（user-002 在 PREMIUM_USERS）→ 顯示綠色 OK → 確定 → 回 detail 頁顯示「エントリー済 ・ パートナー: 佐藤 花子」 ✓
5. 再到 マイエントリー Tab：顯示剛才的賽事卡 ✓
6. 點已結束的賽事 → 看 bracket + 自己第 2 名高亮 ✓
7. 點 ランキング → 看到當月即時 + 上月最終排名 ✓
8. MyPage → 大会成績 → 看月度卡片 ✓

- [ ] **Step 3: BookingComplete 沒有 game prompt 殘留**

預約一個 court → 完成 → BookingComplete 頁不應有任何「対戦相手に通知」UI。

- [ ] **Step 4: Notifications 顯示新類型**

進到 通知 → 只看到 booking/tournament 相關通知，不再有 team/match。

- [ ] **Step 5: Build 最終驗證**

```bash
bun run build
```

Expected: 完全成功，沒有 TS 錯誤、沒有 unused import warning（大致）。

- [ ] **Step 6: Polish 修正**

針對上面任何一步發現的細節（spacing 不對 / icon 顏色 / 文案 typo）逐一修正。每個修正獨立 commit。

- [ ] **Step 7: 最終 commit**

```bash
git status
# 若有 polish 變更
git add -A
git commit -m "Polish: alignment + copy fixes after end-to-end verification"
```

---

## Self-Review 檢查表

- ✅ Spec coverage:
  - §4.1 砍除清單 → Task 8 ✓
  - §4.2 userProfileStore 調整 → 在 Task 14 step 6 polish 中視需要加 `addXp`（目前計分由 tournamentStore 內 derived，不需 mutate user xp，可 omit；若驗收需要顯示「累計 XP」可在 polish 補）
  - §5 訂閱 → Tasks 1-7 ✓
  - §6 Tournament → Tasks 9-13 ✓
  - §7 通知對映 → Task 8 ✓
  - §8 navigation → 各 Task 路由綁定 ✓
  - §9 Demo → Task 1 (subscription) + Task 9 (4 tournaments) ✓
  - §11 風險：歷史成績 cutoff = currentPeriodStartedAt → Task 13 用 `sub.currentPeriodStartedAt()` 過濾 ✓

- ✅ Placeholder scan: 無 TBD / TODO / fill-in-later
- ✅ Type consistency: `Tournament` / `TournamentEntry` / `MatchRecord` / `TournamentResult` / `PaymentMethod` / `SubscriptionStatus` 在 store 與 page 之間一致
- ✅ Function naming: `computePersonalMonthlyScore`、`computeMonthlyRanking`、`registerForTournament` 全程一致

---

**End of Plan.**
