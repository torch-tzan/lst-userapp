import { useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import {
  getPlayer,
  getRankTier,
  getPlayerSeasonalStats,
  getPlayerRecentMatches,
  getSeasonOf,
  seasonKey,
  formatSeasonLabel,
  CURRENT_USER,
  type SkillLevel,
} from "@/lib/tournamentStore";
import { User, Calendar, MapPin, TrendingUp, TrendingDown } from "lucide-react";

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
  const isMe = userId === CURRENT_USER;

  // ── リーグ戦績 — 今シーズン（順位ページと同じ SEEDED_RANKINGS から取得） ──
  const currentSeason = getSeasonOf(new Date());
  const currentSeasonKey = seasonKey(currentSeason);
  const seasonStats = getPlayerSeasonalStats(userId, currentSeasonKey);
  const played = seasonStats?.played ?? 0;
  const won = seasonStats?.won ?? 0;
  const ratingChange = seasonStats?.ratingChange ?? 0;
  const winRate = played === 0 ? "—" : `${Math.round((won / played) * 100)}%`;

  // ── リーグ参加経験 — SEEDED stats から合成（順位ページと数字が対応） ──
  const recent5 = getPlayerRecentMatches(userId, currentSeasonKey).slice(0, 5);

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

      {/* リーグ戦績 grid — 今シーズン（順位と同じ数字） */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-foreground">リーグ戦績</p>
        <span className="text-[10px] text-muted-foreground">{formatSeasonLabel(currentSeason)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5 text-center">
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[10px] text-muted-foreground">出場</p>
          <p className="text-base font-bold text-foreground mt-1">{played}</p>
          <p className="text-[10px] text-muted-foreground">試合</p>
        </div>
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[10px] text-muted-foreground">勝率</p>
          <p className="text-base font-bold text-foreground mt-1">{winRate}</p>
          <p className="text-[10px] text-muted-foreground">
            {won}勝{played - won}敗
          </p>
        </div>
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[10px] text-muted-foreground">レート変動</p>
          <p
            className={`text-base font-bold mt-1 flex items-center justify-center gap-0.5 ${
              ratingChange > 0
                ? "text-primary"
                : ratingChange < 0
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {ratingChange > 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : ratingChange < 0 ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : null}
            {ratingChange > 0 ? "+" : ""}
            {ratingChange}
          </p>
        </div>
      </div>

      {/* リーグ参加経験 list */}
      {recent5.length > 0 ? (
        <>
          <p className="text-sm font-bold text-foreground mb-2">リーグ参加経験</p>
          <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden mb-5">
            {recent5.map((rm) => (
              <div key={rm.id} className="w-full p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        rm.won
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {rm.won ? "勝" : "負"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        rm.isHost
                          ? "bg-accent-yellow/15 text-foreground border-accent-yellow/40"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {rm.isHost ? "ホスト" : "ゲスト"}
                    </span>
                    <span className="text-sm font-bold text-foreground">{rm.score}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formatDate(rm.date)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-0.5">
                  <MapPin className="w-3 h-3" />
                  {rm.venue}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  パートナー：{rm.partnerName} ・ vs {rm.opponentNames.join(" / ")}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-muted/30 border border-border rounded-[8px] p-4 text-center mb-5">
          <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">リーグ参加経験はまだありません</p>
        </div>
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
