import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";
import { History, User } from "lucide-react";
import { addMonths, subMonths } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { getBookings, type StoredBooking } from "@/lib/bookingStore";
import { COURTS } from "@/lib/courtData";
import { COACHES, getCoachAvatar } from "@/lib/coachData";

const courtA = COURTS[0].image;
const courtB = COURTS[1].image;
const courtC = COURTS[2].image;
const coach1Img = COACHES[0].avatar;
const coach2Img = COACHES[1].avatar;

type BookingStatus = "upcoming" | "completed" | "cancelled" | "failed" | "pending_confirmation" | "change_pending" | "in_progress";
type BookingType = "court" | "coach";

interface Booking {
  id: string;
  type: BookingType;
  // Court fields
  courtName?: string;
  courtSubName?: string;
  image?: string;
  // Coach fields
  coachName?: string;
  coachAvatar?: string;
  coachLevel?: string;
  coachSpecialty?: string;
  // Common
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

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1", type: "court",
    courtName: "パデルコート広島", courtSubName: "コートA（屋外ハード）",
    date: "2026-04-20", startTime: "14:00", endTime: "16:00",
    status: "upcoming", image: courtA,
  },
  {
    id: "c1", type: "coach",
    coachName: "佐藤翔太", coachAvatar: coach1Img, coachLevel: "A級", coachSpecialty: "初心者指導",
    date: "2026-04-22", startTime: "10:00", endTime: "10:50",
    status: "upcoming",
  },
  {
    id: "2", type: "court",
    courtName: "北広島パデルクラブ", courtSubName: "コートB（室内）",
    date: "2026-04-25", startTime: "10:00", endTime: "12:00",
    status: "upcoming", image: courtB,
  },
  {
    id: "c2", type: "coach",
    coachName: "田中美咲", coachAvatar: coach2Img, coachLevel: "S級", coachSpecialty: "競技向け",
    date: "2026-04-28", startTime: "13:00", endTime: "14:50",
    status: "upcoming",
  },
  {
    id: "3", type: "court",
    courtName: "パデルコート広島", courtSubName: "コートA（屋外ハード）",
    date: "2026-03-10", startTime: "14:00", endTime: "16:00",
    status: "completed", image: courtA,
  },
  {
    id: "c3", type: "coach",
    coachName: "佐藤翔太", coachAvatar: coach1Img, coachLevel: "A級", coachSpecialty: "初心者指導",
    date: "2026-03-12", startTime: "09:00", endTime: "09:50",
    status: "completed",
  },
  {
    id: "4", type: "court",
    courtName: "北広島パデルクラブ", courtSubName: "コートB（室内）",
    date: "2026-03-15", startTime: "10:00", endTime: "12:00",
    status: "cancelled", image: courtB,
  },
  {
    id: "5", type: "court",
    courtName: "広島中央スポーツ", courtSubName: "コートC（室内ハード）",
    date: "2026-03-20", startTime: "18:00", endTime: "20:00",
    status: "completed", image: courtC,
  },
  {
    id: "6", type: "court",
    courtName: "パデルコート広島", courtSubName: "コートC（室内ハード）",
    date: "2026-03-20", startTime: "18:00", endTime: "20:00",
    status: "failed", image: courtA,
  },
];

const BookingHistory = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const bottomNav = <BottomNav active={1} />;

  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      setMonth((prev) => (diff > 0 ? subMonths(prev, 1) : addMonths(prev, 1)));
    }
    touchStartX.current = null;
  }, []);

  // Merge mock bookings with stored bookings
  const allBookings = useMemo(() => {
    const stored = getBookings();
    const storedAsBH: Booking[] = stored.map((s) => ({
      id: s.id,
      type: s.type,
      courtName: s.courtName,
      courtSubName: s.courtSubName,
      image: s.image,
      coachName: s.coachName,
      coachAvatar: s.coachAvatar || getCoachAvatar(s.coachName || ""),
      coachLevel: s.coachLevel,
      coachSpecialty: s.coachSpecialty,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
    }));
    const ids = new Set(storedAsBH.map((b) => b.id));
    const merged = [...storedAsBH, ...MOCK_BOOKINGS.filter((b) => !ids.has(b.id))];
    return merged.sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  const eventDates = allBookings.map((b) => b.date);
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const dayEvents = allBookings.filter((b) => b.date === selectedDateStr);

  return (
    <PhoneMockup bottomNav={bottomNav}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-30 bg-background">
          <div className="px-[20px] pt-4 pb-3 relative flex items-center justify-center">
            <h1 className="text-xl font-bold text-center text-foreground">予約</h1>
            <div className="absolute right-[20px] flex items-center gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setMonth(today);
                }}
                className="h-8 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                今日
              </button>
              <button
                onClick={() => navigate("/bookings/past")}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <History className="w-[18px] h-[18px] text-foreground" />
              </button>
            </div>
          </div>
          <Separator />

        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* Calendar */}
          <div
            className="px-2"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={month}
              onMonthChange={setMonth}
              locale={ja}
              className={cn("p-3 pointer-events-auto w-full")}
              classNames={{
                months: "flex flex-col w-full",
                month: "w-full space-y-3",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                row: "flex w-full mt-1",
                cell: "relative w-full p-0 text-center text-sm focus-within:relative",
                day: cn(
                  "h-9 w-full p-0 font-normal rounded-[4px]",
                  "hover:bg-muted transition-colors"
                ),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                day_today: "border border-primary/30",
              }}
              modifiers={{
                hasEvent: (date) => eventDates.includes(format(date, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{
                hasEvent: "calendar-has-event",
              }}
            />
          </div>

          <Separator />

          {/* Events for selected date */}
          <div className="px-[20px] pt-4 pb-6">
            <p className="text-sm font-bold text-foreground mb-3">
              {selectedDate
                ? format(selectedDate, "M月d日（E）", { locale: ja })
                : "日付を選択"}
            </p>

            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">予約はありません</p>
            ) : (
              <div className="space-y-3">
                {dayEvents.map((event) => {
                  const statusConfig = STATUS_CONFIG[event.status];
                  const typeBadge = TYPE_BADGE[event.type];
                  const dateStr = event.date.replace(/-/g, "/");
                  return (
                    <button
                      key={event.id}
                      onClick={() => navigate(`/booking/detail/${event.id}`)}
                      className="w-full bg-card border border-border rounded-[8px] p-3 flex gap-3 text-left hover:border-primary/20 transition-colors"
                    >
                      {/* Thumbnail / Avatar */}
                      {event.type === "court" ? (
                        <img
                          src={event.image}
                          alt={event.courtName}
                          className="w-20 h-20 rounded-[8px] object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-[8px] bg-muted flex-shrink-0 overflow-hidden">
                          {event.coachAvatar ? (
                            <img src={event.coachAvatar} alt={event.coachName} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeBadge.className}`}>
                              {typeBadge.label}
                            </span>
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground truncate">
                          {event.type === "court" ? event.courtName : event.coachName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {event.type === "court" ? event.courtSubName : `${event.coachLevel} / ${event.coachSpecialty}`}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1.5">
                          {dateStr} {event.startTime}〜{event.endTime}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
};

export default BookingHistory;
