import { useSyncExternalStore } from "react";

import type { SalesKind, SalesStatus } from "./storeLabels";

/**
 * 売上管理 Mock Store
 * - seed: 30 件の取引（種別/ステータス/金額/日付 mix）
 * - overlay: 手動調整 / 返金処理
 * - 全部 in-memory（reload で seed に戻る）
 */

export interface SalesTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  kind: SalesKind;
  customerName: string;
  amount: number; // 円
  fee: number; // 円（手数料）
  net: number; // 円（純額 = amount - fee）
  status: SalesStatus;
  reason?: string; // 手動調整・返金理由
}

const CUSTOMER_NAMES = [
  "田中 太郎", "鈴木 花子", "佐藤 健", "高橋 美咲", "渡辺 直樹",
  "伊藤 雅之", "山本 沙希", "中村 翔", "小林 麻衣", "加藤 大輔",
  "吉田 涼", "山田 葵", "斉藤 拓真", "松本 萌", "井上 結衣",
];

const KINDS: SalesKind[] = ["court", "coach", "tournament", "other"];
const STATUSES: SalesStatus[] = ["confirmed", "confirmed", "confirmed", "pending", "refunded"];

// 過去 3 ヶ月の日付を生成（today = 2026-05-21 を基準）
function dateOffset(daysAgo: number): string {
  const d = new Date(2026, 4, 21); // 2026-05-21
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function seedTransactions(): SalesTransaction[] {
  const txs: SalesTransaction[] = [];
  for (let i = 0; i < 30; i++) {
    const kind = KINDS[i % KINDS.length];
    const status = STATUSES[i % STATUSES.length];
    const amount = 1500 + ((i * 731) % 14) * 1000; // 1500 〜 14500
    const fee = Math.round(amount * 0.08);
    const daysAgo = (i * 3) % 90;
    txs.push({
      id: `TX-${String(20260000 + i).padStart(8, "0")}`,
      date: dateOffset(daysAgo),
      kind,
      customerName: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length],
      amount,
      fee,
      net: amount - fee,
      status,
    });
  }
  // 日付降順でソート
  return txs.sort((a, b) => (a.date < b.date ? 1 : -1));
}

let state: { transactions: SalesTransaction[] } = {
  transactions: seedTransactions(),
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useAdminSales = (): SalesTransaction[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.transactions;
};

export const useAdminSalesTransaction = (id: string | undefined): SalesTransaction | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.transactions.find((t) => t.id === id);
};

export const addAdjustTransaction = (input: {
  amount: number;
  reason: string;
  kind: SalesKind;
  customerName?: string;
}): void => {
  const next = [...state.transactions];
  const fee = 0;
  next.unshift({
    id: `TX-ADJ-${Date.now().toString().slice(-8)}`,
    date: new Date().toISOString().slice(0, 10),
    kind: input.kind,
    customerName: input.customerName ?? "（手動調整）",
    amount: input.amount,
    fee,
    net: input.amount - fee,
    status: "confirmed",
    reason: input.reason,
  });
  state = { transactions: next };
  notify();
};

export const refundTransaction = (id: string, reason: string): void => {
  state = {
    transactions: state.transactions.map((t) =>
      t.id === id ? { ...t, status: "refunded", reason } : t,
    ),
  };
  notify();
};
