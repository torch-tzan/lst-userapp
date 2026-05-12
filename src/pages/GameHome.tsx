import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";
import SegmentedTabs from "@/components/SegmentedTabs";
import {
  useTournamentStore,
  CURRENT_USER,
  getSeasonOf,
  seasonKey,
  formatSeasonLabel,
  getRankTier,
  getPlayer,
} from "@/lib/tournamentStore";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { useSubscription } from "@/lib/subscriptionStore";
import LeagueMatchList from "@/components/game/LeagueMatchList";
import TierProgressHero from "@/components/game/TierProgressHero";
import { Diamond } from "lucide-react";

const GameHome = () => {
  const navigate = useNavigate();
  const { computeSeasonalRanking } = useTournamentStore();
  const { getMyHostedMatches, getMyApplications } = useLeagueMatchBoardStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();

  const [tab, setTab] = useState("league");
  const [rankingTab, setRankingTab] = useState<"current" | "last">("current");

  const now = new Date();
  const currentSeason = getSeasonOf(now);
  const prevSeason = currentSeason.quarter === 1
    ? { year: currentSeason.year - 1, quarter: 4 as const }
    : { year: currentSeason.year, quarter: (currentSeason.quarter - 1) as 1 | 2 | 3 | 4 };

  const currentSeasonKey = seasonKey(currentSeason);
  const prevSeasonKey = seasonKey(prevSeason);

  const currentRanking = computeSeasonalRanking(currentSeasonKey);
  const lastRanking = computeSeasonalRanking(prevSeasonKey);
  const myCurrentRank = currentRanking.findIndex((r) => r.userId === CURRENT_USER);

  const me = getPlayer(CURRENT_USER);

  const myLeagueOpenCount =
    getMyHostedMatches().filter((m) => m.status === "open" || m.status === "filled").length +
    getMyApplications().filter(({ match }) => match.status === "open" || match.status === "filled").length;

  const TABS = [
    { key: "league", label: "リーグ", badge: myLeagueOpenCount || undefined },
    { key: "ranking", label: "順位" },
  ];

  return (
    <PhoneMockup bottomNav={<BottomNav active={2} />}>
      <div className="bg-background pb-4">
        {/* Dark hero zone: title + TierProgressHero (or non-premium CTA) */}
        <header className="bg-gray-5 px-[20px] pt-3 pb-5">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-lg font-bold text-primary-foreground">ゲーム</h1>
          </div>
          {isPremium ? (
            <TierProgressHero
              rating={me?.rating ?? 1400}
              season={currentSeason}
              rank={myCurrentRank >= 0 ? myCurrentRank + 1 : -1}
              totalRanked={currentRanking.length}
              onClick={() => navigate("/game/my-results")}
            />
          ) : (
            <div className="text-center space-y-2 py-2">
              <p className="text-[11px] text-primary-foreground/70">{formatSeasonLabel(currentSeason)}</p>
              <p className="text-sm font-bold text-primary-foreground">
                プレミアム会員になってリーグに参加
              </p>
              <p className="text-[11px] text-primary-foreground/70">
                大会・リーグ参加・成績確認はプレミアム限定
              </p>
              <button
                onClick={() => navigate("/premium/plan")}
                className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-[6px] mt-1"
              >
                <Diamond className="w-3 h-3" />
                プレミアム登録
              </button>
            </div>
          )}
        </header>

        <div className="mt-3 px-[20px]">
          <SegmentedTabs tabs={TABS} activeKey={tab} onChange={setTab} />
        </div>

        <div className="px-[20px] mt-4 space-y-5">
          {tab === "league" && (
            <>
              {!isPremium ? (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
                  <Diamond className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">リーグはプレミアム会員限定です</p>
                  <button onClick={() => navigate("/premium/plan")} className="text-xs text-primary font-bold mt-1">
                    プレミアム登録 ›
                  </button>
                </div>
              ) : (
                <LeagueMatchList />
              )}
            </>
          )}

          {tab === "ranking" && (
            <>
              <div className="inline-flex bg-muted rounded-full p-1 self-start">
                <button
                  onClick={() => setRankingTab("current")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    rankingTab === "current" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  今シーズン（{formatSeasonLabel(currentSeason)}）
                </button>
                <button
                  onClick={() => setRankingTab("last")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    rankingTab === "last" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  前シーズン（{formatSeasonLabel(prevSeason)}）
                </button>
              </div>

              {(() => {
                const rows = rankingTab === "current" ? currentRanking : lastRanking;
                if (rows.length === 0) {
                  return (
                    <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
                      <p className="text-xs text-muted-foreground">{rankingTab === "current" ? "今シーズン" : "前シーズン"}のデータはまだありません</p>
                    </div>
                  );
                }
                const MEDAL_EMOJI = ["🥇", "🥈", "🥉"];
                return (
                  <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                    {rows.slice(0, 10).map((r, i) => {
                      const isMine = r.userId === CURRENT_USER;
                      const isPodium = i < 3;
                      const tier = getRankTier(r.rating);
                      return (
                        <button
                          key={r.userId}
                          onClick={() => navigate(`/profile/${r.userId}`)}
                          className={`w-full p-3 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors ${
                            isMine ? "bg-primary/10 border-l-[4px] border-l-primary" : ""
                          }`}
                        >
                          <div className="w-10 flex items-center justify-center">
                            {isPodium ? (
                              <span className="text-2xl leading-none">{MEDAL_EMOJI[i]}</span>
                            ) : (
                              <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate flex items-center gap-1 ${isMine ? "text-primary" : "text-foreground"}`}>
                              {r.name}
                              <span className="text-[12px]">{tier.emoji}</span>
                              {isMine && <span className="text-[10px] ml-1 text-primary">（自分）</span>}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {r.played}試合 {r.won}勝 ・ 変動 {r.ratingChange >= 0 ? "+" : ""}{r.ratingChange}
                            </p>
                          </div>
                          <p className={`text-base font-bold ${rankingTab === "current" ? "text-primary" : "text-foreground"}`}>
                            {r.rating}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </PhoneMockup>
  );
};

export default GameHome;
