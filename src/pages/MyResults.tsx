import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, computePersonalMonthlyScore } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import LiveMonthCard from "@/components/game/LiveMonthCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Diamond, ChevronRight } from "lucide-react";

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

  if (!isPremium) {
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

  // Find earliest year with any user activity (completed entry where user participated)
  const userYearMonths = new Set<string>();
  for (const t of tournaments) {
    if (t.status !== "completed") continue;
    const userIn = t.entries.some(
      (e) =>
        e.status === "confirmed" &&
        (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
    );
    if (!userIn) continue;
    const d = new Date(t.scheduledAt);
    userYearMonths.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  // Always include current month so it appears for live ranking
  userYearMonths.add(thisMonth);

  const monthScores = [...userYearMonths]
    .map((ym) => computePersonalMonthlyScore(CURRENT_USER, ym, tournaments))
    .filter((s) => s.yearMonth === thisMonth || s.tournaments.length > 0 || s.total > 0)
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));

  const liveScore = monthScores.find((s) => s.yearMonth === thisMonth);
  const pastMonths = monthScores.filter((s) => s.yearMonth !== thisMonth);

  const ranking = computeRanking(thisMonth);
  const myRank = ranking.findIndex((r) => r.userId === CURRENT_USER);
  const cta = liveScore ? nextRankCta(myRank >= 0 ? myRank + 1 : null, liveScore.total, ranking) : undefined;

  // Year set for dropdown
  const yearSet = new Set<string>(pastMonths.map((s) => s.yearMonth.slice(0, 4)));
  const years = [...yearSet].sort((a, b) => b.localeCompare(a));
  const currentYear = String(now.getFullYear());
  const defaultYear = years.includes(currentYear) ? currentYear : years[0];
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear ?? currentYear);

  const visibleMonths = pastMonths.filter((s) => s.yearMonth.slice(0, 4) === selectedYear);

  return (
    <InnerPageLayout title="大会成績">
      <p className="text-[11px] text-muted-foreground mb-3">
        あなたの参加履歴
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

      {/* Past months — year dropdown + flat list */}
      {pastMonths.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">過去の参加記録はまだありません</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-foreground">過去の成績</p>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {visibleMonths.length === 0 ? (
            <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
              <p className="text-xs text-muted-foreground">{selectedYear}年の参加記録はありません</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
              {visibleMonths.map((s) => (
                <button
                  key={s.yearMonth}
                  onClick={() => navigate(`/game/my-results/${s.yearMonth}`)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{formatYM(s.yearMonth)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      出場 {s.tournaments.length} 大会 ・ {s.won}勝{s.played - s.won}敗
                      {s.bestRank ? ` ・ 最高 ${s.bestRank}位` : ""}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">{s.total}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </InnerPageLayout>
  );
};

export default MyResults;
