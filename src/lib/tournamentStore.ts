import { useCallback, useSyncExternalStore } from "react";
import { addNotification } from "@/lib/notificationStore";

export const CURRENT_USER = "user-001";

export const PARTNER_INVITE_HOURS = 72;

// ── ELO / Tier types ──

export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "master";

export const STARTING_RATING: Record<SkillLevel, number> = {
  beginner: 1400,
  intermediate: 1600,
  advanced: 1800,
};

export const RANK_TIER_RANGES: { tier: RankTier; min: number; max: number; emoji: string; label: string; cls: string }[] = [
  { tier: "bronze",   min: 1400, max: 1599, emoji: "🥉", label: "Bronze",   cls: "text-amber-700" },
  { tier: "silver",   min: 1600, max: 1799, emoji: "🥈", label: "Silver",   cls: "text-gray-500" },
  { tier: "gold",     min: 1800, max: 1999, emoji: "🥇", label: "Gold",     cls: "text-yellow-600" },
  { tier: "platinum", min: 2000, max: 2199, emoji: "💎", label: "Platinum", cls: "text-cyan-500" },
  { tier: "master",   min: 2200, max: 9999, emoji: "👑", label: "Master",   cls: "text-purple-600" },
];

export function getRankTier(rating: number): typeof RANK_TIER_RANGES[number] {
  return RANK_TIER_RANGES.find((r) => rating >= r.min && rating <= r.max) ?? RANK_TIER_RANGES[0];
}

// Padel Points constants
export const PP_MATCH_WIN = 20;
export const PP_TOURNAMENT_CHAMPION = 1000;
export const PP_TOURNAMENT_RUNNER_UP = 500;
export const PP_TOURNAMENT_THIRD = 200;
export const PP_LEAGUE_MATCH_WIN = 30;
export const PP_SEASON_CHAMPION = 5000;
export const PP_SEASON_RUNNER_UP = 2000;
export const PP_SEASON_THIRD = 1000;

export type TournamentFormat = "doubles";
export type TournamentCapacity = 8 | 16 | 32;
export type TournamentStatus =
  | "upcoming"
  | "registration_open"
  | "registration_closed"
  | "in_progress"
  | "completed";

export interface PlayerRef {
  userId: string;
  name: string;
  email: string;
  phone: string;
  displayId: string;
  skillLevel: SkillLevel;
  rating: number;
}

export interface TournamentEntry {
  id: string;
  tournamentId: string;
  registrantUserId: string;
  partnerUserId?: string;
  registeredAt: string;
  status: "pending_partner_confirmation" | "confirmed" | "cancelled" | "declined";
  invitedAt?: string;
  expiresAt?: string;
  partnerRespondedAt?: string;
  partnerDeclineReason?: string;
}

export interface MatchRecord {
  round: number; // 1=R1, 2=QF, 3=SF, 4=F
  p1UserId: string;
  p2UserId: string;
  p1PartnerId?: string;
  p2PartnerId?: string;
  winnerSide: 1 | 2;
  score: string;
}

export interface TournamentResult {
  rankings: { rank: number; userId: string; partnerId?: string }[];
  matches: MatchRecord[];
}

export interface Tournament {
  id: string;
  title: string;
  format: TournamentFormat;
  capacity: TournamentCapacity;
  venue: string;
  scheduledAt: string;
  registrationDeadline: string;
  status: TournamentStatus;
  entries: TournamentEntry[];
  results?: TournamentResult;
  // ── new optional fields ──
  heroImageUrl?: string;
  description?: string;
  accessInfo?: string;
  contactInfo?: string;
}

const PLAYER_DIRECTORY: PlayerRef[] = [
  { userId: CURRENT_USER, name: "田中 太郎",  email: "tanaka@example.com",     phone: "090-1111-0001", displayId: "LST-AB12CD", skillLevel: "intermediate", rating: 1700 },
  { userId: "user-002",   name: "佐藤 花子",  email: "sato.h@example.com",     phone: "090-1111-0002", displayId: "LST-EF34GH", skillLevel: "intermediate", rating: 1820 },
  { userId: "user-003",   name: "鈴木 一郎",  email: "suzuki@example.com",     phone: "090-1111-0003", displayId: "LST-IJ56KL", skillLevel: "advanced",     rating: 1950 },
  { userId: "user-004",   name: "高橋 美咲",  email: "takahashi@example.com",  phone: "090-1111-0004", displayId: "LST-MN78OP", skillLevel: "beginner",     rating: 1450 },
  { userId: "user-005",   name: "渡辺 健太",  email: "watanabe@example.com",   phone: "090-1111-0005", displayId: "LST-QR90ST", skillLevel: "intermediate", rating: 1650 },
  { userId: "user-006",   name: "伊藤 愛",    email: "ito.a@example.com",      phone: "090-1111-0006", displayId: "LST-UV12WX", skillLevel: "advanced",     rating: 2050 },
  { userId: "user-007",   name: "山本 大輝",  email: "yamamoto@example.com",   phone: "090-1111-0007", displayId: "LST-YZ34AB", skillLevel: "intermediate", rating: 1720 },
  { userId: "user-008",   name: "中村 裕子",  email: "nakamura@example.com",   phone: "090-1111-0008", displayId: "LST-CD56EF", skillLevel: "beginner",     rating: 1480 },
  { userId: "user-009",   name: "吉田 恵",    email: "yoshida@example.com",    phone: "090-1111-0009", displayId: "LST-GH78IJ", skillLevel: "intermediate", rating: 1580 },
  { userId: "user-010",   name: "松本 翔太",  email: "matsumoto@example.com",  phone: "090-1111-0010", displayId: "LST-KL90MN", skillLevel: "advanced",     rating: 2230 },
  { userId: "user-011",   name: "小林 優",    email: "kobayashi@example.com",  phone: "090-1111-0011", displayId: "LST-OP12QR", skillLevel: "beginner",     rating: 1420 },
  { userId: "user-012",   name: "加藤 翼",    email: "kato@example.com",       phone: "090-1111-0012", displayId: "LST-ST34UV", skillLevel: "intermediate", rating: 1610 },
];

