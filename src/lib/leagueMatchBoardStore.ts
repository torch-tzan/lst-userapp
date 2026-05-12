import { useCallback, useSyncExternalStore } from "react";
import { addNotification } from "@/lib/notificationStore";
import {
  CURRENT_USER,
  getPlayer,
  applyRatingDelta,
  computeRatingDelta,
  PP_LEAGUE_MATCH_WIN,
  type SkillLevel,
} from "@/lib/tournamentStore";
import {
  createGroupThread,
  addParticipantToThread,
} from "@/lib/messageStore";

export type PostedMatchStatus = "open" | "filled" | "completed" | "cancelled";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "withdrawn";

export interface MatchApplication {
  id: string;
  applicantUserId: string;
  appliedAt: string;
  status: ApplicationStatus;
  rejectedReason?: string;
}

export interface MatchScoreApproval {
  userId: string;
  approvedAt: string;
}

export interface LeagueMatchResult {
  side1UserIds: [string, string];   // 2-player pair
  side2UserIds: [string, string];   // 2-player pair
  winnerSide: 1 | 2;
  score: string;                    // e.g. "6-3"
  hostSubmittedAt: string;
  approvals: MatchScoreApproval[];  // 4-of-4 batch approval; host auto-included
  completedAt?: string;             // set when approvals.length === 4
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
  threadId?: string;              // group chat thread created on post
}

/**
 * Format ISO date for thread title / system messages: "M/D HH:mm".
 */
