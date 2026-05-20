import { useSyncExternalStore } from "react";

import type { Coupon } from "@/lib/couponStore";
import { AVAILABLE_COUPONS } from "@/lib/couponStore";

/**
 * Admin クーポン Mock Store
 * - app 側 AVAILABLE_COUPONS を含む seed
 * - Campaign(kind=coupon) との upsert linkage を提供
 */

export type AdminCouponSource = "manual" | "campaign";

export interface AdminCoupon extends Coupon {
  id: string;
  validFrom: string; // YYYY-MM-DD
  usageLimit?: number; // undefined = unlimited
  currentUsage: number;
  isActive: boolean;
  createdAt: string; // ISO
  source: AdminCouponSource;
  linkedCampaignId?: string;
}

const generateId = (existing: AdminCoupon[]): string => {
  const nums = existing
    .map((c) => Number.parseInt(c.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return `CPN-${String(next).padStart(3, "0")}`;
};

// Seed: app 側 AVAILABLE_COUPONS を取り込み + admin sample
const SEED: AdminCoupon[] = [
  ...AVAILABLE_COUPONS.map<AdminCoupon>((c, idx) => ({
    ...c,
    id: `CPN-${String(idx + 1).padStart(3, "0")}`,
    validFrom: "2026-01-01",
    usageLimit: undefined,
    currentUsage: idx === 0 ? 42 : 18,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    source: "manual",
  })),
  {
    id: "CPN-003",
    code: "SUMMER20",
    label: "夏季20%OFF",
    description: "夏の予約で20%割引",
    discount: 0.2,
    type: "percent",
    minAmount: 1000,
    validFrom: "2026-06-01",
    expiresAt: "2026-08-31",
    usageLimit: 500,
    currentUsage: 124,
    isActive: true,
    createdAt: "2026-04-10T10:00:00.000Z",
    source: "manual",
  },
  {
    id: "CPN-004",
    code: "NEWYEAR2026",
    label: "新年特別 ¥1,000",
    description: "新年限定 ¥1,000 オフ",
    discount: 1000,
    type: "fixed",
    validFrom: "2026-01-01",
    expiresAt: "2026-01-31",
    usageLimit: undefined,
    currentUsage: 312,
    isActive: false,
    createdAt: "2025-12-15T09:00:00.000Z",
    source: "manual",
  },
  {
    id: "CPN-005",
    code: "BIRTHDAY1000",
    label: "誕生月 ¥1,000 クーポン",
    description: "誕生月の会員へ自動付与（¥1,000オフ）",
    discount: 1000,
    type: "fixed",
    validFrom: "2026-01-01",
    expiresAt: "2026-12-31",
    usageLimit: undefined,
    currentUsage: 67,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    source: "campaign",
    linkedCampaignId: "CP-006",
  },
  {
    id: "CPN-006",
    code: "RAINY10",
    label: "梅雨割10%",
    description: "雨の日のコート利用で10%OFF",
    discount: 0.1,
    type: "percent",
    validFrom: "2026-06-01",
    expiresAt: "2026-06-30",
    usageLimit: 200,
    currentUsage: 0,
    isActive: true,
    createdAt: "2026-05-01T08:00:00.000Z",
    source: "manual",
  },
  {
    id: "CPN-007",
    code: "FRIEND500",
    label: "友達紹介500円",
    description: "友達紹介で¥500割引",
    discount: 500,
    type: "fixed",
    minAmount: 2000,
    validFrom: "2026-04-01",
    expiresAt: "2026-05-31",
    usageLimit: 1000,
    currentUsage: 234,
    isActive: true,
    createdAt: "2026-03-25T11:30:00.000Z",
    source: "manual",
  },
  {
    id: "CPN-008",
    code: "GW2026",
    label: "GW 15%OFF",
    description: "ゴールデンウィーク限定",
    discount: 0.15,
    type: "percent",
    validFrom: "2026-04-29",
    expiresAt: "2026-05-06",
    usageLimit: undefined,
    currentUsage: 156,
    isActive: false,
    createdAt: "2026-04-15T10:00:00.000Z",
    source: "manual",
  },
  {
    id: "CPN-009",
    code: "NIGHT15",
    label: "ナイター割15%",
    description: "18時以降の予約で15%OFF",
    discount: 0.15,
    type: "percent",
    validFrom: "2026-06-01",
    expiresAt: "2026-08-31",
    usageLimit: undefined,
    currentUsage: 0,
    isActive: true,
    createdAt: "2026-05-10T09:00:00.000Z",
    source: "manual",
  },
  {
    id: "CPN-010",
    code: "WELCOME500",
    label: "ウェルカム ¥500",
    description: "新規会員登録で ¥500 クーポン",
    discount: 500,
    type: "fixed",
    validFrom: "2026-04-01",
    expiresAt: "2026-06-30",
    usageLimit: undefined,
    currentUsage: 42,
    isActive: true,
    createdAt: "2026-04-01T00:00:00.000Z",
    source: "campaign",
    linkedCampaignId: "CP-003",
  },
];

let state: { coupons: AdminCoupon[] } = { coupons: SEED };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

// ── Hooks ─────────────────────────────────────────────────────────────────
export const useAdminCoupons = (): AdminCoupon[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.coupons;
};

export const useAdminCoupon = (code: string | undefined): AdminCoupon | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!code) return undefined;
  return state.coupons.find((c) => c.code === code);
};