export const PREMIUM_USERS = new Set([
  CURRENT_USER,
  "user-002",
  "user-003",
  "user-005",
  "user-006",
  "user-007",
  "user-008",
  "user-010",
]);

export function findPlayerByDisplayId(id: string): PlayerRef | undefined {
  const target = id.trim().toUpperCase();
  if (!target) return undefined;
  return PLAYER_DIRECTORY.find((p) => p.displayId.toUpperCase() === target);
}

export function getPlayer(userId: string): PlayerRef | undefined {
  return PLAYER_DIRECTORY.find((p) => p.userId === userId);
}

function computeExpiresAt(invitedAt: string, registrationDeadline: string): string {
  const expireFrom72h = new Date(invitedAt);
  expireFrom72h.setHours(expireFrom72h.getHours() + PARTNER_INVITE_HOURS);
  const deadline = new Date(registrationDeadline);
  return (expireFrom72h < deadline ? expireFrom72h : deadline).toISOString();
}

// ── ELO rating calculation ──

export interface RatingChange {
  userId: string;
  before: number;
  after: number;
  delta: number;
}

/**
 * Compute ELO-style rating change for a doubles match.
 * Same tier (rating diff < 100): ±18
 * 1 tier diff (100-300): higher rank loses big (-25), lower rank wins big (+25)
 *                        higher rank wins small (+10), lower rank loses small (-10)
 * 2+ tier diff: capped at 1-tier values
 */
export function computeRatingDelta(myRating: number, opponentAvgRating: number, won: boolean): number {
  const diff = opponentAvgRating - myRating; // positive if opponent is higher rank
  const isSameTier = Math.abs(diff) < 100;
  if (isSameTier) return won ? 18 : -18;
  // 1+ tier difference
  const opponentIsHigher = diff > 0;
  if (opponentIsHigher) {
    return won ? 25 : -10;
  } else {
    return won ? 10 : -25;
  }
}

// ── Season helpers ──

export interface Season {
  year: number;
  quarter: 1 | 2 | 3 | 4;
}

export function getSeasonOf(date: Date | string): Season {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = d.getMonth() + 1; // 1-12
  const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
  return { year: d.getFullYear(), quarter };
}

export function seasonKey(s: Season): string {
  return `${s.year}-Q${s.quarter}`;
}

export function parseSeasonKey(key: string): Season {
  const [y, q] = key.split("-Q");
  return { year: parseInt(y), quarter: parseInt(q) as 1 | 2 | 3 | 4 };
}

export function formatSeasonLabel(s: Season): string {
  return `${s.year}年 Q${s.quarter}`;
}

export function seasonMonthRange(s: Season): { startMonth: number; endMonth: number } {
  const startMonth = (s.quarter - 1) * 3 + 1;
  return { startMonth, endMonth: startMonth + 2 };
}

interface StoreState {
  tournaments: Tournament[];
}

