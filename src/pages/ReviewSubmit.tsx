import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Star } from "lucide-react";
import { toast } from "sonner";

const ReviewSubmit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const coachName = searchParams.get("coach") || "コーチ";
  const bookingId = searchParams.get("bookingId") || "";
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitted(true);
    toast.success("評価を送信しました");
    setTimeout(() => navigate(-1), 1500);
  };

  if (submitted) {
    return (
      <InnerPageLayout title="レッスン評価">
        <div className="flex flex-col items-center justify-center pt-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Star className="w-8 h-8 text-primary fill-primary" />
          </div>
          <p className="text-base font-bold text-foreground">ありがとうございます！</p>
          <p className="text-sm text-muted-foreground text-center">
            評価が送信されました。<br />今後のレッスン改善に活用させていただきます。
          </p>
        </div>
      </InnerPageLayout>
    );
  }

  return (
    <InnerPageLayout title="レッスン評価">
      <div className="space-y-6">
        {/* Coach info */}
        <div className="bg-card border border-border rounded-[8px] p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">担当コーチ</p>
          <p className="text-base font-bold text-foreground">{coachName}</p>
        </div>

        {/* Star rating */}
        <div className="text-center space-y-2">
          <p className="text-sm font-bold text-foreground">レッスンはいかがでしたか？</p>
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hovered || rating)
                      ? "text-accent-yellow fill-accent-yellow"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-muted-foreground">
              {rating === 5 && "最高！とても満足しました"}
              {rating === 4 && "良い！満足しました"}
              {rating === 3 && "普通です"}
              {rating === 2 && "少し不満がありました"}
              {rating === 1 && "不満でした"}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-foreground">コメント（任意）</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="レッスンの感想を教えてください..."
            rows={4}
            className="w-full px-3 py-2.5 text-sm rounded-[8px] border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="w-full h-12 rounded-[4px] bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 transition-opacity"
        >
          評価を送信する
        </button>
      </div>
    </InnerPageLayout>
  );
};

export default ReviewSubmit;
