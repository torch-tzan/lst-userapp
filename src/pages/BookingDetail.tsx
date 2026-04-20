import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import BottomSheet from "@/components/pickers/BottomSheet";
import MiniCalendar from "@/components/pickers/MiniCalendar";
import { MapPin, Calendar, Clock, LayoutGrid, CreditCard, Tag, Coins, RefreshCw, User, Video, AlertCircle, CheckCircle2, Play, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";
import { getBookings, updateBooking, type StoredBooking, type BookingRating } from "@/lib/bookingStore";
import { createThreadOnApproval, addOnlineLessonLink, expireOnlineLessonLink } from "@/lib/messageStore";
import { addNotification } from "@/lib/notificationStore";
import { COURTS } from "@/lib/courtData";
import { COACHES } from "@/lib/coachData";

const courtA = COURTS[0].image;
const courtB = COURTS[1].image;
const courtC = COURTS[2].image;
const coach1Img = COACHES[0].avatar;
const coach2Img = COACHES[1].avatar;

type BookingStatus = "upcoming" | "completed" | "cancelled" | "failed" | "pending_confirmation" | "change_pending" | "in_progress";
type BookingType = "court" | "coach";

interface BookingDetail {
  id: string;
  type: BookingType;
  courtName?: string;
  courtSubName?: string;
  address?: string;
  image?: string;
  courtCount?: number;
  totalHours?: number;
  coachName?: string;
  coachAvatar?: string;
  coachLevel?: string;
  coachSpecialty?: string;
  coachLocation?: string;
  slotCount?: number;
  duration?: number;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  pricePerUnit: number;
  subtotal: number;
  coupon?: string;
  couponDiscount?: number;
  pointsUsed: number;
  total: number;
  paymentMethod: string;
  earnedPoints: number;
  lessonType?: "onsite" | "online";
  venueName?: string;
  venueAddress?: string;
  rescheduleUsed?: boolean;
  pendingChangeDate?: string;
  pendingChangeStart?: string;
  pendingChangeEnd?: string;
  rating?: BookingRating;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  upcoming: { label: "予約確定", className: "bg-primary/10 text-primary border-primary/30" },
  pending_confirmation: { label: "コーチ承認待ち", className: "bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30" },
  change_pending: { label: "変更承認待ち", className: "bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30" },
  in_progress: { label: "レッスン中", className: "bg-available/15 text-available border-available/30" },
  completed: { label: "利用済み", className: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "キャンセル", className: "bg-muted text-muted-foreground border-border" },
  failed: { label: "予約不成立", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const TYPE_BADGE: Record<BookingType, { label: string; className: string }> = {
  court: { label: "コート", className: "bg-blue-100 text-blue-700" },
  coach: { label: "コーチ", className: "bg-primary/15 text-primary" },
};

const MOCK_DETAILS: Record<string, BookingDetail> = {
  "1": {
    id: "1", type: "court", courtName: "パデルコート広島", courtSubName: "コートA（屋外ハード）",
    address: "広島県広島市中区大手町1-2-3", date: "2026-04-20",
    startTime: "14:00", endTime: "16:00", courtCount: 1, status: "upcoming",
    image: courtA, pricePerUnit: 2000, totalHours: 2, subtotal: 4000,
    coupon: "WELCOME10", couponDiscount: 400, pointsUsed: 0, total: 3600,
    paymentMethod: "クレジットカード", earnedPoints: 3,
  },
  "c1": {
    id: "c1", type: "coach", coachName: "佐藤翔太", coachAvatar: coach1Img,
    coachLevel: "A級", coachSpecialty: "初心者指導", coachLocation: "広島県広島市中区",
    date: "2026-04-22", startTime: "10:00", endTime: "10:50",
    slotCount: 1, duration: 50, status: "pending_confirmation",
    pricePerUnit: 4000, subtotal: 4000,
    pointsUsed: 0, total: 4000,
    paymentMethod: "クレジットカード", earnedPoints: 4,
    lessonType: "onsite", venueName: "PADEL HIROSHIMA 中区コート", venueAddress: "広島県広島市中区大手町1-2-3",
  },
  "2": {
    id: "2", type: "court", courtName: "北広島パデルクラブ", courtSubName: "コートB（室内）",
    address: "広島県北広島市中央5-10-1", date: "2026-04-25",
    startTime: "10:00", endTime: "12:00", courtCount: 2, status: "upcoming",
    image: courtB, pricePerUnit: 3500, totalHours: 2, subtotal: 7000,
    pointsUsed: 500, total: 6500, paymentMethod: "PayPay", earnedPoints: 6,
  },
  "c2": {
    id: "c2", type: "coach", coachName: "田中美咲", coachAvatar: coach2Img,
    coachLevel: "S級", coachSpecialty: "競技向け", coachLocation: "広島県広島市南区",
    date: "2026-04-28", startTime: "13:00", endTime: "14:50",
    slotCount: 2, duration: 110, status: "upcoming",
    pricePerUnit: 6000, subtotal: 12000,
    pointsUsed: 0, total: 12000,
    paymentMethod: "Apple Pay", earnedPoints: 12,
    lessonType: "onsite", venueName: "PADEL ARENA 広島南", venueAddress: "広島県広島市南区東雲2-10-5",
    rescheduleUsed: false,
  },
  "3": {
    id: "3", type: "court", courtName: "パデルコート広島", courtSubName: "コートA（屋外ハード）",
    address: "広島県広島市中区大手町1-2-3", date: "2026-03-10",
    startTime: "14:00", endTime: "16:00", courtCount: 1, status: "completed",
    image: courtA, pricePerUnit: 2000, totalHours: 2, subtotal: 4000,
    pointsUsed: 0, total: 4000, paymentMethod: "クレジットカード", earnedPoints: 4,
  },
  "c3": {
    id: "c3", type: "coach", coachName: "佐藤翔太", coachAvatar: coach1Img,
    coachLevel: "A級", coachSpecialty: "初心者指導", coachLocation: "広島県広島市中区",
    date: "2026-03-12", startTime: "09:00", endTime: "09:50",
    slotCount: 1, duration: 50, status: "completed",
    pricePerUnit: 4000, subtotal: 4000,
    pointsUsed: 0, total: 4000,
    paymentMethod: "クレジットカード", earnedPoints: 4,
    lessonType: "online",
  },
  "4": {
    id: "4", type: "court", courtName: "北広島パデルクラブ", courtSubName: "コートB（室内）",
    address: "広島県北広島市中央5-10-1", date: "2026-03-15",
    startTime: "10:00", endTime: "12:00", courtCount: 1, status: "cancelled",
    image: courtB, pricePerUnit: 3500, totalHours: 2, subtotal: 7000,
    pointsUsed: 0, total: 7000, paymentMethod: "クレジットカード", earnedPoints: 0,
  },
  "5": {
    id: "5", type: "court", courtName: "広島中央スポーツ", courtSubName: "コートC（室内ハード）",
    address: "広島県広島市南区松原町3-1-1", date: "2026-03-20",
    startTime: "18:00", endTime: "20:00", courtCount: 1, status: "completed",
    image: courtC, pricePerUnit: 2800, totalHours: 2, subtotal: 5600,
    pointsUsed: 0, total: 5600, paymentMethod: "Apple Pay", earnedPoints: 5,
  },
  "6": {
    id: "6", type: "court", courtName: "パデルコート広島", courtSubName: "コートC（室内ハード）",
    address: "広島県広島市南区松原町3-1-1", date: "2026-03-20",
    startTime: "18:00", endTime: "20:00", courtCount: 1, status: "failed",
    image: courtA, pricePerUnit: 2800, totalHours: 2, subtotal: 5600,
    pointsUsed: 0, total: 5600, paymentMethod: "クレジットカード", earnedPoints: 0,
  },
};

// Court slots
const AVAILABLE_SLOTS = [
  { start: "08:00", end: "10:00" },
  { start: "10:00", end: "12:00" },
  { start: "12:00", end: "14:00" },
  { start: "16:00", end: "18:00" },
  { start: "18:00", end: "20:00" },
];

// Coach-only time slots (no venue constraint)
const COACH_AVAILABLE_SLOTS = [
  { start: "09:00", end: "09:50" },
  { start: "10:00", end: "10:50" },
  { start: "13:00", end: "13:50" },
  { start: "14:00", end: "14:50" },
  { start: "16:00", end: "16:50" },
];

// Coach + venue: only slots where BOTH coach and venue have availability
const COACH_VENUE_SLOTS: Record<string, { start: string; end: string }[]> = {
  "PADEL HIROSHIMA 中区コート": [
    { start: "09:00", end: "09:50" },
    { start: "10:00", end: "10:50" },
    { start: "14:00", end: "14:50" },
  ],
  "PADEL ARENA 広島南": [
    { start: "10:00", end: "10:50" },
    { start: "13:00", end: "13:50" },
    { start: "16:00", end: "16:50" },
  ],
  "パデルパーク広島駅前": [
    { start: "09:00", end: "09:50" },
    { start: "13:00", end: "13:50" },
    { start: "14:00", end: "14:50" },
    { start: "16:00", end: "16:50" },
  ],
  "パデルクラブ北広島": [
    { start: "10:00", end: "10:50" },
    { start: "14:00", end: "14:50" },
  ],
  "パデルスタジオ広島中央": [
    { start: "09:00", end: "09:50" },
    { start: "10:00", end: "10:50" },
    { start: "13:00", end: "13:50" },
  ],
};

const formatDateLabel = (d: string) => {
  const dt = new Date(d + "T00:00:00");
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日（${weekdays[dt.getDay()]}）`;
};

const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
};

const BookingDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Try stored bookings first, then mock
  const storedBooking = useMemo(() => {
    const stored = getBookings().find((b) => b.id === (id || ""));
    if (!stored) return null;
    return {
      ...stored,
      pricePerUnit: stored.pricePerHour || 0,
      subtotal: stored.totalPrice || 0,
      total: stored.totalPrice || 0,
      pointsUsed: 0,
      paymentMethod: "クレジットカード",
      earnedPoints: Math.floor((stored.totalPrice || 0) / 1000),
      coachLocation: stored.location,
    } as BookingDetail;
  }, [id]);

  const [detail, setDetail] = useState<BookingDetail | null>(
    storedBooking || MOCK_DETAILS[id || "1"] || null
  );
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(detail?.date || "");
  const [showApproveSimulation, setShowApproveSimulation] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  if (!detail) {
    return (
      <InnerPageLayout title="予約詳細" onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center pt-20 gap-4">
          <p className="text-base font-bold text-foreground">予約が見つかりません</p>
        </div>
      </InnerPageLayout>
    );
  }

  const isCoach = detail.type === "coach";
  const status = STATUS_CONFIG[detail.status];
  const typeBadge = TYPE_BADGE[detail.type];
  const currentSlotStr = `${detail.startTime}-${detail.endTime}`;
  const isSameDate = rescheduleDate === detail.date;

  // For onsite coach lessons, use venue-restricted slots; for online, use coach-only slots
  const rescheduleSlots = isCoach
    ? (detail.lessonType === "onsite" && detail.venueName && COACH_VENUE_SLOTS[detail.venueName])
      ? COACH_VENUE_SLOTS[detail.venueName]
      : COACH_AVAILABLE_SLOTS
    : AVAILABLE_SLOTS;

  const availableSlots = rescheduleSlots.filter(
    (s) => !isSameDate || `${s.start}-${s.end}` !== currentSlotStr
  );

  const canReschedule = !detail.rescheduleUsed &&
    (detail.status === "upcoming" || detail.status === "pending_confirmation");

  const handleCancel = () => {
    setShowCancelDialog(false);
    // Update stored booking if exists
    updateBooking(detail.id, { status: "cancelled" });
    setDetail({ ...detail, status: "cancelled" });
    addNotification({
      type: "booking_cancelled",
      title: "予約をキャンセルしました",
      message: `${isCoach ? detail.coachName : detail.courtName}（${detail.date} ${detail.startTime}〜${detail.endTime}）`,
      bookingId: detail.id,
    });
    toast.success("予約をキャンセルしました");
    navigate("/bookings");
  };

  const handleReschedule = () => {
    if (!selectedSlot) return;
    const [newStart, newEnd] = selectedSlot.split("-");

    if (isCoach) {
      // Coach booking: reschedule requires coach approval
      updateBooking(detail.id, {
        status: "change_pending",
        rescheduleUsed: true,
        pendingChangeDate: rescheduleDate,
        pendingChangeStart: newStart,
        pendingChangeEnd: newEnd,
      });
      setDetail({
        ...detail,
        status: "change_pending",
        rescheduleUsed: true,
        pendingChangeDate: rescheduleDate,
        pendingChangeStart: newStart,
        pendingChangeEnd: newEnd,
      });
      toast.success("変更リクエストを送信しました。コーチの承認をお待ちください。");
    } else {
      // Court booking: immediate reschedule
      updateBooking(detail.id, {
        date: rescheduleDate,
        startTime: newStart,
        endTime: newEnd,
      });
      setDetail({ ...detail, date: rescheduleDate, startTime: newStart, endTime: newEnd });
      toast.success("予約日時を変更しました");
    }
    setShowReschedule(false);
    setSelectedSlot(null);
  };

  const handleOpenReschedule = () => {
    setRescheduleDate(detail.date);
    setSelectedSlot(null);
    setShowReschedule(true);
  };

  // Simulate coach approval (for demo purposes)
  const simulateCoachApproval = (approve: boolean) => {
    if (detail.status === "pending_confirmation") {
      if (approve) {
        updateBooking(detail.id, { status: "upcoming" });
        setDetail({ ...detail, status: "upcoming" });
        // Auto-send canned message from coach
        createThreadOnApproval(
          detail.id,
          detail.coachName || "",
          detail.date,
          detail.startTime,
          detail.endTime,
          detail.lessonType,
          detail.venueName,
        );
        addNotification({
          type: "booking_confirmed",
          title: "予約が確定しました",
          message: `${detail.coachName}のレッスン（${detail.date} ${detail.startTime}〜${detail.endTime}）が承認されました`,
          bookingId: detail.id,
        });
        toast.success("コーチが予約を承認しました");
      } else {
        updateBooking(detail.id, { status: "failed" });
        setDetail({ ...detail, status: "failed" });
        addNotification({
          type: "booking_rejected",
          title: "予約が不成立になりました",
          message: `${detail.coachName}が予約を承認しませんでした`,
          bookingId: detail.id,
        });
        toast.error("コーチが予約を拒否しました");
      }
    } else if (detail.status === "change_pending") {
      if (approve) {
        updateBooking(detail.id, {
          status: "upcoming",
          date: detail.pendingChangeDate || detail.date,
          startTime: detail.pendingChangeStart || detail.startTime,
          endTime: detail.pendingChangeEnd || detail.endTime,
          pendingChangeDate: undefined,
          pendingChangeStart: undefined,
          pendingChangeEnd: undefined,
        });
        setDetail({
          ...detail,
          status: "upcoming",
          date: detail.pendingChangeDate || detail.date,
          startTime: detail.pendingChangeStart || detail.startTime,
          endTime: detail.pendingChangeEnd || detail.endTime,
          pendingChangeDate: undefined,
          pendingChangeStart: undefined,
          pendingChangeEnd: undefined,
        });
        addNotification({
          type: "change_approved",
          title: "日時変更が承認されました",
          message: `${detail.coachName}のレッスン日時が変更されました`,
          bookingId: detail.id,
        });
        toast.success("コーチが変更を承認しました");
      } else {
        // Revert to upcoming with original times
        updateBooking(detail.id, {
          status: "upcoming",
          pendingChangeDate: undefined,
          pendingChangeStart: undefined,
          pendingChangeEnd: undefined,
        });
        setDetail({
          ...detail,
          status: "upcoming",
          pendingChangeDate: undefined,
          pendingChangeStart: undefined,
          pendingChangeEnd: undefined,
        });
        addNotification({
          type: "change_rejected",
          title: "日時変更が却下されました",
          message: `${detail.coachName}が変更を承認しませんでした。元の日時のままです。`,
          bookingId: detail.id,
        });
        toast.error("コーチが変更を拒否しました。元の日時のままです。");
      }
    }
    setShowApproveSimulation(false);
  };

  // Simulate coach starting the lesson
  const simulateLessonStart = () => {
    updateBooking(detail.id, { status: "in_progress" });
    setDetail({ ...detail, status: "in_progress" });
    // For online lessons, send meeting link in chat
    if (detail.lessonType === "online") {
      addOnlineLessonLink(detail.id);
    }
    addNotification({
      type: "lesson_started",
      title: "レッスンが開始されました",
      message: `${detail.coachName}のレッスンが始まりました`,
      bookingId: detail.id,
    });
    toast("📢 コーチがレッスンを開始しました", {
      description: `${detail.coachName}のレッスンが始まりました`,
    });
  };

  // Simulate lesson completion → trigger rating
  const simulateLessonComplete = () => {
    updateBooking(detail.id, { status: "completed" });
    setDetail({ ...detail, status: "completed" });
    // Expire online lesson link (simulating 10 min after)
    if (detail.lessonType === "online") {
      expireOnlineLessonLink(detail.id);
    }
    addNotification({
      type: "lesson_completed",
      title: "レッスンが終了しました",
      message: `${detail.coachName}のレッスンが終了しました。評価をお願いします。`,
      bookingId: detail.id,
    });
    toast.success("レッスンが終了しました");
    // Open rating dialog
    setRatingStars(0);
    setRatingComment("");
    setShowRatingDialog(true);
  };

  const submitRating = () => {
    if (ratingStars === 0) return;
    const rating: BookingRating = {
      stars: ratingStars,
      comment: ratingComment,
      createdAt: new Date().toISOString(),
    };
    updateBooking(detail.id, { rating });
    setDetail({ ...detail, rating });
    setShowRatingDialog(false);
    toast.success("評価を送信しました。ありがとうございます！");
  };

  return (
    <InnerPageLayout
      title="予約詳細"
      onBack={() => navigate(-1)}
    >
      <div className="space-y-5">
        {/* Status & type badges */}
        <div className="flex items-center justify-center gap-2">
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full inline-flex items-center leading-none ${typeBadge.className}`}>
            {typeBadge.label}
          </span>
          <span className={`text-sm font-bold px-4 py-1.5 rounded-full border inline-flex items-center leading-none ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Pending confirmation notice */}
        {detail.status === "pending_confirmation" && (
          <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-[8px] px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">コーチの承認をお待ちください</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                予約リクエストを送信しました。コーチが確認後、承認または拒否の結果をお知らせします。
              </p>
            </div>
          </div>
        )}

        {/* Change pending notice */}
        {detail.status === "change_pending" && (
          <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-[8px] px-4 py-3 flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">日時変更の承認待ち</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                変更リクエスト: {formatDateLabel(detail.pendingChangeDate || "")} {detail.pendingChangeStart} 〜 {detail.pendingChangeEnd}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                コーチの承認後に変更が確定されます。
              </p>
            </div>
          </div>
        )}

        {/* In progress notice */}
        {detail.status === "in_progress" && (
          <div className="bg-available/10 border border-available/30 rounded-[8px] px-4 py-3 flex items-start gap-3">
            <Play className="w-5 h-5 text-available flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">課程進行中</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {detail.coachName}のレッスンが進行中です。終了後に評価をお願いします。
              </p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-[8px] border border-border p-4">
          <div className="flex gap-3">
            {isCoach ? (
              <div className="w-16 h-16 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                {detail.coachAvatar ? (
                  <img src={detail.coachAvatar} alt={detail.coachName} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : (
              <img
                src={detail.image}
                alt={detail.courtName}
                className="w-16 h-16 rounded-[8px] object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">
                {isCoach ? detail.coachName : detail.courtName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCoach ? `${detail.coachLevel} / ${detail.coachSpecialty}` : detail.courtSubName}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {isCoach ? detail.coachLocation : detail.address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-card rounded-[8px] border border-border divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">利用日</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{formatDateLabel(detail.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">時間</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {detail.startTime} 〜 {detail.endTime}
                {isCoach && detail.duration
                  ? `（${formatDuration(detail.duration)}）`
                  : detail.totalHours
                  ? `（${detail.totalHours}時間）`
                  : ""}
              </p>
            </div>
          </div>
          {!isCoach && detail.courtCount && detail.courtCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <LayoutGrid className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">コート数</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{detail.courtCount}面</p>
              </div>
            </div>
          )}
          {isCoach && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              {detail.lessonType === "online" ? (
                <Video className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">レッスン形式</p>
                {detail.lessonType === "online" ? (
                  <p className="text-sm font-medium text-primary mt-0.5">オンラインレッスン</p>
                ) : (
                  <div className="mt-0.5">
                    <p className="text-sm font-medium text-foreground">現場レッスン</p>
                    {detail.venueName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{detail.venueName}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment details */}
        <div className="bg-card rounded-[8px] border border-border p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">料金明細</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isCoach
                  ? `レッスン料（${detail.slotCount || 1}コマ × ¥${detail.pricePerUnit.toLocaleString()}）`
                  : `コート利用料（${detail.totalHours}時間 × ¥${detail.pricePerUnit.toLocaleString()}）`}
              </span>
              <span className="text-foreground">¥{detail.subtotal.toLocaleString()}</span>
            </div>
            {detail.coupon && detail.couponDiscount && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-primary">
                  <Tag className="w-3.5 h-3.5" />
                  {detail.coupon}
                </span>
                <span className="text-primary">-¥{detail.couponDiscount.toLocaleString()}</span>
              </div>
            )}
            {detail.pointsUsed > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-primary">
                  <Coins className="w-3.5 h-3.5" />
                  ポイント利用
                </span>
                <span className="text-primary">-¥{detail.pointsUsed.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="text-sm font-bold text-foreground">合計</span>
            <span className="text-lg font-bold text-foreground">¥{detail.total.toLocaleString()}</span>
          </div>
          {detail.earnedPoints > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <Coins className="w-3.5 h-3.5 text-accent-yellow" />
              <span className="text-xs text-muted-foreground">この予約で <span className="font-bold text-foreground">{detail.earnedPoints}pt</span> 獲得</span>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="bg-card rounded-[8px] border border-border p-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">お支払い方法</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{detail.paymentMethod}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {(detail.status === "upcoming" || detail.status === "pending_confirmation") && (
          <div className="space-y-3 pt-2">
            {canReschedule ? (
              <button
                onClick={handleOpenReschedule}
                className="w-full h-14 rounded-[4px] border border-primary text-primary text-base font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                日時を変更する
              </button>
            ) : detail.rescheduleUsed ? (
              <div className="text-center text-xs text-muted-foreground py-2">
                日時変更は1回のみ可能です（変更済み）
              </div>
            ) : null}
            <button
              onClick={() => setShowCancelDialog(true)}
              className="w-full h-14 rounded-[4px] border border-destructive text-destructive text-base font-bold hover:bg-destructive/5 transition-colors"
            >
              キャンセルする
            </button>
          </div>
        )}

        {detail.status === "change_pending" && (
          <div className="space-y-3 pt-2">
            <div className="text-center text-xs text-muted-foreground py-2">
              変更承認待ちのため、操作できません
            </div>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="w-full h-14 rounded-[4px] border border-destructive text-destructive text-base font-bold hover:bg-destructive/5 transition-colors"
            >
              キャンセルする
            </button>
          </div>
        )}

        {/* Demo: simulate coach response */}
        {isCoach && (detail.status === "pending_confirmation" || detail.status === "change_pending") && (
          <div className="bg-muted/50 rounded-[8px] border border-dashed border-border p-4 space-y-2">
            <p className="text-xs text-muted-foreground text-center font-medium">🧪 デモ: コーチの応答をシミュレート</p>
            <div className="flex gap-2">
              <button
                onClick={() => simulateCoachApproval(true)}
                className="flex-1 h-10 rounded-[4px] bg-available/15 text-available text-sm font-bold hover:bg-available/25 transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                承認
              </button>
              <button
                onClick={() => simulateCoachApproval(false)}
                className="flex-1 h-10 rounded-[4px] bg-destructive/10 text-destructive text-sm font-bold hover:bg-destructive/15 transition-colors flex items-center justify-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                拒否
              </button>
            </div>
          </div>
        )}

        {/* Demo: simulate lesson start */}
        {isCoach && detail.status === "upcoming" && (
          <div className="bg-muted/50 rounded-[8px] border border-dashed border-border p-4 space-y-2">
            <p className="text-xs text-muted-foreground text-center font-medium">🧪 デモ: レッスン開始をシミュレート</p>
            <button
              onClick={simulateLessonStart}
              className="w-full h-10 rounded-[4px] bg-available/15 text-available text-sm font-bold hover:bg-available/25 transition-colors flex items-center justify-center gap-1"
            >
              <Play className="w-4 h-4" />
              レッスン開始
            </button>
          </div>
        )}

        {/* Demo: simulate lesson complete */}
        {isCoach && detail.status === "in_progress" && (
          <div className="bg-muted/50 rounded-[8px] border border-dashed border-border p-4 space-y-2">
            <p className="text-xs text-muted-foreground text-center font-medium">🧪 デモ: レッスン終了をシミュレート</p>
            <button
              onClick={simulateLessonComplete}
              className="w-full h-10 rounded-[4px] bg-primary/15 text-primary text-sm font-bold hover:bg-primary/25 transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              レッスン終了
            </button>
          </div>
        )}

        {/* Rating display for completed bookings */}
        {detail.status === "completed" && detail.rating && (
          <div className="bg-card rounded-[8px] border border-border p-4 space-y-2">
            <h3 className="text-sm font-bold text-foreground">あなたの評価</h3>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < detail.rating!.stars
                      ? "fill-accent-yellow text-accent-yellow"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            {detail.rating.comment && (
              <p className="text-sm text-muted-foreground leading-relaxed">{detail.rating.comment}</p>
            )}
          </div>
        )}

        {/* Prompt to rate if completed without rating */}
        {detail.status === "completed" && isCoach && !detail.rating && (
          <button
            onClick={() => { setRatingStars(0); setRatingComment(""); setShowRatingDialog(true); }}
            className="w-full h-14 rounded-[4px] border border-primary text-primary text-base font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5" />
            コーチを評価する
          </button>
        )}
      </div>

      {/* Cancel confirmation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-[8px] max-w-[320px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">予約をキャンセル</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              この予約をキャンセルしてもよろしいですか？キャンセル後は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[4px]">戻る</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground rounded-[4px]"
            >
              キャンセルする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating dialog */}
      <AlertDialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <AlertDialogContent className="rounded-[8px] max-w-[320px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-center">レッスンはいかがでしたか？</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground text-center">
                  {detail.coachName}のレッスンを評価してください
                </p>
                {/* Star selector */}
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setRatingStars(i + 1)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          i < ratingStars
                            ? "fill-accent-yellow text-accent-yellow"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {ratingStars > 0 && (
                  <p className="text-center text-sm font-medium text-foreground">
                    {ratingStars === 5 ? "最高！" : ratingStars === 4 ? "良い！" : ratingStars === 3 ? "普通" : ratingStars === 2 ? "いまいち" : "残念"}
                  </p>
                )}
                {/* Comment */}
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="感想やコメントがあればご記入ください（任意）"
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-[6px] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={submitRating}
              disabled={ratingStars === 0}
              className="w-full rounded-[4px] bg-primary text-primary-foreground disabled:opacity-40"
            >
              評価を送信
            </AlertDialogAction>
            <AlertDialogCancel className="w-full rounded-[4px] mt-0">あとで</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomSheet
        open={showReschedule}
        title="日時を変更"
        onClose={() => { setShowReschedule(false); setSelectedSlot(null); }}
        onConfirm={handleReschedule}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {isCoach
              ? detail.lessonType === "onsite"
                ? `${detail.coachName}（${detail.coachLevel}）× ${detail.venueName} の空き日時`
                : `${detail.coachName}（${detail.coachLevel}）の空き日時`
              : `${detail.courtSubName}の空き日時（${detail.totalHours}時間枠）`}
          </p>
          {isCoach && (
            <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-[6px] px-3 py-2">
              <p className="text-xs text-accent-yellow font-medium">
                ⚠ 変更はコーチの承認が必要です（1回のみ変更可能）
              </p>
              {detail.lessonType === "onsite" && detail.venueName && (
                <p className="text-xs text-muted-foreground mt-1">
                  現場レッスンのため、場地「{detail.venueName}」も空いている時間のみ表示しています
                </p>
              )}
            </div>
          )}
          <MiniCalendar value={rescheduleDate} onChange={(v) => { setRescheduleDate(v); setSelectedSlot(null); }} />
          <div className="space-y-2">
            {availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">この日は空きがありません</p>
            ) : (
              availableSlots.map((slot) => {
                const slotKey = `${slot.start}-${slot.end}`;
                return (
                  <button
                    key={slotKey}
                    onClick={() => setSelectedSlot(slotKey)}
                    className={`w-full py-3 rounded-[8px] border text-sm font-medium transition-colors ${
                      selectedSlot === slotKey
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {slot.start} 〜 {slot.end}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </BottomSheet>
    </InnerPageLayout>
  );
};

export default BookingDetailPage;
