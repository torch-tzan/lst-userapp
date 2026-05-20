import { useSyncExternalStore } from "react";

/**
 * LST HQ キャンペーン・イベント Mock Store
 *
 * 店舗版（adminCampaignsStore）と異なり、
 * 配信加盟店を指定（1〜全 12 加盟店）して LST 本部から全国一斉配信。
 * - seed: 10 件
 */

export type LstCampaignKind = "discount" | "event" | "coupon" | "premium";
export const LST_CAMPAIGN_KIND_JP: Record<LstCampaignKind, string> = {
  discount: "割引",
  event: "イベント",
  coupon: "クーポン配布",
  premium: "Premium特典",
};
export const LST_CAMPAIGN_KIND_BADGE_CLS: Record<LstCampaignKind, string> = {
  discount: "bg-rose-50 text-rose-700 border-rose-200",
  event: "bg-amber-50 text-amber-700 border-amber-200",
  coupon: "bg-blue-50 text-blue-700 border-blue-200",
  premium: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export type LstCampaignStatus = "active" | "scheduled" | "ended";
export const LST_CAMPAIGN_STATUS_JP: Record<LstCampaignStatus, string> = {
  active: "アクティブ",
  scheduled: "予定",
  ended: "終了",
};
export const LST_CAMPAIGN_STATUS_BADGE_CLS: Record<LstCampaignStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  ended: "bg-gray-100 text-gray-600 border-gray-200",
};

export interface LstCampaignRecord {
  id: string;
  title: string;
  description: string;
  kind: LstCampaignKind;
  startDate: string;
  endDate: string;
  status: LstCampaignStatus;
  affiliateIds: string[]; // 配信加盟店リスト ([] = 全店舗扱い)
  discountPercent?: number;
  discountAmount?: number;
  couponCode?: string;
  usageCount: number;
  // ── Wave 2: 拡張フィールド（user-app に表示する情報） ──
  imageUrl?: string;
  subtitle?: string;
  body?: string;
  location?: string;
  ctaLabel?: string;
  ctaLink?: string;
}

const ALL_AFFS = [
  "AFF-001",
  "AFF-002",
  "AFF-003",
  "AFF-004",
  "AFF-005",
  "AFF-006",
  "AFF-007",
  "AFF-008",
  "AFF-009",
  "AFF-010",
  "AFF-011",
  "AFF-012",
];

const SEED: LstCampaignRecord[] = [
  { id: "LCP-001", title: "全国ゴールデンウィーク特別割引",   description: "GW 期間限定で全国全店コート料金 15% OFF！",        kind: "discount", startDate: "2026-04-29", endDate: "2026-05-06", status: "ended",     affiliateIds: ALL_AFFS, discountPercent: 15, usageCount: 542 },
  { id: "LCP-002", title: "プレミアム会員: 全国 20% OFF",       description: "プレミアム会員のみ全国コート料金 20% OFF。",        kind: "premium",  startDate: "2026-05-01", endDate: "2026-05-31", status: "active",    affiliateIds: ALL_AFFS, discountPercent: 20, usageCount: 188 },
  { id: "LCP-003", title: "新規会員ウェルカム ¥500 クーポン",   description: "新規会員登録で ¥500 クーポンプレゼント（全国）。",   kind: "coupon",   startDate: "2026-04-01", endDate: "2026-06-30", status: "active",    affiliateIds: ALL_AFFS, discountAmount: 500, couponCode: "WELCOME500", usageCount: 142 },
  { id: "LCP-004", title: "全国夏のスペシャル大会",              description: "7月開催の全国大会、エントリー受付中！",              kind: "event",    startDate: "2026-07-01", endDate: "2026-07-31", status: "scheduled", affiliateIds: ALL_AFFS, usageCount: 0 },
  { id: "LCP-005", title: "広島エリア限定 梅雨割引",              description: "広島エリアの雨の日のコート利用で 10% OFF。",         kind: "discount", startDate: "2026-06-01", endDate: "2026-06-30", status: "scheduled", affiliateIds: ["AFF-001", "AFF-002", "AFF-003"], discountPercent: 10, usageCount: 0 },
  { id: "LCP-006", title: "東京エリア限定 オープン記念",          description: "東京エリア限定でコート料金 25% OFF。",                kind: "discount", startDate: "2026-05-15", endDate: "2026-05-31", status: "active",    affiliateIds: ["AFF-004", "AFF-005"], discountPercent: 25, usageCount: 76 },
  { id: "LCP-007", title: "誕生月クーポン（全国）",                description: "誕生月の会員に ¥1,000 クーポンプレゼント。",         kind: "coupon",   startDate: "2026-01-01", endDate: "2026-12-31", status: "active",    affiliateIds: ALL_AFFS, discountAmount: 1000, couponCode: "BIRTHDAY1000", usageCount: 267 },
  { id: "LCP-008", title: "プレミアム会員限定 全国大会",          description: "プレミアム会員限定の全国大会、エントリー受付。",     kind: "event",    startDate: "2026-06-15", endDate: "2026-06-30", status: "scheduled", affiliateIds: ALL_AFFS, usageCount: 0 },
  { id: "LCP-009", title: "大阪エリア限定 春の割引",              description: "大阪エリア限定で 3 月コート料金 15% OFF。",          kind: "discount", startDate: "2026-03-01", endDate: "2026-03-31", status: "ended",     affiliateIds: ["AFF-006", "AFF-007"], discountPercent: 15, usageCount: 98 },
  { id: "LCP-010", title: "Premium 特典: コーチング無料体験",      description: "プレミアム会員にトップコーチ無料体験 1 回プレゼント。", kind: "premium",  startDate: "2026-05-20", endDate: "2026-06-20", status: "active",    affiliateIds: ALL_AFFS, usageCount: 42 },
];

let state: { campaigns: LstCampaignRecord[] } = { campaigns: SEED };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useLstCampaigns = (): LstCampaignRecord[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.campaigns;
};

export const useLstCampaign = (id: string | undefined): LstCampaignRecord | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.campaigns.find((c) => c.id === id);
};

export const addLstCampaign = (
  input: Omit<LstCampaignRecord, "id" | "usageCount">,
): string => {
  const nums = state.campaigns
    .map((c) => Number.parseInt(c.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  const id = `LCP-${String(next).padStart(3, "0")}`;
  state = {
    campaigns: [...state.campaigns, { ...input, id, usageCount: 0 }],
  };
  notify();
  return id;
};

export const updateLstCampaign = (id: string, patch: Partial<LstCampaignRecord>): void => {
  state = {
    campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  };
  notify();
};

export const deleteLstCampaign = (id: string): void => {
  state = { campaigns: state.campaigns.filter((c) => c.id !== id) };
  notify();
};