function buildInitialState(): StoreState {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString();
  const in7days = new Date(now.getTime() + 7 * 86400000).toISOString();
  const in5days = new Date(now.getTime() + 5 * 86400000).toISOString();
  const in20days = new Date(now.getTime() + 20 * 86400000).toISOString();
  const in15days = new Date(now.getTime() + 15 * 86400000).toISOString();
  const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString();

  // 已結束的大會：自己（＋user-002）得第 2 名（ダブルス）
  const completedTournament: Tournament = {
    id: "t-completed",
    title: "4月度 ダブルストーナメント",
    format: "doubles",
    capacity: 8,
    venue: "LST 本店コートA",
    scheduledAt: lastWeek,
    registrationDeadline: lastWeek,
    status: "completed",
    heroImageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=450&fit=crop",
    description: "毎月恒例のダブルストーナメント。\n4ペア参加、単一エリミネーション形式です。",
    accessInfo: "JR 東京駅 八重洲口 徒歩7分\n地下駐車場あり（100台、有料）",
    contactInfo: "LST 本店 03-1234-5678\nlst-tournament@example.co.jp",
    entries: [
      { id: "e-c1", tournamentId: "t-completed", registrantUserId: CURRENT_USER, partnerUserId: "user-002", registeredAt: lastWeek, status: "confirmed" },
      { id: "e-c2", tournamentId: "t-completed", registrantUserId: "user-003", partnerUserId: "user-008", registeredAt: lastWeek, status: "confirmed" },
      { id: "e-c3", tournamentId: "t-completed", registrantUserId: "user-006", partnerUserId: "user-007", registeredAt: lastWeek, status: "confirmed" },
      { id: "e-c4", tournamentId: "t-completed", registrantUserId: "user-005", partnerUserId: "user-010", registeredAt: lastWeek, status: "confirmed" },
    ],
    results: {
      rankings: [
        { rank: 1, userId: "user-005", partnerId: "user-010" },
        { rank: 2, userId: CURRENT_USER, partnerId: "user-002" },
        { rank: 3, userId: "user-006", partnerId: "user-007" },
        { rank: 4, userId: "user-003", partnerId: "user-008" },
      ],
      matches: [
        // SF
        { round: 2, p1UserId: CURRENT_USER, p1PartnerId: "user-002", p2UserId: "user-003", p2PartnerId: "user-008", winnerSide: 1, score: "6-3" },
        { round: 2, p1UserId: "user-006", p1PartnerId: "user-007", p2UserId: "user-005", p2PartnerId: "user-010", winnerSide: 2, score: "4-6" },
        // F
        { round: 3, p1UserId: CURRENT_USER, p1PartnerId: "user-002", p2UserId: "user-005", p2PartnerId: "user-010", winnerSide: 2, score: "3-6" },
      ],
    },
  };

  // 報名中（雙打 16 隊）
  const openTournament: Tournament = {
    id: "t-open",
    title: "5月度 ダブルス大会",
    format: "doubles",
    capacity: 16,
    venue: "LST 本店コートB",
    scheduledAt: in7days,
    registrationDeadline: in5days,
    status: "registration_open",
    heroImageUrl: "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=800&h=450&fit=crop",
    description: "ペアで挑む月例ダブルス大会。\nお馴染みのパートナーとチームを組んでご参加ください。\n16ペアの単一エリミネーション形式です。",
    accessInfo: "東京メトロ 渋谷駅 徒歩5分\nビル 5F LST 本店コートB",
    contactInfo: "LST 本店 03-1234-5678",
    entries: [
      { id: "e-o1", tournamentId: "t-open", registrantUserId: "user-002", partnerUserId: "user-003", registeredAt: now.toISOString(), status: "confirmed" },
      { id: "e-o2", tournamentId: "t-open", registrantUserId: "user-005", partnerUserId: "user-006", registeredAt: now.toISOString(), status: "confirmed" },
      { id: "e-o3", tournamentId: "t-open", registrantUserId: "user-007", partnerUserId: "user-008", registeredAt: now.toISOString(), status: "confirmed" },
    ],
  };

  // 進行中
  const inProgressTournament: Tournament = {
    id: "t-progress",
    title: "5月度 ダブルス交流戦",
    format: "doubles",
    capacity: 16,
    venue: "LST 西支店コート1",
    scheduledAt: today,
    registrationDeadline: today,
    status: "in_progress",
    heroImageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&h=450&fit=crop",
    description: "西支店主催のダブルス交流戦。\nレベル制限なし、楽しむことを重視した雰囲気の大会です。",
    accessInfo: "西武新宿線 上石神井駅 徒歩10分\nLST 西支店コート1",
    contactInfo: "LST 西支店 042-345-6789",
    entries: [],
  };

  // 即將舉辦
  const upcomingTournament: Tournament = {
    id: "t-upcoming",
    title: "5月度 ビッグダブルス大会",
    format: "doubles",
    capacity: 32,
    venue: "LST 本店コートA",
    scheduledAt: in20days,
    registrationDeadline: in15days,
    status: "upcoming",
    heroImageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=450&fit=crop",
    description: "5月最大のダブルストーナメント。\n32ペア定員、3週間にわたる本格大会。\nランキング上位入賞でシーズン積分大幅獲得。",
    accessInfo: "JR 東京駅 八重洲口 徒歩7分\nLST 本店コートA",
    contactInfo: "LST 本店 03-1234-5678",
    entries: [],
  };

  const in10days = new Date(now.getTime() + 10 * 86400000).toISOString();
  const in9days = new Date(now.getTime() + 9 * 86400000).toISOString();
  const inviteSentAt = new Date(now.getTime() - 24 * 3600000).toISOString(); // 24h ago

  const pendingInviteTournament: Tournament = {
    id: "t-pending-invite",
    title: "5月度 ダブルストーナメント",
    format: "doubles",
    capacity: 8,
    venue: "LST 西支店コート2",
    scheduledAt: in10days,
    registrationDeadline: in9days,
    status: "registration_open",
    heroImageUrl: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&h=450&fit=crop",
    description: "西支店主催のダブルストーナメント。\n気軽にご参加ください。",
    accessInfo: "西武新宿線 上石神井駅 徒歩10分\nLST 西支店コート2",
    contactInfo: "LST 西支店 042-345-6789",
    entries: [
      {
        id: "e-pi1",
        tournamentId: "t-pending-invite",
        registrantUserId: "user-002",
        partnerUserId: CURRENT_USER,
        registeredAt: inviteSentAt,
        status: "pending_partner_confirmation",
        invitedAt: inviteSentAt,
        expiresAt: computeExpiresAt(inviteSentAt, in9days),
      },
    ],
  };

  // User as registrant, partner pending — for demo "私が招待した、相手の確認待ち" state
  const inviteSentByMeAt = new Date(now.getTime() - 12 * 3600000).toISOString(); // 12h ago
  const in12days = new Date(now.getTime() + 12 * 86400000).toISOString();
  const in11days = new Date(now.getTime() + 11 * 86400000).toISOString();

  const selfSentPendingTournament: Tournament = {
    id: "t-self-sent-pending",
    title: "5月度 シニアダブルス交流",
    format: "doubles",
    capacity: 8,
    venue: "LST 本店コートB",
    scheduledAt: in12days,
    registrationDeadline: in11days,
    status: "registration_open",
    heroImageUrl: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&h=450&fit=crop",
    description: "シニア世代の交流ダブルス大会。",
    accessInfo: "東京メトロ 渋谷駅 徒歩5分",
    contactInfo: "LST 本店 03-1234-5678",
    entries: [
      {
        id: "e-self-pending-1",
        tournamentId: "t-self-sent-pending",
        registrantUserId: CURRENT_USER,
        partnerUserId: "user-008",
        registeredAt: inviteSentByMeAt,
        status: "pending_partner_confirmation",
        invitedAt: inviteSentByMeAt,
        expiresAt: computeExpiresAt(inviteSentByMeAt, in11days),
      },
    ],
  };

  // User confirmed doubles (ナイトダブルス)
  const in14days = new Date(now.getTime() + 14 * 86400000).toISOString();
  const in13days = new Date(now.getTime() + 13 * 86400000).toISOString();

  const selfConfirmedNightDoublesTournament: Tournament = {
    id: "t-self-confirmed-night-doubles",
    title: "5月度 ナイトダブルス大会",
    format: "doubles",
    capacity: 16,
    venue: "LST 本店コートA",
    scheduledAt: in14days,
    registrationDeadline: in13days,
    status: "registration_open",
    heroImageUrl: "https://images.unsplash.com/photo-1604167842076-e10b3c4f0a9e?w=800&h=450&fit=crop",
    description: "夜の部開催のダブルス大会。\n仕事帰りでも参加可能。",
    accessInfo: "JR 東京駅 八重洲口 徒歩7分\nLST 本店コートA",
    contactInfo: "LST 本店 03-1234-5678",
    entries: [
      {
        id: "e-self-night-doubles-1",
        tournamentId: "t-self-confirmed-night-doubles",
        registrantUserId: CURRENT_USER,
        partnerUserId: "user-003",
        registeredAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        partnerRespondedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
        status: "confirmed",
      },
    ],
  };

  // User confirmed doubles (with partner accepted)
  const in18days = new Date(now.getTime() + 18 * 86400000).toISOString();
  const in17days = new Date(now.getTime() + 17 * 86400000).toISOString();

  const selfConfirmedDoublesTournament: Tournament = {
    id: "t-self-confirmed-doubles",
    title: "5月度 オープンダブルス",
    format: "doubles",
    capacity: 16,
    venue: "LST 西支店コート2",
    scheduledAt: in18days,
    registrationDeadline: in17days,
    status: "registration_open",
    heroImageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=450&fit=crop",
    description: "レベル制限なしのオープンダブルス。\n初心者から経験者まで歓迎。",
    accessInfo: "西武新宿線 上石神井駅 徒歩10分",
    contactInfo: "LST 西支店 042-345-6789",
    entries: [
      {
        id: "e-self-doubles-1",
        tournamentId: "t-self-confirmed-doubles",
        registrantUserId: CURRENT_USER,
        partnerUserId: "user-005",
        registeredAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
        partnerRespondedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
        status: "confirmed",
      },
    ],
  };

  // Open doubles tournament where user-001 is NOT registered yet (for demo registration flow)
  const in16days = new Date(now.getTime() + 16 * 86400000).toISOString();

  const extraDoublesTournament: Tournament = {
    id: "t-extra-doubles",
    title: "5月度 オープンダブルス交流",
    format: "doubles",
    capacity: 16,
    venue: "LST 本店コートA",
    scheduledAt: in16days,
    registrationDeadline: in15days,
    status: "registration_open",
    heroImageUrl: "https://images.unsplash.com/photo-1530915534180-dffae4f63a01?w=800&h=450&fit=crop",
    description: "気軽に参加できるオープンダブルス交流戦。\n初級〜中級向け、16ペア定員。",
    accessInfo: "JR 東京駅 八重洲口 徒歩7分\nLST 本店コートA",
    contactInfo: "LST 本店 03-1234-5678",
    entries: [
      { id: "e-ed-1", tournamentId: "t-extra-doubles", registrantUserId: "user-003", partnerUserId: "user-006", registeredAt: now.toISOString(), status: "confirmed" },
      { id: "e-ed-2", tournamentId: "t-extra-doubles", registrantUserId: "user-007", partnerUserId: "user-010", registeredAt: now.toISOString(), status: "confirmed" },
      { id: "e-ed-3", tournamentId: "t-extra-doubles", registrantUserId: "user-008", partnerUserId: "user-012", registeredAt: now.toISOString(), status: "confirmed" },
    ],
  };

  // 12月 — 3位（ダブルス w/ user-007）
  const completedDec2025: Tournament = {
    id: "t-completed-dec-2025",
    title: "12月度 ダブルストーナメント",
    format: "doubles",
    capacity: 8,
    venue: "LST 本店コートA",
    scheduledAt: "2025-12-15T14:00:00.000Z",
    registrationDeadline: "2025-12-13T23:00:00.000Z",
    status: "completed",
    heroImageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=450&fit=crop",
    description: "年末恒例のダブルストーナメント。\n4ペア参加、単一エリミネーション。",
    accessInfo: "JR 東京駅 八重洲口 徒歩7分",
    contactInfo: "LST 本店 03-1234-5678",
    entries: [
      { id: "e-d1", tournamentId: "t-completed-dec-2025", registrantUserId: CURRENT_USER, partnerUserId: "user-007", registeredAt: "2025-12-13T00:00:00.000Z", status: "confirmed" },
      { id: "e-d2", tournamentId: "t-completed-dec-2025", registrantUserId: "user-002", partnerUserId: "user-003", registeredAt: "2025-12-13T00:00:00.000Z", status: "confirmed" },
      { id: "e-d3", tournamentId: "t-completed-dec-2025", registrantUserId: "user-005", partnerUserId: "user-006", registeredAt: "2025-12-13T00:00:00.000Z", status: "confirmed" },
      { id: "e-d4", tournamentId: "t-completed-dec-2025", registrantUserId: "user-008", partnerUserId: "user-010", registeredAt: "2025-12-13T00:00:00.000Z", status: "confirmed" },
    ],
    results: {
      rankings: [
        { rank: 1, userId: "user-008", partnerId: "user-010" },
        { rank: 2, userId: "user-002", partnerId: "user-003" },
        { rank: 3, userId: CURRENT_USER, partnerId: "user-007" },
        { rank: 4, userId: "user-005", partnerId: "user-006" },
      ],
      matches: [
        // SF
        { round: 2, p1UserId: CURRENT_USER, p1PartnerId: "user-007", p2UserId: "user-002", p2PartnerId: "user-003", winnerSide: 2, score: "3-6" },
        { round: 2, p1UserId: "user-005", p1PartnerId: "user-006", p2UserId: "user-008", p2PartnerId: "user-010", winnerSide: 2, score: "4-6" },
        // F
        { round: 3, p1UserId: "user-002", p1PartnerId: "user-003", p2UserId: "user-008", p2PartnerId: "user-010", winnerSide: 2, score: "4-6" },
      ],
    },
  };

  // 1月 — 1位（ダブルス w/ user-002）
  const completedJan2026: Tournament = {
    id: "t-completed-jan-2026",
    title: "1月度 ダブルストーナメント",
    format: "doubles",
    capacity: 8,
    venue: "LST 本店コートB",
    scheduledAt: "2026-01-18T14:00:00.000Z",
    registrationDeadline: "2026-01-16T23:00:00.000Z",
    status: "completed",
    heroImageUrl: "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=800&h=450&fit=crop",
    description: "新年最初のダブルストーナメント。\n4ペア参加、単一エリミネーション。",
    accessInfo: "東京メトロ 渋谷駅 徒歩5分\nLST 本店コートB",
    contactInfo: "LST 本店 03-1234-5678",
    entries: [
      { id: "e-j1", tournamentId: "t-completed-jan-2026", registrantUserId: CURRENT_USER, partnerUserId: "user-002", registeredAt: "2026-01-16T00:00:00.000Z", status: "confirmed" },
      { id: "e-j2", tournamentId: "t-completed-jan-2026", registrantUserId: "user-003", partnerUserId: "user-008", registeredAt: "2026-01-16T00:00:00.000Z", status: "confirmed" },
      { id: "e-j3", tournamentId: "t-completed-jan-2026", registrantUserId: "user-005", partnerUserId: "user-006", registeredAt: "2026-01-16T00:00:00.000Z", status: "confirmed" },
      { id: "e-j4", tournamentId: "t-completed-jan-2026", registrantUserId: "user-007", partnerUserId: "user-010", registeredAt: "2026-01-16T00:00:00.000Z", status: "confirmed" },
    ],
    results: {
      rankings: [
        { rank: 1, userId: CURRENT_USER, partnerId: "user-002" },
        { rank: 2, userId: "user-007", partnerId: "user-010" },
        { rank: 3, userId: "user-005", partnerId: "user-006" },
        { rank: 4, userId: "user-003", partnerId: "user-008" },
      ],
      matches: [
        // SF
        { round: 2, p1UserId: CURRENT_USER, p1PartnerId: "user-002", p2UserId: "user-003", p2PartnerId: "user-008", winnerSide: 1, score: "6-2" },
        { round: 2, p1UserId: "user-005", p1PartnerId: "user-006", p2UserId: "user-007", p2PartnerId: "user-010", winnerSide: 2, score: "4-6" },
        // F
        { round: 3, p1UserId: CURRENT_USER, p1PartnerId: "user-002", p2UserId: "user-007", p2PartnerId: "user-010", winnerSide: 1, score: "6-3" },
      ],
    },
  };

  // 2月 — 4位（ダブルス w/ user-005）
  const completedFeb2026: Tournament = {
    id: "t-completed-feb-2026",
    title: "2月度 ダブルス交流戦",
    format: "doubles",
    capacity: 8,
    venue: "LST 西支店コート1",
    scheduledAt: "2026-02-22T14:00:00.000Z",
    registrationDeadline: "2026-02-20T23:00:00.000Z",
    status: "completed",
    heroImageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&h=450&fit=crop",
    description: "西支店主催のダブルス交流戦。\n4ペア参加。",
    accessInfo: "西武新宿線 上石神井駅 徒歩10分\nLST 西支店コート1",
    contactInfo: "LST 西支店 042-345-6789",
    entries: [
      { id: "e-f1", tournamentId: "t-completed-feb-2026", registrantUserId: CURRENT_USER, partnerUserId: "user-005", registeredAt: "2026-02-20T00:00:00.000Z", status: "confirmed" },
      { id: "e-f2", tournamentId: "t-completed-feb-2026", registrantUserId: "user-002", partnerUserId: "user-003", registeredAt: "2026-02-20T00:00:00.000Z", status: "confirmed" },
      { id: "e-f3", tournamentId: "t-completed-feb-2026", registrantUserId: "user-006", partnerUserId: "user-007", registeredAt: "2026-02-20T00:00:00.000Z", status: "confirmed" },
      { id: "e-f4", tournamentId: "t-completed-feb-2026", registrantUserId: "user-008", partnerUserId: "user-010", registeredAt: "2026-02-20T00:00:00.000Z", status: "confirmed" },
    ],
    results: {
      rankings: [
        { rank: 1, userId: "user-006", partnerId: "user-007" },
        { rank: 2, userId: "user-008", partnerId: "user-010" },
        { rank: 3, userId: "user-002", partnerId: "user-003" },
        { rank: 4, userId: CURRENT_USER, partnerId: "user-005" },
      ],
      matches: [
        // SF
        { round: 2, p1UserId: CURRENT_USER, p1PartnerId: "user-005", p2UserId: "user-006", p2PartnerId: "user-007", winnerSide: 2, score: "2-6" },
        { round: 2, p1UserId: "user-002", p1PartnerId: "user-003", p2UserId: "user-008", p2PartnerId: "user-010", winnerSide: 2, score: "4-6" },
        // F
        { round: 3, p1UserId: "user-006", p1PartnerId: "user-007", p2UserId: "user-008", p2PartnerId: "user-010", winnerSide: 1, score: "6-4" },
      ],
    },
  };

  // 3月 — 2位（ダブルス w/ user-005）
  const completedMar2026: Tournament = {
    id: "t-completed-mar-2026",
    title: "3月度 ダブルス大会",
    format: "doubles",
    capacity: 8,
    venue: "LST 本店コートB",
    scheduledAt: "2026-03-15T14:00:00.000Z",
    registrationDeadline: "2026-03-13T23:00:00.000Z",
    status: "completed",
    heroImageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=450&fit=crop",
    description: "春のダブルス大会。\n4ペア参加、単一エリミネーション。",
    accessInfo: "東京メトロ 渋谷駅 徒歩5分\nLST 本店コートB",
    contactInfo: "LST 本店 03-1234-5678",
    entries: [
      { id: "e-m1", tournamentId: "t-completed-mar-2026", registrantUserId: CURRENT_USER, partnerUserId: "user-005", registeredAt: "2026-03-13T00:00:00.000Z", status: "confirmed" },
      { id: "e-m2", tournamentId: "t-completed-mar-2026", registrantUserId: "user-002", partnerUserId: "user-007", registeredAt: "2026-03-13T00:00:00.000Z", status: "confirmed" },
      { id: "e-m3", tournamentId: "t-completed-mar-2026", registrantUserId: "user-003", partnerUserId: "user-006", registeredAt: "2026-03-13T00:00:00.000Z", status: "confirmed" },
      { id: "e-m4", tournamentId: "t-completed-mar-2026", registrantUserId: "user-008", partnerUserId: "user-010", registeredAt: "2026-03-13T00:00:00.000Z", status: "confirmed" },
    ],
    results: {
      rankings: [
        { rank: 1, userId: "user-003", partnerId: "user-006" },
        { rank: 2, userId: CURRENT_USER, partnerId: "user-005" },
        { rank: 3, userId: "user-002", partnerId: "user-007" },
        { rank: 4, userId: "user-008", partnerId: "user-010" },
      ],
      matches: [
        // SF
        { round: 2, p1UserId: CURRENT_USER, p1PartnerId: "user-005", p2UserId: "user-002", p2PartnerId: "user-007", winnerSide: 1, score: "6-4" },
        { round: 2, p1UserId: "user-003", p1PartnerId: "user-006", p2UserId: "user-008", p2PartnerId: "user-010", winnerSide: 1, score: "6-2" },
        // F
        { round: 3, p1UserId: CURRENT_USER, p1PartnerId: "user-005", p2UserId: "user-003", p2PartnerId: "user-006", winnerSide: 2, score: "3-6" },
      ],
    },
  };

  return {
    tournaments: [
      inProgressTournament,
      openTournament,
      pendingInviteTournament,
      selfSentPendingTournament,
      selfConfirmedNightDoublesTournament,
      selfConfirmedDoublesTournament,
      extraDoublesTournament,
      upcomingTournament,
      completedTournament,    // 4月 2026
      completedMar2026,       // 3月
      completedFeb2026,       // 2月
      completedJan2026,       // 1月
      completedDec2025,       // 12月 2025
    ],
  };
}

