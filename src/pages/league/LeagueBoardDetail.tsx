import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { CURRENT_USER, getPlayer, getRankTier } from "@/lib/tournamentStore";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";
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

const SKILL_LABEL: Record<string, string> = {
  beginner: "初心者",
  intermediate: "中級",
  advanced: "上級",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const LeagueBoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getPostedMatch,
    applyToMatch,
    approveApplication,
    rejectApplication,
    cancelPostedMatch,
    venueConfirmScore,
  } = useLeagueMatchBoardStore();
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const match = id ? getPostedMatch(id) : undefined;
  if (!match) {
    return (
      <InnerPageLayout title="募集詳細">
        <p className="text-center text-sm text-muted-foreground">見つかりません</p>
      </InnerPageLayout>
    );
  }

  const isHost = match.hostUserId === CURRENT_USER;
  const myApp = match.applications.find((a) => a.applicantUserId === CURRENT_USER);
  const isApplicant = !!myApp;
  const host = getPlayer(match.hostUserId);
  const hostTier = host ? getRankTier(host.rating) : null;

  const handleApply = () => {
    const r = applyToMatch(match.id);
    if (r.ok) {
      toast({ title: "応募しました", description: "ホストの承認をお待ちください" });
    } else {
      toast({ title: "応募に失敗しました", description: r.error });
    }
  };

  const handleApprove = (appId: string) => {
    const r = approveApplication(match.id, appId);
    if (r.ok) toast({ title: "承認しました" });
    else toast({ title: "承認に失敗しました", description: r.error });
  };

  const handleReject = (appId: string) => {
    const r = rejectApplication(match.id, appId);
    if (r.ok) toast({ title: "却下しました" });
  };

  const handleCancel = () => {
    const r = cancelPostedMatch(match.id);
    if (r.ok) {
      toast({ title: "募集をキャンセルしました" });
      navigate("/game/league");
    }
  };

  const handleVenueConfirm = () => {
    const r = venueConfirmScore(match.id);
    if (r.ok) toast({ title: "比分が確定しました" });
  };

  // Determine CTA label
  const ctaLabel =
    match.status === "cancelled" ? undefined
    : match.status === "completed" ? undefined
    : isHost && match.status === "filled" && !match.result ? "比分を入力する"
    : isHost && match.result && !match.result.venueConfirmedAt ? "[DEMO] 場館確認"
    : isHost ? "募集を取り消す"
    : isApplicant ? undefined
    : match.status === "open" ? "応募する"
    : undefined;

  const onCtaClick =
    isHost && match.status === "filled" && !match.result
      ? () => navigate(`/game/league/${match.id}/score`)
    : isHost && match.result && !match.result.venueConfirmedAt
      ? handleVenueConfirm
    : isHost
      ? () => setShowCancelDialog(true)
    : match.status === "open" && !isApplicant
      ? handleApply
    : undefined;

  return (
    <InnerPageLayout
      title="募集詳細"
      ctaLabel={ctaLabel}
      onCtaClick={onCtaClick}
    >
      {/* Header card */}
      <div className="bg-card border border-border rounded-[8px] p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded ${
              match.status === "filled"
                ? "bg-primary/10 text-primary"
                : match.status === "completed"
                ? "bg-muted text-muted-foreground"
                : match.status === "cancelled"
                ? "bg-destructive/10 text-destructive"
                : "bg-yellow-500/10 text-yellow-600"
            }`}
          >
            {match.status === "filled"
              ? "成立済"
              : match.status === "completed"
              ? "完了"
              : match.status === "cancelled"
              ? "キャンセル済"
              : "募集中"}
          </span>
          {match.desiredSkillLevel && (
            <span className="text-[10px] bg-muted px-2 py-1 rounded font-bold text-muted-foreground">
              {SKILL_LABEL[match.desiredSkillLevel]}向け
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-base font-bold text-foreground">{host?.name ?? "—"} さん</p>
          {hostTier && <span className="text-base">{hostTier.emoji}</span>}
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />{formatDateTime(match.desiredDate)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />{match.preferredVenue}
          </p>
        </div>
        {match.description && (
          <p className="text-xs text-foreground mt-3 leading-relaxed whitespace-pre-line">
            {match.description}
          </p>
        )}
      </div>

      {/* My application status */}
      {isApplicant && myApp && (
        <div
          className={`rounded-[8px] p-3 mb-4 ${
            myApp.status === "pending"
              ? "bg-yellow-500/10 border border-yellow-500/30"
              : myApp.status === "approved"
              ? "bg-primary/10 border border-primary/30"
              : "bg-muted border border-border"
          }`}
        >
          <p className="text-xs font-bold text-foreground">
            {myApp.status === "pending" && "応募中：ホストの返答を待っています"}
            {myApp.status === "approved" && "✓ 承認されました — 試合当日にお会いしましょう"}
            {myApp.status === "rejected" && "却下されました"}
          </p>
        </div>
      )}

      {/* Applicants list (host view) */}
      {isHost && (
        <section>
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
            <Users className="w-4 h-4" />
            応募者一覧 ({match.applications.length})
          </p>
          {match.applications.length === 0 ? (
            <div className="bg-muted/30 border border-border rounded-[8px] p-4 text-center text-xs text-muted-foreground">
              まだ応募はありません
            </div>
          ) : (
            <div className="space-y-2">
              {match.applications.map((app) => {
                const player = getPlayer(app.applicantUserId);
                const tier = player ? getRankTier(player.rating) : null;
                return (
                  <div key={app.id} className="bg-card border border-border rounded-[8px] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{player?.name ?? "—"}</p>
                        {tier && (
                          <span className="text-[10px]">
                            {tier.emoji}{tier.label}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          app.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-600"
                            : app.status === "approved"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {app.status === "pending"
                          ? "未対応"
                          : app.status === "approved"
                          ? "承認済"
                          : "却下"}
                      </span>
                    </div>
                    {app.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(app.id)}
                          className="flex-1 h-9 rounded-[6px] border border-border text-xs font-bold"
                        >
                          却下
                        </button>
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="flex-1 h-9 rounded-[6px] bg-primary text-primary-foreground text-xs font-bold"
                        >
                          承認
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Approved members list (filled state) */}
      {match.status === "filled" && (
        <section className="mt-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
            <Users className="w-4 h-4 text-primary" />
            参加メンバー
          </p>
          <div className="bg-primary/5 border border-primary/30 rounded-[8px] p-3 space-y-1.5">
            <p className="text-xs text-foreground">{host?.name ?? "—"} さん（ホスト）</p>
            {match.applications
              .filter((a) => a.status === "approved")
              .map((a) => {
                const p = getPlayer(a.applicantUserId);
                return (
                  <p key={a.id} className="text-xs text-foreground">
                    {p?.name ?? "—"} さん
                  </p>
                );
              })}
          </div>
        </section>
      )}

      {/* Match result */}
      {match.result && (
        <section className="mt-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            試合結果
          </p>
          <div className="bg-card border border-border rounded-[8px] p-3 text-xs text-foreground space-y-1">
            <p>勝者：{match.result.winnerSide === 1 ? "サイド 1" : "サイド 2"}</p>
            <p>スコア：{match.result.score}</p>
            <p className="text-[11px] text-muted-foreground mt-2">
              {match.result.venueConfirmedAt
                ? "場館確認済 — 結果が確定しました"
                : "場館の確認を待っています"}
            </p>
          </div>
        </section>
      )}

      {/* Cancel confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>募集を取り消しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              応募者にも通知され、リストから削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>戻る</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground"
            >
              取り消す
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </InnerPageLayout>
  );
};

export default LeagueBoardDetail;
