import { useSyncExternalStore } from "react";

import { getAffiliatesSnapshot } from "./adminAffiliatesStore";

/**
 * 精算 Mock Store (LST HQ ビュー)
 *
 * 加盟店ごとの精算状況を管理する。Figma round 3 で導入。
 *  - settlementStatus: 'settled' | 'pending' | 'unsettled'
 *  - settledAt: 精算完了日時（ISO 文字列、未精算なら undefined）
 *
 * Seed:
 *  - 10 件以上の加盟店について 2026/05 月の精算行を作成
 *  - 8 settled / 2 pending / N unsettled の mix
 *  - prototype only — reload で seed に戻る
 */

export type SettlementStatus = "settled" | "pending" | "unsettled";

export interface SettlementRow {
  affiliateId: string;
  /** YYYY-MM 形式の対象月 */
  periodMonth: string;
  status: SettlementStatus;
  /** ISO 文字列。未精算なら undefined */
  settledAt?: string;
}

const TODAY = new Date(2026, 4, 21); // 2026-05-21
const CURRENT_PERIOD = "2026-05";

function isoDaysAgo(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

interface State {
  rows: SettlementRow[];
}

function buildState(): State {
  const affiliates = getAffiliatesSnapshot();
  // 順序を固定して deterministic に
  const sorted = affiliates.slice().sort((a, b) => a.id.localeCompare(b.id));
  const rows: SettlementRow[] = sorted.map((a, idx) => {
    // 0-2 未精算 / 3-4 処理中 / 5+ 精算済
    if (idx <= 2) {
      return { affiliateId: a.id, periodMonth: CURRENT_PERIOD, status: "unsettled" };
    }
    if (idx <= 4) {
      return { affiliateId: a.id, periodMonth: CURRENT_PERIOD, status: "pending" };
    }
    return {
      affiliateId: a.id,
      periodMonth: CURRENT_PERIOD,
      status: "settled",
      settledAt: isoDaysAgo((idx - 5) * 2 + 1),
    };
  });
  return { rows };
}

let state: State = buildState();

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useSettlementRows = (): SettlementRow[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.rows;
};

export const useSettlementByAffiliate = (affiliateId: string): SettlementRow | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.rows.find((r) => r.affiliateId === affiliateId);
};

/** 単一加盟店を精算済にする */
export const settleAffiliate = (affiliateId: string): void => {
  const nowIso = new Date().toISOString();
  state = {
    rows: state.rows.map((r) =>
      r.affiliateId === affiliateId && r.periodMonth === CURRENT_PERIOD
        ? { ...r, status: "settled", settledAt: nowIso }
        : r,
    ),
  };
  notify();
};

/** 一括精算（未精算 + 処理中 を全部 settled に） */
export const settleAllPending = (): number => {
  const nowIso = new Date().toISOString();
  let count = 0;
  state = {
    rows: state.rows.map((r) => {
      if (r.periodMonth !== CURRENT_PERIOD) return r;
      if (r.status === "settled") return r;
      count += 1;
      return { ...r, status: "settled", settledAt: nowIso };
    }),
  };
  notify();
  return count;
};

export const CURRENT_SETTLEMENT_PERIOD = CURRENT_PERIOD;
