import { useSyncExternalStore, useCallback } from "react";
import { addNotification } from "@/lib/notificationStore";
import { getBookings, type StoredBooking } from "@/lib/bookingStore";

/* ── Constants ── */

export const CURRENT_USER = "user-001";
export const WIN_XP = 100;
export const LOSE_XP = 30;
export const WIN_POINTS = 500;
export const LOSE_POINTS = 100;

/* ── Types ── */

export type TeamStatus = "active" | "disbanded";

export interface GameTeam {
  id: string;
  name: string;
  members: { userId: string; name: string }[];
  createdAt: string;
  status: TeamStatus;
  weekKey: string;
}

export type InviteStatus = "pending" | "accepted" | "declined";

export interface TeamInvite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  teamName: string;
  status: InviteStatus;
  createdAt: string;
  weekKey: string;
}

export type MatchStatus =
  | "proposed"
  | "scheduled"
  | "pending_confirmation"
  | "completed"
  | "cancelled"
  | "declined";

export interface GameMatch {
  id: string;
  weekKey: string;
  team1Id: string;
  team2Id: string;
  proposedBy: string;
  scheduledAt?: string;
  status: MatchStatus;
  score1?: number;
  score2?: number;
  winnerId?: string;
  submittedBy?: string;
  confirmedBy?: string[];
  submittedAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  disputedBy?: string;
  disputedAt?: string;
  notifiedOpponent?: boolean;
  manualCourtBookingId?: string;
  createdAt: string;
}

export interface PlayerPool {
  userId: string;
  name: string;
  level: string;
  wins: number;
  losses: number;
}

/* ── ISO Week helpers ── */

export function getISOWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function formatWeekLabel(weekKey: string): string {
  const [y, w] = weekKey.split("-W");
  return `${y}年 第${parseInt(w)}週`;
}

