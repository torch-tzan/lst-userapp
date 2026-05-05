import { useCallback, useSyncExternalStore } from "react";
import { addNotification } from "@/lib/notificationStore";

export const CURRENT_USER = "user-001";
export const POINTS_PARTICIPATION = 10;
export const POINTS_WIN = 50;
export const POINTS_PODIUM = { 1: 100, 2: 50, 3: 25 } as const;

export const PARTNER_INVITE_HOURS = 72;

export type TournamentFormat = "singles" | "doubles";
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
  { userId: CURRENT_USER, name: "田中 太郎" },
  { userId: "user-002", name: "佐藤 花子" },
  { userId: "user-003", name: "鈴木 一郎" },
  { userId: "user-004", name: "高橋 美咲" },
  { userId: "user-005", name: "渡辺 健太" },
  { userId: "user-006", name: "伊藤 愛" },
  { userId: "user-007", name: "山本 大輝" },
  { userId: "user-008", name: "中村 裕子" },
  { userId: "user-009", name: "吉田 恵" },
  { userId: "user-010", name: "松本 翔太" },
  { userId: "user-011", name: "小林 優" },
  { userId: "user-012", name: "加藤 翼" },
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

export function findPlayerByName(query: string): PlayerRef | undefined {
  return PLAYER_DIRECTORY.find(
    (p) => p.name.replace(/\s/g, "").includes(query.replace(/\s/g, ""))
  );
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

  // 已結束的大會：自己得第 2 名
  const completedTournament: Tournament = {
    id: "t-completed",
    title: "4月度 シングルス大会",
    format: "singles",
    capacity: 8,
    venue: "LST 本店コートA",
    scheduledAt: lastWeek,
    registrationDeadline: lastWeek,
    status: "completed",
    heroImageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=450&fit=crop",
    description: "毎月恒例のシングルストーナメント。\n初級〜上級まで実力に応じてご参加いただけます。\n試合形式は8名による単一エリミネーションです。",
    accessInfo: "JR 東京駅 八重洲口 徒歩7分\n地下駐車場あり（100台、有料）",
    contactInfo: "LST 本店 03-1234-5678\nlst-tournament@example.co.jp",
    entries: [
      { id: "e-c1", tournamentId: "t-completed", registrantUserId: CURRENT_USER, registeredAt: lastWeek, status: "confirmed" },
      ...["user-002","user-003","user-005","user-006","user-007","user-010","user-008"].map((u, i) => ({
        id: `e-c${i+2}`, tournamentId: "t-completed", registrantUserId: u, registeredAt: lastWeek, status: "confirmed" as const,
      })),
    ],
    results: {
      rankings: [
        { rank: 1, userId: "user-010" },
        { rank: 2, userId: CURRENT_USER },
        { rank: 3, userId: "user-006" },
        { rank: 4, userId: "user-003" },
      ],
      matches: [
        // R1
        { round: 1, p1UserId: CURRENT_USER, p2UserId: "user-008", winnerSide: 1, score: "6-2" },
        { round: 1, p1UserId: "user-006", p2UserId: "user-007", winnerSide: 1, score: "6-3" },
        { round: 1, p1UserId: "user-010", p2UserId: "user-005", winnerSide: 1, score: "6-1" },
        { round: 1, p1UserId: "user-003", p2UserId: "user-002", winnerSide: 1, score: "6-4" },
        // SF
        { round: 2, p1UserId: CURRENT_USER, p2UserId: "user-006", winnerSide: 1, score: "6-3" },
        { round: 2, p1UserId: "user-010", p2UserId: "user-003", winnerSide: 1, score: "6-2" },
        // F
        { round: 3, p1UserId: CURRENT_USER, p2UserId: "user-010", winnerSide: 2, score: "4-6" },
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
    title: "5月度 シングルストーナメント",
    format: "singles",
    capacity: 32,
    venue: "LST 本店コートA",
    scheduledAt: in20days,
    registrationDeadline: in15days,
    status: "upcoming",
    heroImageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=450&fit=crop",
    description: "5月最大のシングルストーナメント。\n32名定員、3週間にわたる本格大会。\nランキング上位入賞で月間積分大幅獲得。",
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

  return {
    tournaments: [
      inProgressTournament,
      openTournament,
      pendingInviteTournament,
      upcomingTournament,
      completedTournament,
    ],
  };
}

let state: StoreState = buildInitialState();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

/* ── Personal scoring ── */

function yearMonthOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface PersonalMonthlyScore {
  yearMonth: string;
  participation: number;
  wins: number;
  podiumBonus: number;
  total: number;
  played: number;
  won: number;
  bestRank: number | null;
  tournaments: {
    tournamentId: string;
    title: string;
    date: string;
    matchesPlayed: number;
    matchesWon: number;
    finalRank: number | null;
    score: number;
  }[];
}

export function computePersonalMonthlyScore(
  userId: string,
  yearMonth: string,
  tournaments: Tournament[]
): PersonalMonthlyScore {
  const inMonth = tournaments.filter(
    (t) => t.status === "completed" && yearMonthOf(t.scheduledAt) === yearMonth && t.results
  );
  let participation = 0;
  let wins = 0;
  let podiumBonus = 0;
  let played = 0;
  let won = 0;
  let bestRank: number | null = null;
  const list: PersonalMonthlyScore["tournaments"] = [];

  for (const t of inMonth) {
    const entry = t.entries.find(
      (e) => e.status === "confirmed" && (e.registrantUserId === userId || e.partnerUserId === userId)
    );
    if (!entry) continue;
    participation += POINTS_PARTICIPATION;

    let mPlayed = 0;
    let mWon = 0;
    for (const m of t.results!.matches) {
      const onSide1 = m.p1UserId === userId || m.p1PartnerId === userId;
      const onSide2 = m.p2UserId === userId || m.p2PartnerId === userId;
      if (!onSide1 && !onSide2) continue;
      mPlayed++;
      const isWin = (onSide1 && m.winnerSide === 1) || (onSide2 && m.winnerSide === 2);
      if (isWin) mWon++;
    }
    wins += mWon * POINTS_WIN;
    played += mPlayed;
    won += mWon;

    const ranking = t.results!.rankings.find(
      (r) => r.userId === userId || r.partnerId === userId
    );
    let podium = 0;
    let finalRank: number | null = null;
    if (ranking) {
      finalRank = ranking.rank;
      if (bestRank == null || ranking.rank < bestRank) bestRank = ranking.rank;
      if (ranking.rank === 1) podium = POINTS_PODIUM[1];
      else if (ranking.rank === 2) podium = POINTS_PODIUM[2];
      else if (ranking.rank === 3) podium = POINTS_PODIUM[3];
    }
    podiumBonus += podium;

    const tScore = POINTS_PARTICIPATION + mWon * POINTS_WIN + podium;
    list.push({
      tournamentId: t.id,
      title: t.title,
      date: t.scheduledAt,
      matchesPlayed: mPlayed,
      matchesWon: mWon,
      finalRank,
      score: tScore,
    });
  }

  return {
    yearMonth,
    participation,
    wins,
    podiumBonus,
    total: participation + wins + podiumBonus,
    played,
    won,
    bestRank,
    tournaments: list,
  };
}

export interface MonthlyRankingRow {
  userId: string;
  name: string;
  score: number;
  played: number;
  won: number;
  bestRank: number | null;
}

export function computeMonthlyRanking(
  yearMonth: string,
  tournaments: Tournament[]
): MonthlyRankingRow[] {
  const allUserIds = new Set<string>();
  tournaments.forEach((t) => {
    if (yearMonthOf(t.scheduledAt) !== yearMonth) return;
    t.entries.forEach((e) => {
      if (e.status !== "confirmed") return;
      allUserIds.add(e.registrantUserId);
      if (e.partnerUserId) allUserIds.add(e.partnerUserId);
    });
  });

  const rows: MonthlyRankingRow[] = [];
  for (const uid of allUserIds) {
    const s = computePersonalMonthlyScore(uid, yearMonth, tournaments);
    const player = getPlayer(uid);
    rows.push({
      userId: uid,
      name: player?.name ?? uid,
      score: s.total,
      played: s.played,
      won: s.won,
      bestRank: s.bestRank,
    });
  }
  return rows.sort((a, b) => b.score - a.score || b.won - a.won);
}

/* ── Hook ── */

export function useTournamentStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  const getTournament = useCallback((id: string) => {
    return data.tournaments.find((t) => t.id === id);
  }, [data.tournaments]);

  const getMyEntries = useCallback(() => {
    return data.tournaments
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
      if (t.format === "doubles" && !partnerUserId) return { ok: false, error: "パートナーを指定してください" };
      if (partnerUserId && !PREMIUM_USERS.has(partnerUserId)) {
        return { ok: false, error: "パートナーがプレミアム会員ではないため、エントリーできません" };
      }
      if (t.entries.length >= t.capacity) return { ok: false, error: "定員に達しました" };

      const now = new Date().toISOString();
      const isDoubles = t.format === "doubles";
      const entry: TournamentEntry = {
        id: `e-${Date.now()}`,
        tournamentId,
        registrantUserId: CURRENT_USER,
        partnerUserId,
        registeredAt: now,
        status: isDoubles ? "pending_partner_confirmation" : "confirmed",
        ...(isDoubles && {
          invitedAt: now,
          expiresAt: computeExpiresAt(now, t.registrationDeadline),
        }),
      };
      state = {
        ...state,
        tournaments: state.tournaments.map((x) =>
          x.id === tournamentId ? { ...x, entries: [...x.entries, entry] } : x
        ),
      };
      emit();

      if (isDoubles) {
        addNotification({
          type: "tournament_partner_invited",
          title: "大会の招待が届きました",
          message: `田中 太郎さんから「${t.title}」への招待が届きました。${PARTNER_INVITE_HOURS}時間以内に回答してください。`,
        });
      } else {
        addNotification({
          type: "tournament_registration_confirmed",
          title: "大会のエントリーが完了しました",
          message: `${t.title}のエントリーを受け付けました。`,
        });
      }
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
    getEntry,
    getPendingInvitesForUser,
    getCompletedTournaments,
    computeMyMonthlyScore: (ym: string) => computePersonalMonthlyScore(CURRENT_USER, ym, data.tournaments),
    computeRanking: (ym: string) => computeMonthlyRanking(ym, data.tournaments),
  };
}
