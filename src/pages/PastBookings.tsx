import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import AnimatedTabs from "@/components/AnimatedTabs";
import { MapPin, Clock, User } from "lucide-react";
import { getBookings } from "@/lib/bookingStore";
import { COACHES, getCoachAvatar } from "@/lib/coachData";
import { COURTS } from "@/lib/courtData";

type BookingStatus = "upcoming" | "completed" | "cancelled" | "failed" | "pending_confirmation" | "change_pending" | "in_progress";
type BookingType = "court" | "coach";

interface Booking {
  id: string;
  type: BookingType;
  courtName?: string;
  courtSubName?: string;
  image?: string;
  coachName?: string;
  coachAvatar?: string;
  coachLevel?: string;
  coachSpecialty?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  upcoming: { label: "予約確定", className: "bg-primary/10 text-primary" },
  pending_confirmation: { label: "承認待ち", className: "bg-accent-yellow/15 text-accent-yellow" },
  change_pending: { label: "変更承認待ち", className: "bg-accent-yellow/15 text-accent-yellow" },
  in_progress: { label: "レッスン中", className: "bg-available/15 text-available" },
  completed: { label: "利用済み", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "キャンセル", className: "bg-muted text-muted-foreground" },
  failed: { label: "予約不成立", className: "bg-destructive/10 text-destructive" },
};

const TYPE_BADGE: Record<BookingType, { label: string; className: string }> = {
  court: { label: "コート", className: "bg-blue-100 text-blue-700" },
  coach: { label: "コーチ", className: "bg-primary/15 text-primary" },
};

const coach1Img = COACHES[0].avatar;

const MOCK_PAST: Booking[] = [
  { id: "3", type: "court", courtName: "パデルコート広島", courtSubName: "コートA（屋外ハード）", image: COURTS[0].image, date: "2026-03-10", startTime: "14:00", endTime: "16:00", status: "completed" },
  { id: "c3", type: "coach", coachName: "佐藤翔太", coachAvatar: coach1Img, coachLevel: "A級", coachSpecialty: "初心者指導", date: "2026-03-12", startTime: "09:00", endTime: "09:50", status: "completed" },
  { id: "4", type: "court", courtName: "北広島パデルクラブ", courtSubName: "コートB（室内）", image: COURTS[1].image, date: "2026-03-15", startTime: "10:00", endTime: "12:00", status: "cancelled" },
  { id: "5", type: "court", courtName: "広島中央スポーツ", courtSubName: "コートC（室内ハード）", image: COURTS[2].image, date: "2026-03-20", startTime: "18:00", endTime: "20:00", status: "completed" },
  { id: "6", type: "court", courtName: "パデルコート広島", courtSubName: "コートC（室内ハード）", image: COURTS[0].image, date: "2026-03-20", startTime: "18:00", endTime: "20:00", status: "failed" },
];

type StatusFilter = "all" | "upcoming" | "pending" | "completed" | "cancelled";

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "upcoming", label: "確定" },
  { key: "pending", label: "承認待ち" },
  { key: "completed", label: "完了" },
  { key: "cancelled", label: "キャンセル" },
];

const matchesFilter = (status: BookingStatus, filter: StatusFilter): boolean => {
  switch (filter) {
    case "all": return true;
    case "upcoming": return status === "upcoming" || status === "in_progress";
    case "pending": return status === "pending_confirmation" || status === "change_pending";
    case "completed": return status === "completed";
    case "cancelled": return status === "cancelled" || status === "failed";
  }
};

const formatDate = (d: string) => d.replace(/-/g, "/");

const PastBookings = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const allBookings = useMemo(() => {
    const stored = getBookings();
    const storedAsBooking: Booking[] = stored.map((s) => ({
      id: s.id, type: s.type, courtName: s.courtName, courtSubName: s.courtSubName,
      image: s.image,
      coachName: s.coachName, coachAvatar: s.coachAvatar || getCoachAvatar(s.coachName || ""),
      coachLevel: s.coachLevel, coachSpecialty: s.coachSpecialty,
      date: s.date, startTime: s.startTime, endTime: s.endTime, status: s.status,
    }));
    const ids = new Set(storedAsBooking.map((b) => b.id));
    const merged = [...storedAsBooking, ...MOCK_PAST.filter((b) => !ids.has(b.id))];
    return merged.sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const filtered = allBookings.filter((b) => matchesFilter(b.status, filter));

  return (
    <InnerPageLayout title="予約履歴">
      {/* Tabs */}
      <div className="-mx-[20px] mb-3 -mt-6">
        <AnimatedTabs
          tabs={FILTER_TABS.map((t) => ({ key: t.key, label: t.label }))}
          activeKey={filter}
          onChange={(key) => setFilter(key as StatusFilter)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center pt-20">
          <p className="text-sm text-muted-foreground">該当する予約はありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const status = STATUS_CONFIG[booking.status];
            const typeBadge = TYPE_BADGE[booking.type];
            const isCoach = booking.type === "coach";
            const avatar = isCoach ? (booking.coachAvatar || getCoachAvatar(booking.coachName || "")) : undefined;
            return (
              <button
                key={booking.id}
                onClick={() => navigate(`/booking/detail/${booking.id}`)}
                className="w-full bg-card border border-border rounded-[8px] p-3 flex gap-3 text-left hover:border-primary/20 transition-colors"
              >
                {/* Thumbnail / Avatar */}
                {isCoach ? (
                  <div className="w-16 h-16 rounded-[8px] bg-muted flex-shrink-0 overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt={booking.coachName} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ) : (
                  booking.image ? (
                    <img src={booking.image} alt={booking.courtName} loading="lazy" className="w-16 h-16 rounded-[8px] object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-[8px] bg-muted flex-shrink-0 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeBadge.className}`}>
                        {typeBadge.label}
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">
                    {isCoach ? booking.coachName : booking.courtName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {isCoach ? `${booking.coachLevel} / ${booking.coachSpecialty}` : booking.courtSubName}
                  </p>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDate(booking.date)} {booking.startTime}〜{booking.endTime}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </InnerPageLayout>
  );
};

export default PastBookings;
