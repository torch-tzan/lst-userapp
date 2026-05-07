import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, getPlayer } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, MapPin, Users, Trophy, Diamond, Lock, Phone, Train, Info, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatDateTimeJP(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function hoursUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 3600000));
}

const ROUND_LABEL: Record<number, string> = {
  1: "1回戦",
  2: "準決勝",
  3: "決勝",
  4: "決勝",
};

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTournament, acceptPartnerInvite, cancelMyPendingInvite, cancelMyConfirmedEntry } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelConfirmedDialog, setShowCancelConfirmedDialog] = useState(false);

  const t = id ? getTournament(id) : undefined;

  if (!t) {
    return (
      <InnerPageLayout title="大会詳細">
        <p className="text-center text-sm text-muted-foreground">大会が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const myEntry = t.entries.find(
    (e) =>
      (e.status === "confirmed" || e.status === "pending_partner_confirmation") &&
      (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
  );
  const isOpen = t.status === "registration_open";
  const canRegister = isOpen && !myEntry && t.entries.length < t.capacity;

  const isInvitee = myEntry?.status === "pending_partner_confirmation" && myEntry.partnerUserId === CURRENT_USER;
  const isInviter = myEntry?.status === "pending_partner_confirmation" && myEntry.registrantUserId === CURRENT_USER;

  const isConfirmedAndCancellable =
    myEntry?.status === "confirmed" &&
    (t.status === "registration_open" || t.status === "registration_closed");

  const handleEntry = () => {
    if (!isPremium) {
      navigate("/premium/plan");
      return;
    }
    navigate(`/game/tournament/${t.id}/entry`);
  };

  return (
    <InnerPageLayout
      title="大会詳細"
      ctaLabel={
        isInvitee
          ? undefined
          : isInviter
          ? "パートナーを変更する"
          : isConfirmedAndCancellable
          ? "エントリーを取り消す"
          : myEntry
          ? "エントリー済"
          : !isOpen
          ? undefined
          : !canRegister
          ? "定員に達しました"
          : isPremium
          ? "エントリーする"
          : "プレミアム会員になってエントリー"
      }
      ctaDisabled={
        isInviter || isConfirmedAndCancellable
          ? false
          : !!myEntry || !canRegister
      }
      onCtaClick={
        isInviter
          ? () => setShowCancelDialog(true)
          : isConfirmedAndCancellable
          ? () => setShowCancelConfirmedDialog(true)
          : handleEntry
      }
    >
      {/* Hero image */}
      {t.heroImageUrl && (
        <div className="-mx-[20px] -mt-6 mb-4 aspect-video bg-muted overflow-hidden">
          <img src={t.heroImageUrl} alt={t.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title + meta */}
      <div className="mb-4">
        <p className="text-base font-bold text-foreground">{t.title}</p>
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            {formatDateTimeJP(t.scheduledAt)}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {t.venue}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            ダブルス / 上限 {t.capacity} 枠
          </p>
        </div>
        {isOpen && (
          <div className="bg-muted rounded-[6px] p-2 mt-3 text-[11px] text-foreground">
            エントリー受付中：{t.entries.length} / {t.capacity}
            締切 {formatDateTimeJP(t.registrationDeadline)}
          </div>
        )}
        {myEntry && myEntry.status === "confirmed" && (
          <div className="bg-primary/10 text-primary rounded-[6px] p-2 mt-3 text-[11px] font-bold flex items-center gap-1">
            <Diamond className="w-3 h-3" />
            エントリー済
            {myEntry.partnerUserId && ` ・ パートナー: ${getPlayer(myEntry.partnerUserId)?.name ?? "—"}`}
          </div>
        )}
        {/* Inviter view: show pending status (with name) — bottom CTA handles action */}
        {isInviter && (
          <div className="bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 rounded-[6px] p-2 mt-3 text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            パートナー確認待ち ({getPlayer(myEntry.partnerUserId ?? "")?.name ?? "—"})
          </div>
        )}
      </div>

      {/* Invitee CTA card */}
      {isInvitee && myEntry && (
        <div className="bg-accent-yellow/5 border-2 border-accent-yellow/40 rounded-[8px] p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-accent-yellow" />
            <p className="text-xs font-bold text-foreground">
              残り {myEntry.expiresAt ? hoursUntil(myEntry.expiresAt) : 0} 時間
            </p>
          </div>
          <p className="text-sm text-foreground mb-1">
            <span className="font-bold">{getPlayer(myEntry.registrantUserId)?.name ?? "—"}</span> さんから招待が届いています
          </p>
          <p className="text-[11px] text-muted-foreground mb-4">
            期限内に回答してください。
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/game/invite/${myEntry.id}`)}
              className="flex-1 h-12 rounded-[8px] border border-border bg-background text-foreground font-bold"
            >
              辞退する
            </button>
            <button
              onClick={() => {
                const r = acceptPartnerInvite(myEntry.id);
                if (r.ok) toast({ title: "招待を承諾しました", description: `${t.title} のエントリーが確定しました` });
              }}
              className="flex-1 h-12 rounded-[8px] bg-primary text-primary-foreground font-bold"
            >
              承諾する
            </button>
          </div>
        </div>
      )}

      {/* Description */}
      {t.description && (
        <section className="mb-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-muted-foreground" />
            大会について
          </p>
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{t.description}</p>
        </section>
      )}

      {/* Access */}
      {t.accessInfo && (
        <section className="mb-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Train className="w-4 h-4 text-muted-foreground" />
            アクセス
          </p>
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{t.accessInfo}</p>
        </section>
      )}

      {/* Contact */}
      {t.contactInfo && (
        <section className="mb-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-muted-foreground" />
            お問い合わせ
          </p>
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{t.contactInfo}</p>
        </section>
      )}

      {/* Premium gating notice for non-premium */}
      {isOpen && !isPremium && (
        <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex gap-2 mb-4">
          <Lock className="w-5 h-5 text-accent-yellow flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground">プレミアム会員限定</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              月額 ¥500 のプレミアム会員になると大会エントリーが可能になります。
            </p>
          </div>
        </div>
      )}

      {/* Completed: bracket + rankings */}
      {t.status === "completed" && t.results && (
        <>
          <p className="text-sm font-bold text-foreground mt-2 mb-2 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            最終結果
          </p>
          <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden mb-4">
            {t.results.rankings.map((r) => {
              const isMine = r.userId === CURRENT_USER || r.partnerId === CURRENT_USER;
              const player = getPlayer(r.userId);
              const partner = r.partnerId ? getPlayer(r.partnerId) : undefined;
              return (
                <div key={r.rank} className={`p-3 flex items-center gap-3 ${isMine ? "bg-primary/5" : ""}`}>
                  <div className="w-8 text-center font-bold text-sm text-muted-foreground">{r.rank}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMine ? "text-primary" : "text-foreground"}`}>
                      {player?.name ?? r.userId}
                      {partner && ` × ${partner.name}`}
                      {isMine && <span className="text-[10px] ml-1">（自分）</span>}
                    </p>
                  </div>
                  {r.rank <= 3 && (
                    <Trophy
                      className={`w-4 h-4 ${
                        r.rank === 1 ? "text-yellow-600" : r.rank === 2 ? "text-gray-400" : "text-amber-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm font-bold text-foreground mb-2">対戦記録</p>
          <div className="space-y-1.5 mb-4">
            {t.results.matches.map((m, i) => {
              const p1 = getPlayer(m.p1UserId)?.name ?? m.p1UserId;
              const p2 = getPlayer(m.p2UserId)?.name ?? m.p2UserId;
              const winner = m.winnerSide === 1 ? p1 : p2;
              return (
                <div key={i} className="bg-card border border-border rounded-[6px] p-2.5 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-muted-foreground">{ROUND_LABEL[m.round]}</span>
                  <span className="text-foreground flex-1 mx-2 text-center">{p1} vs {p2}</span>
                  <span className="text-foreground font-bold">{m.score}</span>
                  <span className="text-[10px] text-primary ml-2">勝: {winner.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>パートナーを変更しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在の招待をキャンセルして、再度エントリーします。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>戻る</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (myEntry) {
                  const r = cancelMyPendingInvite(myEntry.id);
                  if (r.ok) {
                    toast({ title: "招待を取り消しました" });
                    navigate(`/game/tournament/${t.id}/entry`);
                  }
                }
              }}
            >
              変更する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelConfirmedDialog} onOpenChange={setShowCancelConfirmedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>エントリーを取り消しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              エントリーをキャンセルすると、他の参加者にも通知されます。再エントリーが必要な場合は受付期間内に手続きしてください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>戻る</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (myEntry) {
                  const r = cancelMyConfirmedEntry(myEntry.id);
                  if (r.ok) {
                    toast({ title: "エントリーを取り消しました", description: "他の参加者にも通知されました" });
                    setShowCancelConfirmedDialog(false);
                  } else {
                    toast({ title: "取り消しに失敗しました", description: r.error });
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              取り消す
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </InnerPageLayout>
  );
};

export default TournamentDetail;
