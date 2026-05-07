import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";
import AnimatedTabs from "@/components/AnimatedTabs";
import {
  useTournamentStore,
  CURRENT_USER,
  getSeasonOf,
  seasonKey,
  formatSeasonLabel,
  getRankTier,
  getPlayer,
  type Tournament,
} from "@/lib/tournamentStore";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { useSubscription } from "@/lib/subscriptionStore";
import MyEntryCard from "@/components/game/MyEntryCard";
import { Trophy, Calendar, MapPin, Diamond, Lock, Users, Plus } from "lucide-react";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "近日開催",
  registration_open: "エントリー受付中",
  registration_closed: "受付終了",
  in_progress: "開催中",
  completed: "終了",
};

const STATUS_CLS: Record<string, string> = {
  upcoming: "bg-muted text-muted-foreground",
  registration_open: "bg-primary/10 text-primary",
  registration_closed: "bg-accent-yellow/10 text-accent-yellow",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-muted text-muted-foreground",
};

const TournamentCard = ({ t }: { t: Tournament }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/game/tournament/${t.id}`)}
      className="w-full bg-card border border-border rounded-[8px] p-4 text-left hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_CLS[t.status]}`}>
          {STATUS_LABEL[t.status]}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">
          ダブルス / {t.capacity}枠
        </span>
      </div>
      <p className="text-sm font-bold text-foreground">{t.title}</p>
      <div className="mt-2 space-y-0.5">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDateTime(t.scheduledAt)}
        </p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {t.venue}
        </p>
        {t.status === "registration_open" && (
          <p className="text-[11px] text-primary font-bold flex items-center gap-1 mt-1.5">
            <Users className="w-3 h-3" />
            {t.entries.length} / {t.capacity} エントリー済
          </p>
        )}
      </div>
    </button>
  );
};

