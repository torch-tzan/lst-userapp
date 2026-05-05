import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, getPlayer } from "@/lib/tournamentStore";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, MapPin, Users, Clock, AlertCircle } from "lucide-react";

function formatDateTimeJP(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function hoursUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 3600000));
}

const DECLINE_REASONS = [
  "予定が合わない",
  "他の大会に参加予定",
  "今回は見送ります",
  "その他",
];

const InviteConfirm = () => {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { getEntry, acceptPartnerInvite, declinePartnerInvite } = useTournamentStore();
  const { toast } = useToast();

  const found = entryId ? getEntry(entryId) : undefined;
  const [showDecline, setShowDecline] = useState(false);
  const [reason, setReason] = useState<string>("");

  if (!found) {
    return (
      <InnerPageLayout title="招待確認">
        <p className="text-center text-sm text-muted-foreground">招待が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const { entry, tournament } = found;
  const inviter = getPlayer(entry.registrantUserId);
  const remaining = entry.expiresAt ? hoursUntil(entry.expiresAt) : 0;

  if (entry.status !== "pending_partner_confirmation") {
    return (
      <InnerPageLayout title="招待確認">
        <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center">
          <p className="text-sm text-muted-foreground">
            この招待は既に処理済みです（{entry.status === "confirmed" ? "承諾済" : "辞退済"}）
          </p>
          <button
            onClick={() => navigate(`/game/tournament/${tournament.id}`)}
            className="text-xs text-primary font-bold mt-3"
          >
            大会詳細へ ›
          </button>
        </div>
      </InnerPageLayout>
    );
  }

  const handleAccept = () => {
    const r = acceptPartnerInvite(entry.id);
    if (r.ok) {
      toast({
        title: "招待を承諾しました",
        description: `${tournament.title} のエントリーが確定しました`,
      });
      navigate(`/game/tournament/${tournament.id}`);
    }
  };

  const handleDecline = () => {
    if (!reason) return;
    declinePartnerInvite(entry.id, reason);
    navigate("/game");
  };

  return (
    <InnerPageLayout title="招待確認">
      <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex gap-2 mb-4">
        <Clock className="w-5 h-5 text-accent-yellow flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground">残り {remaining} 時間</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {entry.expiresAt && `${formatDateTimeJP(entry.expiresAt)}までに回答してください`}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[8px] p-4 mb-4">
        <p className="text-[11px] text-muted-foreground">招待者</p>
        <p className="text-sm font-bold text-foreground mt-0.5">{inviter?.name ?? entry.registrantUserId} さん</p>
        <div className="border-t border-border mt-3 pt-3">
          <p className="text-base font-bold text-foreground">{tournament.title}</p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateTimeJP(tournament.scheduledAt)}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              {tournament.venue}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              {tournament.format === "singles" ? "シングルス" : "ダブルス"} / 上限 {tournament.capacity} 枠
            </p>
          </div>
        </div>
      </div>

      {!showDecline ? (
        <div className="space-y-2">
          <button
            onClick={handleAccept}
            className="w-full h-12 rounded-[8px] bg-primary text-primary-foreground font-bold"
          >
            承諾してエントリーする
          </button>
          <button
            onClick={() => setShowDecline(true)}
            className="w-full h-12 rounded-[8px] border border-border bg-background text-foreground font-bold"
          >
            辞退する
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-[8px] p-4">
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            辞退理由を選択してください
          </p>
          <div className="space-y-2 mb-3">
            {DECLINE_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2 px-3 py-3 border rounded-[8px] cursor-pointer ${
                  reason === r ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <input
                  type="radio"
                  name="decline-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-foreground">{r}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleDecline}
            disabled={!reason}
            className="w-full h-12 rounded-[8px] bg-destructive text-destructive-foreground font-bold disabled:opacity-40 mb-2"
          >
            辞退を確定する
          </button>
          <button
            onClick={() => { setShowDecline(false); setReason(""); }}
            className="w-full h-10 rounded-[8px] border border-border bg-background text-foreground text-sm font-bold"
          >
            キャンセル
          </button>
        </div>
      )}
    </InnerPageLayout>
  );
};

export default InviteConfirm;
