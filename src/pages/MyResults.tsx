import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, computePersonalMonthlyScore } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { deriveUserBadges } from "@/lib/tournamentBadges";
import LiveMonthCard from "@/components/game/LiveMonthCard";
import TrophyChip from "@/components/game/TrophyChip";
import { Diamond, ChevronRight } from "lucide-react";

function yearMonthsBetween(startIso: string, endDate: Date): string[] {
  const start = new Date(startIso);
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months.reverse();
}

function formatYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

function nextRankCta(currentRank: number | null, currentScore: number, currentRanking: { score: number; userId: string }[]): string | undefined {
  if (currentRank === null || currentRank <= 3) return undefined;
  const targetIdx = 2; // 3位
  const targetScore = currentRanking[targetIdx]?.score ?? 0;
  const diff = targetScore - currentScore;
  if (diff <= 0) return undefined;
  return `あと ${diff} 点で 3位`;
}

const MyResults = () => {
  const navigate = useNavigate();
  const { tournaments, computeRanking } = useTournamentStore();
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

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const months = yearMonthsBetween(periodStart, now);
  const monthScores = months.map((ym) => computePersonalMonthlyScore(CURRENT_USER, ym, tournaments));
  const liveScore = monthScores.find((s) => s.yearMonth === thisMonth);
  const pastMonths = monthScores.filter((s) => s.yearMonth !== thisMonth && (s.tournaments.length > 0 || s.total > 0));

  const ranking = computeRanking(thisMonth);
  const myRank = ranking.findIndex((r) => r.userId === CURRENT_USER);
  const cta = liveScore ? nextRankCta(myRank >= 0 ? myRank + 1 : null, liveScore.total, ranking) : undefined;

  const badges = deriveUserBadges(CURRENT_USER, tournaments);

  // Group past months by year
  const yearGroups = new Map<string, typeof pastMonths>();
  for (const s of pastMonths) {
    const year = s.yearMonth.slice(0, 4);
    if (!yearGroups.has(year)) yearGroups.set(year, []);
    yearGroups.get(year)!.push(s);
  }
  const years = [...yearGroups.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <InnerPageLayout title="大会成績">
      <p className="text-[11px] text-muted-foreground mb-3">
        プレミアム会員期間（{new Date(periodStart).getFullYear()}年
        {new Date(periodStart).getMonth() + 1}月{new Date(periodStart).getDate()}日〜）の成績
      </p>

      {/* Live this-month card */}
      {liveScore && (
        <div className="mb-5">
          <LiveMonthCard
            variant="full"
            yearMonthLabel={formatYM(liveScore.yearMonth)}
            totalScore={liveScore.total}
            rank={myRank >= 0 ? myRank + 1 : null}
            played={liveScore.played}
            cta={cta}
          />
        </div>
      )}

      {/* Trophy section */}
      {badges.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-bold text-foreground mb-2">獲得トロフィー</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-[20px] px-[20px]">
            {badges.map((b) => (
              <TrophyChip key={b.type} badge={b} />
            ))}
          </div>
        </div>
      )}

      {/* Past months — flat year-grouped list */}
      {pastMonths.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">過去の参加記録はまだありません</p>
        </div>
      ) : (
        <div className="space-y-5">
          {years.map((year) => {
            const monthsInYear = yearGroups.get(year)!;
            return (
              <div key={year}>
                <p className="text-sm font-bold text-foreground mb-2">{year}年</p>
                <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                  {monthsInYear.map((s) => {
                    const trophy = s.bestRank === 1 ? "🥇" : s.bestRank === 2 ? "🥈" : s.bestRank === 3 ? "🥉" : null;
                    return (
                      <button
                        key={s.yearMonth}
                        onClick={() => navigate(`/game/my-results/${s.yearMonth}`)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            {formatYM(s.yearMonth)}
                            {trophy && <span className="text-base">{trophy}</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            出場 {s.tournaments.length} 大会 ・ {s.won}勝{s.played - s.won}敗
                            {s.bestRank ? ` ・ 最高 ${s.bestRank}位` : ""}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary">{s.total}</p>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </InnerPageLayout>
  );
};

export default MyResults;
