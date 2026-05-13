import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { CURRENT_USER } from "@/lib/tournamentStore";
import { useToast } from "@/components/ui/use-toast";
import LeagueBoardForm from "./LeagueBoardForm";

const LeagueBoardEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPostedMatch, editPostedMatch } = useLeagueMatchBoardStore();
  const { toast } = useToast();

  const match = id ? getPostedMatch(id) : undefined;

  if (!match) {
    return (
      <InnerPageLayout title="募集を編集">
        <p className="text-center text-sm text-muted-foreground">募集が見つかりません</p>
      </InnerPageLayout>
    );
  }

  if (match.hostUserId !== CURRENT_USER) {
    return (
      <InnerPageLayout title="募集を編集">
        <p className="text-center text-sm text-muted-foreground">ホストのみ編集できます</p>
      </InnerPageLayout>
    );
  }

  if (match.result || match.status === "completed" || match.status === "cancelled") {
    return (
      <InnerPageLayout title="募集を編集">
        <p className="text-center text-sm text-muted-foreground">
          この募集はもう編集できません
        </p>
      </InnerPageLayout>
    );
  }

  return (
    <LeagueBoardForm
      title="募集を編集"
      submitLabel="保存する"
      initial={{
        isoDateTime: match.desiredDate,
        venue: match.preferredVenue,
        description: match.description,
        skillLevel: match.desiredSkillLevel,
      }}
      footerHint={
        match.applications.some((a) => a.status === "approved")
          ? "承認済みの参加者がいます。日時・場地を変更すると参加者に通知が届きます。"
          : undefined
      }
      onSubmit={(values) => {
        const r = editPostedMatch(match.id, values);
        if (r.ok) {
          toast({ title: "募集情報を更新しました" });
          navigate(`/game/league/${match.id}`);
        } else {
          toast({ title: "更新に失敗しました", description: r.error });
        }
      }}
    />
  );
};

export default LeagueBoardEdit;
