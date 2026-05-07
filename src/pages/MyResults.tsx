import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import {
  useTournamentStore,
  CURRENT_USER,
  computePersonalSeasonalSummary,
  getSeasonOf,
  seasonKey,
  formatSeasonLabel,
  getRankTier,
  getPlayer,
  computeTotalPadelPoints,
  type Season,
} from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Diamond, ChevronRight, Trophy, TrendingUp } from "lucide-react";

const MyResults = () => {
  const navigate = useNavigate();
  const { tournaments, computeSeasonalRanking } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();

  if (!isPremium) {
    return (
      <InnerPageLayout title="大会成績">
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
          <Diamond className="w-8 h-8 text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">大会成績はプレミアム会員限定です</p>
          <button onClick={() => navigate("/premium/plan")} className="text-xs text-primary font-bold mt-1">
            プレミアム登録 ›
          </button>
        </div>
      </InnerPageLayout>
    );
  }

  const now = new Date();
  const currentSeason = getSeasonOf(now);
  const currentKey = seasonKey(currentSeason);

  // Find all seasons with user activity
  const seasonsWithActivity = new Set<string>();
  for (const t of tournaments) {
    if (t.status !== "completed") continue;
    const userIn = t.entries.some(
      (e) => e.status === "confirmed" && (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
    );
    if (!userIn) continue;
    seasonsWithActivity.add(seasonKey(getSeasonOf(t.scheduledAt)));
  }
  seasonsWithActivity.add(currentKey); // always include current

  const allSeasons = [...seasonsWithActivity].sort((a, b) => b.localeCompare(a));
  const seasonSummaries = allSeasons.map((sk) => computePersonalSeasonalSummary(CURRENT_USER, sk, tournaments));

  const liveSummary = seasonSummaries.find((s) => s.seasonKey === currentKey);
  const pastSummaries = seasonSummaries.filter((s) => s.seasonKey !== currentKey && (s.tournaments.length > 0 || s.played > 0));

  const ranking = computeSeasonalRanking(currentKey);
  const myRank = ranking.findIndex((r) => r.userId === CURRENT_USER);

  const me = getPlayer(CURRENT_USER);
  const myTier = me ? getRankTier(me.rating) : null;
  const totalPP = computeTotalPadelPoints(CURRENT_USER, tournaments);

  // Year set for dropdown
  const yearSet = new Set<string>(pastSummaries.map((s) => s.seasonKey.slice(0, 4)));
  const years = [...yearSet].sort((a, b) => b.localeCompare(a));
  const currentYear = String(now.getFullYear());
  const defaultYear = years.includes(currentYear) ? currentYear : (years[0] ?? currentYear);
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);

  const visibleSeasons = pastSummaries.filter((s) => s.seasonKey.slice(0, 4) === selectedYear);

  return (
    <InnerPageLayout title="大会成績">
      <p className="text-[11px] text-muted-foreground mb-3">あなたの参加履歴</p>

      {/* Live this-season hero card */}
      {liveSummary && (
        <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] opacity-80">{formatSeasonLabel(currentSeason)}（進行中）</p>
            {myTier && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded bg-white/10 ${myTier.cls}`}>
                {myTier.emoji} {myTier.label}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold text-primary">{me?.rating ?? 1400}</span>
            <span className="text-sm opacity-80">レーティング</span>
            <span className={`text-xs ml-2 font-bold flex items-center gap-0.5 ${liveSummary.ratingChange >= 0 ? "text-primary" : "text-destructive"}`}>
              {liveSummary.ratingChange >= 0 && <TrendingUp className="w-3 h-3" />}
              {liveSummary.ratingChange >= 0 ? "+" : ""}{liveSummary.ratingChange}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] opacity-70">即時順位</p>
              <p className="text-base font-bold">{myRank >= 0 ? `${myRank + 1}位` : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] opacity-70">勝率</p>
              <p className="text-base font-bold">{liveSummary.played === 0 ? "—" : `${Math.round((liveSummary.won / liveSummary.played) * 100)}%`}</p>
              <p className="text-[10px] opacity-70">{liveSummary.won}勝{liveSummary.played - liveSummary.won}敗</p>
            </div>
            <div>
              <p className="text-[10px] opacity-70">PP</p>
              <p className="text-base font-bold">{totalPP.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Past seasons — year dropdown */}
      {pastSummaries.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-xs text-muted-foreground">過去の参加記録はまだありません</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-foreground">過去のシーズン</p>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}年</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {visibleSeasons.length === 0 ? (
            <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
              <p className="text-xs text-muted-foreground">{selectedYear}年の参加記録はありません</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
              {visibleSeasons.map((s) => {
                const trophy = s.bestRank === 1 ? "🥇" : s.bestRank === 2 ? "🥈" : s.bestRank === 3 ? "🥉" : null;
                return (
                  <button
                    key={s.seasonKey}
                    onClick={() => navigate(`/game/my-results/${s.seasonKey}`)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        {formatSeasonLabel({ year: parseInt(s.seasonKey.split("-Q")[0]), quarter: parseInt(s.seasonKey.split("-Q")[1]) as 1 | 2 | 3 | 4 })}
                        {trophy && <span className="text-base">{trophy}</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {s.tournaments.length} 大会 ・ {s.won}勝{s.played - s.won}敗
                        {s.bestRank ? ` ・ 最高 ${s.bestRank}位` : ""}
                        ・ レート変動 {s.ratingChange >= 0 ? "+" : ""}{s.ratingChange}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary">{s.padelPoints}<span className="text-[10px] ml-0.5">PP</span></p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </InnerPageLayout>
  );
};

export default MyResults;
