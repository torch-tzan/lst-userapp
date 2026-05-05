import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPendingBooking, clearPendingBooking, addBooking, type StoredBooking } from "@/lib/bookingStore";
import { createReviewThread } from "@/lib/messageStore";

const BookingComplete = () => {
  const navigate = useNavigate();
  const bookingType = useRef<string | null>(null);
  const lessonTypeRef = useRef<string | null>(null);
  const videoCountRef = useRef<number>(0);
  const reviewThreadIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    if (savedRef.current || failed) return;
    const pending = getPendingBooking();
    if (!pending) return;
    bookingType.current = (pending.type as string) || "court";
    lessonTypeRef.current = (pending.lessonType as string) || null;
    const vids = pending.reviewVideos as { name: string }[] | undefined;
    videoCountRef.current = vids?.length ?? 0;

    const isCoach = pending.type === "coach";
    const isReview = pending.lessonType === "review";

    let endTime = "";
    if (isReview) {
      // No time for review
    } else if (isCoach && pending.slots && Array.isArray(pending.slots) && pending.slots.length > 0) {
      const lastSlot = pending.slots[pending.slots.length - 1] as string;
      const [h, m] = lastSlot.split(":").map(Number);
      const endMin = h * 60 + m + 50;
      endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    } else if (pending.slots && Array.isArray(pending.slots) && pending.slots.length > 0) {
      const lastSlot = pending.slots[pending.slots.length - 1] as string;
      const endH = parseInt(lastSlot.split(":")[0]) + 1;
      endTime = `${String(endH).padStart(2, "0")}:00`;
    }

    const startTime = (!isReview && pending.slots && Array.isArray(pending.slots) && pending.slots.length > 0)
      ? pending.slots[0] as string
      : "";

    const booking: StoredBooking = {
      id: `bk-${Date.now()}`,
      type: (pending.type as "court" | "coach") || "court",
      date: (pending.date as string) || "",
      startTime,
      endTime,
      status: isReview ? "upcoming" : (pending.type === "coach" ? "pending_confirmation" : "upcoming"),
      totalPrice: pending.totalPrice as number,
      pricePerHour: pending.pricePerHour as number,
      courtName: pending.courtName as string | undefined,
      courtSubName: pending.courtSubName as string | undefined,
      image: pending.courtImage as string | undefined,
      address: pending.address as string | undefined,
      people: pending.people as number | undefined,
      coachName: pending.coachName as string | undefined,
      coachAvatar: pending.coachAvatar as string | undefined,
      coachLevel: pending.coachLevel as string | undefined,
      coachSpecialty: pending.coachSpecialty as string | undefined,
      location: pending.location as string | undefined,
      lessonType: pending.lessonType as "onsite" | "online" | "review" | undefined,
      venueName: pending.venueName as string | undefined,
      venueAddress: pending.venueAddress as string | undefined,
      timeRange: pending.timeRange as string | undefined,
      duration: pending.duration as number | undefined,
      slotCount: pending.slotCount as number | undefined,
      mode: pending.mode as "solo" | "standard" | undefined,
      equipment: pending.equipment as StoredBooking["equipment"],
      equipmentTotal: pending.equipmentTotal as number | undefined,
      eventId: pending.fromEvent as string | undefined,
      teamId: pending.teamId as string | undefined,
      reviewVideos: pending.reviewVideos as StoredBooking["reviewVideos"],
    };

    addBooking(booking);

    // Create review thread if review type (pass uploaded videos + memo if any)
    if (isReview && pending.coachName) {
      const vids = (booking.reviewVideos ?? []).map((v) => ({ name: v.name }));
      const memo = (pending.reviewMemo as string | undefined) ?? "";
      const thread = createReviewThread(booking.id, pending.coachName as string, vids, memo);
      reviewThreadIdRef.current = thread.id;
    }

    clearPendingBooking();
    savedRef.current = true;
  }, [failed]);

  return (
    <InnerPageLayout
      title="決済"
      hideBack
      ctaLabel={failed ? "お支払いをやり直す" : "ホームに戻る"}
      onCtaClick={() => (failed ? navigate("/booking/payment") : navigate("/"))}
    >
      {failed ? (
        /* ===== Payment Failed ===== */
        <div className="flex flex-col items-center justify-center pt-16 gap-5">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">お支払いに失敗しました</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              決済処理中にエラーが発生しました。<br />
              お支払い方法をご確認の上、<br />
              もう一度お試しください。
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mt-3 h-11 px-6 rounded-[8px] text-sm font-semibold"
          >
            ホームに戻る
          </Button>
        </div>
      ) : (
        /* ===== Payment Success ===== */
        <div className="flex flex-col items-center justify-center pt-16 gap-5">
          <div className="w-20 h-20 rounded-full bg-available/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-available" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              {lessonTypeRef.current === "review"
                ? "予約と動画を受け付けました"
                : bookingType.current === "coach"
                ? "予約リクエストを送信しました"
                : "予約が完了しました"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lessonTypeRef.current === "review" ? (
                <>
                  {videoCountRef.current}本の動画をアップロードしました。<br />
                  コーチが確認後、メッセージでフィードバックが届きます。
                </>
              ) : bookingType.current === "coach" ? (
                <>コーチの確認後、予約が確定されます。<br />確定後にお知らせいたします。</>
              ) : (
                <>ご予約ありがとうございます。<br />予約詳細はマイページからご確認いただけます。</>
              )}
            </p>
          </div>
          {lessonTypeRef.current === "review" && reviewThreadIdRef.current ? (
            <Button
              onClick={() => navigate(`/messages/${reviewThreadIdRef.current}`)}
              className="mt-3 h-11 px-6 rounded-[4px] text-sm font-semibold bg-primary text-primary-foreground"
            >
              メッセージを確認する
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate("/bookings")}
              className="mt-3 h-11 px-6 rounded-[8px] text-sm font-semibold"
            >
              予約履歴を確認
            </Button>
          )}

        </div>
      )}

      {/* Demo toggle */}
      <div className="fixed bottom-24 right-6 z-50">
        <button
          onClick={() => setFailed((f) => !f)}
          className="px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        >
          Demo: {failed ? "成功に切替" : "失敗に切替"}
        </button>
      </div>
    </InnerPageLayout>
  );
};

export default BookingComplete;
