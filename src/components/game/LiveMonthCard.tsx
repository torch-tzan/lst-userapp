import { ChevronRight, TrendingUp } from "lucide-react";

interface Props {
  variant: "compact" | "full";
  yearMonthLabel: string;        // ex: "2026年5月"
  totalScore: number;
  rank: number | null;
  played: number;
  cta?: string;                  // ex: "あと 50 点で 3 位"  (only used in full variant)
  onClick?: () => void;          // compact 變成 button
}

const LiveMonthCard = ({ variant, yearMonthLabel, totalScore, rank, played, cta, onClick }: Props) => {
  if (variant === "compact") {
    const inner = (
      <div className="bg-card border border-border rounded-[8px] p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground">{yearMonthLabel} の成績</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-primary">{totalScore}</span>
            <span className="text-[11px] text-muted-foreground">積分</span>
            {rank !== null && (
              <span className="text-xs font-bold text-foreground ml-1">{rank}位</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">出場 {played} 試合</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    );
    return onClick ? (
      <button onClick={onClick} className="w-full text-left">{inner}</button>
    ) : inner;
  }

  // full variant
  return (
    <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5">
      <p className="text-[11px] opacity-80">{yearMonthLabel}（進行中）</p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-4xl font-bold text-primary">{totalScore}</span>
        <span className="text-sm opacity-80">積分</span>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <div>
          <p className="text-[10px] opacity-70">即時順位</p>
          <p className="text-base font-bold">{rank !== null ? `${rank}位` : "—"}</p>
        </div>
        <div className="w-px h-8 bg-white/20" />
        <div>
          <p className="text-[10px] opacity-70">出場</p>
          <p className="text-base font-bold">{played} 試合</p>
        </div>
      </div>
      {cta && (
        <div className="bg-primary/20 rounded-[6px] p-2 mt-4 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <p className="text-[11px] font-bold text-primary">{cta}</p>
        </div>
      )}
    </div>
  );
};

export default LiveMonthCard;
