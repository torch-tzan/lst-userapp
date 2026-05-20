import { useSyncExternalStore } from "react";

import type { CampaignAudience, CampaignKind, CampaignStatus } from "./storeLabels";

/**
 * キャンペーン Mock Store
 * - seed: 8 件
 */

export interface CampaignRecord {
  id: string;
  title: string;
  description: string;
  kind: CampaignKind;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: CampaignStatus;
  discountPercent?: number;
  discountAmount?: number;
  couponCode?: string;
  audience: CampaignAudience;
  usageCount: number;
  conversionRate: number; // 0〜100
}

const SEED: CampaignRecord[] = [
  { id: "CP-001", title: "ゴールデンウィーク特別割引", description: "GW 期間限定でコート料金 15% OFF！", kind: "discount", startDate: "2026-04-29", endDate: "2026-05-06", status: "ended",     discountPercent: 15, audience: "all",     usageCount: 156, conversionRate: 32 },
  { id: "CP-002", title: "プレミアム会員限定 20% OFF", description: "プレミアム会員のみコート料金 20% OFF。", kind: "discount", startDate: "2026-05-01", endDate: "2026-05-31", status: "active",    discountPercent: 20, audience: "premium", usageCount: 88, conversionRate: 41 },
  { id: "CP-003", title: "新規会員ウェルカム ¥500 クーポン", description: "新規会員登録で ¥500 クーポンプレゼント。", kind: "coupon",   startDate: "2026-04-01", endDate: "2026-06-30", status: "active",    discountAmount: 500, couponCode: "WELCOME500", audience: "new", usageCount: 42, conversionRate: 28 },
  { id: "CP-004", title: "夏のスペシャル大会", description: "7月開催の大会、エントリー受付中！", kind: "event",    startDate: "2026-07-01", endDate: "2026-07-31", status: "scheduled", audience: "all",     usageCount: 0,   conversionRate: 0 },
  { id: "CP-005", title: "梅雨割引キャンペーン", description: "雨の日のコート利用で 10% OFF。", kind: "discount", startDate: "2026-06-01", endDate: "2026-06-30", status: "scheduled", discountPercent: 10, audience: "all", usageCount: 0, conversionRate: 0 },
  { id: "CP-006", title: "誕生月クーポン", description: "誕生月の会員に ¥1,000 クーポンプレゼント。", kind: "coupon",   startDate: "2026-01-01", endDate: "2026-12-31", status: "active",    discountAmount: 1000, couponCode: "BIRTHDAY1000", audience: "all", usageCount: 67, conversionRate: 55 },
  { id: "CP-007", title: "春のリーグイベント", description: "3〜5月開催の春リーグイベント。", kind: "event",    startDate: "2026-03-01", endDate: "2026-05-31", status: "active",    audience: "all", usageCount: 124, conversionRate: 22 },
  { id: "CP-008", title: "正月キャンペーン", description: "新年特別 25% OFF。", kind: "discount", startDate: "2026-01-01", endDate: "2026-01-07", status: "ended", discountPercent: 25, audience: "all", usageCount: 198, conversionRate: 47 },
];

let state: { campaigns: CampaignRecord[] } = { campaigns: SEED };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useAdminCampaigns = (): CampaignRecord[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.campaigns;
};

export const useAdminCampaign = (id: string | undefined): CampaignRecord | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.campaigns.find((c) => c.id === id);
};

export const addCampaign = (input: Omit<CampaignRecord, "id" | "usageCount" | "conversionRate">): string => {
  const nums = state.campaigns
    .map((c) => Number.parseInt(c.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  const id = `CP-${String(next).padStart(3, "0")}`;
  state = {
    campaigns: [...state.campaigns, { ...input, id, usageCount: 0, conversionRate: 0 }],
  };
  notify();
  return id;
};

export const updateCampaign = (id: string, patch: Partial<CampaignRecord>): void => {
  state = {
    campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  };
  notify();
};

export const deleteCampaign = (id: string): void => {
  state = { campaigns: state.campaigns.filter((c) => c.id !== id) };
  notify();
};
