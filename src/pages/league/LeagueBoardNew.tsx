import { useNavigate } from "react-router-dom";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { useToast } from "@/components/ui/use-toast";
import LeagueBoardForm from "./LeagueBoardForm";

const LeagueBoardNew = () => {
  const navigate = useNavigate();
  const { createPostedMatch } = useLeagueMatchBoardStore();
  const { toast } = useToast();

  return (
    <LeagueBoardForm
      title="募集を作成"
      submitLabel="作成する"
      footerHint="作成後、他の利用者から応募が届きます。あなたが承認すると 4 名揃って試合が成立します。"
      onSubmit={(values) => {
        const r = createPostedMatch(values);
        if (r.ok) {
          toast({ title: "募集を作成しました", description: "他のメンバーから応募を待ちましょう" });
          navigate(r.id ? `/game/league/${r.id}` : "/game/league");
        }
      }}
    />
  );
};

export default LeagueBoardNew;
