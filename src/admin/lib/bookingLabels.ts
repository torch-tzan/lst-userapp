import type { BookingStatus, BookingType } from "@/lib/bookingStore";

/** 予約ステータスの日本語ラベル */
export const BOOKING_STATUS_JP: Record<BookingStatus, string> = {
  upcoming: "予約中",
  in_progress: "進行中",
  completed: "完了",
  cancelled: "キャンセル",
  failed: "失敗",
  pending_confirmation: "確認待ち",
  change_pending: "変更待ち",
};

/** 予約ステータス badge の Tailwind クラス */
export const BOOKING_STATUS_BADGE_CLS: Record<BookingStatus, string> = {
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  pending_confirmation: "bg-yellow-50 text-yellow-700 border-yellow-200",
  change_pending: "bg-orange-50 text-orange-700 border-orange-200",
};

/** 予約種別ラベル */
export const BOOKING_TYPE_JP: Record<BookingType, string> = {
  court: "コート",
  coach: "コーチ",
};

/** 予約種別 badge クラス */
export const BOOKING_TYPE_BADGE_CLS: Record<BookingType, string> = {
  court: "bg-blue-50 text-blue-700 border-blue-200",
  coach: "bg-purple-50 text-purple-700 border-purple-200",
};
