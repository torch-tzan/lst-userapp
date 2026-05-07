import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import {
  useTournamentStore,
  getPlayer,
  getRankTier,
  computeTotalPadelPoints,
  CURRENT_USER,
  type SkillLevel,
} from "@/lib/tournamentStore";
import { Trophy, User, Award, Diamond, Calendar } from "lucide-react";

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: "初心者",
  intermediate: "中級",
  advanced: "上級",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { tournaments } = useTournamentStore();

  if (!userId) {
    return (
      <InnerPageLayout title="プレイヤー">
        <p className="text-center text-sm text-muted-foreground">見つかりません</p>
      </InnerPageLayout>
    );
  }

  const player = getPlayer(userId);
  if (!player) {
    return (
      <InnerPageLayout title="プレイヤー">
        <p className="text-center text-sm text-muted-foreground">プレイヤーが見つかりません</p>
      </InnerPageLayout>
    );
  }

  const tier = getRankTier(player.rating);
  const padelPoints = computeTotalPadelPoints(userId, tournaments);
  const isMe = userId === CURRENT_USER;

  // Stats from completed tournaments
  let totalPlayed = 0;
  let totalWon = 0;
  let bestRank: number | null = null;
  const recentTournaments: { id: string; title: string; date: string; finalRank: number | null }[] = [];

  for (const t of tournaments) {
    if (t.status !== "completed" || !t.results) continue;
    const entry = t.entries.find(
      (e) =>
        e.status === "confirmed" &&
        (e.registrantUserId === userId || e.partnerUserId === userId)
    );
    if (!entry) continue;
    let mPlayed = 0;
    let mWon = 0;
    for (const m of t.results.matches) {
      const onSide1 = m.p1UserId === userId || m.p1PartnerId === userId;
      const onSide2 = m.p2UserId === userId || m.p2PartnerId === userId;
      if (!onSide1 && !onSide2) continue;
      mPlayed++;
      const isWin = (onSide1 && m.winnerSide === 1) || (onSide2 && m.winnerSide === 2);
      if (isWin) mWon++;
    }
    totalPlayed += mPlayed;
    totalWon += mWon;
    const ranking = t.results.rankings.find(
      (r) => r.userId === userId || r.partnerId === userId
    );
    if (ranking && (bestRank == null || ranking.rank < bestRank)) bestRank = ranking.rank;
    recentTournaments.push({
      id: t.id,
      title: t.title,
      date: t.scheduledAt,
      finalRank: ranking?.rank ?? null,
    });
  }

  recentTournaments.sort((a, b) => b.date.localeCompare(a.date));
  const recent5 = recentTournaments.slice(0, 5);

  const winRate =
    totalPlayed === 0 ? "—" : `${Math.round((totalWon / totalPlayed) * 100)}%`;

  return (
    <InnerPageLayout title="プレイヤー">
      {/* Hero card */}
      <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5 mb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold">{player.name}</p>
            {isMe && <p className="text-[10px] text-primary mt-0.5">（あなた）</p>}
            <p className="text-[11px] opacity-70 mt-0.5">
              自申告レベル：{SKILL_LABEL[player.skillLevel]}
            </p>
          </div>
        </div>

        {/* Rating + tier */}
        <div className="bg-white/5 rounded-[8px] p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] opacity-70">レーティング</p>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded bg-white/10 ${tier.cls}`}
            >
              {tier.emoji} {tier.label}
            </span>
          </div>
          <p className="text-3xl font-bold text-primary">{player.rating}</p>
        </div>
      </div>

      {/* Stats grid */}
      <p className="text-sm font-bold text-foreground mb-2">戦績</p>
      <div className="grid grid-cols-3 gap-2 mb-5 text-center">
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[10px] text-muted-foreground">総試合</p>
          <p className="text-base font-bold text-foreground mt-1">{totalPlayed}</p>
        </div>
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[10px] text-muted-foreground">勝率</p>
          <p className="text-base font-bold text-foreground mt-1">{winRate}</p>
          <p className="text-[10px] text-muted-foreground">
            {totalWon}勝{totalPlayed - totalWon}敗
          </p>
        </div>
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[10px] text-muted-foreground">最高名次</p>
          <p className="text-base font-bold text-foreground mt-1 flex items-center justify-center gap-1">
            {bestRank ? (
              <>
                <Trophy className="w-3.5 h-3.5 text-primary" />
                {bestRank}位
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {/* Padel Points */}
      <div className="bg-primary/5 border border-primary/30 rounded-[8px] p-3 mb-5 flex items-center gap-3">
        <Diamond className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground">累計 Padel Points</p>
          <p className="text-xl font-bold text-primary">
            {padelPoints.toLocaleString()}{" "}
            <span className="text-xs font-medium">PP</span>
          </p>
        </div>
      </div>

      {/* Recent tournaments */}
      {recent5.length > 0 && (
        <>
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-muted-foreground" />
            最近の大会
          </p>
          <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden mb-5">
            {recent5.map((rt) => (
              <button
                key={rt.id}
                onClick={() => navigate(`/game/tournament/${rt.id}`)}
                className="w-full p-3 text-left hover:bg-muted/30 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{rt.title}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {formatDate(rt.date)}
                  </p>
                </div>
                {rt.finalRank && (
                  <span className="text-xs font-bold text-foreground">{rt.finalRank}位</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Note about privacy */}
      <p className="text-[10px] text-muted-foreground text-center">
        メールアドレスや電話番号は公開されません。
        <br />
        試合のお誘いはマイIDから行ってください。
      </p>
    </InnerPageLayout>
  );
};

export default Profile;
