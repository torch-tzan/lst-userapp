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
  const [winnerSide, setWinnerSide] = useState<1 | 2>(1);
  const [score, setScore] = useState("6-3");

  const selectedUsers = [side1User1, side1User2, side2User1, side2User2].filter(Boolean);
  const isValid =
    selectedUsers.length === 4 && new Set(selectedUsers).size === 4 && score.trim().length > 0;

  const submit = () => {
    if (!isValid) return;
    const r = submitMatchScore(matchId, {
      side1UserIds: [side1User1, side1User2],
      side2UserIds: [side2User1, side2User2],
      winnerSide,
      score: score.trim(),
    });
    if (r.ok) {
      toast({ title: "比分を入力しました", description: "場館の確認をお待ちください" });
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
        ホストとして比分を入力してください。送信後は場館の受付員が確認 → 確定となります。
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

      <p className="text-sm font-bold text-foreground mb-2">勝者サイド</p>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setWinnerSide(1)}
          className={`flex-1 h-12 rounded-[8px] font-bold ${
            winnerSide === 1
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground"
          }`}
        >
          サイド 1
        </button>
        <button
          onClick={() => setWinnerSide(2)}
          className={`flex-1 h-12 rounded-[8px] font-bold ${
            winnerSide === 2
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground"
          }`}
        >
          サイド 2
        </button>
      </div>

      <p className="text-sm font-bold text-foreground mb-2">スコア</p>
      <input
        type="text"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        placeholder="例：6-3"
        className="w-full bg-card border border-border rounded-[8px] p-3 text-sm mb-4"
      />
    </InnerPageLayout>
  );
}

export default LeagueBoardScore;
