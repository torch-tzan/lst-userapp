import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { CURRENT_USER, getPlayer } from "@/lib/tournamentStore";
import { useToast } from "@/components/ui/use-toast";

const LeagueBoardScore = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPostedMatch, submitMatchScore } = useLeagueMatchBoardStore();
  const { toast } = useToast();

  const match = id ? getPostedMatch(id) : undefined;
  if (!match) {
    return (
      <InnerPageLayout title="比分入力">
        <p className="text-center text-sm text-muted-foreground">募集が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const isHost = match.hostUserId === CURRENT_USER;
  if (!isHost) {
    return (
      <InnerPageLayout title="比分入力">
        <p className="text-center text-sm text-muted-foreground">ホストのみ入力できます</p>
      </InnerPageLayout>
    );
  }

  const approvedIds = match.applications
    .filter((a) => a.status === "approved")
    .map((a) => a.applicantUserId);
  const allMembers = [match.hostUserId, ...approvedIds];

  return <LeagueBoardScoreForm matchId={match.id} allMembers={allMembers} navigate={navigate} toast={toast} submitMatchScore={submitMatchScore} />;
};

// Inner component to allow hooks after early-return guards
function LeagueBoardScoreForm({
  matchId,
  allMembers,
  navigate,
  toast,
  submitMatchScore,
}: {
  matchId: string;
  allMembers: string[];
  navigate: ReturnType<typeof useNavigate>;
  toast: ReturnType<typeof useToast>["toast"];
  submitMatchScore: ReturnType<typeof useLeagueMatchBoardStore>["submitMatchScore"];
}) {
  const [side1User1, setSide1User1] = useState<string>(allMembers[0] ?? "");
  const [side1User2, setSide1User2] = useState<string>(allMembers[1] ?? "");
  const [side2User1, setSide2User1] = useState<string>(allMembers[2] ?? "");
  const [side2User2, setSide2User2] = useState<string>(allMembers[3] ?? "");
  const [side1Score, setSide1Score] = useState<string>("");
  const [side2Score, setSide2Score] = useState<string>("");

  const selectedUsers = [side1User1, side1User2, side2User1, side2User2].filter(Boolean);
  const side1Num = Number(side1Score);
  const side2Num = Number(side2Score);
  const bothScoresFilled = side1Score !== "" && side2Score !== "";
  const scoresValid =
    bothScoresFilled && Number.isFinite(side1Num) && Number.isFinite(side2Num) && side1Num !== side2Num;
  const allFourPickedUnique =
    selectedUsers.length === 4 && new Set(selectedUsers).size === 4;
  const isValid = allFourPickedUnique && scoresValid;
  const derivedWinnerSide: 1 | 2 | null = bothScoresFilled
    ? side1Num > side2Num
      ? 1
      : side1Num < side2Num
      ? 2
      : null
    : null;

  const submit = () => {
    if (!isValid || derivedWinnerSide === null) return;
    const r = submitMatchScore(matchId, {
      side1UserIds: [side1User1, side1User2],
      side2UserIds: [side2User1, side2User2],
      winnerSide: derivedWinnerSide,
      score: `${side1Num}-${side2Num}`,
    });
    if (r.ok) {
      toast({ title: "比分を入力しました", description: "参加者全員の承認をお待ちください" });
      navigate(`/game/league/${matchId}`);
    } else {
      toast({ title: "失敗しました", description: r.error });
    }
  };

  const PlayerSelect = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-card border border-border rounded-[6px] p-2 text-sm"
    >
      <option value="">選択</option>
      {allMembers.map((uid) => (
        <option key={uid} value={uid}>
          {getPlayer(uid)?.name ?? uid}
        </option>
      ))}
    </select>
  );

  return (
    <InnerPageLayout
      title="比分入力"
      ctaLabel="送信する"
      ctaDisabled={!isValid}
      onCtaClick={submit}
    >
      <div className="bg-muted/30 border border-border rounded-[8px] p-3 mb-4 text-[11px] text-muted-foreground">
        ホストとして比分を入力してください。送信後は参加者全員（4名）の承認をお待ちください。
      </div>

      <p className="text-sm font-bold text-foreground mb-2">サイド 1（ペア）</p>
      <div className="space-y-2 mb-4">
        <PlayerSelect value={side1User1} onChange={setSide1User1} />
        <PlayerSelect value={side1User2} onChange={setSide1User2} />
      </div>

      <p className="text-sm font-bold text-foreground mb-2">サイド 2（ペア）</p>
      <div className="space-y-2 mb-4">
        <PlayerSelect value={side2User1} onChange={setSide2User1} />
        <PlayerSelect value={side2User2} onChange={setSide2User2} />
      </div>

      <p className="text-sm font-bold text-foreground mb-2">スコア</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-2">
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">サイド 1</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={side1Score}
            onChange={(e) => setSide1Score(e.target.value)}
            placeholder="0"
            className="w-full bg-card border border-border rounded-[8px] p-3 text-center text-2xl font-bold focus:border-primary outline-none"
          />
        </div>
        <span className="text-xl font-bold text-muted-foreground pt-5">−</span>
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">サイド 2</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={side2Score}
            onChange={(e) => setSide2Score(e.target.value)}
            placeholder="0"
            className="w-full bg-card border border-border rounded-[8px] p-3 text-center text-2xl font-bold focus:border-primary outline-none"
          />
        </div>
      </div>
      {bothScoresFilled && derivedWinnerSide !== null && (
        <p className="text-[11px] font-bold text-primary mb-4">
          ✓ サイド {derivedWinnerSide} の勝ち
        </p>
      )}
      {bothScoresFilled && derivedWinnerSide === null && (
        <p className="text-[11px] font-bold text-destructive mb-4">
          ※ スコアが同じです。勝者が決められません。
        </p>
      )}
    </InnerPageLayout>
  );
}

export default LeagueBoardScore;
