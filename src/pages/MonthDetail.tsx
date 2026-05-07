import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import {
  useTournamentStore,
  CURRENT_USER,
  computePersonalSeasonalSummary,
  formatSeasonLabel,
  parseSeasonKey,
} from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { Diamond, Trophy, Calendar, TrendingUp } from "lucide-react";

function formatDateJP(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const MonthDetail = () => {
  const { yearMonth: seasonKeyParam } = useParams();
  const navigate = useNavigate();
  const { tournaments } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();

  if (!isPremium) {
    return (
      <InnerPageLayout title="シーズン成績">
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
          <Diamond className="w-8 h-8 text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">シーズン成績はプレミアム会員限定です</p>
          <button onClick={() => navigate("/premium/plan")} className="text-xs text-primary font-bold mt-1">
            プレミアム登録 ›
          </button>
        </div>
      </InnerPageLayout>
    );
  }

  if (!seasonKeyParam || !/^\d{4}-Q[1-4]$/.test(seasonKeyParam)) {
    return (
      <InnerPageLayout title="シーズン成績">
        <p className="text-center text-sm text-muted-foreground">シーズンが見つかりません</p>
      </InnerPageLayout>
    );
  }

  const summary = computePersonalSeasonalSummary(CURRENT_USER, seasonKeyParam, tournaments);
  const season = parseSeasonKey(seasonKeyParam);
  const trophy = summary.bestRank === 1 ? "🥇" : summary.bestRank === 2 ? "🥈" : summary.bestRank === 3 ? "🥉" : null;

  return (
    <InnerPageLayout title={`${formatSeasonLabel(season)}の成績`}>
      {/* Hero score card */}
      <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5 mb-5">
        <p className="text-[11px] opacity-80">{formatSeasonLabel(season)}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-4xl font-bold text-primary">{summary.padelPoints}</span>
          <span className="text-sm opacity-80">PP</span>
          {trophy && <span className="text-2xl ml-2">{trophy}</span>}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] opacity-70">レート変動</span>
          <span className={`text-xs font-bold flex items-center gap-0.5 ${summary.ratingChange >= 0 ? "text-primary" : "text-destructive"}`}>
            {summary.ratingChange >= 0 && <TrendingUp className="w-3 h-3" />}
            {summary.ratingChange >= 0 ? "+" : ""}{summary.ratingChange}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-[10px] opacity-70">出場</p>
            <p className="text-base font-bold">{summary.tournaments.length} 大会</p>
          </div>
          <div>
            <p className="text-[10px] opacity-70">勝率</p>
            <p className="text-base font-bold">
              {summary.played === 0 ? "—" : `${Math.round((summary.won / summary.played) * 100)}%`}
            </p>
            <p className="text-[10px] opacity-70">{summary.won}勝{summary.played - summary.won}敗</p>
          </div>
          <div>
            <p className="text-[10px] opacity-70">最高名次</p>
            <p className="text-base font-bold">{summary.bestRank ? `${summary.bestRank}位` : "—"}</p>
          </div>
        </div>
      </div>

      {/* Tournament list */}
      {summary.tournaments.length > 0 ? (
        <>
          <p className="text-sm font-bold text-foreground mb-2">参加大会</p>
          <div className="space-y-2">
            {summary.tournaments.map((tt) => (
              <button
                key={tt.tournamentId}
                onClick={() => navigate(`/game/tournament/${tt.tournamentId}`)}
                className="w-full bg-card border border-border rounded-[8px] p-3 text-left flex items-center justify-between hover:border-primary/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    {tt.title}
                    {tt.finalRank && tt.finalRank <= 3 && (
                      <Trophy className={`w-3.5 h-3.5 ${tt.finalRank === 1 ? "text-yellow-600" : tt.finalRank === 2 ? "text-gray-400" : "text-amber-700"}`} />
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {formatDateJP(tt.date)}
                    {` ・ ${tt.matchesPlayed}試合 ${tt.matchesWon}勝`}
                    {tt.finalRank ? ` ・ ${tt.finalRank}位` : ""}
                    ・ レート {tt.ratingDelta >= 0 ? "+" : ""}{tt.ratingDelta}
                  </p>
                </div>
                <span className="text-base font-bold text-primary">+{tt.padelPoints}<span className="text-[10px]">PP</span></span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">このシーズンの参加記録はありません</p>
        </div>
      )}
    </InnerPageLayout>
  );
};

export default MonthDetail;
