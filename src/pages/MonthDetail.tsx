import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, computePersonalMonthlyScore } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { Diamond, Trophy, Calendar } from "lucide-react";

function formatYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

function formatDateJP(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const MonthDetail = () => {
  const { yearMonth } = useParams();
  const navigate = useNavigate();
  const { tournaments } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();

  if (!isPremium) {
    return (
      <InnerPageLayout title="月度成績">
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
          <Diamond className="w-8 h-8 text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">月度成績はプレミアム会員限定です</p>
          <button
            onClick={() => navigate("/premium/plan")}
            className="text-xs text-primary font-bold mt-1"
          >
            プレミアム登録 ›
          </button>
        </div>
      </InnerPageLayout>
    );
  }

  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return (
      <InnerPageLayout title="月度成績">
        <p className="text-center text-sm text-muted-foreground">月度が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const score = computePersonalMonthlyScore(CURRENT_USER, yearMonth, tournaments);
  const trophy = score.bestRank === 1 ? "🥇" : score.bestRank === 2 ? "🥈" : score.bestRank === 3 ? "🥉" : null;

  return (
    <InnerPageLayout title={`${formatYM(yearMonth)}の成績`}>
      {/* Hero score card */}
      <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5 mb-5">
        <p className="text-[11px] opacity-80">{formatYM(yearMonth)}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-4xl font-bold text-primary">{score.total}</span>
          <span className="text-sm opacity-80">積分</span>
          {trophy && <span className="text-2xl ml-2">{trophy}</span>}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-[10px] opacity-70">出場</p>
            <p className="text-base font-bold">{score.tournaments.length} 大会</p>
          </div>
          <div>
            <p className="text-[10px] opacity-70">勝率</p>
            <p className="text-base font-bold">
              {score.played === 0 ? "—" : `${Math.round((score.won / score.played) * 100)}%`}
            </p>
            <p className="text-[10px] opacity-70">{score.won}勝{score.played - score.won}敗</p>
          </div>
          <div>
            <p className="text-[10px] opacity-70">最高名次</p>
            <p className="text-base font-bold">{score.bestRank ? `${score.bestRank}位` : "—"}</p>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <p className="text-sm font-bold text-foreground mb-2">積分内訳</p>
      <div className="grid grid-cols-2 gap-2 mb-5 text-center">
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[10px] text-muted-foreground">参加</p>
          <p className="text-base font-bold text-foreground mt-1">+{score.participation}</p>
        </div>
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[10px] text-muted-foreground">勝利</p>
          <p className="text-base font-bold text-foreground mt-1">+{score.wins}</p>
        </div>
      </div>

      {/* Tournament list */}
      {score.tournaments.length > 0 ? (
        <>
          <p className="text-sm font-bold text-foreground mb-2">参加大会</p>
          <div className="space-y-2">
            {score.tournaments.map((tt) => (
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
                  </p>
                </div>
                <span className="text-base font-bold text-primary">+{tt.score}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">この月の参加記録はありません</p>
        </div>
      )}
    </InnerPageLayout>
  );
};

export default MonthDetail;
