// 店舗管理モジュール共通の日本語ラベル & badge スタイル
// 売上 / 支払い / スタッフ / シフト / お知らせ / キャンペーン

// ── 売上 ─────────────────────────────────────────────
export type SalesKind = "court" | "coach" | "tournament" | "other" | "adjust";
export const SALES_KIND_JP: Record<SalesKind, string> = {
  court: "コート予約",
  coach: "コーチング",
  tournament: "大会",
  other: "その他",
  adjust: "手動調整",
};
export const SALES_KIND_BADGE_CLS: Record<SalesKind, string> = {
  court: "bg-blue-50 text-blue-700 border-blue-200",
  coach: "bg-purple-50 text-purple-700 border-purple-200",
  tournament: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
  adjust: "bg-slate-100 text-slate-600 border-slate-200",
};

export type SalesStatus = "confirmed" | "pending" | "refunded";
export const SALES_STATUS_JP: Record<SalesStatus, string> = {
  confirmed: "確定",
  pending: "保留",
  refunded: "返金済み",
};
export const SALES_STATUS_BADGE_CLS: Record<SalesStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  refunded: "bg-gray-100 text-gray-600 border-gray-200",
};

// ── 支払い ───────────────────────────────────────────
export type PaymentStatus = "completed" | "failed" | "pending" | "refunded";
export const PAYMENT_STATUS_JP: Record<PaymentStatus, string> = {
  completed: "完了",
  failed: "失敗",
  pending: "保留",
  refunded: "返金済み",
};
export const PAYMENT_STATUS_BADGE_CLS: Record<PaymentStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  refunded: "bg-gray-100 text-gray-600 border-gray-200",
};

export type PaymentMethod = "credit" | "paypay" | "apple_pay";
export const PAYMENT_METHOD_JP: Record<PaymentMethod, string> = {
  credit: "クレジット",
  paypay: "PayPay",
  apple_pay: "Apple Pay",
};

// ── スタッフ ─────────────────────────────────────────
export type StaffRole = "owner" | "staff" | "reception";
export const STAFF_ROLE_JP: Record<StaffRole, string> = {
  owner: "オーナー",
  staff: "スタッフ",
  reception: "受付",
};

export type StaffEmployment = "fulltime" | "parttime" | "contract";
export const STAFF_EMPLOYMENT_JP: Record<StaffEmployment, string> = {
  fulltime: "正社員",
  parttime: "アルバイト",
  contract: "契約",
};

export type StaffStatus = "active" | "paused" | "retired";
export const STAFF_STATUS_JP: Record<StaffStatus, string> = {
  active: "アクティブ",
  paused: "休止",
  retired: "退職",
};
export const STAFF_STATUS_BADGE_CLS: Record<StaffStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-yellow-50 text-yellow-700 border-yellow-200",
  retired: "bg-gray-100 text-gray-600 border-gray-200",
};

// ── シフト ───────────────────────────────────────────
export type ShiftKind = "regular" | "early" | "late" | "break";
export const SHIFT_KIND_JP: Record<ShiftKind, string> = {
  regular: "出勤",
  early: "早番",
  late: "遅番",
  break: "休憩",
};

export type ShiftStatus = "confirmed" | "requested" | "cancelled";
export const SHIFT_STATUS_JP: Record<ShiftStatus, string> = {
  confirmed: "確定",
  requested: "申請中",
  cancelled: "キャンセル",
};
export const SHIFT_STATUS_BADGE_CLS: Record<ShiftStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  requested: "bg-yellow-50 text-yellow-700 border-yellow-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

// ── お知らせ ─────────────────────────────────────────
export type AnnouncementCategory = "notice" | "maintenance" | "event" | "other";
export const ANNOUNCEMENT_CATEGORY_JP: Record<AnnouncementCategory, string> = {
  notice: "お知らせ",
  maintenance: "メンテナンス",
  event: "イベント",
  other: "その他",
};

export type AnnouncementStatus = "published" | "draft" | "scheduled" | "ended";
export const ANNOUNCEMENT_STATUS_JP: Record<AnnouncementStatus, string> = {
  published: "公開",
  draft: "下書き",
  scheduled: "予約",
  ended: "終了",
};
export const ANNOUNCEMENT_STATUS_BADGE_CLS: Record<AnnouncementStatus, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  ended: "bg-slate-100 text-slate-600 border-slate-200",
};

export type AnnouncementAudience = "all" | "premium" | "specific";
export const ANNOUNCEMENT_AUDIENCE_JP: Record<AnnouncementAudience, string> = {
  all: "全員",
  premium: "プレミアム会員",
  specific: "特定",
};

// ── キャンペーン ─────────────────────────────────────
export type CampaignKind = "discount" | "event" | "coupon";
export const CAMPAIGN_KIND_JP: Record<CampaignKind, string> = {
  discount: "割引",
  event: "イベント",
  coupon: "クーポン配布",
};

export type CampaignStatus = "active" | "scheduled" | "ended";
export const CAMPAIGN_STATUS_JP: Record<CampaignStatus, string> = {
  active: "アクティブ",
  scheduled: "予定",
  ended: "終了",
};
export const CAMPAIGN_STATUS_BADGE_CLS: Record<CampaignStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  ended: "bg-gray-100 text-gray-600 border-gray-200",
};

export type CampaignAudience = "all" | "premium" | "new";
export const CAMPAIGN_AUDIENCE_JP: Record<CampaignAudience, string> = {
  all: "全員",
  premium: "プレミアム",
  new: "新規",
};
