import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import BottomNav from "@/components/BottomNav";
import { useGameStore, CURRENT_USER, WIN_XP, WIN_POINTS, LOSE_XP, LOSE_POINTS } from "@/lib/gameStore";
import { useUserProfile } from "@/lib/userProfileStore";
import { Trophy, Clock, Check, X, MapPin, Calendar, AlertCircle } from "lucide-react";
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

const GameMatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getMatch,
    getTeam,
    acceptMatchProposal,
    declineMatchProposal,
    cancelMatch,
    submitMatchScore,
    confirmMatchScore,
    disputeMatchScore,
    getMatchedBookingForMatch,
    notifyOpponentAboutBooking,
  } = useGameStore();
  const { addXpAndPoints } = useUserProfile();

  const match = id ? getMatch(id) : null;
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (!match) {
    return (
      <InnerPageLayout title="試合詳細" onBack={() => navigate(-1)} bottomNav={<BottomNav active={2} />}>
        <p className="text-sm text-muted-foreground text-center py-12">試合が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const team1 = getTeam(match.team1Id);
  const team2 = getTeam(match.team2Id);
  const myTeam = [team1, team2].find((t) => t?.members.some((m) => m.userId === CURRENT_USER));
  const isMyMatch = !!myTeam;
  const isProposer = match.proposedBy === CURRENT_USER;
  const alreadyConfirmed = (match.confirmedBy ?? []).includes(CURRENT_USER);
  const allMembers = [...(team1?.members ?? []), ...(team2?.members ?? [])];
  const disputer = match.disputedBy ? allMembers.find((m) => m.userId === match.disputedBy) : null;
  const matchedBooking = getMatchedBookingForMatch(match);

  const isWin1 = match.winnerId === match.team1Id;
  const isWin2 = match.winnerId === match.team2Id;

  const canEnterScore =
    isMyMatch && match.status === "scheduled";
  const canConfirm =
    isMyMatch && match.status === "pending_confirmation" && !alreadyConfirmed;

  const STATUS_COPY: Record<string, string> = {
    proposed: isProposer ? "相手の承諾待ち" : "自チーム承諾待ち",
    scheduled: "対戦予定",
    pending_confirmation: "結果確認待ち",
    completed: "試合終了",
    cancelled: "キャンセル",
    declined: "辞退されました",
  };

  const handleSubmit = () => {
    const n1 = parseInt(s1);
    const n2 = parseInt(s2);
    if (isNaN(n1) || isNaN(n2) || n1 < 0 || n2 < 0 || n1 === n2) return;
    submitMatchScore(match.id, n1, n2);
    setS1("");
    setS2("");
  };

  const handleConfirm = () => {
    confirmMatchScore(match.id, addXpAndPoints);
  };

  const handleDispute = () => {
    if (!confirm("異議を申立てますか？結果がリセットされ、再入力が必要になります。")) return;
    disputeMatchScore(match.id);
  };

  const handleCancel = () => {
    cancelMatch(match.id, cancelReason.trim() || undefined);
    setShowCancel(false);
    navigate("/game");
  };

  return (
    <InnerPageLayout title="試合詳細" onBack={() => navigate(-1)} bottomNav={<BottomNav active={2} />}>
      <div className="space-y-4 pb-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">{STATUS_COPY[match.status]}</span>
          {match.scheduledAt && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(match.scheduledAt).toLocaleString("ja-JP")}
            </span>
          )}
        </div>

        {/* Score card */}
        <div className="bg-card border border-border rounded-[8px] overflow-hidden">
          <div className={`flex items-center justify-between px-4 py-4 ${isWin1 ? "bg-primary/10" : ""}`}>
            <div className="flex items-center gap-2">
              {isWin1 && <Trophy className="w-4 h-4 text-primary" />}
              <div>
                <p className={`text-sm font-bold ${isWin1 ? "text-primary" : "text-foreground"}`}>{team1?.name}</p>
                <p className="text-[10px] text-muted-foreground">{team1?.members.map((m) => m.name).join(" × ")}</p>
              </div>
            </div>
            {canEnterScore ? (
              <input
                type="number"
                inputMode="numeric"
                value={s1}
                onChange={(e) => setS1(e.target.value)}
                className="w-14 h-10 text-xl font-bold text-center rounded-[6px] border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <span className={`text-2xl font-bold ${isWin1 ? "text-primary" : "text-muted-foreground"}`}>
                {match.score1 ?? "-"}
              </span>
            )}
          </div>
          <div className="flex items-center px-4">
            <div className="flex-1 border-t border-border" />
            <span className="px-2 text-xs font-bold text-muted-foreground">VS</span>
            <div className="flex-1 border-t border-border" />
          </div>
          <div className={`flex items-center justify-between px-4 py-4 ${isWin2 ? "bg-primary/10" : ""}`}>
            <div className="flex items-center gap-2">
              {isWin2 && <Trophy className="w-4 h-4 text-primary" />}
              <div>
                <p className={`text-sm font-bold ${isWin2 ? "text-primary" : "text-foreground"}`}>{team2?.name}</p>
                <p className="text-[10px] text-muted-foreground">{team2?.members.map((m) => m.name).join(" × ")}</p>
              </div>
            </div>
            {canEnterScore ? (
              <input
                type="number"
                inputMode="numeric"
                value={s2}
                onChange={(e) => setS2(e.target.value)}
                className="w-14 h-10 text-xl font-bold text-center rounded-[6px] border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <span className={`text-2xl font-bold ${isWin2 ? "text-primary" : "text-muted-foreground"}`}>
                {match.score2 ?? "-"}
              </span>
            )}
          </div>
        </div>

        {/* Proposed (other team needs to accept) */}
        {match.status === "proposed" && !isProposer && (
          <div className="space-y-2">
            <button
              onClick={() => acceptMatchProposal(match.id)}
              className="w-full h-11 rounded-[6px] bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              試合を承諾する
            </button>
            <button
              onClick={() => declineMatchProposal(match.id)}
              className="w-full h-10 rounded-[6px] border border-border text-sm font-bold flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              辞退する
            </button>
          </div>
        )}

        {/* Dispute banner */}
        {match.status === "scheduled" && disputer && (
          <div className="bg-destructive/5 border border-destructive/30 rounded-[8px] p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              <span className="font-bold">{disputer.name}</span> さんが前回の結果に異議を申立てました。再入力が必要です。
            </p>
          </div>
        )}

        {/* Scheduled */}
        {match.status === "scheduled" && isMyMatch && (
          <>
            {matchedBooking ? (
              <div className="bg-accent/10 border border-accent/30 rounded-[8px] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent flex-shrink-0" />
                  <p className="text-xs font-bold text-foreground">場地予約済み</p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {matchedBooking.courtName} · {matchedBooking.date} {matchedBooking.startTime}〜{matchedBooking.endTime}
                </p>
                {!match.notifiedOpponent && (
                  <button
                    onClick={() => notifyOpponentAboutBooking(match.id, matchedBooking.id)}
                    className="w-full h-9 rounded-[6px] bg-primary text-primary-foreground text-xs font-bold"
                  >
                    対戦相手にスケジュールを通知する
                  </button>
                )}
                {match.notifiedOpponent && (
                  <p className="text-[11px] text-accent flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    対戦相手に通知済み
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-muted/30 border border-border rounded-[8px] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-foreground">場地がまだ予約されていません</p>
                </div>
                <button
                  onClick={() => navigate("/search")}
                  className="w-full h-9 rounded-[6px] border border-primary text-primary text-xs font-bold"
                >
                  場地を予約する
                </button>
              </div>
            )}

            <div className="bg-card border border-border rounded-[8px] p-3 space-y-3">
              <p className="text-xs font-bold text-foreground">試合結果を入力</p>
              <p className="text-[11px] text-muted-foreground">
                試合後、スコアを入力して送信してください。全員の同意で確定します。
              </p>
              <button
                onClick={handleSubmit}
                disabled={!s1 || !s2 || parseInt(s1) === parseInt(s2)}
                className="w-full h-10 rounded-[6px] bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40"
              >
                結果を送信
              </button>
            </div>

            <button
              onClick={() => setShowCancel(true)}
              className="w-full h-10 rounded-[6px] border border-destructive text-destructive text-sm font-bold flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              試合をキャンセル
            </button>
          </>
        )}

        {/* Pending confirmation */}
        {match.status === "pending_confirmation" && (
          <div className="space-y-3">
            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-[8px] p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent-yellow flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">承認状況（全員同意で確定）</p>
                </div>
              </div>
              <div className="space-y-1 pl-6">
                {allMembers.map((m) => {
                  const confirmed = (match.confirmedBy ?? []).includes(m.userId);
                  const isSubmitter = match.submittedBy === m.userId;
                  return (
                    <div key={m.userId} className="flex items-center gap-2 text-[11px]">
                      {confirmed ? (
                        <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={confirmed ? "text-foreground" : "text-muted-foreground"}>
                        {m.name}
                        {isSubmitter && <span className="text-[9px] text-primary ml-1">（提出者）</span>}
                        {m.userId === CURRENT_USER && <span className="text-[9px] text-muted-foreground ml-1">（自分）</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {canConfirm ? (
              <>
                <button
                  onClick={handleConfirm}
                  className="w-full h-11 rounded-[6px] bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  結果に同意する
                </button>
                <button
                  onClick={handleDispute}
                  className="w-full h-10 rounded-[6px] border border-destructive text-destructive text-sm font-bold flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  異議を申立てる
                </button>
              </>
            ) : alreadyConfirmed ? (
              <div className="bg-accent/10 border border-accent/30 rounded-[8px] p-3 text-center text-xs">
                <div className="flex items-center justify-center gap-1 text-accent font-bold">
                  <Check className="w-4 h-4" />
                  承認済み
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Completed */}
        {match.status === "completed" && isMyMatch && (
          <div className="bg-primary/5 border border-primary/20 rounded-[8px] p-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-primary font-bold">
              <Check className="w-4 h-4" />
              試合結果確定
            </div>
            <p className="text-xs text-muted-foreground">
              XP +{myTeam?.id === match.winnerId ? WIN_XP : LOSE_XP} /
              ポイント +{myTeam?.id === match.winnerId ? WIN_POINTS : LOSE_POINTS}pt
            </p>
          </div>
        )}

        {/* Cancelled */}
        {match.status === "cancelled" && (
          <div className="bg-destructive/5 border border-destructive/30 rounded-[8px] p-3 text-center">
            <p className="text-xs font-bold text-destructive">キャンセルされました</p>
            {match.cancelReason && (
              <p className="text-[11px] text-muted-foreground mt-1">理由: {match.cancelReason}</p>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={showCancel} onOpenChange={setShowCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>試合をキャンセルしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              対戦相手にも通知されます。
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="理由（任意）"
                className="mt-3 w-full h-20 p-2 text-sm rounded-[6px] border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>戻る</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>キャンセルする</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </InnerPageLayout>
  );
};

export default GameMatchDetail;
