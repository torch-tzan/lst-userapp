import { useNavigate } from "react-router-dom";
import {
  CURRENT_USER,
  getPlayer,
  type Tournament,
  type TournamentEntry,
} from "@/lib/tournamentStore";
import { Calendar, MapPin, Mail, Clock, Check, ChevronRight } from "lucide-react";

interface Props {
  tournament: Tournament;
  myEntry: TournamentEntry;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getCountdown(iso: string): { label: string; cls: string } {
  const target = new Date(iso);
  const now = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((targetDay.getTime() - today.getTime()) / 86400000);

  if (days < 0) return { label: "終了", cls: "bg-muted text-muted-foreground" };
  if (days === 0) return { label: "本日開催", cls: "bg-destructive text-destructive-foreground" };
  if (days <= 3) return { label: `あと${days}日`, cls: "bg-accent-yellow text-foreground" };
  if (days <= 14) return { label: `あと${days}日`, cls: "bg-card text-foreground border border-border" };
  return { label: `あと${days}日`, cls: "bg-muted text-muted-foreground" };
}

const Avatar = ({ name }: { name: string }) => (
  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
    {name.charAt(0)}
  </div>
);

const MyEntryCard = ({ tournament, myEntry }: Props) => {
  const navigate = useNavigate();
  const isPending = myEntry.status === "pending_partner_confirmation";
  const isInvitee = isPending && myEntry.partnerUserId === CURRENT_USER;
  const isInviter = isPending && myEntry.registrantUserId === CURRENT_USER;
  const isConfirmed = myEntry.status === "confirmed";

  const partner = myEntry.partnerUserId ? getPlayer(myEntry.partnerUserId) : undefined;
  const inviter = isInvitee ? getPlayer(myEntry.registrantUserId) : undefined;
  const partnerToShow = isInvitee ? inviter : partner;

  let statusLabel: string;
  let statusIcon: typeof Mail;
  let statusCls: string;
  if (isInvitee) {
    statusLabel = "招待が届いています";
    statusIcon = Mail;
    statusCls = "bg-accent-yellow text-foreground border-transparent";
  } else if (isInviter) {
    statusLabel = `${partner?.name ?? "—"} さんの確認待ち`;
    statusIcon = Clock;
    statusCls = "bg-muted text-muted-foreground border-border";
  } else if (isConfirmed) {
    statusLabel = "エントリー確定";
    statusIcon = Check;
    statusCls = "bg-primary/10 text-primary border-primary/30";
  } else {
    statusLabel = "—";
    statusIcon = Mail;
    statusCls = "bg-muted text-muted-foreground border-border";
  }

  const StatusIcon = statusIcon;
  const countdown = getCountdown(tournament.scheduledAt);

  // Invitee cards get thicker yellow border to flag "you need to act"
  const cardCls = isInvitee
    ? "w-full bg-accent-yellow/5 border-2 border-accent-yellow/60 rounded-[12px] p-4 text-left hover:border-accent-yellow transition-colors"
    : "w-full bg-card border border-border rounded-[12px] p-4 text-left hover:border-primary/40 transition-colors";

  return (
    <button onClick={() => navigate(`/game/tournament/${tournament.id}`)} className={cardCls}>
      {/* Countdown pill (prominent) + status badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${countdown.cls}`}>
          {countdown.label}
        </span>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border ${statusCls}`}>
          <StatusIcon className="w-3 h-3" />
          {statusLabel}
        </span>
      </div>

      {/* Title + date */}
      <p className="text-base font-bold text-foreground leading-tight mb-2">
        {tournament.title}
      </p>
      <div className="space-y-0.5 mb-3">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDateTime(tournament.scheduledAt)}
        </p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {tournament.venue}
        </p>
      </div>

      {/* Partner block */}
      {partnerToShow ? (
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <Avatar name={partnerToShow.name} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">
              {isInvitee ? "招待主" : "パートナー"}
            </p>
            <p className="text-xs font-bold text-foreground truncate">
              {partnerToShow.name}
              {isInviter && (
                <span className="text-[10px] text-muted-foreground font-normal ml-1">（確認待ち）</span>
              )}
            </p>
          </div>
          {isInvitee && (
            <span className="text-[11px] font-bold text-accent-yellow flex items-center gap-0.5">
              確認
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground pt-3 border-t border-border">
          パートナー未確定
        </p>
      )}

      {/* Sub-info row */}
      <p className="text-[10px] font-bold text-muted-foreground mt-2 text-right">
        ダブルス / {tournament.capacity}枠
      </p>
    </button>
  );
};

export default MyEntryCard;
