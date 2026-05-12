import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLeagueMatchBoardStore, type PostedMatch } from "@/lib/leagueMatchBoardStore";
import { CURRENT_USER, getPlayer, getRankTier, type SkillLevel } from "@/lib/tournamentStore";
import { Calendar, MapPin, Users, ChevronRight, Plus, Filter, X } from "lucide-react";

const SKILL_LABEL: Record<SkillLevel, string> = { beginner: "初心者", intermediate: "中級", advanced: "上級" };

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type RelationBadge = { label: string; cls: string } | null;

function getRelationBadge(match: PostedMatch): RelationBadge {
  if (match.hostUserId === CURRENT_USER) {
    return { label: "マイ募集", cls: "bg-primary/10 text-primary border-primary/30" };
  }
  const myApp = match.applications.find((a) => a.applicantUserId === CURRENT_USER);
  if (myApp) {
    if (myApp.status === "pending") return { label: "応募中", cls: "bg-accent-yellow/15 text-accent-yellow border-accent-yellow/40" };
    if (myApp.status === "approved") return { label: "承認済", cls: "bg-primary/10 text-primary border-primary/30" };
    if (myApp.status === "rejected") return { label: "却下", cls: "bg-muted text-muted-foreground border-border" };
  }
  return null;
}

/** Extract a "region" label from a venue string. Crude — split on first space or take first char chunk. */
function extractRegion(venue: string): string {
  // venues look like "LST 本店コートB", "LST 西支店コート2"
  // Take 2nd word (after "LST ") if it exists
  const parts = venue.split(/\s+/);
  if (parts.length >= 2) {
    const second = parts[1];
    // Strip コート + number suffix
    return second.replace(/コート.*$/, "");
  }
  return venue;
}

const Card = ({
  match,
  onClick,
  onHostClick,
}: {
  match: PostedMatch;
  onClick: () => void;
  onHostClick: (e: React.MouseEvent) => void;
}) => {
  const host = getPlayer(match.hostUserId);
  const tier = host ? getRankTier(host.rating) : null;
  const approvedCount = match.applications.filter((a) => a.status === "approved").length;
  const relation = getRelationBadge(match);
  const pendingMyApps = match.hostUserId === CURRENT_USER
    ? match.applications.filter((a) => a.status === "pending").length
    : 0;
  const isMyMatch = match.hostUserId === CURRENT_USER;

  return (
    <div
      onClick={onClick}
      className="w-full bg-card border border-border rounded-[8px] p-3 text-left hover:border-primary/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground">
            {match.status === "filled" ? "成立済" : "募集中"}
          </span>
          {relation && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${relation.cls}`}>
              {relation.label}
            </span>
          )}
        </div>
        {match.desiredSkillLevel && (
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold text-muted-foreground">
            {SKILL_LABEL[match.desiredSkillLevel]}向け
          </span>
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
        <p className="flex items-center gap-1"><Users className="w-3 h-3" />{approvedCount + 1}/4 確定 ・ 応募 {match.applications.length} 件</p>
      </div>
      {pendingMyApps > 0 && (
        <p className="text-[11px] text-primary font-bold mt-2 flex items-center gap-1">
          {pendingMyApps} 件の応募を確認 <ChevronRight className="w-3 h-3" />
        </p>
      )}
    </div>
  );
};

const LeagueMatchList = () => {
  const navigate = useNavigate();
  const { postedMatches } = useLeagueMatchBoardStore();

  const [filterLevel, setFilterLevel] = useState<SkillLevel | null>(null);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);

  // Compute available regions from current matches
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    postedMatches.forEach((m) => {
      if (m.status === "open" || m.status === "filled") set.add(extractRegion(m.preferredVenue));
    });
    return [...set].sort();
  }, [postedMatches]);

  const items = useMemo(() => {
    return postedMatches
      .filter((m) => m.status === "open" || m.status === "filled")
      .filter((m) => !filterLevel || m.desiredSkillLevel === filterLevel)
      .filter((m) => !filterRegion || extractRegion(m.preferredVenue) === filterRegion)
      .sort((a, b) => a.desiredDate.localeCompare(b.desiredDate));
  }, [postedMatches, filterLevel, filterRegion]);

  const hasFilters = !!filterLevel || !!filterRegion;
  const clearFilters = () => {
    setFilterLevel(null);
    setFilterRegion(null);
  };

  const handleHostClick = (e: React.MouseEvent, hostUserId: string) => {
    e.stopPropagation();
    navigate(`/profile/${hostUserId}`);
  };

  const [fabPortalTarget, setFabPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setFabPortalTarget(document.getElementById("phone-container"));
  }, []);

  return (
    <>
      {/* Filter chips */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto -mx-[20px] px-[20px] pb-1">
        <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        {/* Level chips */}
        {(["beginner", "intermediate", "advanced"] as SkillLevel[]).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)}
            className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
              filterLevel === lvl
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {SKILL_LABEL[lvl]}
          </button>
        ))}
        {/* Region chips */}
        {availableRegions.map((region) => (
          <button
            key={region}
            onClick={() => setFilterRegion(filterRegion === region ? null : region)}
            className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
              filterRegion === region
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {region}
          </button>
        ))}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex-shrink-0 text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-0.5 ml-1"
          >
            <X className="w-3 h-3" />
            クリア
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-8 text-center space-y-3">
          <Users className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">
            {hasFilters ? "条件に合う募集はありません" : "現在、募集はありません"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {hasFilters
              ? "フィルターを変えるか、自分で作成してみよう"
              : "あなたが最初の募集を作成してみよう"}
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
        <div className="space-y-2 pb-20">
          {items.map((m) => (
            <Card
              key={m.id}
              match={m}
              onClick={() => navigate(`/game/league/${m.id}`)}
              onHostClick={(e) => handleHostClick(e, m.hostUserId)}
            />
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
