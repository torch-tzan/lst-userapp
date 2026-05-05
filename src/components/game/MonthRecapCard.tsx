import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import type { PersonalMonthlyScore } from "@/lib/tournamentStore";

interface Props {
  score: PersonalMonthlyScore;
  isCurrent?: boolean;
}

function formatYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

const MonthRecapCard = ({ score, isCurrent }: Props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const trophy = score.bestRank === 1 ? "🥇" : score.bestRank === 2 ? "🥈" : score.bestRank === 3 ? "🥉" : null;

  return (
    <div className="bg-card border border-border rounded-[8px] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-foreground">{formatYM(score.yearMonth)}</p>
            {isCurrent && (
              <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">今月</span>
            )}
            {trophy && <span className="text-base">{trophy}</span>}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            出場 {score.tournaments.length} 大会 ・ {score.won}勝{score.played - score.won}敗
            {score.bestRank ? ` ・ 最高 ${score.bestRank}位` : ""}
          </p>
        </div>
        <p className="text-lg font-bold text-primary">{score.total}</p>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-3 bg-muted/20">
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="bg-card rounded-[6px] p-2">
              <p className="text-[10px] text-muted-foreground">参加</p>
              <p className="text-sm font-bold text-foreground">+{score.participation}</p>
            </div>
            <div className="bg-card rounded-[6px] p-2">
              <p className="text-[10px] text-muted-foreground">勝利</p>
              <p className="text-sm font-bold text-foreground">+{score.wins}</p>
            </div>
            <div className="bg-card rounded-[6px] p-2">
              <p className="text-[10px] text-muted-foreground">入賞</p>
              <p className="text-sm font-bold text-foreground">+{score.podiumBonus}</p>
            </div>
          </div>
          {score.tournaments.length > 0 && (
            <div className="space-y-1.5">
              {score.tournaments.map((tt) => (
                <button
                  key={tt.tournamentId}
                  onClick={() => navigate(`/game/tournament/${tt.tournamentId}`)}
                  className="w-full bg-card rounded-[6px] p-2 text-left flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1">
                      {tt.title}
                      {tt.finalRank && tt.finalRank <= 3 && (
                        <Trophy className={`w-3 h-3 ${tt.finalRank === 1 ? "text-yellow-600" : tt.finalRank === 2 ? "text-gray-400" : "text-amber-700"}`} />
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tt.matchesPlayed}試合 {tt.matchesWon}勝
                      {tt.finalRank ? ` ・ 最終 ${tt.finalRank}位` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">+{tt.score}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthRecapCard;