function formatMatchTitle(iso: string, venue: string): string {
  const d = new Date(iso);
  const date = `${d.getMonth() + 1}/${d.getDate()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  // Strip a leading "LST " brand prefix so chat titles stay compact.
  const shortVenue = venue.replace(/^LST\s+/, "");
  return `${date} ${time} ${shortVenue}`;
}

/**
 * Sum PP_LEAGUE_MATCH_WIN across every completed league match this user won.
 * Pure helper — caller passes in match list to avoid hook-in-thunk issues.
 */
export function computeLeaguePP(userId: string, postedMatches: PostedMatch[]): number {
  let total = 0;
  for (const m of postedMatches) {
    if (m.status !== "completed" || !m.result) continue;
    const onSide1 = m.result.side1UserIds.includes(userId);
    const onSide2 = m.result.side2UserIds.includes(userId);
    if (!onSide1 && !onSide2) continue;
    const isWin = (onSide1 && m.result.winnerSide === 1) || (onSide2 && m.result.winnerSide === 2);
    if (isWin) total += PP_LEAGUE_MATCH_WIN;
  }
  return total;
}

interface StoreState {
  postedMatches: PostedMatch[];
}

function buildInitialState(): StoreState {
  const now = new Date();
  // ISO at given day-offset and hour-of-day relative to today.
  const dayAt = (offsetDays: number, hour: number): string => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, hour, 0);
    return d.toISOString();
  };
  const hoursAgo = (h: number): string => new Date(now.getTime() - h * 3600000).toISOString();

  return {
    postedMatches: [
      // ── L0: joinable recruit (CURRENT_USER not host, not applied). ──
      {
        id: "lm-0",
        hostUserId: "user-009",
        desiredDate: dayAt(7, 19), // next week 19:00
        preferredVenue: "パデルコート広島 コートA",
        description: "中級ダブルス募集中。仕事帰りに楽しくプレーしましょう！",
        desiredSkillLevel: "intermediate",
        applications: [
          { id: "app-0-1", applicantUserId: "user-012", appliedAt: hoursAgo(3), status: "pending" },
        ],
        status: "open",
        createdAt: hoursAgo(12),
        threadId: "thread-league-match-lm-0",
      },

      // ── L1: open recruit, future. CURRENT_USER has applied (pending). ──
      {
        id: "lm-1",
        hostUserId: "user-002",
        desiredDate: dayAt(12, 21), // ~5/25 21:00
        preferredVenue: "北広島パデルクラブ コートB",
        description: "金曜の夜の部で軽くダブルスをやりませんか？仕事帰りでも参加可能。",
        desiredSkillLevel: "intermediate",
        applications: [
          { id: "app-1-1", applicantUserId: CURRENT_USER, appliedAt: hoursAgo(8), status: "pending" },
          { id: "app-1-2", applicantUserId: "user-006", appliedAt: hoursAgo(4), status: "pending" },
        ],
        status: "open",
        createdAt: hoursAgo(24),
        threadId: "thread-league-match-lm-1",
      },

      // ── L2: joined + chat. CURRENT_USER is approved member. Filled. No score yet. ──
      {
        id: "lm-2",
        hostUserId: "user-003",
        desiredDate: dayAt(2, 18), // ~5/15 18:00
        preferredVenue: "広島中央スポーツ コートC",
        description: "今週末ダブルス組みましょう。本気度高めで！",
        desiredSkillLevel: "advanced",
        applications: [
          { id: "app-2-1", applicantUserId: CURRENT_USER, appliedAt: hoursAgo(30), status: "approved" },
          { id: "app-2-2", applicantUserId: "user-007", appliedAt: hoursAgo(28), status: "approved" },
          { id: "app-2-3", applicantUserId: "user-002", appliedAt: hoursAgo(26), status: "approved" },
        ],
        status: "filled",
        createdAt: hoursAgo(36),
        threadId: "thread-league-match-lm-2",
      },

      // ── L3: CURRENT_USER hosts, all 4 filled, score input pending. ──
      {
        id: "lm-3",
        hostUserId: CURRENT_USER,
        desiredDate: dayAt(-1, 20), // ~5/12 20:00 (yesterday)
        preferredVenue: "パデルコート広島 コートA",
        description: "中級ダブルス。仲良くプレーしましょう。",
        desiredSkillLevel: "intermediate",
        applications: [
          { id: "app-3-1", applicantUserId: "user-005", appliedAt: hoursAgo(40), status: "approved" },
          { id: "app-3-2", applicantUserId: "user-007", appliedAt: hoursAgo(38), status: "approved" },
          { id: "app-3-3", applicantUserId: "user-002", appliedAt: hoursAgo(36), status: "approved" },
        ],
        status: "filled",
        createdAt: hoursAgo(60),
        threadId: "thread-league-match-lm-3",
      },

      // ── L4: score submitted, CURRENT_USER needs to approve (2/4 done). ──
      {
        id: "lm-4",
        hostUserId: "user-005",
        desiredDate: dayAt(-3, 19), // ~5/10 19:00
        preferredVenue: "北広島パデルクラブ コートB",
        description: "週末リーグマッチ。スコア入力済み、皆さん確認お願いします。",
        desiredSkillLevel: "intermediate",
        applications: [
          { id: "app-4-1", applicantUserId: CURRENT_USER, appliedAt: hoursAgo(96), status: "approved" },
          { id: "app-4-2", applicantUserId: "user-007", appliedAt: hoursAgo(94), status: "approved" },
          { id: "app-4-3", applicantUserId: "user-002", appliedAt: hoursAgo(92), status: "approved" },
        ],
        status: "filled",
        createdAt: hoursAgo(120),
        threadId: "thread-league-match-lm-4",
        result: {
          side1UserIds: [CURRENT_USER, "user-007"],
          side2UserIds: ["user-005", "user-002"],
          winnerSide: 1,
          score: "6-3",
          hostSubmittedAt: hoursAgo(6),
          // Host + one other have approved; CURRENT_USER still needs to.
          approvals: [
            { userId: "user-005", approvedAt: hoursAgo(6) },
            { userId: "user-002", approvedAt: hoursAgo(4) },
          ],
        },
      },

      // ── L5: completed match. CURRENT_USER on side1, side1 won. ──
      {
        id: "lm-5",
        hostUserId: "user-006",
        desiredDate: dayAt(-5, 18), // ~5/8 18:00
        preferredVenue: "広島中央スポーツ コートC",
        description: "先週のダブルス。みんなで楽しめました。",
        desiredSkillLevel: "advanced",
        applications: [
          { id: "app-5-1", applicantUserId: CURRENT_USER, appliedAt: hoursAgo(160), status: "approved" },
          { id: "app-5-2", applicantUserId: "user-003", appliedAt: hoursAgo(158), status: "approved" },
          { id: "app-5-3", applicantUserId: "user-007", appliedAt: hoursAgo(156), status: "approved" },
        ],
        status: "completed",
        createdAt: hoursAgo(200),
        threadId: "thread-league-match-lm-5",
        result: {
          side1UserIds: [CURRENT_USER, "user-006"],
          side2UserIds: ["user-003", "user-007"],
          winnerSide: 1,
          score: "6-4 / 6-3",
          hostSubmittedAt: hoursAgo(100),
          approvals: [
            { userId: "user-006", approvedAt: hoursAgo(100) },
            { userId: CURRENT_USER, approvedAt: hoursAgo(98) },
            { userId: "user-003", approvedAt: hoursAgo(96) },
            { userId: "user-007", approvedAt: hoursAgo(94) },
          ],
          completedAt: hoursAgo(94),
        },
      },

      // ── L6: cancelled match (CURRENT_USER hosted, then cancelled). ──
      {
        id: "lm-6",
        hostUserId: CURRENT_USER,
        desiredDate: dayAt(4, 20), // ~5/17 20:00 (future, but cancelled)
        preferredVenue: "広島中央スポーツ コートC",
        description: "週末ダブルス予定でしたが、急用で中止します。すみません！",
        desiredSkillLevel: "intermediate",
        applications: [
          { id: "app-6-1", applicantUserId: "user-005", appliedAt: hoursAgo(48), status: "approved" },
        ],
        status: "cancelled",
        createdAt: hoursAgo(72),
        cancelledAt: hoursAgo(24),
        cancelledReason: "急用で出席できなくなりました",
        threadId: "thread-league-match-lm-6",
      },
    ],
  };
}

/**
 * Seed group chat threads for the demo matches. Idempotent — createGroupThread
 * returns existing thread if linkedEntity matches, so HMR / reload is safe.
 */
function seedDemoThreads(matches: PostedMatch[]): void {
  const nowStr = () => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  for (const m of matches) {
    if (!m.threadId) continue;
    const host = getPlayer(m.hostUserId);
    if (!host) continue;
    const approvedApplicants = m.applications
      .filter((a) => a.status === "approved")
      .map((a) => getPlayer(a.applicantUserId))
      .filter((p): p is NonNullable<typeof p> => !!p);

    const participants = [
      { userId: host.userId, name: host.name, role: "host" as const },
      ...approvedApplicants.map((p) => ({ userId: p.userId, name: p.name, role: "participant" as const })),
    ];

    const title = formatMatchTitle(m.desiredDate, m.preferredVenue);

    // For L2 (lm-2) add some demo chat history so user sees a populated group thread.
    const initialMessages =
      m.id === "lm-2"
        ? [
            { id: "demo-lm-2-1", sender: "user" as const, text: "皆さんよろしくお願いします！", time: nowStr() },
            { id: "demo-lm-2-2", sender: "system" as const, text: `${getPlayer("user-007")?.name ?? "—"} さんが参加しました`, time: nowStr() },
            { id: "demo-lm-2-3", sender: "user" as const, text: "コート確保しました。広島中央スポーツ コートC、18:00 集合でお願いします。", time: nowStr() },
            { id: "demo-lm-2-4", sender: "system" as const, text: `${getPlayer("user-002")?.name ?? "—"} さんが参加しました`, time: nowStr() },
          ]
        : undefined;

    createGroupThread({
      linkedEntityType: "league-match",
      linkedEntityId: m.id,
      title,
      participants,
      initialSystemMessage: `${host.name}さんが「${title}」を募集しました。`,
      initialMessages,
    });
  }
}

let state: StoreState = buildInitialState();
// Hydrate demo group chats lazily (next tick so messageStore is ready in test envs).
if (typeof window !== "undefined") {
  seedDemoThreads(state.postedMatches);
}
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
    const host = getPlayer(CURRENT_USER);
    const title = formatMatchTitle(input.desiredDate, input.preferredVenue);

    // Create group chat thread up front; host is the sole initial participant.
    const thread = createGroupThread({
      linkedEntityType: "league-match",
      linkedEntityId: id,
      title,
      participants: host
        ? [{ userId: host.userId, name: host.name, role: "host" }]
        : [],
      initialSystemMessage: `${host?.name ?? "ホスト"}さんが「${title}」を募集しました。参加者が承認されるとここに集まります。`,
    });

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
      threadId: thread.id,
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

    // Add approved applicant to the match's group chat thread.
    if (m.threadId) {
      const applicant = getPlayer(approvedApplicantId);
      if (applicant) {
        addParticipantToThread(m.threadId, {
          userId: applicant.userId,
          name: applicant.name,
          role: "participant",
        });
      }
    }

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

  /**
   * Current user (non-host) withdraws their participation.
   * - pending app → marked "withdrawn"
   * - approved app on a still-cancellable match → marked "withdrawn"; if the match
   *   was "filled" and approved count drops below 3, status reverts to "open".
   */
  const withdrawFromMatch = useCallback((matchId: string): { ok: boolean; error?: string } => {
    const m = state.postedMatches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: "募集が見つかりません" };
    if (m.hostUserId === CURRENT_USER) return { ok: false, error: "ホストは募集取消メニューを使ってください" };
    if (m.result) return { ok: false, error: "比分が入力されているため取消できません" };
    if (m.status === "completed" || m.status === "cancelled")
      return { ok: false, error: "この試合は終了しています" };

    const app = m.applications.find((a) => a.applicantUserId === CURRENT_USER);
    if (!app) return { ok: false, error: "応募していません" };
    if (app.status === "rejected" || app.status === "withdrawn")
      return { ok: false, error: "既に取消済みです" };

    state = {
      ...state,
      postedMatches: state.postedMatches.map((x) => {
        if (x.id !== matchId) return x;
        const updated = x.applications.map((a) =>
          a.id === app.id ? { ...a, status: "withdrawn" as ApplicationStatus } : a,
        );
        const approvedCount = updated.filter((a) => a.status === "approved").length;
        const newStatus =
          x.status === "filled" && approvedCount < 3 ? ("open" as PostedMatchStatus) : x.status;
        return { ...x, applications: updated, status: newStatus };
      }),
    };
    emit();
    addNotification({
      type: "league_match_application_withdrawn",
      title: "リーグ試合の参加が取消されました",
      message: `${getPlayer(CURRENT_USER)?.name ?? "—"}さんが「${m.description ?? m.preferredVenue}」への参加を取り消しました。`,
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

  const submitMatchScore = useCallback((
    matchId: string,
    result: Omit<LeagueMatchResult, "hostSubmittedAt" | "approvals" | "completedAt">,
  ): { ok: boolean; error?: string } => {
    const m = state.postedMatches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: "募集が見つかりません" };
    if (m.hostUserId !== CURRENT_USER) return { ok: false, error: "ホストのみ比分入力できます" };
    if (m.status !== "filled") return { ok: false, error: "試合がまだ成立していません" };

    const nowIso = new Date().toISOString();
    state = {
      ...state,
      postedMatches: state.postedMatches.map((x) =>
        x.id === matchId
          ? {
              ...x,
              result: {
                ...result,
                hostSubmittedAt: nowIso,
                // Host auto-approves their own submission.
                approvals: [{ userId: CURRENT_USER, approvedAt: nowIso }],
              },
            }
          : x
      ),
    };
    emit();
    addNotification({
      type: "league_score_submitted",
      title: "比分が入力されました",
      message: `「${m.description ?? m.preferredVenue}」の比分が入力されました。参加者全員の承認をお待ちください。`,
      postedMatchId: m.id,
    });
    return { ok: true };
  }, []);

  /**
   * Current user approves the submitted score. When all 4 participants
   * (host + 3 others on side1+side2) have approved, the match completes
   * and ratings + PP are written.
   */
  const approveMatchScore = useCallback((matchId: string): { ok: boolean; error?: string } => {
    const m = state.postedMatches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: "募集が見つかりません" };
    if (!m.result) return { ok: false, error: "比分がまだ入力されていません" };
    if (m.result.completedAt) return { ok: false, error: "既に完了済みです" };

    const allFour = [...m.result.side1UserIds, ...m.result.side2UserIds];
    if (!allFour.includes(CURRENT_USER)) {
      return { ok: false, error: "この試合の参加者ではありません" };
    }
    if (m.result.approvals.some((a) => a.userId === CURRENT_USER)) {
      return { ok: false, error: "既に承認済みです" };
    }

    const nowIso = new Date().toISOString();
    const updatedApprovals = [...m.result.approvals, { userId: CURRENT_USER, approvedAt: nowIso }];
    const isCompleted = allFour.every((u) => updatedApprovals.some((a) => a.userId === u));

    state = {
      ...state,
      postedMatches: state.postedMatches.map((x) =>
        x.id === matchId
          ? {
              ...x,
              status: isCompleted ? ("completed" as PostedMatchStatus) : x.status,
              result: {
                ...x.result!,
                approvals: updatedApprovals,
                completedAt: isCompleted ? nowIso : x.result!.completedAt,
              },
            }
          : x
      ),
    };

    if (isCompleted) {
      // Compute pair averages and apply rating deltas; award PP to winners.
      const result = m.result;
      const side1 = result.side1UserIds;
      const side2 = result.side2UserIds;
      const side1Avg = side1.map((u) => getPlayer(u)?.rating ?? 1400).reduce((a, b) => a + b, 0) / side1.length;
      const side2Avg = side2.map((u) => getPlayer(u)?.rating ?? 1400).reduce((a, b) => a + b, 0) / side2.length;
      const side1Won = result.winnerSide === 1;
      const side1Delta = computeRatingDelta(side1Avg, side2Avg, side1Won);
      const side2Delta = computeRatingDelta(side2Avg, side1Avg, !side1Won);

      for (const u of side1) {
        applyRatingDelta(u, side1Delta);
        addNotification({
          type: "league_match_completed",
          title: "試合が完了しました",
          message: `「${m.description ?? m.preferredVenue}」が完了しました。レート ${side1Delta >= 0 ? "+" : ""}${side1Delta}${side1Won ? ` ・ +${PP_LEAGUE_MATCH_WIN} PP` : ""}`,
          postedMatchId: m.id,
        });
      }
      for (const u of side2) {
        applyRatingDelta(u, side2Delta);
        addNotification({
          type: "league_match_completed",
          title: "試合が完了しました",
          message: `「${m.description ?? m.preferredVenue}」が完了しました。レート ${side2Delta >= 0 ? "+" : ""}${side2Delta}${!side1Won ? ` ・ +${PP_LEAGUE_MATCH_WIN} PP` : ""}`,
          postedMatchId: m.id,
        });
      }
    }

    emit();
    if (!isCompleted) {
      addNotification({
        type: "league_score_approval",
        title: "比分を承認しました",
        message: `「${m.description ?? m.preferredVenue}」の承認 ${updatedApprovals.length}/4`,
        postedMatchId: m.id,
      });
    }
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
    approveMatchScore,
    withdrawFromMatch,
  };
}
