import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import BottomNav from "@/components/BottomNav";
import { useGameStore, CURRENT_USER } from "@/lib/gameStore";
import { Users, LogOut, UserCog } from "lucide-react";
import { useState } from "react";
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

const GameTeamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTeam, disbandTeam } = useGameStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const team = id ? getTeam(id) : null;
  const isMember = !!team?.members.some((m) => m.userId === CURRENT_USER);

  if (!team) {
    return (
      <InnerPageLayout title="チーム" onBack={() => navigate(-1)} bottomNav={<BottomNav active={2} />}>
        <p className="text-sm text-muted-foreground text-center py-12">チームが見つかりません</p>
      </InnerPageLayout>
    );
  }

  const handleDisband = () => {
    disbandTeam(team.id);
    setShowConfirm(false);
    navigate("/game");
  };

  return (
    <InnerPageLayout title={team.name} onBack={() => navigate(-1)} bottomNav={<BottomNav active={2} />}>
      <div className="space-y-5 pb-6">
        <div className="bg-card border border-border rounded-[8px] p-4">
          <p className="text-xs font-bold text-muted-foreground mb-3">メンバー</p>
          <div className="space-y-2">
            {team.members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {m.name}
                  {m.userId === CURRENT_USER && (
                    <span className="text-[10px] text-primary ml-1">（自分）</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {team.status === "active" && isMember && (
          <div className="space-y-2">
            <button
              onClick={() => navigate("/game/team/new", { state: { replacingTeamId: team.id } })}
              className="w-full h-11 rounded-[6px] border border-primary text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/5"
            >
              <UserCog className="w-4 h-4" />
              メンバーを変更する
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full h-11 rounded-[6px] border border-destructive text-destructive text-sm font-bold flex items-center justify-center gap-2 hover:bg-destructive/5"
            >
              <LogOut className="w-4 h-4" />
              チームを解散してゲームを退出する
            </button>
          </div>
        )}

        {team.status === "disbanded" && (
          <div className="bg-muted/40 border border-border rounded-[8px] p-3 text-center">
            <p className="text-xs text-muted-foreground">このチームは解散されました</p>
          </div>
        )}
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>チームを解散しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              進行中の試合もキャンセルされ、パートナーに通知されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisband}>解散する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </InnerPageLayout>
  );
};

export default GameTeamDetail;
