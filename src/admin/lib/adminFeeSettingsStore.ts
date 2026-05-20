import { useSyncExternalStore } from "react";

/**
 * 手数料設定 Mock Store (LST HQ)
 *
 * - グローバル設定（default fee rate / minimum amount / calc method）
 * - 加盟店別 override（list 表示用 — 実体は adminAffiliatesStore.feeRateOverride を見るが
 *   ここでは add 操作用の入口として使う）
 * - 変更履歴 mock
 */

import { getAffiliatesSnapshot, updateAffiliate } from "./adminAffiliatesStore";

export type FeeCalcMethod = "flat" | "tiered";

export interface FeeSettingsState {
  defaultRate: number;     // %
  minAmount: number;       // 最低取引金額（円）
  calcMethod: FeeCalcMethod;
}

export interface FeeChangeLog {
  id: string;
  changedAt: string;       // YYYY-MM-DD HH:mm
  changedBy: string;
  summary: string;
}

interface State {
  settings: FeeSettingsState;
  history: FeeChangeLog[];
}

const SEED_HISTORY: FeeChangeLog[] = [
  { id: "log-1", changedAt: "2026-05-15 14:32", changedBy: "管理者", summary: "AFF-008 横浜ベイサイドパデルの手数料率を 9% に設定" },
  { id: "log-2", changedAt: "2026-04-28 10:15", changedBy: "管理者", summary: "AFF-004 東京湾パデルセンターの手数料率を 12% に設定" },
  { id: "log-3", changedAt: "2026-04-10 09:00", changedBy: "管理者", summary: "AFF-002 北広島パデルクラブの手数料率を 8% に設定" },
  { id: "log-4", changedAt: "2026-03-22 16:48", changedBy: "管理者", summary: "グローバル手数料率を 10% に変更（旧 12%）" },
  { id: "log-5", changedAt: "2026-03-01 11:20", changedBy: "管理者", summary: "最低取引金額を ¥500 に設定" },
];

let state: State = {
  settings: {
    defaultRate: 10,
    minAmount: 500,
    calcMethod: "flat",
  },
  history: SEED_HISTORY.slice(),
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useFeeSettings = (): FeeSettingsState => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.settings;
};

export const useFeeHistory = (): FeeChangeLog[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.history;
};

export const updateGlobalFeeSettings = (patch: Partial<FeeSettingsState>): void => {
  const summary: string[] = [];
  if (patch.defaultRate !== undefined && patch.defaultRate !== state.settings.defaultRate) {
    summary.push(`グローバル手数料率を ${patch.defaultRate}% に変更（旧 ${state.settings.defaultRate}%）`);
  }
  if (patch.minAmount !== undefined && patch.minAmount !== state.settings.minAmount) {
    summary.push(`最低取引金額を ¥${patch.minAmount.toLocaleString("ja-JP")} に変更`);
  }
  if (patch.calcMethod !== undefined && patch.calcMethod !== state.settings.calcMethod) {
    summary.push(`計算方式を ${patch.calcMethod === "flat" ? "固定率" : "段階制"} に変更`);
  }
  const log: FeeChangeLog | null = summary.length > 0
    ? {
        id: `log-${Date.now()}`,
        changedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        changedBy: "管理者",
        summary: summary.join(" / "),
      }
    : null;
  state = {
    settings: { ...state.settings, ...patch },
    history: log ? [log, ...state.history] : state.history,
  };
  notify();
};

/** 加盟店別 override を追加（adminAffiliatesStore も更新） */
export const addFeeOverride = (input: {
  affiliateId: string;
  rate: number;
  appliedFrom: string;
}): void => {
  updateAffiliate(input.affiliateId, { feeRateOverride: input.rate });
  const aff = getAffiliatesSnapshot().find((a) => a.id === input.affiliateId);
  const name = aff?.storeName ?? input.affiliateId;
  const log: FeeChangeLog = {
    id: `log-${Date.now()}`,
    changedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    changedBy: "管理者",
    summary: `${input.affiliateId} ${name} の手数料率を ${input.rate}% に設定（適用 ${input.appliedFrom}〜）`,
  };
  state = { ...state, history: [log, ...state.history] };
  notify();
};

/** 加盟店別 override を解除 */
export const removeFeeOverride = (affiliateId: string): void => {
  updateAffiliate(affiliateId, { feeRateOverride: undefined });
  const aff = getAffiliatesSnapshot().find((a) => a.id === affiliateId);
  const name = aff?.storeName ?? affiliateId;
  const log: FeeChangeLog = {
    id: `log-${Date.now()}`,
    changedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    changedBy: "管理者",
    summary: `${affiliateId} ${name} の手数料率 override を解除`,
  };
  state = { ...state, history: [log, ...state.history] };
  notify();
};
