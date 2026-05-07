import { useNavigate } from "react-router-dom";
import { useLeagueMatchBoardStore, type PostedMatch } from "@/lib/leagueMatchBoardStore";
import { CURRENT_USER, getPlayer, getRankTier } from "@/lib/tournamentStore";
import { Calendar, MapPin, Users, ChevronRight, Plus } from "lucide-react";

const SKILL_LABEL = { beginner: "初心者", intermediate: "中級", advanced: "上級" } as const;

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

const Card = ({ match, onClick }: { match: PostedMatch; onClick: () => void }) => {
  const host = getPlayer(match.hostUserId);
  const tier = host ? getRankTier(host.rating) : null;
  const approvedCount = match.applications.filter((a) => a.status === "approved").length;
  const relation = getRelationBadge(match);
  const pendingMyApps = match.hostUserId === CURRENT_USER
    ? match.applications.filter((a) => a.status === "pending").length
    : 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-[8px] p-3 text-left hover:border-primary/40 transition-colors"
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
        <p className="text-sm font-bold text-foreground">{host?.name ?? "—"} さん</p>
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
    </button>
  );
};

const LeagueMatchList = () => {
  const navigate = useNavigate();
  const { postedMatches } = useLeagueMatchBoardStore();

  // Unified list: all open + filled, sorted by desiredDate ascending
  const items = postedMatches
    .filter((m) => m.status === "open" || m.status === "filled")
    .sort((a, b) => a.desiredDate.localeCompare(b.desiredDate));

  return (
    <>
      {items.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">現在、募集はありません</p>
        </div>
      ) : (
        <div className="space-y-2 pb-20">
          {items.map((m) => (
            <Card key={m.id} match={m} onClick={() => navigate(`/game/league/${m.id}`)} />
          ))}
        </div>
      )}

      {/* Floating action button — pinned to bottom-right of phone container.
          Phone is 390px wide centered in browser viewport, so right CSS uses 50% calc. */}
      <button
        onClick={() => navigate("/game/league/new")}
        className="fixed bottom-[100px] right-[calc(50%-176px)] z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform"
        aria-label="募集を作成"
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
};

export default LeagueMatchList;
