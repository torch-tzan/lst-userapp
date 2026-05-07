import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { CURRENT_USER, getPlayer, getRankTier } from "@/lib/tournamentStore";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import type { PostedMatch } from "@/lib/leagueMatchBoardStore";

const SKILL_LABEL = { beginner: "初心者", intermediate: "中級", advanced: "上級" };

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const Card = ({
  match,
  footerNote,
  onClick,
}: {
  match: PostedMatch;
  footerNote?: string;
  onClick: () => void;
}) => {
  const host = getPlayer(match.hostUserId);
  const tier = host ? getRankTier(host.rating) : null;
  const approvedCount = match.applications.filter((a) => a.status === "approved").length;
  const totalSlots = 3; // host + 3 = 4 total
  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-[8px] p-3 text-left hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-muted-foreground">
          {match.status === "filled" ? "成立済" : "募集中"}
        </span>
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
        <p className="flex items-center gap-1"><Users className="w-3 h-3" />{approvedCount}/{totalSlots}承認済 ・ 応募 {match.applications.length} 件</p>
      </div>
      {footerNote && (
        <p className="text-[10px] text-primary font-bold mt-2 flex items-center gap-1">
          {footerNote}<ChevronRight className="w-3 h-3" />
        </p>
      )}
    </button>
  );
};

const LeagueBoardList = () => {
  const navigate = useNavigate();
  const { postedMatches, getMyHostedMatches, getMyApplications } = useLeagueMatchBoardStore();

  const myHosted = getMyHostedMatches().filter(
    (m) => m.status === "open" || m.status === "filled"
  );
  const myApps = getMyApplications().filter(
    ({ match }) => match.status === "open" || match.status === "filled"
  );
  const myAppsMatchIds = new Set(myApps.map(({ match }) => match.id));
  const browseable = postedMatches
    .filter(
      (m) =>
        (m.status === "open" || m.status === "filled") &&
        m.hostUserId !== CURRENT_USER &&
        !myAppsMatchIds.has(m.id)
    )
    .sort((a, b) => a.desiredDate.localeCompare(b.desiredDate));

  return (
    <InnerPageLayout
      title="リーグ募集板"
      ctaLabel="募集を作成する"
      onCtaClick={() => navigate("/game/league/new")}
    >
      {/* My hosted */}
      {myHosted.length > 0 && (
        <section className="mb-5">
          <p className="text-sm font-bold text-foreground mb-2">マイ募集</p>
          <div className="space-y-2">
            {myHosted.map((m) => (
              <Card
                key={m.id}
                match={m}
                onClick={() => navigate(`/game/league/${m.id}`)}
                footerNote={
                  m.applications.some((a) => a.status === "pending")
                    ? `${m.applications.filter((a) => a.status === "pending").length} 件の応募を確認 ›`
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* My applications */}
      {myApps.length > 0 && (
        <section className="mb-5">
          <p className="text-sm font-bold text-foreground mb-2">応募した募集</p>
          <div className="space-y-2">
            {myApps.map(({ match, application }) => (
              <Card
                key={match.id}
                match={match}
                onClick={() => navigate(`/game/league/${match.id}`)}
                footerNote={
                  application.status === "pending"
                    ? "ホストの返答を待っています"
                    : application.status === "approved"
                    ? "承認されました ›"
                    : "却下されました"
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Browseable */}
      <section>
        <p className="text-sm font-bold text-foreground mb-2">他の募集を探す</p>
        {browseable.length === 0 ? (
          <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
            <p className="text-xs text-muted-foreground">現在、応募できる募集はありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {browseable.map((m) => (
              <Card key={m.id} match={m} onClick={() => navigate(`/game/league/${m.id}`)} />
            ))}
          </div>
        )}
      </section>
    </InnerPageLayout>
  );
};

export default LeagueBoardList;
