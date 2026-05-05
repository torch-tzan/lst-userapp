import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, computePersonalMonthlyScore } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { Trophy, Calendar, Diamond } from "lucide-react";

function yearMonthsBetween(startIso: string, endDate: Date): string[] {
  const start = new Date(startIso);
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months.reverse(); // 最新月在最上面
}

function formatYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

const MyResults = () => {
  const navigate = useNavigate();
  const { tournaments } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();
  const periodStart = sub.currentPeriodStartedAt();

  if (!isPremium || !periodStart) {
    return (
      <InnerPageLayout title="大会成績">
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
          <Diamond className="w-8 h-8 text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">大会成績はプレミアム会員限定です</p>
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

  const months = yearMonthsBetween(periodStart, new Date());
  const cards = months
    .map((ym) => computePersonalMonthlyScore(CURRENT_USER, ym, tournaments))
    .filter((s) => s.tournaments.length > 0 || s.total > 0);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <InnerPageLayout title="大会成績">
      <p className="text-[11px] text-muted-foreground mb-3">
        プレミアム会員期間（{new Date(periodStart).getFullYear()}年
        {new Date(periodStart).getMonth() + 1}月{new Date(periodStart).getDate()}日〜）の成績を表示しています
      </p>

      {cards.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">まだ大会の参加記録がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((s) => (
            <div key={s.yearMonth} className="bg-card border border-border rounded-[8px] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {formatYM(s.yearMonth)}
                  {s.yearMonth === thisMonth && (
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                      今月
                    </span>
                  )}
                </p>
                <p className="text-2xl font-bold text-primary">{s.total}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-[6px] p-2">
                  <p className="text-[10px] text-muted-foreground">出場</p>
                  <p className="text-sm font-bold text-foreground">{s.tournaments.length} 回</p>
                </div>
                <div className="bg-muted/50 rounded-[6px] p-2">
                  <p className="text-[10px] text-muted-foreground">勝率</p>
                  <p className="text-sm font-bold text-foreground">
                    {s.played === 0 ? "—" : `${Math.round((s.won / s.played) * 100)}%`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{s.won}勝{s.played - s.won}敗</p>
                </div>
                <div className="bg-muted/50 rounded-[6px] p-2">
                  <p className="text-[10px] text-muted-foreground">最高名次</p>
                  <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                    {s.bestRank ? (
                      <>
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                        {s.bestRank}位
                      </>
                    ) : "—"}
                  </p>
                </div>
              </div>

              {s.tournaments.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {s.tournaments.map((tt) => (
                    <button
                      key={tt.tournamentId}
                      onClick={() => navigate(`/game/tournament/${tt.tournamentId}`)}
                      className="w-full bg-muted/30 rounded-[6px] p-2 text-left flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{tt.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {tt.matchesPlayed}試合 {tt.matchesWon}勝
                          {tt.finalRank ? ` ・ 最終 ${tt.finalRank}位` : ""}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">+{tt.score}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </InnerPageLayout>
  );
};

export default MyResults;
