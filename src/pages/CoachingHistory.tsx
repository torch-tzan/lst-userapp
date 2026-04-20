import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { ChevronRight } from "lucide-react";
import { getBookings } from "@/lib/bookingStore";
import { COACHES, getCoachIdByName } from "@/lib/coachData";

interface CoachRecord {
  coachId: string;
  coachName: string;
  coachAvatar: string;
  coachLevel: string;
  specialty: string;
  lessonCount: number;
}

const MOCK_COACHES: CoachRecord[] = [
  { coachId: "1", coachName: "佐藤翔太", coachAvatar: COACHES[0].avatar, coachLevel: "A級", specialty: "初心者指導・フォーム改善", lessonCount: 2 },
  { coachId: "3", coachName: "鈴木健太", coachAvatar: COACHES[2].avatar, coachLevel: "B級", specialty: "基礎トレーニング・ジュニア育成", lessonCount: 2 },
  { coachId: "2", coachName: "田中美咲", coachAvatar: COACHES[1].avatar, coachLevel: "S級", specialty: "戦術分析", lessonCount: 1 },
];

const CoachingHistory = () => {
  const navigate = useNavigate();

  const coaches = useMemo(() => {
    const stored = getBookings();
    const coachMap = new Map<string, CoachRecord>();

    stored
      .filter((b) => b.type === "coach" && b.status === "completed")
      .forEach((b) => {
        const resolvedId = getCoachIdByName(b.coachName || "");
        if (!resolvedId) return;
        const existing = coachMap.get(resolvedId);
        if (existing) {
          existing.lessonCount++;
        } else {
          const summary = COACHES.find((c) => c.id === resolvedId);
          coachMap.set(resolvedId, {
            coachId: resolvedId,
            coachName: b.coachName || "",
            coachAvatar: summary?.avatar || b.coachAvatar || "",
            coachLevel: b.coachLevel || "",
            specialty: b.coachSpecialty || "",
            lessonCount: 1,
          });
        }
      });

    MOCK_COACHES.forEach((m) => {
      if (!coachMap.has(m.coachId)) {
        coachMap.set(m.coachId, { ...m });
      }
    });

    return Array.from(coachMap.values());
  }, []);

  return (
    <InnerPageLayout title="コーチング履歴">
      {coaches.length === 0 ? (
        <div className="flex items-center justify-center pt-20">
          <p className="text-sm text-muted-foreground">コーチング履歴はありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coaches.map((coach) => (
            <button
              key={coach.coachId}
              onClick={() => navigate(`/coaches/${coach.coachId}`)}
              className="w-full bg-card border border-border rounded-[8px] p-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-[70px] rounded-[8px] overflow-hidden flex-shrink-0">
                  <img src={coach.coachAvatar} alt={coach.coachName} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-bold text-foreground">{coach.coachName}</span>
                    <span className="text-[10px] text-muted-foreground">{coach.coachLevel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{coach.specialty}</p>
                  <p className="text-xs text-primary font-medium">受講回数: {coach.lessonCount}回</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </InnerPageLayout>
  );
};

export default CoachingHistory;
