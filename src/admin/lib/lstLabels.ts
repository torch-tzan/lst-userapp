// LST HQ 専用ラベル & badge スタイル
// 加盟店 / 会員 / 取引 / 手数料 など、LST 本部視点で使うもの

// ── 加盟店ステータス ────────────────────────────────────
export type AffiliateStatus = "active" | "paused" | "terminating" | "terminated";

export const AFFILIATE_STATUS_JP: Record<AffiliateStatus, string> = {
  active: "アクティブ",
  paused: "一時停止",
  terminating: "解約予定",
  terminated: "解約済み",
};

export const AFFILIATE_STATUS_BADGE_CLS: Record<AffiliateStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-yellow-50 text-yellow-700 border-yellow-200",
  terminating: "bg-amber-50 text-amber-700 border-amber-200",
  terminated: "bg-gray-100 text-gray-600 border-gray-200",
};

// ── 都道府県（プロトタイプ用 — 主要 5 つだけ） ────────────────
export const PREFECTURES = [
  "東京都",
  "大阪府",
  "神奈川県",
  "福岡県",
  "北海道",
  "愛知県",
  "京都府",
  "広島県",
] as const;
export type Prefecture = (typeof PREFECTURES)[number];

// ── Premium ステータス（表示用） ───────────────────────
export type MemberPremiumStatus = "none" | "active" | "cancelled_pending" | "expired";

export const MEMBER_PREMIUM_STATUS_JP: Record<MemberPremiumStatus, string> = {
  none: "なし",
  active: "アクティブ",
  cancelled_pending: "解約予定",
  expired: "期限切れ",
};

export const MEMBER_PREMIUM_STATUS_BADGE_CLS: Record<MemberPremiumStatus, string> = {
  none: "bg-gray-100 text-gray-600 border-gray-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled_pending: "bg-amber-50 text-amber-700 border-amber-200",
  expired: "bg-rose-50 text-rose-700 border-rose-200",
};

// ── 取引種別（LST 全体ビュー） ─────────────────────────
export type RevenueTxKind = "court" | "coach" | "tournament" | "premium" | "other";

export const REVENUE_TX_KIND_JP: Record<RevenueTxKind, string> = {
  court: "コート予約",
  coach: "コーチング",
  tournament: "大会",
  premium: "Premium",
  other: "その他",
};

export const REVENUE_TX_KIND_BADGE_CLS: Record<RevenueTxKind, string> = {
  court: "bg-blue-50 text-blue-700 border-blue-200",
  coach: "bg-purple-50 text-purple-700 border-purple-200",
  tournament: "bg-amber-50 text-amber-700 border-amber-200",
  premium: "bg-emerald-50 text-emerald-700 border-emerald-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

export type RevenueTxStatus = "confirmed" | "pending" | "refunded";

export const REVENUE_TX_STATUS_JP: Record<RevenueTxStatus, string> = {
  confirmed: "確定",
  pending: "保留",
  refunded: "返金済み",
};

export const REVENUE_TX_STATUS_BADGE_CLS: Record<RevenueTxStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  refunded: "bg-gray-100 text-gray-600 border-gray-200",
};
