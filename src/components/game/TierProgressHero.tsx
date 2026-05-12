import { Lock } from "lucide-react";
import {
  RANK_TIER_RANGES,
  getRankTier,
  formatSeasonLabel,
  seasonDaysRemaining,
  type Season,
} from "@/lib/tournamentStore";

interface Props {
  rating: number;
  season: Season;
  rank: number; // 1-based; -1 if unranked
  totalRanked: number;
  onClick?: () => void;
}

const TierProgressHero = ({ rating, season, rank, totalRanked, onClick }: Props) => {
  const tier = getRankTier(rating);
  const tierIndex = RANK_TIER_RANGES.findIndex((t) => t.tier === tier.tier);
  const nextTier = RANK_TIER_RANGES[tierIndex + 1] ?? null;
  const progress = nextTier
    ? Math.min(100, Math.max(0, ((rating - tier.min) / (nextTier.min - tier.min)) * 100))
    : 100;
  const daysLeft = seasonDaysRemaining(season);
  const rankLabel = rank > 0 ? `${rank}位／${totalRanked}人` : "未ランク";

  const content = (
    <div className="space-y-4">
      {/* 5 tier shields row */}
      <div className="flex items-center justify-between gap-1.5">
        {RANK_TIER_RANGES.map((t, i) => {
          const isCurrent = t.tier === tier.tier;
          const isUnlocked = i <= tierIndex;
          return (
            <div
              key={t.tier}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-opacity ${
                isCurrent ? "opacity-100" : isUnlocked ? "opacity-60" : "opacity-30"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                  isCurrent
                    ? `${t.bgCls} ring-2 ring-white/40 shadow-lg`
                    : isUnlocked
                    ? "bg-white/10"
                    : "bg-white/5"
                }`}
              >
                {isUnlocked ? t.emoji : <Lock className="w-3.5 h-3.5 text-white/40" />}
              </div>
              <span
                className={`text-[9px] font-bold ${
                  isCurrent ? "text-primary-foreground" : "text-primary-foreground/50"
                }`}
              >
                {t.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current tier + rating */}
      <div className="text-center">
        <p className={`text-xs font-bold ${tier.cls} mb-0.5`}>{tier.label}</p>
        <p className="text-4xl font-bold text-primary-foreground tracking-tight">{rating}</p>
      </div>

      {/* Progress bar to next tier */}
      {nextTier ? (
        <div>
          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 ${nextTier.bgCls} rounded-full transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-primary-foreground/70">
            <span>{rating}</span>
            <span>
              次：{nextTier.emoji} {nextTier.label}（{nextTier.min}）
            </span>
          </div>
        </div>
      ) : (
        <p className="text-center text-[10px] text-primary-foreground/70">最高ティアに到達</p>
      )}

      {/* Season info row */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-primary-foreground/80">
        <span>
          {formatSeasonLabel(season)} ・ 残り {daysLeft}日
        </span>
        <span className="font-bold text-primary-foreground">{rankLabel}</span>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }
  return content;
};

export default TierProgressHero;