let state: StoreState = buildInitialState();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

// ── Personal seasonal scoring ──

export interface PersonalSeasonalSummary {
  seasonKey: string;
  ratingChange: number;     // sum of all rating deltas in this season
  endingRating: number;     // rating at end of season (or current if ongoing)
  padelPoints: number;
  played: number;
  won: number;
  bestRank: number | null;  // best tournament rank
  tournaments: {
    tournamentId: string;
    title: string;
    date: string;
    matchesPlayed: number;
    matchesWon: number;
    finalRank: number | null;
    ratingDelta: number;    // rating change from this tournament
    padelPoints: number;    // padel points from this tournament
  }[];
}

export function computePersonalSeasonalSummary(
  userId: string,
  season: string,
  tournaments: Tournament[]
): PersonalSeasonalSummary {
  const player = getPlayer(userId);
  const startingRating = player?.rating ?? 1400;

  const inSeason = tournaments.filter(
    (t) => t.status === "completed" && seasonKey(getSeasonOf(t.scheduledAt)) === season && t.results
  );

  let played = 0;
  let won = 0;
  let bestRank: number | null = null;
  let totalRatingDelta = 0;
  let totalPadelPoints = 0;
  const list: PersonalSeasonalSummary["tournaments"] = [];

  for (const t of inSeason) {
    const entry = t.entries.find(
      (e) => e.status === "confirmed" && (e.registrantUserId === userId || e.partnerUserId === userId)
    );
    if (!entry) continue;

    let mPlayed = 0;
    let mWon = 0;
    let tRatingDelta = 0;

    for (const m of t.results!.matches) {
      const onSide1 = m.p1UserId === userId || m.p1PartnerId === userId;
      const onSide2 = m.p2UserId === userId || m.p2PartnerId === userId;
      if (!onSide1 && !onSide2) continue;
      mPlayed++;
      const isWin = (onSide1 && m.winnerSide === 1) || (onSide2 && m.winnerSide === 2);
      if (isWin) mWon++;

      // Compute rating delta for this match
      const myPair = onSide1
        ? [m.p1UserId, m.p1PartnerId].filter(Boolean) as string[]
        : [m.p2UserId, m.p2PartnerId].filter(Boolean) as string[];
      const oppPair = onSide1
        ? [m.p2UserId, m.p2PartnerId].filter(Boolean) as string[]
        : [m.p1UserId, m.p1PartnerId].filter(Boolean) as string[];

      const myAvg = myPair.length > 0
        ? myPair.map((u) => getPlayer(u)?.rating ?? 1400).reduce((a, b) => a + b, 0) / myPair.length
        : startingRating;
      const oppAvg = oppPair.length > 0
        ? oppPair.map((u) => getPlayer(u)?.rating ?? 1400).reduce((a, b) => a + b, 0) / oppPair.length
        : 1400;

      tRatingDelta += computeRatingDelta(myAvg, oppAvg, isWin);
    }

    played += mPlayed;
    won += mWon;
    totalRatingDelta += tRatingDelta;

    const ranking = t.results!.rankings.find(
      (r) => r.userId === userId || r.partnerId === userId
    );
    let finalRank: number | null = null;
    let podiumPP = 0;
    if (ranking) {
      finalRank = ranking.rank;
      if (bestRank == null || ranking.rank < bestRank) bestRank = ranking.rank;
      if (ranking.rank === 1) podiumPP = PP_TOURNAMENT_CHAMPION;
      else if (ranking.rank === 2) podiumPP = PP_TOURNAMENT_RUNNER_UP;
      else if (ranking.rank === 3) podiumPP = PP_TOURNAMENT_THIRD;
    }

    const tPadelPoints = mWon * PP_MATCH_WIN + podiumPP;
    totalPadelPoints += tPadelPoints;

    list.push({
      tournamentId: t.id,
      title: t.title,
      date: t.scheduledAt,
      matchesPlayed: mPlayed,
      matchesWon: mWon,
      finalRank,
      ratingDelta: tRatingDelta,
      padelPoints: tPadelPoints,
    });
  }

  return {
    seasonKey: season,
    ratingChange: totalRatingDelta,
    endingRating: startingRating + totalRatingDelta, // simplified — assumes player.rating is the current cumulative
    padelPoints: totalPadelPoints,
    played,
    won,
    bestRank,
    tournaments: list,
  };
}

