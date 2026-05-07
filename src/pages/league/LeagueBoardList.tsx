import InnerPageLayout from "@/components/InnerPageLayout";
import LeagueMatchList from "@/components/game/LeagueMatchList";

const LeagueBoardList = () => {
  return (
    <InnerPageLayout title="リーグ募集板">
      <LeagueMatchList />
    </InnerPageLayout>
  );
};

export default LeagueBoardList;
