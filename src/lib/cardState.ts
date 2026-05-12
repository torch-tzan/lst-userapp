import { CURRENT_USER } from "@/lib/tournamentStore";
import type { PostedMatch } from "@/lib/leagueMatchBoardStore";

/**
 * Derives the per-current-user UI state for a league match card.
 * Drives the 5 visually-distinct demo states surfaced in the league list.
 */
export type LeagueCardState =
  | { kind: "open"; isMine: boolean; userApplicationStatus?: "pending" | "rejected" }  // status="open" recruit; can apply or manage
  | { kind: "joined_chat"; threadId: string }                                // approved member, no score yet
  | { kind: "score_input_pending" }                                          // host, all 4 in, no result yet
  | { kind: "score_approval_pending"; approvalsCount: number; threadId?: string } // result exists, user has NOT approved
  | { kind: "score_approved_waiting"; approvalsCount: number }               // user approved, others pending
  | { kind: "completed"; userSide: 1 | 2 | null; userWon: boolean; score: string }
  | { kind: "filled_observer" }                                              // filled but user not in the match
  | { kind: "cancelled" };

export function getCardState(match: PostedMatch, userId: string = CURRENT_USER): LeagueCardState {
  if (match.status === "cancelled") return { kind: "cancelled" };

  const isHost = match.hostUserId === userId;
  const myApp = match.applications.find((a) => a.applicantUserId === userId);
  const isApprovedMember = isHost || myApp?.status === "approved";
  const result = match.result;

  // Completed
  if (match.status === "completed" && result) {
    const userSide = result.side1UserIds.includes(userId)
      ? 1
      : result.side2UserIds.includes(userId)
      ? 2
      : null;
    const userWon = userSide !== null && result.winnerSide === userSide;
    return { kind: "completed", userSide, userWon, score: result.score };
  }

  // Score submitted, awaiting 4-of-4 approvals
  if (result && match.status === "filled") {
    const allFour = [...result.side1UserIds, ...result.side2UserIds];
    if (allFour.includes(userId)) {
      const hasApproved = result.approvals.some((a) => a.userId === userId);
      if (hasApproved) {
        return { kind: "score_approved_waiting", approvalsCount: result.approvals.length };
      }
      return {
        kind: "score_approval_pending",
        approvalsCount: result.approvals.length,
        threadId: match.threadId,
      };
    }
    return { kind: "filled_observer" };
  }

  // Filled, no score yet
  if (match.status === "filled" && !result) {
    if (isHost) return { kind: "score_input_pending" };
    if (isApprovedMember && match.threadId) return { kind: "joined_chat", threadId: match.threadId };
    return { kind: "filled_observer" };
  }

  // Open recruitment
  if (isApprovedMember && match.threadId) {
    return { kind: "joined_chat", threadId: match.threadId };
  }
  const userAppStatus =
    myApp?.status === "pending" || myApp?.status === "rejected" ? myApp.status : undefined;
  return { kind: "open", isMine: isHost, userApplicationStatus: userAppStatus };
}
