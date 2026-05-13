import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { CURRENT_USER, getPlayer, getRankTier, PP_LEAGUE_MATCH_WIN } from "@/lib/tournamentStore";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, MapPin, Users, Trophy, MessageCircle, Check, MoreVertical, X, Pencil } from "lucide-react";
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
import BottomSheet from "@/components/pickers/BottomSheet";

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
    approveMatchScore,
    withdrawFromMatch,
  } = useLeagueMatchBoardStore();
  const { toast } = useToast();
  // Confirm dialog is shared between host-cancel and applicant-withdraw.
  const [confirmMode, setConfirmMode] = useState<"cancel" | "withdraw" | null>(null);
  const [showMenu, setShowMenu] = useState(false);

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
  const isApprovedMember = isHost || myApp?.status === "approved";
  const host = getPlayer(match.hostUserId);
  const hostTier = host ? getRankTier(host.rating) : null;

  // ── Result / approval derived state ──
  const result = match.result;
  const allFourIds = result ? [...result.side1UserIds, ...result.side2UserIds] : [];
  const userInMatch = !!result && allFourIds.includes(CURRENT_USER);
  const hasApproved = !!result && result.approvals.some((a) => a.userId === CURRENT_USER);
  const approvalsCount = result?.approvals.length ?? 0;
  const userSide = result
    ? result.side1UserIds.includes(CURRENT_USER)
      ? 1
      : result.side2UserIds.includes(CURRENT_USER)
      ? 2
      : null
    : null;
  const userWon = userSide !== null && result?.winnerSide === userSide;

  const handleApply = () => {
    const r = applyToMatch(match.id);
    if (r.ok) {
      toast({ title: "応募しました", description: "ホストの承認をお待ちください" });
    } else {
      toast({ title: "応募に失敗しました", description: r.error });
    }
  };

  const handleApproveApp = (appId: string) => {
    const r = approveApplication(match.id, appId);
    if (r.ok) toast({ title: "承認しました" });
    else toast({ title: "承認に失敗しました", description: r.error });
  };

  const handleRejectApp = (appId: string) => {
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

  const handleWithdraw = () => {
    const r = withdrawFromMatch(match.id);
    if (r.ok) {
      toast({ title: "参加を取り消しました" });
      navigate("/game/league");
    } else {
      toast({ title: "取消できませんでした", description: r.error });
    }
  };

  const handleApproveScore = () => {
    const r = approveMatchScore(match.id);
    if (r.ok) {
      const willComplete = approvalsCount + 1 === 4;
      toast({
        title: willComplete ? "比分を承認・試合完了！" : "比分を承認しました",
        description: willComplete ? "レート・PP が更新されました" : `承認 ${approvalsCount + 1}/4`,
      });
    } else {
      toast({ title: "承認できませんでした", description: r.error });
    }
  };

  // Host can edit / cancel any non-completed, non-cancelled match without a result.
  const canEdit = isHost && !result && match.status !== "completed" && match.status !== "cancelled";
  const canCancel = isHost && match.status !== "completed" && match.status !== "cancelled";

  // Applicant (pending or approved, not yet scored) can withdraw their own participation.
  const canWithdraw =
    !isHost &&
    !!myApp &&
    myApp.status !== "rejected" &&
    myApp.status !== "withdrawn" &&
    !result &&
    match.status !== "completed" &&
    match.status !== "cancelled";

  const showMenuTrigger = canEdit || canCancel || canWithdraw;

  // CTA priority: approve score → submit score → apply.
  // Cancel now lives in the "..." menu (top-right) so it isn't competing for the bottom slot.
  let ctaLabel: string | undefined;
  let onCtaClick: (() => void) | undefined;
  if (match.status === "cancelled" || match.status === "completed") {
    ctaLabel = undefined;
  } else if (result && userInMatch && !hasApproved) {
    ctaLabel = `比分を承認する（${approvalsCount}/4）`;
    onCtaClick = handleApproveScore;
  } else if (isHost && match.status === "filled" && !result) {
    ctaLabel = "比分を入力する";
    onCtaClick = () => navigate(`/game/league/${match.id}/score`);
  } else if (match.status === "open" && !isApplicant && !isHost) {
    ctaLabel = "応募する";
    onCtaClick = handleApply;
  }

  const rightAction = showMenuTrigger ? (
    <button
      onClick={() => setShowMenu(true)}
      className="p-1 text-foreground hover:text-primary transition-colors"
      aria-label="その他のアクション"
    >
      <MoreVertical className="w-5 h-5" />
    </button>
  ) : undefined;

  const statusBadge =
    match.status === "filled"
      ? { label: "成立済", cls: "bg-primary/10 text-primary" }
      : match.status === "completed"
      ? { label: "完了", cls: "bg-green-100 text-green-700" }
      : match.status === "cancelled"
      ? { label: "キャンセル済", cls: "bg-destructive/10 text-destructive" }
      : { label: "募集中", cls: "bg-yellow-500/10 text-yellow-600" };

  return (
    <InnerPageLayout title="募集詳細" ctaLabel={ctaLabel} onCtaClick={onCtaClick} rightAction={rightAction}>
      {/* Header card */}
      <div className="bg-card border border-border rounded-[8px] p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${statusBadge.cls}`}>
            {statusBadge.label}
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
            <Calendar className="w-3.5 h-3.5" />
            {formatDateTime(match.desiredDate)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {match.preferredVenue}
            <span className="text-[10px] text-muted-foreground/70">（主催者で予約）</span>
          </p>
        </div>
        {match.description && (
          <p className="text-xs text-foreground mt-3 leading-relaxed whitespace-pre-line">
            {match.description}
          </p>
        )}

        {/* Group chat entry — visible to host + approved applicants */}
        {isApprovedMember && match.threadId && (
          <button
            onClick={() => navigate(`/messages/${match.threadId}`)}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-primary/10 text-primary text-xs font-bold py-2 rounded-[6px] hover:bg-primary/15 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            メッセージを開く
          </button>
        )}
      </div>

      {/* Cancelled-state banner */}
      {match.status === "cancelled" && (
        <div className="rounded-[8px] p-3 mb-4 bg-destructive/5 border border-destructive/30">
          <p className="text-xs font-bold text-destructive mb-1">この募集はキャンセルされました</p>
          {match.cancelledReason && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              理由：{match.cancelledReason}
            </p>
          )}
        </div>
      )}

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
                            {tier.emoji}
                            {tier.label}
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
                          onClick={() => handleRejectApp(app.id)}
                          className="flex-1 h-9 rounded-[6px] border border-border text-xs font-bold"
                        >
                          却下
                        </button>
                        <button
                          onClick={() => handleApproveApp(app.id)}
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

      {/* Approved members list (filled state, no result yet) */}
      {match.status === "filled" && !result && (
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

      {/* Match result + approval progress / completion details */}
      {result && (
        <section className="mt-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            試合結果
          </p>
          <div className="bg-card border border-border rounded-[8px] p-3 text-xs text-foreground space-y-2">
            {/* Sides + score */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className={`text-center ${result.winnerSide === 1 ? "font-bold text-primary" : "text-muted-foreground"}`}>
                <p className="text-[10px] uppercase tracking-wide">サイド 1</p>
                {result.side1UserIds.map((u) => (
                  <p key={u} className="text-[11px]">
                    {getPlayer(u)?.name ?? "—"}
                  </p>
                ))}
              </div>
              <p className="text-base font-bold text-center">{result.score}</p>
              <div className={`text-center ${result.winnerSide === 2 ? "font-bold text-primary" : "text-muted-foreground"}`}>
                <p className="text-[10px] uppercase tracking-wide">サイド 2</p>
                {result.side2UserIds.map((u) => (
                  <p key={u} className="text-[11px]">
                    {getPlayer(u)?.name ?? "—"}
                  </p>
                ))}
              </div>
            </div>

            {/* Approval progress */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground">参加者の承認</span>
                <span className="text-[11px] font-bold text-foreground">
                  {approvalsCount}/4
                  {match.status === "completed" && <span className="text-primary ml-1">✓ 完了</span>}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${match.status === "completed" ? "bg-primary" : "bg-accent-yellow"}`}
                  style={{ width: `${(approvalsCount / 4) * 100}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allFourIds.map((u) => {
                  const player = getPlayer(u);
                  const approved = result.approvals.some((a) => a.userId === u);
                  return (
                    <span
                      key={u}
                      className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        approved
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {approved && <Check className="w-3 h-3" />}
                      {player?.name ?? "—"}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* User's outcome on completion */}
            {match.status === "completed" && userSide !== null && (
              <div className="pt-2 border-t border-border text-[11px]">
                <p>
                  あなたの結果：
                  <span className={`font-bold ml-1 ${userWon ? "text-primary" : "text-muted-foreground"}`}>
                    {userWon ? `勝ち ・ +${PP_LEAGUE_MATCH_WIN} PP` : "負け"}
                  </span>
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Host / applicant action menu (… top-right) */}
      <BottomSheet
        open={showMenu}
        title="アクション"
        onClose={() => setShowMenu(false)}
        onConfirm={() => setShowMenu(false)}
        confirmLabel="閉じる"
      >
        {canEdit && (
          <button
            onClick={() => {
              setShowMenu(false);
              navigate(`/game/league/${match.id}/edit`);
            }}
            className="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Pencil className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">募集情報を編集</p>
              <p className="text-[11px] text-muted-foreground">
                日時・場地・説明などを変更できます
              </p>
            </div>
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => {
              setShowMenu(false);
              setConfirmMode("cancel");
            }}
            className="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-destructive">募集を取り消す</p>
              <p className="text-[11px] text-muted-foreground">
                参加者全員に通知され、リストから削除されます
              </p>
            </div>
          </button>
        )}
        {canWithdraw && (
          <button
            onClick={() => {
              setShowMenu(false);
              setConfirmMode("withdraw");
            }}
            className="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-destructive">
                {myApp?.status === "approved" ? "参加を取り消す" : "応募を取り消す"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {myApp?.status === "approved"
                  ? "ホストと他の参加者に通知が届きます"
                  : "応募が取り消されます"}
              </p>
            </div>
          </button>
        )}
      </BottomSheet>

      {/* Double-check confirm dialog — content adapts to host vs applicant */}
      <AlertDialog open={confirmMode !== null} onOpenChange={(o) => !o && setConfirmMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に取り消しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMode === "cancel"
                ? "この操作は取り消せません。応募者・参加者全員に通知が届きます。"
                : "この操作は取り消せません。ホストと他の参加者に通知が届きます。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmMode === "cancel") handleCancel();
                else if (confirmMode === "withdraw") handleWithdraw();
                setConfirmMode(null);
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

export default LeagueBoardDetail;
