import { useCallback, useSyncExternalStore } from "react";
import { addNotification } from "@/lib/notificationStore";
import { CURRENT_USER, getPlayer, type SkillLevel } from "@/lib/tournamentStore";

export type PostedMatchStatus = "open" | "filled" | "completed" | "cancelled";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface MatchApplication {
  id: string;
  applicantUserId: string;
  appliedAt: string;
  status: ApplicationStatus;
  rejectedReason?: string;
}

export interface LeagueMatchResult {
  side1UserIds: [string, string];   // 2-player pair
  side2UserIds: [string, string];   // 2-player pair
  winnerSide: 1 | 2;
  score: string;                    // e.g. "6-3"
  hostSubmittedAt: string;
  venueConfirmedAt?: string;
}

export interface PostedMatch {
  id: string;
  hostUserId: string;
  desiredDate: string;            // ISO
  preferredVenue: string;
  description?: string;
  desiredSkillLevel?: SkillLevel; // 希望のレベル
  applications: MatchApplication[];
  status: PostedMatchStatus;
  result?: LeagueMatchResult;
  createdAt: string;
  cancelledAt?: string;
  cancelledReason?: string;
}

interface StoreState {
  postedMatches: PostedMatch[];
}

function buildInitialState(): StoreState {
  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 86400000).toISOString();
  const in5days = new Date(now.getTime() + 5 * 86400000).toISOString();
  const in7days = new Date(now.getTime() + 7 * 86400000).toISOString();

  return {
    postedMatches: [
      // State 1: user-001 hosts, has 2 pending applicants (user is HOST)
      {
        id: "lm-1",
        hostUserId: CURRENT_USER,
        desiredDate: in3days,
        preferredVenue: "LST 本店コートB",
        description: "土曜午後にダブルスを楽しみたい方を募集しています。中級〜上級レベル歓迎。",
        desiredSkillLevel: "intermediate",
        applications: [
          {
            id: "app-1-1",
            applicantUserId: "user-005",
            appliedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
            status: "pending",
          },
          {
            id: "app-1-2",
            applicantUserId: "user-007",
            appliedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
            status: "pending",
          },
        ],
        status: "open",
        createdAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
      },
      // State 2: someone else hosts, user-001 applied (status pending)
      {
        id: "lm-2",
        hostUserId: "user-002",
        desiredDate: in5days,
        preferredVenue: "LST 西支店コート1",
        description: "金曜の夜の部で軽くダブルスをやりませんか？仕事帰りでも参加可能。",
        desiredSkillLevel: "intermediate",
        applications: [
          {
            id: "app-2-1",
            applicantUserId: CURRENT_USER,
            appliedAt: new Date(now.getTime() - 6 * 3600000).toISOString(),
            status: "pending",
          },
          {
            id: "app-2-2",
            applicantUserId: "user-006",
            appliedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
            status: "approved",
          },
        ],
        status: "open",
        createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      },
      // State 3: someone else hosts, user-001 NOT applied (browse-only)
      {
        id: "lm-3",
        hostUserId: "user-006",
        desiredDate: in7days,
        preferredVenue: "LST 本店コートA",
        description: "上級者向けダブルス。本気で勝負したい方どうぞ。",
        desiredSkillLevel: "advanced",
        applications: [
          {
            id: "app-3-1",
            applicantUserId: "user-003",
            appliedAt: new Date(now.getTime() - 10 * 3600000).toISOString(),
            status: "approved",
          },
        ],
        status: "open",
        createdAt: new Date(now.getTime() - 18 * 3600000).toISOString(),
      },
    ],
  };
}

let state: StoreState = buildInitialState();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

/* Hook */

