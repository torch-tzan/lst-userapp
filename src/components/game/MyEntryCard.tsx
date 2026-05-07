import { useNavigate } from "react-router-dom";
import {
  CURRENT_USER,
  getPlayer,
  type Tournament,
  type TournamentEntry,
} from "@/lib/tournamentStore";
import { Calendar, MapPin, Mail, Clock, Check, Users, ChevronRight } from "lucide-react";

interface Props {
  tournament: Tournament;
  myEntry: TournamentEntry;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const MyEntryCard = ({ tournament, myEntry }: Props) => {
  const navigate = useNavigate();
  const isPending = myEntry.status === "pending_partner_confirmation";
  const isInvitee = isPending && myEntry.partnerUserId === CURRENT_USER;
  const isInviter = isPending && myEntry.registrantUserId === CURRENT_USER;
  const isConfirmed = myEntry.status === "confirmed";

  const partner = myEntry.partnerUserId ? getPlayer(myEntry.partnerUserId) : undefined;
  const inviter = isInvitee ? getPlayer(myEntry.registrantUserId) : undefined;

  let statusLabel: string;
  let statusIcon: typeof Mail;
  let statusCls: string;
  if (isInvitee) {
    // 我要動作 — 黃底深字 filled badge（最搶眼）
    statusLabel = "招待が届いています";
    statusIcon = Mail;
    statusCls = "bg-accent-yellow text-foreground border-transparent";
  } else if (isInviter) {
    // 等對方動作 — 灰色 muted（passive）
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

  // Actionable card (invitee) gets thicker yellow border + brighter hover
  const cardCls = isInvitee
    ? "w-full bg-accent-yellow/5 border-2 border-accent-yellow/60 rounded-[8px] p-4 text-left hover:border-accent-yellow transition-colors"
    : "w-full bg-card border border-border rounded-[8px] p-4 text-left hover:border-primary/40 transition-colors";

  return (
    <button onClick={() => navigate(`/game/tournament/${tournament.id}`)} className={cardCls}>
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border ${statusCls}`}>
          <StatusIcon className="w-3 h-3" />
          {statusLabel}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">
          ダブルス / {tournament.capacity}枠
        </span>
      </div>

      <p className="text-sm font-bold text-foreground">{tournament.title}</p>

      <div className="mt-2 space-y-0.5">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDateTime(tournament.scheduledAt)}
        </p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {tournament.venue}
        </p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
          <Users className="w-3 h-3" />
          {isInvitee
            ? `${inviter?.name ?? "—"} さんからの招待`
            : isInviter
            ? `パートナー: ${partner?.name ?? "—"}（確認待ち）`
            : `パートナー: ${partner?.name ?? "—"}`}
        </p>
      </div>

      {/* Actionable hint for invitee — clear "you need to do something" cue */}
      {isInvitee && (
        <div className="flex items-center justify-end mt-3 pt-2 border-t border-accent-yellow/30">
          <span className="text-[11px] font-bold text-accent-yellow flex items-center gap-0.5">
            タップして確認
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}
    </button>
  );
};

export default MyEntryCard;
