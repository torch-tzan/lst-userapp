import { useSyncExternalStore } from "react";

import type { PaymentMethod, PaymentStatus } from "./storeLabels";

/**
 * 支払い履歴 Mock Store
 * - seed: 40 件
 */

export interface PaymentRecord {
  id: string;
  date: string; // YYYY-MM-DD HH:mm
  memberName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  relatedTxId?: string; // 取引 ID
  refundReason?: string;
}

const MEMBER_NAMES = [
  "田中 太郎", "鈴木 花子", "佐藤 健", "高橋 美咲", "渡辺 直樹",
  "伊藤 雅之", "山本 沙希", "中村 翔", "小林 麻衣", "加藤 大輔",
  "吉田 涼", "山田 葵",
];

const METHODS: PaymentMethod[] = ["credit", "credit", "credit", "paypay", "apple_pay"];
const STATUSES: PaymentStatus[] = ["completed", "completed", "completed", "completed", "failed", "pending", "refunded"];

function dateTimeOffset(daysAgo: number, hour: number, minute: number): string {
  const d = new Date(2026, 4, 21, hour, minute);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function seedPayments(): PaymentRecord[] {
  const rows: PaymentRecord[] = [];
  for (let i = 0; i < 40; i++) {
    const status = STATUSES[i % STATUSES.length];
    const amount = 1500 + ((i * 533) % 14) * 1000;
    rows.push({
      id: `PY-${String(50000 + i).padStart(6, "0")}`,
      date: dateTimeOffset((i * 2) % 60, 9 + (i % 12), (i * 7) % 60),
      memberName: MEMBER_NAMES[i % MEMBER_NAMES.length],
      amount,
      method: METHODS[i % METHODS.length],
      status,
      relatedTxId: status !== "failed" ? `TX-${String(20260000 + (i % 30)).padStart(8, "0")}` : undefined,
    });
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

let state: { payments: PaymentRecord[] } = {
  payments: seedPayments(),
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useAdminPayments = (): PaymentRecord[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.payments;
};

export const useAdminPayment = (id: string | undefined): PaymentRecord | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.payments.find((p) => p.id === id);
};

export const refundPayment = (id: string, reason: string): void => {
  state = {
    payments: state.payments.map((p) =>
      p.id === id ? { ...p, status: "refunded", refundReason: reason } : p,
    ),
  };
  notify();
};

export const retryPayment = (id: string): void => {
  state = {
    payments: state.payments.map((p) =>
      p.id === id ? { ...p, status: "pending" } : p,
    ),
  };
  notify();
};