export function getWeekDateRange(weekKey: string): { start: Date; end: Date } {
  const [yStr, wStr] = weekKey.split("-W");
  const y = parseInt(yStr);
  const w = parseInt(wStr);
  // ISO 8601: week 1 is the week containing Jan 4
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const start = new Date(mondayWeek1);
  start.setUTCDate(mondayWeek1.getUTCDate() + (w - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

export function formatWeekRange(weekKey: string): string {
  const { start, end } = getWeekDateRange(weekKey);
  return `${start.getUTCMonth() + 1}/${start.getUTCDate()} 〜 ${end.getUTCMonth() + 1}/${end.getUTCDate()}`;
}

/** Previous ISO week key (for last-week ranking display) */
export function getPreviousWeekKey(weekKey: string = getISOWeekKey()): string {
  const { start } = getWeekDateRange(weekKey);
  const prev = new Date(start);
  prev.setUTCDate(prev.getUTCDate() - 7);
  return getISOWeekKey(prev);
}

/* ── Mock previous-week ranking ── */
export interface RankingEntry {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  xp: number;
  points: number;
}

const MOCK_PREV_WEEK_RANKING: RankingEntry[] = [
  { teamId: "lw-1", teamName: "チーム松本", wins: 8, losses: 1, xp: 830, points: 4100 },
  { teamId: "lw-2", teamName: "チーム伊藤", wins: 7, losses: 2, xp: 760, points: 3700 },
  { teamId: "lw-3", teamName: "チーム鈴木", wins: 7, losses: 2, xp: 760, points: 3700 },
  { teamId: "lw-4", teamName: "チーム山本", wins: 6, losses: 3, xp: 690, points: 3300 },
  { teamId: "lw-5", teamName: "チーム佐藤", wins: 5, losses: 3, xp: 590, points: 2800 },
  { teamId: "team-demo-1", teamName: "チーム田中", wins: 5, losses: 4, xp: 620, points: 2900 }, // ← user
  { teamId: "lw-7", teamName: "チーム高橋", wins: 4, losses: 4, xp: 520, points: 2400 },
  { teamId: "lw-8", teamName: "チーム渡辺", wins: 4, losses: 5, xp: 490, points: 2200 },
  { teamId: "lw-9", teamName: "チーム木村", wins: 3, losses: 5, xp: 390, points: 1800 },
  { teamId: "lw-10", teamName: "チーム林", wins: 2, losses: 6, xp: 260, points: 1100 },
  { teamId: "lw-11", teamName: "チーム清水", wins: 1, losses: 7, xp: 160, points: 600 },
  { teamId: "lw-12", teamName: "チーム森", wins: 0, losses: 8, xp: 80, points: 200 },
];

/* ── Mock player pool ── */

const PLAYER_POOL: PlayerPool[] = [
  { userId: "user-002", name: "佐藤 花子", level: "中級", wins: 12, losses: 3 },
  { userId: "user-003", name: "鈴木 一郎", level: "上級", wins: 18, losses: 5 },
  { userId: "user-004", name: "高橋 美咲", level: "初級", wins: 3, losses: 7 },
  { userId: "user-005", name: "渡辺 健太", level: "中級", wins: 10, losses: 6 },
  { userId: "user-006", name: "伊藤 愛", level: "上級", wins: 22, losses: 4 },
  { userId: "user-007", name: "山本 大輝", level: "中級", wins: 14, losses: 8 },
  { userId: "user-008", name: "中村 裕子", level: "初級", wins: 5, losses: 9 },
  { userId: "user-009", name: "吉田 恵", level: "中級", wins: 8, losses: 6 },
  { userId: "user-010", name: "松本 翔太", level: "上級", wins: 20, losses: 3 },
];

/* ── Store state ── */

interface StoreState {
  teams: GameTeam[];
  invites: TeamInvite[];
  matches: GameMatch[];
}

function buildInitialState(): StoreState {
  const thisWeek = getISOWeekKey();
  return {
    teams: [
      {
        id: "team-demo-1",
        name: "チーム田中",
        members: [
          { userId: CURRENT_USER, name: "田中 太郎" },
          { userId: "user-002", name: "佐藤 花子" },
        ],
        createdAt: new Date().toISOString(),
        status: "active",
        weekKey: thisWeek,
      },
      {
        id: "team-demo-2",
        name: "チーム鈴木",
        members: [
          { userId: "user-003", name: "鈴木 一郎" },
          { userId: "user-004", name: "高橋 美咲" },
        ],
        createdAt: new Date().toISOString(),
        status: "active",
        weekKey: thisWeek,
      },
      {
        id: "team-demo-3",
        name: "チーム渡辺",
        members: [
          { userId: "user-005", name: "渡辺 健太" },
          { userId: "user-006", name: "伊藤 愛" },
        ],
        createdAt: new Date().toISOString(),
        status: "active",
        weekKey: thisWeek,
      },
    ],
    invites: [
      {
        id: "inv-demo-1",
        fromUserId: "user-007",
        fromUserName: "山本 大輝",
        toUserId: CURRENT_USER,
        toUserName: "田中 太郎",
        teamName: "チーム山本",
        status: "pending",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        weekKey: thisWeek,
      },
    ],
    matches: [
      // An upcoming scheduled match
      {
        id: "match-demo-1",
        weekKey: thisWeek,
        team1Id: "team-demo-1",
        team2Id: "team-demo-2",
        proposedBy: CURRENT_USER,
        scheduledAt: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 2);
          d.setHours(18, 0, 0, 0);
          return d.toISOString();
        })(),
        status: "scheduled",
        createdAt: new Date().toISOString(),
      },
      // A match awaiting the current user's confirmation
      {
        id: "match-demo-2",
        weekKey: thisWeek,
        team1Id: "team-demo-1",
        team2Id: "team-demo-3",
        proposedBy: "user-005",
        scheduledAt: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          d.setHours(19, 0, 0, 0);
          return d.toISOString();
        })(),
        status: "pending_confirmation",
        score1: 6,
        score2: 3,
        winnerId: "team-demo-1",
        submittedBy: "user-005",
        confirmedBy: ["user-005", "user-002"],
        submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

let state: StoreState = buildInitialState();
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
function getSnapshot() { return state; }

/* ── Getters ── */

export function getPlayerPool() { return PLAYER_POOL; }

/* ── Hook ── */

export function useGameStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  /* Teams */

  /** 取用戶目前 active 的所有隊伍（不分週 — 跨週續用，可同時擁有多隊） */
  const getUserTeams = useCallback(() => {
    return data.teams.filter(
      (t) => t.status === "active" && t.members.some((m) => m.userId === CURRENT_USER)
    );
  }, [data.teams]);

  /** 為了相容性：取第一個 active team */
  const getUserTeam = useCallback((_weekKey?: string) => {
    return data.teams.find(
      (t) => t.status === "active" && t.members.some((m) => m.userId === CURRENT_USER)
    );
  }, [data.teams]);

  /** 目前 active 的所有隊伍 — 跨週續用 */
  const getActiveTeams = useCallback((_weekKey?: string) => {
    return data.teams.filter((t) => t.status === "active");
  }, [data.teams]);

  const getTeam = useCallback((teamId: string) => {
    return data.teams.find((t) => t.id === teamId);
  }, [data.teams]);

  const sendInvite = useCallback((toUserId: string, toUserName: string, teamName: string) => {
    const exists = state.invites.some(
      (i) => i.fromUserId === CURRENT_USER && i.toUserId === toUserId && i.status === "pending"
    );
    if (exists) return;
    const inv: TeamInvite = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromUserId: CURRENT_USER,
      fromUserName: "田中 太郎",
      toUserId,
      toUserName,
      teamName,
      status: "pending",
      createdAt: new Date().toISOString(),
      weekKey: getISOWeekKey(),
    };
    state = { ...state, invites: [...state.invites, inv] };
    emit();
    addNotification({
      type: "team_invite" as any,
      title: "チーム招待が届きました",
      message: `田中 太郎さんから「${teamName}」への招待が届きました。`,
    });
  }, []);

  const acceptInvite = useCallback((inviteId: string) => {
    const inv = state.invites.find((i) => i.id === inviteId);
    if (!inv || inv.status !== "pending") return;
    // Create team
    const team: GameTeam = {
      id: `team-${Date.now()}`,
      name: inv.teamName,
      members: [
        { userId: inv.fromUserId, name: inv.fromUserName },
        { userId: inv.toUserId, name: inv.toUserName },
      ],
      createdAt: new Date().toISOString(),
      status: "active",
      weekKey: inv.weekKey,
    };
    state = {
      ...state,
      teams: [...state.teams, team],
      invites: state.invites.map((i) =>
        i.id === inviteId
          ? { ...i, status: "accepted" as InviteStatus }
          : // Cancel other pending invites involving either user in same week
          i.weekKey === inv.weekKey &&
            i.status === "pending" &&
            [inv.fromUserId, inv.toUserId].some((u) => [i.fromUserId, i.toUserId].includes(u))
          ? { ...i, status: "declined" as InviteStatus }
          : i
      ),
    };
    emit();
    addNotification({
      type: "team_invite_accepted" as any,
      title: "チーム招待が承諾されました",
      message: `${inv.toUserName}さんが招待を承諾しました。`,
    });
  }, []);

  const declineInvite = useCallback((inviteId: string) => {
    state = {
      ...state,
      invites: state.invites.map((i) =>
        i.id === inviteId ? { ...i, status: "declined" as InviteStatus } : i
      ),
    };
    emit();
  }, []);

  const cancelSentInvite = useCallback((inviteId: string) => {
    const inv = state.invites.find((i) => i.id === inviteId);
    if (!inv || inv.status !== "pending") return;
    state = {
      ...state,
      invites: state.invites.map((i) =>
        i.id === inviteId ? { ...i, status: "declined" as InviteStatus } : i
      ),
    };
    emit();
  }, []);

  const disbandTeam = useCallback((teamId: string) => {
    const team = state.teams.find((t) => t.id === teamId);
    if (!team) return;
    // Cancel any in-flight matches for this team
    state = {
      ...state,
      teams: state.teams.map((t) => (t.id === teamId ? { ...t, status: "disbanded" as TeamStatus } : t)),
      matches: state.matches.map((m) =>
        (m.team1Id === teamId || m.team2Id === teamId) &&
        (m.status === "proposed" || m.status === "scheduled")
          ? { ...m, status: "cancelled" as MatchStatus, cancelledBy: CURRENT_USER, cancelReason: "チーム解散" }
          : m
      ),
    };
    emit();
    addNotification({
      type: "team_disbanded" as any,
      title: "チームが解散されました",
      message: `${team.name}が解散されました。`,
    });
  }, []);

  const getPendingInvitesForUser = useCallback(() => {
    return data.invites.filter(
      (i) => i.toUserId === CURRENT_USER && i.status === "pending"
    );
  }, [data.invites]);

  const getSentInvitesByUser = useCallback(() => {
    return data.invites.filter(
      (i) => i.fromUserId === CURRENT_USER && i.status === "pending"
    );
  }, [data.invites]);

  /* Matches */

  const getMatch = useCallback((matchId: string) => {
    return data.matches.find((m) => m.id === matchId);
  }, [data.matches]);

  const getMatchesForWeek = useCallback((weekKey: string) => {
    return data.matches.filter((m) => m.weekKey === weekKey);
  }, [data.matches]);

  const getUserMatches = useCallback((weekKey: string) => {
    const myTeams = getUserTeams();
    if (myTeams.length === 0) return [];
    const teamIds = new Set(myTeams.map((t) => t.id));
    return data.matches.filter(
      (m) => m.weekKey === weekKey && (teamIds.has(m.team1Id) || teamIds.has(m.team2Id))
    );
  }, [data.matches, getUserTeams]);

  const proposeMatch = useCallback((fromTeamId: string, toTeamId: string, scheduledAt?: string) => {
    const match: GameMatch = {
      id: `match-${Date.now()}`,
      weekKey: getISOWeekKey(),
      team1Id: fromTeamId,
      team2Id: toTeamId,
      proposedBy: CURRENT_USER,
      scheduledAt,
      status: "proposed",
      createdAt: new Date().toISOString(),
    };
    state = { ...state, matches: [...state.matches, match] };
    emit();
    addNotification({
      type: "match_proposed" as any,
      title: "試合のお誘いが届きました",
      message: "対戦の申込みが届きました。承認または辞退してください。",
      matchId: match.id,
    });
    return match;
  }, []);

  const acceptMatchProposal = useCallback((matchId: string) => {
    state = {
      ...state,
      matches: state.matches.map((m) =>
        m.id === matchId && m.status === "proposed"
          ? { ...m, status: "scheduled" as MatchStatus }
          : m
      ),
    };
    emit();
    addNotification({
      type: "match_accepted" as any,
      title: "試合が承認されました",
      message: "対戦相手が試合を承認しました。",
      matchId,
    });
  }, []);

  const declineMatchProposal = useCallback((matchId: string) => {
    state = {
      ...state,
      matches: state.matches.map((m) =>
        m.id === matchId && m.status === "proposed"
          ? { ...m, status: "declined" as MatchStatus }
          : m
      ),
    };
    emit();
  }, []);

  const cancelMatch = useCallback((matchId: string, reason?: string) => {
    const match = state.matches.find((m) => m.id === matchId);
    if (!match) return;
    state = {
      ...state,
      matches: state.matches.map((m) =>
        m.id === matchId
          ? { ...m, status: "cancelled" as MatchStatus, cancelledBy: CURRENT_USER, cancelReason: reason }
          : m
      ),
    };
    emit();
    // Notify the other team (not self)
    const team1 = state.teams.find((t) => t.id === match.team1Id);
    const team2 = state.teams.find((t) => t.id === match.team2Id);
    [...(team1?.members ?? []), ...(team2?.members ?? [])]
      .filter((m) => m.userId !== CURRENT_USER)
      .forEach(() => {
        addNotification({
          type: "match_cancelled" as any,
          title: "試合がキャンセルされました",
          message: reason ? `理由: ${reason}` : "対戦がキャンセルされました。",
          matchId,
        });
      });
  }, []);

  const submitMatchScore = useCallback((matchId: string, score1: number, score2: number) => {
    const match = state.matches.find((m) => m.id === matchId);
    if (!match) return;
    const winnerId = score1 === score2 ? undefined : score1 > score2 ? match.team1Id : match.team2Id;
    state = {
      ...state,
      matches: state.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              score1,
              score2,
              winnerId,
              status: "pending_confirmation" as MatchStatus,
              submittedBy: CURRENT_USER,
              confirmedBy: [CURRENT_USER],
              submittedAt: new Date().toISOString(),
            }
          : m
      ),
    };
    emit();
    const team1 = state.teams.find((t) => t.id === match.team1Id);
    const team2 = state.teams.find((t) => t.id === match.team2Id);
    [...(team1?.members ?? []), ...(team2?.members ?? [])]
      .filter((m) => m.userId !== CURRENT_USER)
      .forEach(() => {
        addNotification({
          type: "match_confirm_request" as any,
          title: "試合結果の確認が必要です",
          message: `${score1} - ${score2} の試合結果が提出されました。`,
          matchId,
        });
      });
  }, []);

  const confirmMatchScore = useCallback((matchId: string, addXpAndPoints: (xp: number, points: number) => void) => {
    const match = state.matches.find((m) => m.id === matchId);
    if (!match || match.status !== "pending_confirmation") return;
    const already = match.confirmedBy ?? [];
    if (already.includes(CURRENT_USER)) return;
    const nextConfirmed = [...already, CURRENT_USER];

    const team1 = state.teams.find((t) => t.id === match.team1Id);
    const team2 = state.teams.find((t) => t.id === match.team2Id);
    const allMembers = [...(team1?.members ?? []), ...(team2?.members ?? [])];
    const allIds = allMembers.map((m) => m.userId);
    const allAgreed = allIds.every((id) => nextConfirmed.includes(id));

    state = {
      ...state,
      matches: state.matches.map((m) =>
        m.id === matchId
          ? { ...m, confirmedBy: nextConfirmed, status: allAgreed ? ("completed" as MatchStatus) : m.status }
          : m
      ),
    };
    emit();

    if (allAgreed && allIds.includes(CURRENT_USER) && match.winnerId) {
      const winnerTeam = match.winnerId === match.team1Id ? team1 : team2;
      const isWinner = !!winnerTeam?.members.some((m) => m.userId === CURRENT_USER);
      addXpAndPoints(isWinner ? WIN_XP : LOSE_XP, isWinner ? WIN_POINTS : LOSE_POINTS);
      addNotification({
        type: "match_settled" as any,
        title: isWinner ? "勝利おめでとうございます！" : "試合完了",
        message: `XP +${isWinner ? WIN_XP : LOSE_XP} / ポイント +${isWinner ? WIN_POINTS : LOSE_POINTS}pt を獲得`,
        matchId,
      });
    }
  }, []);

  const disputeMatchScore = useCallback((matchId: string) => {
    const match = state.matches.find((m) => m.id === matchId);
    if (!match) return;
    const team1 = state.teams.find((t) => t.id === match.team1Id);
    const team2 = state.teams.find((t) => t.id === match.team2Id);
    const disputer = [...(team1?.members ?? []), ...(team2?.members ?? [])].find((m) => m.userId === CURRENT_USER);
    state = {
      ...state,
      matches: state.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              status: "scheduled" as MatchStatus,
              score1: undefined,
              score2: undefined,
              winnerId: undefined,
              submittedBy: undefined,
              confirmedBy: [],
              submittedAt: undefined,
              disputedBy: CURRENT_USER,
              disputedAt: new Date().toISOString(),
            }
          : m
      ),
    };
    emit();
    [...(team1?.members ?? []), ...(team2?.members ?? [])]
      .filter((m) => m.userId !== CURRENT_USER)
      .forEach(() => {
        addNotification({
          type: "match_disputed" as any,
          title: "試合結果に異議あり",
          message: `${disputer?.name ?? "対戦者"}さんが異議を申立てました。再入力が必要です。`,
          matchId,
        });
      });
  }, []);

  const notifyOpponentAboutBooking = useCallback((matchId: string, bookingId: string) => {
    const match = state.matches.find((m) => m.id === matchId);
    if (!match) return;
    state = {
      ...state,
      matches: state.matches.map((m) =>
        m.id === matchId ? { ...m, notifiedOpponent: true, manualCourtBookingId: bookingId } : m
      ),
    };
    emit();
    const team1 = state.teams.find((t) => t.id === match.team1Id);
    const team2 = state.teams.find((t) => t.id === match.team2Id);
    [...(team1?.members ?? []), ...(team2?.members ?? [])]
      .filter((m) => m.userId !== CURRENT_USER)
      .forEach(() => {
        addNotification({
          type: "match_venue_booked" as any,
          title: "試合の場地が予約されました",
          message: "対戦相手が場地を予約しました。詳細を確認してください。",
          matchId,
        });
      });
  }, []);

  const replacePartner = useCallback((oldTeamId: string, newUserId: string, newUserName: string) => {
    const oldTeam = state.teams.find((t) => t.id === oldTeamId);
    if (!oldTeam) return;
    // Disband old team (also cancels in-flight matches)
    state = {
      ...state,
      teams: state.teams.map((t) => (t.id === oldTeamId ? { ...t, status: "disbanded" as TeamStatus } : t)),
      matches: state.matches.map((m) =>
        (m.team1Id === oldTeamId || m.team2Id === oldTeamId) &&
        (m.status === "proposed" || m.status === "scheduled")
          ? { ...m, status: "cancelled" as MatchStatus, cancelledBy: CURRENT_USER, cancelReason: "メンバー変更" }
          : m
      ),
    };
    emit();
    // Send invite to new partner
    const inv: TeamInvite = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromUserId: CURRENT_USER,
      fromUserName: "田中 太郎",
      toUserId: newUserId,
      toUserName: newUserName,
      teamName: oldTeam.name,
      status: "pending",
      createdAt: new Date().toISOString(),
      weekKey: getISOWeekKey(),
    };
    state = { ...state, invites: [...state.invites, inv] };
    emit();
    addNotification({
      type: "team_invite" as any,
      title: "チーム招待が届きました",
      message: `田中 太郎さんから「${oldTeam.name}」への招待が届きました。`,
    });
  }, []);

  /** 自動對映：查找覆蓋 match.scheduledAt 時段的 booking */
  const getMatchedBookingForMatch = useCallback((match: GameMatch): StoredBooking | undefined => {
    if (match.manualCourtBookingId) {
      const b = getBookings().find((b) => b.id === match.manualCourtBookingId);
      if (b) return b;
    }
    if (!match.scheduledAt) return undefined;
    const matchDate = new Date(match.scheduledAt);
    const matchDateStr = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, "0")}-${String(matchDate.getDate()).padStart(2, "0")}`;
    const matchHM = matchDate.getHours() * 60 + matchDate.getMinutes();
    return getBookings().find((b) => {
      if (b.type !== "court" || b.status !== "upcoming") return false;
      if (b.date !== matchDateStr) return false;
      if (!b.startTime || !b.endTime) return false;
      const [sh, sm] = b.startTime.split(":").map(Number);
      const [eh, em] = b.endTime.split(":").map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return matchHM >= start && matchHM < end;
    });
  }, []);

  /* Weekly ranking — computed */

  const getWeeklyRanking = useCallback((weekKey: string) => {
    // For demo: previous week always returns mock data
    if (weekKey === getPreviousWeekKey()) {
      return [...MOCK_PREV_WEEK_RANKING].sort((a, b) => b.xp - a.xp || b.wins - a.wins);
    }
    const completed = data.matches.filter(
      (m) => m.weekKey === weekKey && m.status === "completed" && m.winnerId
    );
    const teamStats = new Map<string, { wins: number; losses: number; xp: number; points: number }>();
    completed.forEach((m) => {
      const loserId = m.winnerId === m.team1Id ? m.team2Id : m.team1Id;
      const w = teamStats.get(m.winnerId!) ?? { wins: 0, losses: 0, xp: 0, points: 0 };
      w.wins += 1;
      w.xp += WIN_XP;
      w.points += WIN_POINTS;
      teamStats.set(m.winnerId!, w);
      const l = teamStats.get(loserId) ?? { wins: 0, losses: 0, xp: 0, points: 0 };
      l.losses += 1;
      l.xp += LOSE_XP;
      l.points += LOSE_POINTS;
      teamStats.set(loserId, l);
    });
    return [...teamStats.entries()]
      .map(([teamId, stats]) => {
        const team = data.teams.find((t) => t.id === teamId);
        return { teamId, teamName: team?.name ?? "Unknown", ...stats };
      })
      .sort((a, b) => b.xp - a.xp || b.wins - a.wins);
  }, [data.matches, data.teams]);

  /** 查找用戶 scheduled 比賽，時段與給定 booking 匹配 */
  const findSchedulableMatchForBooking = useCallback((booking: StoredBooking): GameMatch | undefined => {
    if (booking.type !== "court" || !booking.date || !booking.startTime || !booking.endTime) return undefined;
    const myTeam = getUserTeam();
    if (!myTeam) return undefined;
    const [sh, sm] = booking.startTime.split(":").map(Number);
    const [eh, em] = booking.endTime.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return data.matches.find((m) => {
      if (m.status !== "scheduled") return false;
      if (m.team1Id !== myTeam.id && m.team2Id !== myTeam.id) return false;
      if (!m.scheduledAt) return false;
      const d = new Date(m.scheduledAt);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (ds !== booking.date) return false;
      const hm = d.getHours() * 60 + d.getMinutes();
      return hm >= start && hm < end;
    });
  }, [data.matches, getUserTeam]);

  return {
    ...data,
    // teams
    getUserTeam,
    getUserTeams,
    getActiveTeams,
    getTeam,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelSentInvite,
    disbandTeam,
    replacePartner,
    getPendingInvitesForUser,
    getSentInvitesByUser,
    // matches
    getMatch,
    getMatchesForWeek,
    getUserMatches,
    proposeMatch,
    acceptMatchProposal,
    declineMatchProposal,
    cancelMatch,
    submitMatchScore,
    confirmMatchScore,
    disputeMatchScore,
    notifyOpponentAboutBooking,
    getMatchedBookingForMatch,
    findSchedulableMatchForBooking,
    // ranking
    getWeeklyRanking,
  };
}
