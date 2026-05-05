import { useNavigate } from "react-router-dom";
import { useTournamentStore, getPlayer } from "@/lib/tournamentStore";
import { Mail, Clock } from "lucide-react";

function hoursUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 3600000));
}

const PendingInviteBanner = () => {
  const navigate = useNavigate();
  const { getPendingInvitesForUser } = useTournamentStore();
  const invites = getPendingInvitesForUser();

  if (invites.length === 0) return null;

  return (
    <div className="px-[20px] mb-3 space-y-2">
      {invites.map(({ entry, tournament }) => {
        const inviter = getPlayer(entry.registrantUserId)?.name ?? entry.registrantUserId;
        const remaining = entry.expiresAt ? hoursUntil(entry.expiresAt) : 0;
        return (
          <button
            key={entry.id}
            onClick={() => navigate(`/game/invite/${entry.id}`)}
            className="w-full bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex items-start gap-2 text-left hover:bg-accent-yellow/15 transition-colors"
          >
            <Mail className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">
                {inviter}さんから「{tournament.title}」への招待
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                残り {remaining} 時間
              </p>
            </div>
            <span className="text-[10px] font-bold text-accent-yellow flex-shrink-0">確認 ›</span>
          </button>
        );
      })}
    </div>
  );
};

export default PendingInviteBanner;
