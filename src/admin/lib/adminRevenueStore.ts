import { useSyncExternalStore } from "react";

import { getAffiliatesSnapshot } from "./adminAffiliatesStore";
import type { RevenueTxKind, RevenueTxStatus } from "./lstLabels";

/**
 * 手数料・売上 Mock Store (LST HQ ビュー)
 *
 * - 加盟店ごとの今月売上 / 手数料 / 純額（LST 取り分）を集計
 * - 取引明細は加盟店 × 日付で合成して 60 件 mock
 * - 完全 in-memory、reload で seed に戻る
 */

const TODAY = new Date(2026, 4, 21); // 2026-05-21
const GLOBAL_FEE_RATE_DEFAULT = 10;  // % — fee settings 側と共有想定

export interface AffiliateRevenueRow {
  affiliateId: string;
  affiliateName: string;
  prefecture: string;
  revenue: number;       // 今月売上（円）
  feeRate: number;       // 適用された手数料率（%）
  fee: number;           // 手数料収入（LST 取り分）
  netToAffiliate: number;// 加盟店受取
  txCount: number;       // 件数
  lastMonthRevenue: number;
  changePct: number;
}

export interface RevenueTransaction {
  id: string;
  date: string;          // YYYY-MM-DD
  affiliateId: string;
  affiliateName: string;
  kind: RevenueTxKind;
  amount: number;
  fee: number;
  status: RevenueTxStatus;
}

interface State {
  rows: AffiliateRevenueRow[];
  transactions: RevenueTransaction[];
}

const KINDS: RevenueTxKind[] = ["court", "coach", "tournament", "premium", "other"];
const STATUSES: RevenueTxStatus[] = ["confirmed", "confirmed", "confirmed", "pending", "refunded"];

function dateOffset(daysAgo: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function buildState(): State {
  const affiliates = getAffiliatesSnapshot();
  const rows: AffiliateRevenueRow[] = affiliates.map((a) => {
    const feeRate = a.feeRateOverride ?? GLOBAL_FEE_RATE_DEFAULT;
    const revenue = a.monthlyRevenue;
    const fee = Math.round((revenue * feeRate) / 100);
    const lastMonth = Math.round(revenue * 0.85 + ((a.id.charCodeAt(4) % 5) * 50_000));
    const changePct = lastMonth === 0 ? 0 : Math.round(((revenue - lastMonth) / lastMonth) * 100);
    const txCount = Math.max(0, Math.round(revenue / 18_000));
    return {
      affiliateId: a.id,
      affiliateName: a.storeName,
      prefecture: a.prefecture,
      revenue,
      feeRate,
      fee,
      netToAffiliate: revenue - fee,
      txCount,
      lastMonthRevenue: lastMonth,
      changePct,
    };
  });

  // 取引明細: 各加盟店 × 5 件 ≒ 60 件
  const transactions: RevenueTransaction[] = [];
  let counter = 1;
  for (const a of affiliates) {
    const feeRate = a.feeRateOverride ?? GLOBAL_FEE_RATE_DEFAULT;
    for (let i = 0; i < 5; i++) {
      const daysAgo = (i * 4 + counter) % 30;
      const kind = KINDS[(counter + i) % KINDS.length];
      const status = STATUSES[(counter + i) % STATUSES.length];
      const amount = 2_000 + ((counter * 731) % 12) * 1_500;
      const fee = Math.round((amount * feeRate) / 100);
      transactions.push({
        id: `LTX-${String(20260000 + counter).padStart(8, "0")}`,
        date: dateOffset(daysAgo),
        affiliateId: a.id,
        affiliateName: a.storeName,
        kind,
        amount,
        fee,
        status,
      });
      counter += 1;
    }
  }
  transactions.sort((a, b) => (a.date < b.date ? 1 : -1));

  return { rows, transactions };
}

let state: State = buildState();

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useRevenueRows = (): AffiliateRevenueRow[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.rows;
};

export const useRevenueTransactions = (): RevenueTransaction[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.transactions;
};

/** 集計値（概要タブ用） */
export const useRevenueSummary = () => {
  useSyncExternalStore(subscribe, getSnapshot);
  const rows = state.rows;
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalFee = rows.reduce((s, r) => s + r.fee, 0);
  const totalLastMonth = rows.reduce((s, r) => s + r.lastMonthRevenue, 0);
  const avgRevenue = rows.length === 0 ? 0 : Math.round(totalRevenue / rows.length);
  const changePct = totalLastMonth === 0
    ? 0
    : Math.round(((totalRevenue - totalLastMonth) / totalLastMonth) * 100);
  return { totalRevenue, totalFee, avgRevenue, changePct };
};

/** rebuild — fee settings 等で値が変わった時に呼ぶ想定（簡易） */
export const rebuildRevenueStore = (): void => {
  state = buildState();
  notify();
};
