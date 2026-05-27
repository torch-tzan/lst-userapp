import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { getCardState } from "@/lib/cardState";
import { CURRENT_USER, getPlayer, getRankTier, STARTING_RATING } from "@/lib/tournamentStore";
import { Calendar, MapPin, Users, ChevronRight, MessageCircle, Trophy, Check } from "lucide-react";
import BottomNav from "@/components/BottomNav";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function topStatusBadge(state: ReturnType<typeof getCardState>): { label: string; cls: string } {
  switch (state.kind) {
    case "open":
      return { label: state.isMine ? "マイ募集" : "募集中", cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" };
    case "joined_chat":
      return { label: "参加中", cls: "bg-primary/15 text-primary border-primary/30" };
    case "score_input_pending":
      return { label: "比分入力待ち", cls: "bg-primary/10 text-primary border-primary/30" };
    case "score_approval_pending":
      return { label: `比分確認 ${state.approvalsCount}/4`, cls: "bg-accent-yellow text-foreground border-transparent" };
    case "score_approved_waiting":
      return { label: `承認済 ${state.approvalsCount}/4`, cls: "bg-muted text-muted-foreground border-border" };
    case "completed":
      return { label: "✓ 完了", cls: "bg-green-100 text-green-700 border-green-200" };
    case "filled_observer":
      return { label: "満員", cls: "bg-muted text-muted-foreground border-border" };
    case "cancelled":
      return { label: "キャンセル済", cls: "bg-destructive/10 text-destructive border-destructive/30" };
  }
}

const STATE_LABELS: Record<string, string> = {
  "open-recruit": "募集中",
  "open-mine": "マイ募集",
  "open-pending": "応募中",
  "joined_chat": "参加中",
  "score_input_pending": "比分入力待ち",
  "score_approval_pending": "比分確認",
  "score_approved_waiting": "承認済",
  "completed": "完了",
  "filled_observer": "満員（観察）",
  "cancelled": "キャンセル済",
};

/** All league card visual states for Figma export (cards only, no full mockups). */
const FigmaLeagueCardStates = () => {
  const { postedMatches } = useLeagueMatchBoardStore();

  const cards = postedMatches.map((match) => {
    const state = getCardState(match);
    let stateKey = state.kind;
    if (state.kind === "open" && state.isMine) stateKey = "open-mine" as typeof stateKey;
    if (state.kind === "open" && state.userApplicationStatus === "pending") stateKey = "open-pending" as typeof stateKey;
    if (state.kind === "open" && !state.isMine && !state.userApplicationStatus) stateKey = "open-recruit" as typeof stateKey;

    const host = getPlayer(match.hostUserId);
    const tier = host ? getRankTier(host.rating) : null;
    const desiredTier = match.desiredSkillLevel
      ? getRankTier(STARTING_RATING[match.desiredSkillLevel])
      : null;
    const approvedCount = match.applications.filter((a) => a.status === "approved").length;
    const pendingMyApps =
      match.hostUserId === CURRENT_USER
        ? match.applications.filter((a) => a.status === "pending").length
        : 0;
    const isMyMatch = match.hostUserId === CURRENT_USER;
    const topBadge = topStatusBadge(state);
    const chatThreadId =
      state.kind === "joined_chat" || state.kind === "score_approval_pending"
        ? state.threadId
        : undefined;

    return {
      id: match.id,
      stateKey,
      match,
      host,
      tier,
      desiredTier,
      approvedCount,
      pendingMyApps,
      isMyMatch,
      topBadge,
      state,
      chatThreadId,
    };
  });

  // Deduplicate by state key — keep first match per unique visual state
  const seen = new Set<string>();
  let unique = cards.filter((c) => {
    if (seen.has(c.stateKey)) return false;
    seen.add(c.stateKey);
    return true;
  });

  // Synthetic cards for states not covered by demo seed data
  const synthetic: typeof cards = [];
  if (!seen.has("open-mine")) {
    const m = postedMatches.find((x) => x.hostUserId === CURRENT_USER) ?? postedMatches[0];
    synthetic.push({
      ...cards.find((c) => c.id === m.id)!,
      stateKey: "open-mine",
      state: { kind: "open", isMine: true },
      topBadge: { label: "マイ募集", cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
      isMyMatch: true,
      pendingMyApps: 2,
    });
  }
  if (!seen.has("filled_observer")) {
    const m = postedMatches.find((x) => x.id === "lm-2")!;
    synthetic.push({
      ...cards.find((c) => c.id === m.id)!,
      stateKey: "filled_observer",
      state: { kind: "filled_observer" },
      topBadge: { label: "満員", cls: "bg-muted text-muted-foreground border-border" },
      chatThreadId: undefined,
    });
  }
  unique = [...unique, ...synthetic];

  return (
    <div
      id="phone-container"
      className="relative w-[390px] min-h-[844px] bg-background flex flex-col"
    >
      <div className="h-[50px] flex-shrink-0 flex items-center justify-between px-8 pt-1 bg-background">
        <span className="text-xs font-semibold text-foreground">9:41</span>
      </div>
      <div className="flex-1 px-[20px] py-4 space-y-4">
        <p className="text-sm font-bold text-foreground">リーグカード — 全状態</p>
        {unique.map(({ id, stateKey, match, host, tier, desiredTier, approvedCount, pendingMyApps, isMyMatch, topBadge, state, chatThreadId }) => (
          <div key={id}>
            <p className="text-[10px] text-muted-foreground mb-1.5">{STATE_LABELS[stateKey] ?? stateKey}</p>
            <div
              className={`w-full bg-card border border-border rounded-[8px] p-3 pl-3.5 text-left border-l-[4px] ${
                desiredTier?.leftBorderCls ?? "border-l-border"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {desiredTier && <span className="text-[12px] leading-none">{desiredTier.emoji}</span>}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${topBadge.cls}`}>
                    {topBadge.label}
                  </span>
                  {state.kind === "open" && state.userApplicationStatus === "pending" && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-accent-yellow/15 text-accent-yellow border-accent-yellow/40">
                      応募中
                    </span>
                  )}
                </div>
                {chatThreadId && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-foreground">{host?.name ?? "—"} さん</p>
                {tier && <span className="text-[10px]">{tier.emoji}</span>}
              </div>
              {match.description && (
                <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{match.description}</p>
              )}
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <p className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateTime(match.desiredDate)}</p>
                <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{match.preferredVenue}</p>
                {state.kind !== "completed" && (
                  <p className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {approvedCount + 1}/4 確定 ・ 応募 {match.applications.length} 件
                  </p>
                )}
              </div>
              {pendingMyApps > 0 && state.kind === "open" && isMyMatch && (
                <p className="text-[11px] text-primary font-bold mt-2 flex items-center gap-1">
                  {pendingMyApps} 件の応募を確認 <ChevronRight className="w-3 h-3" />
                </p>
              )}
              {state.kind === "score_input_pending" && (
                <div className="mt-2 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1.5 rounded-[6px]">
                  <Trophy className="w-3 h-3" />比分入力 <ChevronRight className="w-3 h-3" />
                </div>
              )}
              {state.kind === "score_approval_pending" && (
                <div className="mt-2 inline-flex items-center gap-1 bg-accent-yellow text-foreground text-[11px] font-bold px-3 py-1.5 rounded-[6px]">
                  <Check className="w-3 h-3" />比分を確認 <ChevronRight className="w-3 h-3" />
                </div>
              )}
              {state.kind === "completed" && (
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground">{state.score}</span>
                  <span className={`font-bold ${state.userWon ? "text-primary" : "text-muted-foreground"}`}>
                    {state.userSide === null ? "—" : state.userWon ? "あなた: 勝" : "あなた: 負"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 bg-gray-5 border-t border-border">
        <BottomNav active={2} />
        <div className="flex justify-center pb-1 pt-0.5">
          <div className="w-[134px] h-[5px] bg-foreground/30 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default FigmaLeagueCardStates;