// ── Lookups ───────────────────────────────────────────────────────────────
export const getCouponByCode = (code: string): AdminCoupon | undefined =>
  state.coupons.find((c) => c.code === code);

// ── Mutations ─────────────────────────────────────────────────────────────
export type NewCouponInput = Omit<AdminCoupon, "id" | "createdAt" | "currentUsage"> & {
  currentUsage?: number;
};

export const addCoupon = (input: NewCouponInput): string => {
  const id = generateId(state.coupons);
  const coupon: AdminCoupon = {
    ...input,
    id,
    currentUsage: input.currentUsage ?? 0,
    createdAt: new Date().toISOString(),
  };
  state = { coupons: [...state.coupons, coupon] };
  notify();
  return id;
};

export const updateCoupon = (id: string, patch: Partial<AdminCoupon>): void => {
  state = {
    coupons: state.coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  };
  notify();
};

export const deleteCoupon = (id: string): void => {
  state = { coupons: state.coupons.filter((c) => c.id !== id) };
  notify();
};

// ── Campaign linkage ─────────────────────────────────────────────────────
export interface UpsertCouponFromCampaignInput {
  campaignId: string;
  code: string;
  label: string;
  description: string;
  type: "percent" | "fixed";
  discount: number;
  validFrom: string;
  expiresAt: string;
  isActive: boolean;
}

/**
 * Campaign(kind=coupon) と linkage を保つ upsert。
 * - 既に同 campaignId に紐付くクーポンがある → update
 * - なければ新規 add（source=campaign, linkedCampaignId=campaignId）
 */
export const upsertCouponFromCampaign = (input: UpsertCouponFromCampaignInput): string => {
  const existing = state.coupons.find((c) => c.linkedCampaignId === input.campaignId);
  if (existing) {
    updateCoupon(existing.id, {
      code: input.code,
      label: input.label,
      description: input.description,
      type: input.type,
      discount: input.discount,
      validFrom: input.validFrom,
      expiresAt: input.expiresAt,
      isActive: input.isActive,
    });
    return existing.id;
  }
  return addCoupon({
    code: input.code,
    label: input.label,
    description: input.description,
    type: input.type,
    discount: input.discount,
    validFrom: input.validFrom,
    expiresAt: input.expiresAt,
    usageLimit: undefined,
    isActive: input.isActive,
    source: "campaign",
    linkedCampaignId: input.campaignId,
  });
};