export interface SeasonalRankingRow {
  userId: string;
  name: string;
  rating: number;
  tier: RankTier;
  played: number;
  won: number;
  ratingChange: number;
}

export function computeSeasonalRanking(
  season: string,
  tournaments: Tournament[]
): SeasonalRankingRow[] {
  // Collect all userIds who participated in this season's tournaments
  const allUserIds = new Set<string>();
  tournaments.forEach((t) => {
    if (t.status !== "completed") return;
    if (seasonKey(getSeasonOf(t.scheduledAt)) !== season) return;
    t.entries.forEach((e) => {
      if (e.status !== "confirmed") return;
      allUserIds.add(e.registrantUserId);
      if (e.partnerUserId) allUserIds.add(e.partnerUserId);
    });
  });

  const rows: SeasonalRankingRow[] = [];
  for (const uid of allUserIds) {
    const summary = computePersonalSeasonalSummary(uid, season, tournaments);
    const player = getPlayer(uid);
    const finalRating = player?.rating ?? 1400; // current/cumulative rating
    rows.push({
      userId: uid,
      name: player?.name ?? uid,
      rating: finalRating,
      tier: getRankTier(finalRating).tier,
      played: summary.played,
      won: summary.won,
      ratingChange: summary.ratingChange,
    });
  }
  return rows.sort((a, b) => b.rating - a.rating);
}

