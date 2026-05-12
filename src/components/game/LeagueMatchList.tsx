import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLeagueMatchBoardStore, type PostedMatch } from "@/lib/leagueMatchBoardStore";
import { CURRENT_USER, getPlayer, getRankTier, STARTING_RATING, type SkillLevel } from "@/lib/tournamentStore";
import { getCardState, type LeagueCardState } from "@/lib/cardState";
import MultiSelectSheet from "@/components/pickers/MultiSelectSheet";
import { COURTS } from "@/lib/courtData";
import { Calendar, MapPin, Users, ChevronRight, Plus, MessageCircle, Trophy, Check, ChevronDown } from "lucide-react";

const SKILL_LABEL: Record<SkillLevel, string> = { beginner: "初心者", intermediate: "中級", advanced: "上級" };

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Group matches into ordered buckets keyed by local date (今日 / 明日 / M/D). */
function groupByDate(items: PostedMatch[]): { key: string; label: string; items: PostedMatch[] }[] {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${tomorrow.getMonth()}-${tomorrow.getDate()}`;

  const buckets = new Map<string, PostedMatch[]>();
  for (const m of items) {
    const d = new Date(m.desiredDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(m);
  }

  return [...buckets.entries()]
    .map(([key, ms]) => {
      const [y, m, day] = key.split("-").map(Number);
      const dateObj = new Date(y, m, day);
      let label: string;
      if (key === todayKey) label = "今日";
      else if (key === tomorrowKey) label = "明日";
      else label = `${m + 1}/${day}`;
      return { key, label, items: ms, sortKey: dateObj.getTime() };
    })
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ key, label, items }) => ({ key, label, items }));
}

/**
 * Map a venue string to a platform facility name (used as the filter key).
 * Venues that don't match any registered COURTS facility fall back to "その他".
 */
function extractRegion(venue: string): string {
  for (const c of COURTS) {
    if (venue.startsWith(c.name)) return c.name;
  }
  return "その他";
}

/** Derive a top-left status badge label + tone for a card state. */
function topStatusBadge(state: LeagueCardState): { label: string; cls: string } {
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

const Card = ({
  match,
  onClick,
  onHostClick,
  onChatClick,
}: {
  match: PostedMatch;
  onClick: () => void;
  onHostClick: (e: React.MouseEvent) => void;
  onChatClick?: (e: React.MouseEvent, threadId: string) => void;
}) => {
  const host = getPlayer(match.hostUserId);
  const tier = host ? getRankTier(host.rating) : null;
  const desiredTier = match.desiredSkillLevel
    ? getRankTier(STARTING_RATING[match.desiredSkillLevel])
    : null;
  const approvedCount = match.applications.filter((a) => a.status === "approved").length;
  const pendingMyApps = match.hostUserId === CURRENT_USER
    ? match.applications.filter((a) => a.status === "pending").length
    : 0;
  const isMyMatch = match.hostUserId === CURRENT_USER;

  const state = getCardState(match);
  const topBadge = topStatusBadge(state);
  const chatThreadId =
    state.kind === "joined_chat" || state.kind === "score_approval_pending"
      ? state.kind === "joined_chat"
        ? state.threadId
        : state.threadId
      : undefined;

  return (
    <div
      onClick={onClick}
      className={`w-full bg-card border border-border rounded-[8px] p-3 pl-3.5 text-left hover:border-primary/40 transition-colors cursor-pointer border-l-[4px] ${
        desiredTier?.leftBorderCls ?? "border-l-border"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {desiredTier && (
            <span className="text-[12px] leading-none flex-shrink-0" aria-label={`${SKILL_LABEL[match.desiredSkillLevel!]}向け`}>
              {desiredTier.emoji}
            </span>
          )}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${topBadge.cls}`}>
            {topBadge.label}
          </span>
          {state.kind === "open" && state.userApplicationStatus === "pending" && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-accent-yellow/15 text-accent-yellow border-accent-yellow/40 whitespace-nowrap">
              応募中
            </span>
          )}
        </div>
        {chatThreadId && onChatClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onChatClick(e, chatThreadId); }}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/15 text-primary flex items-center justify-center transition-colors"
            aria-label="メッセージを開く"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1">
        {isMyMatch ? (
          <p className="text-sm font-bold text-foreground">{host?.name ?? "—"} さん</p>
        ) : (
          <button
            onClick={onHostClick}
            className="text-sm font-bold text-foreground hover:text-primary hover:underline"
          >
            {host?.name ?? "—"} さん
          </button>
        )}
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

      {/* State-specific inline CTA / result */}
      {pendingMyApps > 0 && state.kind === "open" && isMyMatch && (
        <p className="text-[11px] text-primary font-bold mt-2 flex items-center gap-1">
          {pendingMyApps} 件の応募を確認 <ChevronRight className="w-3 h-3" />
        </p>
      )}
      {state.kind === "score_input_pending" && (
        <div className="mt-2 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1.5 rounded-[6px]">
          <Trophy className="w-3 h-3" />
          比分入力 <ChevronRight className="w-3 h-3" />
        </div>
      )}
      {state.kind === "score_approval_pending" && (
        <div className="mt-2 inline-flex items-center gap-1 bg-accent-yellow text-foreground text-[11px] font-bold px-3 py-1.5 rounded-[6px]">
          <Check className="w-3 h-3" />
          比分を確認 <ChevronRight className="w-3 h-3" />
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
  );
};

/** True if CURRENT_USER is host, an active applicant, or a result-side member. */
function isMyMatch(m: PostedMatch): boolean {
  if (m.hostUserId === CURRENT_USER) return true;
  const app = m.applications.find((a) => a.applicantUserId === CURRENT_USER);
  if (app && app.status !== "rejected" && app.status !== "withdrawn") return true;
  if (
    m.result &&
    (m.result.side1UserIds.includes(CURRENT_USER) || m.result.side2UserIds.includes(CURRENT_USER))
  ) {
    return true;
  }
  return false;
}

const LeagueMatchList = () => {
  const navigate = useNavigate();
  const { postedMatches } = useLeagueMatchBoardStore();

  // Sub-tab: joinable recruits vs my matches
  const [subTab, setSubTab] = useState<"join" | "mine">("join");

  // Multi-select filters; empty set = no filter (show all)
  const [filterLevels, setFilterLevels] = useState<Set<SkillLevel>>(new Set());
  const [filterRegions, setFilterRegions] = useState<Set<string>>(new Set());
  const [openFilter, setOpenFilter] = useState<"level" | "region" | null>(null);

  // Compute available regions across all non-cancelled matches so the filter
  // can reach completed games too.
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    postedMatches.forEach((m) => {
      if (m.status !== "cancelled") set.add(extractRegion(m.preferredVenue));
    });
    return [...set].sort();
  }, [postedMatches]);

  const items = useMemo(() => {
    return postedMatches
      .filter((m) => {
        const mine = isMyMatch(m);
        // "join" tab: open recruits I haven't engaged with (cancelled excluded by status).
        if (subTab === "join") return !mine && m.status === "open";
        // "mine" tab: anything I'm involved in (including my own cancelled posts).
        return mine;
      })
      .filter((m) =>
        filterLevels.size === 0 || (m.desiredSkillLevel && filterLevels.has(m.desiredSkillLevel)),
      )
      .filter((m) =>
        filterRegions.size === 0 || filterRegions.has(extractRegion(m.preferredVenue)),
      )
      // Newest-first so recently-completed and upcoming both surface high.
      .sort((a, b) => b.desiredDate.localeCompare(a.desiredDate));
  }, [postedMatches, subTab, filterLevels, filterRegions]);

  const hasFilters = filterLevels.size > 0 || filterRegions.size > 0;

  const counts = useMemo(
    () => ({
      join: postedMatches.filter((m) => !isMyMatch(m) && m.status === "open").length,
      mine: postedMatches.filter((m) => isMyMatch(m)).length,
    }),
    [postedMatches],
  );

  const handleHostClick = (e: React.MouseEvent, hostUserId: string) => {
    e.stopPropagation();
    navigate(`/profile/${hostUserId}`);
  };

  const handleChatClick = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    navigate(`/messages/${threadId}`);
  };

  const [fabPortalTarget, setFabPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setFabPortalTarget(document.getElementById("phone-container"));
  }, []);

  const levelButtonLabel = filterLevels.size === 0
    ? "等級"
    : filterLevels.size === 1
    ? SKILL_LABEL[[...filterLevels][0]]
    : `等級 ${filterLevels.size}`;
  const regionButtonLabel = filterRegions.size === 0
    ? "場地"
    : filterRegions.size === 1
    ? [...filterRegions][0]
    : `場地 ${filterRegions.size}`;

  const triggerCls = (active: boolean) =>
    `flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
      active
        ? "bg-primary/10 text-primary border-primary/40"
        : "bg-card text-muted-foreground border-border hover:border-primary/40"
    }`;

  const subTabCls = (active: boolean) =>
    `relative pb-2 text-sm transition-colors ${
      active ? "text-foreground font-bold" : "text-muted-foreground font-medium hover:text-foreground"
    }`;

  return (
    <>
      {/* Sub-tabs (text + underline) — visually distinct from the pill SegmentedTabs above */}
      <div className="flex gap-5 border-b border-border mb-3">
        <button onClick={() => setSubTab("join")} className={subTabCls(subTab === "join")}>
          募集中
          {counts.join > 0 && (
            <span className="ml-1 text-xs text-muted-foreground/70 font-normal">
              ({counts.join})
            </span>
          )}
          {subTab === "join" && (
            <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-primary rounded-t-full" />
          )}
        </button>
        <button onClick={() => setSubTab("mine")} className={subTabCls(subTab === "mine")}>
          マイ試合
          {counts.mine > 0 && (
            <span className="ml-1 text-xs text-muted-foreground/70 font-normal">
              ({counts.mine})
            </span>
          )}
          {subTab === "mine" && (
            <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* Filter dropdowns */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setOpenFilter("level")} className={triggerCls(filterLevels.size > 0)}>
          {levelButtonLabel}
          <ChevronDown className="w-3 h-3" />
        </button>
        <button onClick={() => setOpenFilter("region")} className={triggerCls(filterRegions.size > 0)}>
          {regionButtonLabel}
          <ChevronDown className="w-3 h-3" />
        </button>
        {hasFilters && (
          <button
            onClick={() => { setFilterLevels(new Set()); setFilterRegions(new Set()); }}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
          >
            クリア
          </button>
        )}
      </div>

      <MultiSelectSheet
        open={openFilter === "level"}
        title="等級で絞り込み"
        options={[
          { value: "beginner", label: SKILL_LABEL.beginner },
          { value: "intermediate", label: SKILL_LABEL.intermediate },
          { value: "advanced", label: SKILL_LABEL.advanced },
        ]}
        selected={filterLevels as Set<string>}
        onConfirm={(next) => {
          setFilterLevels(new Set(next as Set<SkillLevel>));
          setOpenFilter(null);
        }}
        onClose={() => setOpenFilter(null)}
      />

      <MultiSelectSheet
        open={openFilter === "region"}
        title="場地で絞り込み"
        options={availableRegions.map((r) => ({ value: r, label: r }))}
        selected={filterRegions}
        onConfirm={(next) => {
          setFilterRegions(next);
          setOpenFilter(null);
        }}
        onClose={() => setOpenFilter(null)}
      />

      {items.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-8 text-center space-y-3">
          <Users className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">
            {hasFilters
              ? "条件に合う募集はありません"
              : subTab === "join"
              ? "募集中の試合はありません"
              : "あなたが参加している試合はまだありません"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {hasFilters
              ? "フィルターを変えるか、自分で作成してみよう"
              : subTab === "join"
              ? "新しい募集を待つか、自分で作成してみよう"
              : "「募集中」タブから応募するか、自分で募集を作成しましょう"}
          </p>
          <button
            onClick={() => navigate("/game/league/new")}
            className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-[6px] mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            募集を作成する
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {groupByDate(items).map((group) => (
            <div key={group.key} className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground px-1">
                {group.label}
              </p>
              {group.items.map((m) => (
                <Card
                  key={m.id}
                  match={m}
                  onClick={() => navigate(`/game/league/${m.id}`)}
                  onHostClick={(e) => handleHostClick(e, m.hostUserId)}
                  onChatClick={handleChatClick}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Floating action button — portaled into #phone-container so it sits
          above the bottom nav inside the phone frame, independent of viewport size. */}
      {fabPortalTarget &&
        createPortal(
          <button
            onClick={() => navigate("/game/league/new")}
            className="absolute bottom-[90px] right-5 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform"
            aria-label="募集を作成"
          >
            <Plus className="w-6 h-6" />
          </button>,
          fabPortalTarget
        )}
    </>
  );
};

export default LeagueMatchList;
