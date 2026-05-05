import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, computePersonalMonthlyScore } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { deriveUserBadges } from "@/lib/tournamentBadges";
import LiveMonthCard from "@/components/game/LiveMonthCard";
import MonthRecapCard from "@/components/game/MonthRecapCard";
import TrophyChip from "@/components/game/TrophyChip";
import { Diamond, ChevronDown, ChevronUp } from "lucide-react";

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

  // year grouping
  const yearGroups = new Map<string, typeof pastMonths>();
  for (const s of pastMonths) {
    const year = s.yearMonth.slice(0, 4);
    if (!yearGroups.has(year)) yearGroups.set(year, []);
    yearGroups.get(year)!.push(s);
  }
  const years = [...yearGroups.keys()].sort((a, b) => b.localeCompare(a));
  const currentYear = String(now.getFullYear());
  const [openYears, setOpenYears] = useState<Set<string>>(new Set([currentYear]));
  const toggleYear = (y: string) => {
    const next = new Set(openYears);
    next.has(y) ? next.delete(y) : next.add(y);
    setOpenYears(next);
  };

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

      {/* Year accordion */}
      {pastMonths.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">過去の参加記録はまだありません</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-bold text-foreground mb-2">年度成績</p>
          <div className="space-y-3">
            {years.map((year) => {
              const monthsInYear = yearGroups.get(year)!;
              const totalScore = monthsInYear.reduce((sum, s) => sum + s.total, 0);
              const totalTournaments = monthsInYear.reduce((sum, s) => sum + s.tournaments.length, 0);
              const bestRank = monthsInYear.reduce<number | null>(
                (best, s) => (s.bestRank !== null && (best === null || s.bestRank < best) ? s.bestRank : best),
                null
              );
              const isOpen = openYears.has(year);
              return (
                <div key={year} className="bg-card border border-border rounded-[8px] overflow-hidden">
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{year}年</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        出場 {totalTournaments} 大会 ・ 累計 {totalScore} 積分
                        {bestRank ? ` ・ 最高 ${bestRank}位` : ""}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="border-t border-border p-3 bg-muted/10 space-y-2">
                      {monthsInYear.map((s) => (
                        <MonthRecapCard key={s.yearMonth} score={s} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </InnerPageLayout>
  );
};

export default MyResults;
