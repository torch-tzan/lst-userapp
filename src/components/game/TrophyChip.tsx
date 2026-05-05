import type { Badge } from "@/lib/tournamentBadges";

interface Props {
  badge: Badge;
}

const TrophyChip = ({ badge }: Props) => (
  <div className="flex-shrink-0 w-[88px] bg-card border border-border rounded-[8px] p-3 text-center">
    <div className="text-2xl">{badge.emoji}</div>
    <p className="text-[11px] font-bold text-foreground mt-1">{badge.label}</p>
    <p className="text-[10px] text-primary font-bold mt-0.5">×{badge.count}</p>
    <p className="text-[9px] text-muted-foreground mt-0.5">{badge.description}</p>
  </div>
);

export default TrophyChip;