/** Total Padel Points accumulated across ALL completed tournaments for a user */
export function computeTotalPadelPoints(userId: string, tournaments: Tournament[]): number {
  let total = 0;
  for (const t of tournaments) {
    if (t.status !== "completed" || !t.results) continue;
    const entry = t.entries.find(
      (e) => e.status === "confirmed" && (e.registrantUserId === userId || e.partnerUserId === userId)
    );
    if (!entry) continue;
    let mWon = 0;
    for (const m of t.results.matches) {
      const onSide1 = m.p1UserId === userId || m.p1PartnerId === userId;
      const onSide2 = m.p2UserId === userId || m.p2PartnerId === userId;
      if (!onSide1 && !onSide2) continue;
      const isWin = (onSide1 && m.winnerSide === 1) || (onSide2 && m.winnerSide === 2);
      if (isWin) mWon++;
    }
    total += mWon * PP_MATCH_WIN;
    const ranking = t.results.rankings.find((r) => r.userId === userId || r.partnerId === userId);
    if (ranking?.rank === 1) total += PP_TOURNAMENT_CHAMPION;
    else if (ranking?.rank === 2) total += PP_TOURNAMENT_RUNNER_UP;
    else if (ranking?.rank === 3) total += PP_TOURNAMENT_THIRD;
  }
  return total;
}

