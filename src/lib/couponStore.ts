export interface Coupon {
  code: string;
  label: string;
  description: string;
  discount: number;
  type: "percent" | "fixed";
  minAmount?: number;
  expiresAt: string;
}

export const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: "WELCOME10",
    label: "初回10%OFF",
    description: "初回ご利用限定の10%割引クーポン",
    discount: 0.1,
    type: "percent",
    expiresAt: "2026-06-30",
  },
  {
    code: "PADEL500",
    label: "500円割引",
    description: "すべての予約で使える500円割引",
    discount: 500,
    type: "fixed",
    expiresAt: "2026-05-31",
  },
];