const GameHome = () => {
  const navigate = useNavigate();
  const { tournaments, getMyEntries, computeMySeasonalSummary, computeSeasonalRanking, getPendingInvitesForUser, computeMyTotalPadelPoints } = useTournamentStore();
  const { getOpenMatches, getMyHostedMatches, getMyApplications } = useLeagueMatchBoardStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();

  const [tab, setTab] = useState("tournaments");
  const [rankingTab, setRankingTab] = useState<"current" | "last">("current");

  const now = new Date();
  const currentSeason = getSeasonOf(now);
  const prevSeason = currentSeason.quarter === 1
    ? { year: currentSeason.year - 1, quarter: 4 as const }
    : { year: currentSeason.year, quarter: (currentSeason.quarter - 1) as 1 | 2 | 3 | 4 };

  const currentSeasonKey = seasonKey(currentSeason);
  const prevSeasonKey = seasonKey(prevSeason);

  const mySeasonSummary = computeMySeasonalSummary(currentSeasonKey);
  const myEntries = getMyEntries();
  const currentRanking = computeSeasonalRanking(currentSeasonKey);
  const lastRanking = computeSeasonalRanking(prevSeasonKey);
  const myCurrentRank = currentRanking.findIndex((r) => r.userId === CURRENT_USER);

  const me = getPlayer(CURRENT_USER);
  const myTier = me ? getRankTier(me.rating) : null;
  const myPadelPoints = computeMyTotalPadelPoints();

  const pendingInviteCount = getPendingInvitesForUser().length;
  const myLeagueOpenCount =
    getMyHostedMatches().filter((m) => m.status === "open" || m.status === "filled").length +
    getMyApplications().filter(({ match }) => match.status === "open" || match.status === "filled").length;
  const allOpenLeagueMatches = getOpenMatches();

  const upcomingAndOpen = tournaments.filter((t) =>
    ["upcoming", "registration_open", "in_progress"].includes(t.status)
  );
  const completed = tournaments.filter((t) => t.status === "completed");

  const TABS = [
    { key: "tournaments", label: "大会" },
    { key: "league", label: "リーグ", badge: myLeagueOpenCount || undefined },
    { key: "my-entries", label: "マイエントリー", badge: pendingInviteCount || undefined },
    { key: "ranking", label: "ランキング" },
  ];

  return (
    <PhoneMockup bottomNav={<BottomNav active={2} />}>
      <div className="bg-background pb-4">
        <header className="bg-gray-5 py-3 pb-[120px]">
          <div className="flex items-center justify-center px-[20px]">
            <h1 className="text-lg font-bold text-primary-foreground">ゲーム</h1>
          </div>
        </header>

        {/* Hero */}
        <div className="-mt-[100px] relative z-10 px-[20px]">
          {isPremium ? (
            <button
              onClick={() => navigate("/game/my-results")}
              className="w-full text-left rounded-[12px] overflow-hidden shadow-lg bg-primary text-primary-foreground"
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-medium opacity-80">{formatSeasonLabel(currentSeason)}（今シーズン）</p>
                  {myTier && (
                    <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded font-bold">
                      {myTier.emoji} {myTier.label} ・ {me?.rating}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                    <p className="text-[9px] text-muted-foreground">レーティング変動</p>
                    <p className={`text-base font-bold ${mySeasonSummary.ratingChange >= 0 ? "text-primary" : "text-destructive"}`}>
                      {mySeasonSummary.ratingChange >= 0 ? "+" : ""}{mySeasonSummary.ratingChange}
                    </p>
                  </div>
                  <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                    <p className="text-[9px] text-muted-foreground">即時順位</p>
                    <p className="text-base font-bold text-primary">
                      {myCurrentRank >= 0 ? `${myCurrentRank + 1}位` : "—"}
                    </p>
                  </div>
                  <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                    <p className="text-[9px] text-muted-foreground">PP</p>
                    <p className="text-base font-bold text-foreground">{myPadelPoints.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-foreground px-5 py-2.5 flex items-center justify-between text-[11px] text-primary-foreground">
                <span className="flex items-center gap-1">
                  <Diamond className="w-3 h-3 text-primary" />
                  プレミアム会員
                </span>
                <span>エントリー可能</span>
              </div>
            </button>
          ) : (
            <div className="rounded-[12px] overflow-hidden shadow-lg bg-primary text-primary-foreground">
              <div className="px-5 py-4">
                <p className="text-[11px] font-medium opacity-80">{formatSeasonLabel(currentSeason)}</p>
                <p className="text-base font-bold mt-2">プレミアム会員になってリーグに参加</p>
                <p className="text-[11px] opacity-80 mt-1">大会・リーグ参加・成績確認はプレミアム限定</p>
              </div>
              <div className="bg-foreground px-5 py-2.5 flex items-center justify-between text-[11px] text-primary-foreground">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  一般会員
                </span>
                <button onClick={() => navigate("/premium/plan")} className="text-primary font-bold">
                  プレミアム登録 ›
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5">
          <AnimatedTabs tabs={TABS} activeKey={tab} onChange={setTab} className="px-[20px]" />
        </div>

        <div className="px-[20px] mt-4 space-y-5">
          {tab === "tournaments" && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground">開催予定・受付中</p>
                {upcomingAndOpen.map((t) => <TournamentCard key={t.id} t={t} />)}
              </div>
              {completed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">過去の大会</p>
                  {completed.slice(0, 5).map((t) => <TournamentCard key={t.id} t={t} />)}
                </div>
              )}
            </>
          )}

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
                <>
                  <button
                    onClick={() => navigate("/game/league")}
                    className="w-full bg-card border-2 border-primary/30 rounded-[8px] p-4 flex items-center gap-3 text-left hover:border-primary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">リーグ募集板を開く</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{allOpenLeagueMatches.length} 件の募集が進行中</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate("/game/league/new")}
                    className="w-full bg-primary text-primary-foreground rounded-[8px] p-4 flex items-center gap-3 text-left hover:opacity-90"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">募集を作成</p>
                      <p className="text-[11px] opacity-80 mt-0.5">時間・場所・希望レベルを指定して仲間を集める</p>
                    </div>
                  </button>
                  <div className="bg-muted/30 border border-border rounded-[8px] p-3 text-[11px] text-muted-foreground">
                    リーグ試合では、ホストが場館・時間を決めて募集 → 参加者が応募 → ホストが承認 → 4 名揃ったら成立。場館代は各自負担です。
                  </div>
                </>
              )}
            </>
          )}

          {tab === "my-entries" && (
            <>
              {!isPremium && (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
                  <Diamond className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">マイエントリーはプレミアム会員限定です</p>
                  <button onClick={() => navigate("/premium/plan")} className="inline-flex items-center gap-1 text-xs text-primary font-bold mt-1">
                    プレミアム登録 ›
                  </button>
                </div>
              )}
              {isPremium && myEntries.length === 0 && (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
                  <p className="text-xs text-muted-foreground">エントリー中の大会はありません</p>
                </div>
              )}
              {isPremium && myEntries.map((t) => {
                const myEntry = t.entries.find(
                  (e) =>
                    (e.status === "confirmed" || e.status === "pending_partner_confirmation") &&
                    (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
                );
                if (!myEntry) return null;
                return <MyEntryCard key={t.id} tournament={t} myEntry={myEntry} />;
              })}
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
                return (
                  <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                    {rows.slice(0, 10).map((r, i) => {
                      const isMine = r.userId === CURRENT_USER;
                      const tier = getRankTier(r.rating);
                      return (
                        <button
                          key={r.userId}
                          onClick={() => navigate(`/profile/${r.userId}`)}
                          className={`w-full p-3 flex items-center gap-3 text-left hover:bg-muted/30 ${isMine ? "bg-primary/5" : ""}`}
                        >
                          <div className="w-8 text-center font-bold text-sm text-muted-foreground">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate flex items-center gap-1 ${isMine ? "text-primary" : "text-foreground"}`}>
                              {r.name}
                              <span className="text-[10px]">{tier.emoji}</span>
                              {isMine && <span className="text-[10px] ml-1">（自分）</span>}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{r.played}試合 {r.won}勝 ・ 変動 {r.ratingChange >= 0 ? "+" : ""}{r.ratingChange}</p>
                          </div>
                          <p className={`text-sm font-bold ${rankingTab === "current" ? "text-primary" : "text-foreground"}`}>{r.rating}</p>
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