export function useLeagueMatchBoardStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  const getPostedMatch = useCallback((id: string) => {
    return data.postedMatches.find((m) => m.id === id);
  }, [data.postedMatches]);

  const getOpenMatches = useCallback(() => {
    return data.postedMatches
      .filter((m) => m.status === "open" || m.status === "filled")
      .sort((a, b) => a.desiredDate.localeCompare(b.desiredDate));
  }, [data.postedMatches]);

  const getMyHostedMatches = useCallback(() => {
    return data.postedMatches.filter((m) => m.hostUserId === CURRENT_USER);
  }, [data.postedMatches]);

  const getMyApplications = useCallback(() => {
    const result: { match: PostedMatch; application: MatchApplication }[] = [];
    for (const m of data.postedMatches) {
      const app = m.applications.find((a) => a.applicantUserId === CURRENT_USER);
      if (app) result.push({ match: m, application: app });
    }
    return result;
  }, [data.postedMatches]);

  const createPostedMatch = useCallback((input: {
    desiredDate: string;
    preferredVenue: string;
    description?: string;
    desiredSkillLevel?: SkillLevel;
  }): { ok: boolean; id?: string; error?: string } => {
    const id = `lm-${Date.now()}`;
    const newMatch: PostedMatch = {
      id,
      hostUserId: CURRENT_USER,
      desiredDate: input.desiredDate,
      preferredVenue: input.preferredVenue,
      description: input.description,
      desiredSkillLevel: input.desiredSkillLevel,
      applications: [],
      status: "open",
      createdAt: new Date().toISOString(),
    };
    state = {
      ...state,
      postedMatches: [newMatch, ...state.postedMatches],
    };
    emit();
    return { ok: true, id };
  }, []);

  const applyToMatch = useCallback((matchId: string): { ok: boolean; error?: string } => {
    const m = state.postedMatches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: "募集が見つかりません" };
    if (m.status !== "open") return { ok: false, error: "募集が締切られています" };
    if (m.hostUserId === CURRENT_USER) return { ok: false, error: "自分の募集には応募できません" };
    if (m.applications.some((a) => a.applicantUserId === CURRENT_USER)) {
      return { ok: false, error: "既に応募済みです" };
    }
    const application: MatchApplication = {
      id: `app-${Date.now()}`,
      applicantUserId: CURRENT_USER,
      appliedAt: new Date().toISOString(),
      status: "pending",
    };
    state = {
      ...state,
      postedMatches: state.postedMatches.map((x) =>
        x.id === matchId ? { ...x, applications: [...x.applications, application] } : x
      ),
    };
    emit();
    addNotification({
      type: "league_match_application_received",
      title: "リーグ試合への応募が届きました",
      message: `${getPlayer(CURRENT_USER)?.name ?? "—"}さんから「${m.description ?? m.preferredVenue}」への参加申し込みがあります。`,
      postedMatchId: m.id,
    });
    return { ok: true };
  }, []);

  const approveApplication = useCallback((matchId: string, applicationId: string): { ok: boolean; error?: string } => {
    const m = state.postedMatches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: "募集が見つかりません" };
    if (m.hostUserId !== CURRENT_USER) return { ok: false, error: "ホストのみ承認できます" };
    const approvedCount = m.applications.filter((a) => a.status === "approved").length;
    if (approvedCount >= 3) return { ok: false, error: "既に4名揃っています" };

    let approvedApplicantId: string | undefined;
    state = {
      ...state,
      postedMatches: state.postedMatches.map((x) => {
        if (x.id !== matchId) return x;
        const updated = x.applications.map((a) => {
          if (a.id !== applicationId) return a;
          if (a.status !== "pending") return a;
          approvedApplicantId = a.applicantUserId;
          return { ...a, status: "approved" as ApplicationStatus };
        });
        const newApprovedCount = updated.filter((a) => a.status === "approved").length;
        return {
          ...x,
          applications: updated,
          status: newApprovedCount >= 3 ? "filled" : x.status,
        };
      }),
    };
    if (!approvedApplicantId) return { ok: false, error: "申し込みが見つかりません" };
    emit();
    addNotification({
      type: "league_match_application_approved",
      title: "リーグ試合の参加が承認されました",
      message: `${getPlayer(m.hostUserId)?.name ?? "—"}さんが「${m.description ?? m.preferredVenue}」への参加を承認しました。`,
      postedMatchId: m.id,
    });

    // Check if filled
    const updatedMatch = state.postedMatches.find((x) => x.id === matchId);
    if (updatedMatch?.status === "filled") {
      addNotification({
        type: "league_match_filled",
        title: "リーグ試合が成立しました",
        message: `「${m.description ?? m.preferredVenue}」のメンバーが揃いました。試合当日はコートでお会いしましょう。`,
        postedMatchId: m.id,
      });
    }
    return { ok: true };
  }, []);

  const rejectApplication = useCallback((matchId: string, applicationId: string, reason?: string): { ok: boolean; error?: string } => {
    const m = state.postedMatches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: "募集が見つかりません" };
    if (m.hostUserId !== CURRENT_USER) return { ok: false, error: "ホストのみ却下できます" };
    state = {
      ...state,
      postedMatches: state.postedMatches.map((x) =>
        x.id === matchId
          ? {
              ...x,
              applications: x.applications.map((a) =>
                a.id === applicationId ? { ...a, status: "rejected" as ApplicationStatus, rejectedReason: reason } : a
              ),
            }
          : x
      ),
    };
    emit();
    addNotification({
      type: "league_match_application_rejected",
      title: "リーグ試合の応募が却下されました",
      message: `「${m.description ?? m.preferredVenue}」への応募が却下されました。`,
      postedMatchId: m.id,
    });
    return { ok: true };
  }, []);

  const cancelPostedMatch = useCallback((matchId: string, reason?: string): { ok: boolean; error?: string } => {
    const m = state.postedMatches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: "募集が見つかりません" };
    if (m.hostUserId !== CURRENT_USER) return { ok: false, error: "ホストのみキャンセルできます" };
    state = {
      ...state,
      postedMatches: state.postedMatches.map((x) =>
        x.id === matchId
          ? { ...x, status: "cancelled" as PostedMatchStatus, cancelledAt: new Date().toISOString(), cancelledReason: reason }
          : x
      ),
    };
    emit();
    addNotification({
      type: "league_match_cancelled",
      title: "リーグ試合がキャンセルされました",
      message: `「${m.description ?? m.preferredVenue}」がキャンセルされました。${reason ? `理由：${reason}` : ""}`,
      postedMatchId: m.id,
    });
    return { ok: true };
  }, []);

  const submitMatchScore = useCallback((matchId: string, result: Omit<LeagueMatchResult, "hostSubmittedAt" | "venueConfirmedAt">): { ok: boolean; error?: string } => {
    const m = state.postedMatches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: "募集が見つかりません" };
    if (m.hostUserId !== CURRENT_USER) return { ok: false, error: "ホストのみ比分入力できます" };
    if (m.status !== "filled") return { ok: false, error: "試合がまだ成立していません" };

    state = {
      ...state,
      postedMatches: state.postedMatches.map((x) =>
        x.id === matchId
          ? {
              ...x,
              result: { ...result, hostSubmittedAt: new Date().toISOString() },
            }
          : x
      ),
    };
    emit();
    addNotification({
      type: "league_score_submitted",
      title: "比分が入力されました",
      message: `「${m.description ?? m.preferredVenue}」の比分が入力されました。場館の確認をお待ちください。`,
      postedMatchId: m.id,
    });
    return { ok: true };
  }, []);

  /** DEMO: simulate venue staff approving the score */
  const venueConfirmScore = useCallback((matchId: string): { ok: boolean; error?: string } => {
    const m = state.postedMatches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: "募集が見つかりません" };
    if (!m.result) return { ok: false, error: "比分がまだ入力されていません" };
    if (m.result.venueConfirmedAt) return { ok: false, error: "既に確認済みです" };

    state = {
      ...state,
      postedMatches: state.postedMatches.map((x) =>
        x.id === matchId
          ? {
              ...x,
              status: "completed" as PostedMatchStatus,
              result: { ...x.result!, venueConfirmedAt: new Date().toISOString() },
            }
          : x
      ),
    };
    emit();
    addNotification({
      type: "league_score_confirmed",
      title: "比分が確定しました",
      message: `「${m.description ?? m.preferredVenue}」の比分が確定しました。`,
      postedMatchId: m.id,
    });
    return { ok: true };
  }, []);

  return {
    ...data,
    getPostedMatch,
    getOpenMatches,
    getMyHostedMatches,
    getMyApplications,
    createPostedMatch,
    applyToMatch,
    approveApplication,
    rejectApplication,
    cancelPostedMatch,
    submitMatchScore,
    venueConfirmScore,
  };
}
