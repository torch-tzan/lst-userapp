import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Star } from "lucide-react";
import { getBookings, type StoredBooking } from "@/lib/bookingStore";
import { getCoachIdByName, getCoachAvatar } from "@/lib/coachData";

const ReviewHistory = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<StoredBooking[]>([]);

  useEffect(() => {
    const all = getBookings();
    setReviews(all.filter((b) => b.type === "coach" && b.rating));
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <InnerPageLayout title="評価履歴">
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 gap-3">
          <Star className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm font-bold text-foreground">評価履歴はありません</p>
          <p className="text-xs text-muted-foreground text-center">
            レッスン完了後に評価すると、<br />ここに履歴が表示されます。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                const coachId = getCoachIdByName(b.coachName || "");
                if (coachId) navigate(`/coaches/${coachId}`);
              }}
              className="w-full text-left bg-card rounded-[8px] border border-border p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex gap-3">
                {/* Square coach avatar */}
                <div className="w-14 h-14 rounded-[8px] bg-muted flex-shrink-0 overflow-hidden">
                  {(() => {
                    const avatar = b.coachAvatar || getCoachAvatar(b.coachName || "");
                    return avatar ? (
                      <img src={avatar} alt={b.coachName} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                        {(b.coachName || "?")[0]}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-foreground">{b.coachName}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {b.rating?.createdAt ? formatDate(b.rating.createdAt) : ""}
                    </span>
                  </div>
              <div className="flex items-center gap-0.5 mb-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < (b.rating?.stars || 0)
                        ? "fill-accent-yellow text-accent-yellow"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              {b.rating?.comment && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {b.rating.comment}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                {b.date} {b.startTime}〜{b.endTime}
                {b.lessonType === "online" ? " ・ オンライン" : b.venueName ? ` ・ ${b.venueName}` : ""}
              </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </InnerPageLayout>
  );
};

export default ReviewHistory;
