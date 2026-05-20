import type { SkillLevel } from "@/lib/tournamentStore";
import type { PostedMatchStatus, ApplicationStatus } from "@/lib/leagueMatchBoardStore";

/** 希望レベルの日本語ラベル */
export const SKILL_LEVEL_JP: Record<SkillLevel, string> = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級",
};

export function skillLevelLabel(level: SkillLevel | undefined): string {
  if (!level) return "—";
  return SKILL_LEVEL_JP[level];
}

/** リーグ試合ステータスの日本語ラベル */
export const POSTED_MATCH_STATUS_JP: Record<PostedMatchStatus, string> = {
  open: "募集中",
  filled: "確定済み",
  completed: "完了",
  cancelled: "キャンセル",
};

/** ステータス badge の Tailwind クラス（背景 + 文字） */
export const POSTED_MATCH_STATUS_BADGE_CLS: Record<PostedMatchStatus, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  filled: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

/** 応募ステータスの日本語ラベル */
export const APPLICATION_STATUS_JP: Record<ApplicationStatus, string> = {
  pending: "保留中",
  approved: "承認済み",
  rejected: "却下",
  withdrawn: "取消",
};

export const APPLICATION_STATUS_BADGE_CLS: Record<ApplicationStatus, string> = {
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  withdrawn: "bg-gray-100 text-gray-600 border-gray-200",
};
