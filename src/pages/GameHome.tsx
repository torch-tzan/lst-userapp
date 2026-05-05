import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";
import AnimatedTabs from "@/components/AnimatedTabs";
import { useTournamentStore, CURRENT_USER, type Tournament } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { Trophy, Calendar, MapPin, Diamond, Lock, Users } from "lucide-react";

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function previousYearMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

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

// Hoisted to module scope to avoid re-creation on parent re-renders.
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
          {t.format === "singles" ? "シングルス" : "ダブルス"} / {t.capacity}枠
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
  const { tournaments, getMyEntries, computeMyMonthlyScore, computeRanking } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();

  const [tab, setTab] = useState("tournaments");

  const thisMonth = currentYearMonth();
  const prevMonth = previousYearMonth();

  const myScore = computeMyMonthlyScore(thisMonth);
  const myEntries = getMyEntries();
  const currentRanking = computeRanking(thisMonth);
  const lastRanking = computeRanking(prevMonth);
  const myCurrentRank = currentRanking.findIndex((r) => r.userId === CURRENT_USER);

  const upcomingAndOpen = tournaments.filter((t) =>
    ["upcoming", "registration_open", "in_progress"].includes(t.status)
  );
  const completed = tournaments.filter((t) => t.status === "completed");

  const TABS = [
    { key: "tournaments", label: "大会" },
    { key: "my-entries", label: "マイエントリー" },
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
          <div className="rounded-[12px] overflow-hidden shadow-lg bg-primary text-primary-foreground">
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium opacity-80">{formatYM(thisMonth)}（今月）</p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                  <p className="text-[9px] text-muted-foreground">今月積分</p>
                  <p className="text-base font-bold text-primary">{myScore.total}</p>
                </div>
                <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                  <p className="text-[9px] text-muted-foreground">即時順位</p>
                  <p className="text-base font-bold text-primary">
                    {myCurrentRank >= 0 ? `${myCurrentRank + 1}位` : "—"}
                  </p>
                </div>
                <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                  <p className="text-[9px] text-muted-foreground">出場</p>
                  <p className="text-base font-bold text-foreground">{myScore.tournaments.length}回</p>
                </div>
              </div>
            </div>
            <div className="bg-foreground px-5 py-2.5 flex items-center justify-between text-[11px] text-primary-foreground">
              {isPremium ? (
                <>
                  <span className="flex items-center gap-1">
                    <Diamond className="w-3 h-3 text-primary" />
                    プレミアム会員
                  </span>
                  <span>エントリー可能</span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    一般会員
                  </span>
                  <button onClick={() => navigate("/premium/plan")} className="text-primary font-bold">
                    プレミアム登録 ›
                  </button>
                </>
              )}
            </div>
          </div>
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
                  {completed.map((t) => <TournamentCard key={t.id} t={t} />)}
                </div>
              )}
            </>
          )}

          {tab === "my-entries" && (
            <>
              {!isPremium && (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
                  <Diamond className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">マイエントリーはプレミアム会員限定です</p>
                  <button
                    onClick={() => navigate("/premium/plan")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-bold mt-1"
                  >
                    プレミアム登録 ›
                  </button>
                </div>
              )}
              {isPremium && myEntries.length === 0 && (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
                  <p className="text-xs text-muted-foreground">エントリー中の大会はありません</p>
                </div>
              )}
              {isPremium && myEntries.map((t) => <TournamentCard key={t.id} t={t} />)}
            </>
          )}

          {tab === "ranking" && (
            <>
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">{formatYM(thisMonth)} 即時ランキング</p>
                </div>
              </div>
              {currentRanking.length === 0 ? (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
                  <p className="text-xs text-muted-foreground">今月のデータはまだありません</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                  {currentRanking.slice(0, 10).map((r, i) => {
                    const isMine = r.userId === CURRENT_USER;
                    return (
                      <div key={r.userId} className={`p-3 flex items-center gap-3 ${isMine ? "bg-primary/5" : ""}`}>
                        <div className="w-8 text-center font-bold text-sm text-muted-foreground">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isMine ? "text-primary" : "text-foreground"}`}>
                            {r.name}{isMine && <span className="text-[10px] ml-1">（自分）</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{r.played}試合 {r.won}勝</p>
                        </div>
                        <p className="text-sm font-bold text-primary">{r.score}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mt-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">{formatYM(prevMonth)} 最終ランキング</p>
                </div>
              </div>
              {lastRanking.length === 0 ? (
                <div className="bg-muted/30 border border-border rounded-[8px] p-4 text-center">
                  <p className="text-xs text-muted-foreground">先月のデータはありません</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                  {lastRanking.slice(0, 10).map((r, i) => {
                    const isMine = r.userId === CURRENT_USER;
                    return (
                      <div key={r.userId} className={`p-3 flex items-center gap-3 ${isMine ? "bg-primary/5" : ""}`}>
                        <div className="w-8 text-center font-bold text-sm text-muted-foreground">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isMine ? "text-primary" : "text-foreground"}`}>
                            {r.name}{isMine && <span className="text-[10px] ml-1">（自分）</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{r.played}試合 {r.won}勝</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">{r.score}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PhoneMockup>
  );
};

export default GameHome;