/* ── Hook ── */

export function useTournamentStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  const getTournament = useCallback((id: string) => {
    return data.tournaments.find((t) => t.id === id);
  }, [data.tournaments]);

  const getMyEntries = useCallback(() => {
    return data.tournaments
      .filter((t) => t.status !== "completed")
      .filter((t) =>
        t.entries.some(
          (e) =>
            (e.status === "confirmed" || e.status === "pending_partner_confirmation") &&
            (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
        )
      );
  }, [data.tournaments]);

  const registerForTournament = useCallback(
    (tournamentId: string, partnerUserId?: string): { ok: boolean; error?: string } => {
      const t = state.tournaments.find((x) => x.id === tournamentId);
      if (!t) return { ok: false, error: "大会が見つかりません" };
      if (t.status !== "registration_open") return { ok: false, error: "現在エントリーを受け付けていません" };
      if (!partnerUserId) return { ok: false, error: "パートナーを指定してください" };
      if (!PREMIUM_USERS.has(partnerUserId)) {
        return { ok: false, error: "パートナーがプレミアム会員ではないため、エントリーできません" };
      }
      if (t.entries.length >= t.capacity) return { ok: false, error: "定員に達しました" };

      const now = new Date().toISOString();
      const entry: TournamentEntry = {
        id: `e-${Date.now()}`,
        tournamentId,
        registrantUserId: CURRENT_USER,
        partnerUserId,
        registeredAt: now,
        status: "pending_partner_confirmation",
        invitedAt: now,
        expiresAt: computeExpiresAt(now, t.registrationDeadline),
      };
      state = {
        ...state,
        tournaments: state.tournaments.map((x) =>
          x.id === tournamentId ? { ...x, entries: [...x.entries, entry] } : x
        ),
      };
      emit();

      addNotification({
        type: "tournament_partner_invited",
        title: "大会の招待が届きました",
        message: `田中 太郎さんから「${t.title}」への招待が届きました。${PARTNER_INVITE_HOURS}時間以内に回答してください。`,
        entryId: entry.id,
      });
      return { ok: true };
    },
    []
  );

  const acceptPartnerInvite = useCallback((entryId: string): { ok: boolean; error?: string } => {
    let foundTournament: Tournament | undefined;
    state = {
      ...state,
      tournaments: state.tournaments.map((t) => {
        const idx = t.entries.findIndex(
          (e) => e.id === entryId && e.status === "pending_partner_confirmation"
        );
        if (idx < 0) return t;
        foundTournament = t;
        const updated = [...t.entries];
        updated[idx] = {
          ...updated[idx],
          status: "confirmed",
          partnerRespondedAt: new Date().toISOString(),
        };
        return { ...t, entries: updated };
      }),
    };
    if (!foundTournament) return { ok: false, error: "招待が見つかりません" };
    emit();
    addNotification({
      type: "tournament_partner_accepted",
      title: "パートナーが招待を承諾しました",
      message: `${foundTournament.title} のエントリーが確定しました。`,
    });
    return { ok: true };
  }, []);

  const declinePartnerInvite = useCallback(
    (entryId: string, reason?: string): { ok: boolean; error?: string } => {
      let foundTournament: Tournament | undefined;
      state = {
        ...state,
        tournaments: state.tournaments.map((t) => {
          const idx = t.entries.findIndex(
            (e) => e.id === entryId && e.status === "pending_partner_confirmation"
          );
          if (idx < 0) return t;
          foundTournament = t;
          const updated = [...t.entries];
          updated[idx] = {
            ...updated[idx],
            status: "cancelled",
            partnerRespondedAt: new Date().toISOString(),
            partnerDeclineReason: reason,
          };
          return { ...t, entries: updated };
        }),
      };
      if (!foundTournament) return { ok: false, error: "招待が見つかりません" };
      emit();
      addNotification({
        type: "tournament_partner_declined",
        title: "パートナーが招待を辞退しました",
        message: `${foundTournament.title} のエントリーがキャンセルされました。${reason ? `理由: ${reason}` : ""}`,
      });
      return { ok: true };
    },
    []
  );

  const cancelMyPendingInvite = useCallback(
    (entryId: string): { ok: boolean; error?: string } => {
      let foundTournament: Tournament | undefined;
      let cancelledEntry: TournamentEntry | undefined;
      state = {
        ...state,
        tournaments: state.tournaments.map((t) => {
          const idx = t.entries.findIndex(
            (e) =>
              e.id === entryId &&
              e.status === "pending_partner_confirmation" &&
              e.registrantUserId === CURRENT_USER
          );
          if (idx < 0) return t;
          foundTournament = t;
          cancelledEntry = t.entries[idx];
          const updated = [...t.entries];
          updated[idx] = {
            ...updated[idx],
            status: "cancelled",
            partnerRespondedAt: new Date().toISOString(),
          };
          return { ...t, entries: updated };
        }),
      };
      if (!foundTournament || !cancelledEntry) return { ok: false, error: "招待が見つかりません" };
      emit();
      addNotification({
        type: "tournament_partner_cancelled",
        title: "招待が取り消されました",
        message: `${foundTournament.title} への招待が取り消されました。`,
      });
      return { ok: true };
    },
    []
  );

  const cancelMyConfirmedEntry = useCallback(
    (entryId: string): { ok: boolean; error?: string } => {
      let foundTournament: Tournament | undefined;
      let myCancelledEntry: TournamentEntry | undefined;
      state = {
        ...state,
        tournaments: state.tournaments.map((t) => {
          const idx = t.entries.findIndex(
            (e) =>
              e.id === entryId &&
              e.status === "confirmed" &&
              (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
          );
          if (idx < 0) return t;
          foundTournament = t;
          myCancelledEntry = t.entries[idx];
          const updated = [...t.entries];
          updated[idx] = {
            ...updated[idx],
            status: "cancelled",
            partnerRespondedAt: new Date().toISOString(),
          };
          return { ...t, entries: updated };
        }),
      };
      if (!foundTournament || !myCancelledEntry) {
        return { ok: false, error: "エントリーが見つかりません" };
      }
      emit();

      // Notification to ME (confirmation of my own cancellation)
      addNotification({
        type: "tournament_partner_cancelled",
        title: "エントリーを取り消しました",
        message: `「${foundTournament.title}」のエントリーを取り消しました。`,
      });

      // Broadcast to OTHER confirmed entries in the same tournament
      const otherConfirmedUsers = new Set<string>();
      for (const e of foundTournament.entries) {
        if (e.id === entryId) continue;
        if (e.status !== "confirmed") continue;
        if (e.registrantUserId && e.registrantUserId !== CURRENT_USER) {
          otherConfirmedUsers.add(e.registrantUserId);
        }
        if (e.partnerUserId && e.partnerUserId !== CURRENT_USER) {
          otherConfirmedUsers.add(e.partnerUserId);
        }
      }
      // For demo purposes: fire ONE broadcast notification representing what other participants would receive.
      // In production this would be a per-user push notification from the backend.
      if (otherConfirmedUsers.size > 0) {
        const myName = getPlayer(CURRENT_USER)?.name ?? "—";
        addNotification({
          type: "tournament_participant_cancelled",
          title: "他の参加者がエントリーを取り消しました",
          message: `${myName}さんが「${foundTournament.title}」のエントリーを取り消しました。（デモ：本来は他の参加者に届く通知）`,
        });
      }
      return { ok: true };
    },
    []
  );

  const getEntry = useCallback((entryId: string) => {
    for (const t of data.tournaments) {
      const e = t.entries.find((x) => x.id === entryId);
      if (e) return { entry: e, tournament: t };
    }
    return undefined;
  }, [data.tournaments]);

  const getPendingInvitesForUser = useCallback(() => {
    const result: { entry: TournamentEntry; tournament: Tournament }[] = [];
    for (const t of data.tournaments) {
      for (const e of t.entries) {
        if (e.status === "pending_partner_confirmation" && e.partnerUserId === CURRENT_USER) {
          result.push({ entry: e, tournament: t });
        }
      }
    }
    return result;
  }, [data.tournaments]);

  const getCompletedTournaments = useCallback(
    (sinceIso?: string) => {
      return data.tournaments
        .filter((t) => t.status === "completed")
        .filter((t) => !sinceIso || t.scheduledAt >= sinceIso)
        .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
    },
    [data.tournaments]
  );

  return {
    ...data,
    getTournament,
    getMyEntries,
    registerForTournament,
    acceptPartnerInvite,
    declinePartnerInvite,
    cancelMyPendingInvite,
    cancelMyConfirmedEntry,
    getEntry,
    getPendingInvitesForUser,
    getCompletedTournaments,
    computeMySeasonalSummary: (season: string) => computePersonalSeasonalSummary(CURRENT_USER, season, data.tournaments),
    computeSeasonalRanking: (season: string) => computeSeasonalRanking(season, data.tournaments),
    computeMyTotalPadelPoints: () => computeTotalPadelPoints(CURRENT_USER, data.tournaments),
  };
}
