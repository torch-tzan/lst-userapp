import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import BottomSheet from "@/components/pickers/BottomSheet";
import MiniCalendar from "@/components/pickers/MiniCalendar";
import { Star, MapPin, Clock, Calendar, ChevronLeft, ChevronRight, Video, FileVideo } from "lucide-react";
import { getBookings, type StoredBooking } from "@/lib/bookingStore";
import { COACHES_DETAIL, type CoachDetail as CoachDetailType, type CoachReview, type CoachVenue, type LessonMenu } from "@/lib/coachData";

const levelColor: Record<string, string> = {
  "S級": "bg-red-100 text-red-700",
  "A級": "bg-primary/15 text-primary",
  "B級": "bg-blue-100 text-blue-700",
};

const formatDateLabel = (d: string) => {
  const dt = new Date(d + "T00:00:00");
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const dayOfWeek = weekdays[dt.getDay()];
  const label = `${dt.getMonth() + 1}月${dt.getDate()}日（${dayOfWeek}）`;
  if (d === todayStr) return `本日 ${label}`;
  if (d === tomorrowStr) return `明日 ${label}`;
  return label;
};

const CoachDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const coach = COACHES_DETAIL[id || "1"];

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(todayStr);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(coach?.lessonMenus[0]?.id || "");
  const selectedMenu = coach?.lessonMenus.find((m) => m.id === selectedMenuId);
  const lessonType = selectedMenu?.type || "onsite";
  const [selectedVenueId, setSelectedVenueId] = useState(coach?.venues[0]?.id || "");
  const selectedVenue = coach?.venues.find((v) => v.id === selectedVenueId);

  // Booking drawer state
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);

  // Merge user-submitted reviews from bookingStore
  const [userReviews, setUserReviews] = useState<CoachReview[]>([]);
  useEffect(() => {
    const bookings = getBookings();
    const coachReviews = bookings
      .filter((b: StoredBooking) => b.type === "coach" && b.coachName === coach?.name && b.rating)
      .map((b: StoredBooking) => ({
        id: `user-${b.id}`,
        name: "あなた",
        rating: b.rating!.stars,
        date: b.rating!.createdAt.split("T")[0],
        comment: b.rating!.comment,
      }));
    setUserReviews(coachReviews);
  }, [coach?.name]);

  const allReviews = useMemo(() => {
    return [...userReviews, ...(coach?.reviews || [])];
  }, [userReviews, coach?.reviews]);

  const coachAvailableDates = useMemo(() => {
    const dates = new Set<string>();
    const seed = parseInt(id || "1");
    const base = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dayHash = (d.getDate() * 7 + seed * 13 + d.getDay()) % 10;
      if (dayHash > 2) {
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        dates.add(str);
      }
    }
    return dates;
  }, [id]);

  if (!coach) {
    return (
      <InnerPageLayout title="コーチ詳細" onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center pt-20 gap-4">
          <p className="text-base font-bold text-foreground">コーチが見つかりません</p>
        </div>
      </InnerPageLayout>
    );
  }

  const prevDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (str >= todayStr) {
      setSelectedDate(str);
      setSelectedSlots([]);
    }
  };

  const nextDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setSelectedDate(str);
    setSelectedSlots([]);
  };

  const toggleSlot = (time: string) => {
    if (selectedSlots.includes(time)) {
      if (time === selectedSlots[0] || time === selectedSlots[selectedSlots.length - 1]) {
        setSelectedSlots(selectedSlots.filter((s) => s !== time));
      }
      return;
    }
    if (selectedSlots.length === 0) {
      setSelectedSlots([time]);
      return;
    }
    const availableTimes = coach.availableSlots.filter((s) => s.available).map((s) => s.time);
    const allSelected = [...selectedSlots, time].sort();
    const firstIdx = availableTimes.indexOf(allSelected[0]);
    const lastIdx = availableTimes.indexOf(allSelected[allSelected.length - 1]);
    if (firstIdx === -1 || lastIdx === -1) return;
    const span = availableTimes.slice(firstIdx, lastIdx + 1);
    if (span.length === allSelected.length && span.every((t, i) => t === allSelected[i])) {
      setSelectedSlots(allSelected);
    }
  };

  const slotCount = selectedSlots.length;
  const totalMinutes = slotCount > 0 ? slotCount * 50 + (slotCount - 1) * 10 : 0;
  const menuPrice = selectedMenu ? slotCount * selectedMenu.price : 0;
  const courtFee = lessonType === "onsite" && selectedVenue ? slotCount * selectedVenue.courtFeePerHour : 0;
  const totalPrice = menuPrice + courtFee;

  const formatTotalDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}分`;
    if (m === 0) return `${h}時間`;
    return `${h}時間${m}分`;
  };

  const getTimeRange = () => {
    if (slotCount === 0) return "";
    const first = selectedSlots[0];
    const lastStartH = parseInt(selectedSlots[slotCount - 1].split(":")[0]);
    const lastStartM = parseInt(selectedSlots[slotCount - 1].split(":")[1]);
    const endTotalMin = lastStartH * 60 + lastStartM + 50;
    const endH = Math.floor(endTotalMin / 60);
    const endM = endTotalMin % 60;
    return `${first} 〜 ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const handleProceedToConfirm = () => {
    if (lessonType === "review") {
      // Review type: no time selection needed
      navigate("/booking/confirm", {
        state: {
          type: "coach",
          coachId: coach.id,
          coachName: coach.name,
          coachAvatar: coach.avatar,
          coachLevel: coach.level,
          coachSpecialty: coach.specialty.join("・"),
          location: "オンラインレビュー",
          date: new Date().toISOString().slice(0, 10),
          slots: [],
          timeRange: "",
          duration: 0,
          pricePerHour: selectedMenu?.price || 0,
          slotCount: 1,
          lessonType: "review" as const,
        },
      });
      setShowBookingDrawer(false);
      return;
    }
    if (slotCount === 0) return;
    setShowBookingDrawer(false);
    navigate("/booking/confirm", {
      state: {
        type: "coach",
        coachId: coach.id,
        coachName: coach.name,
        coachAvatar: coach.avatar,
        coachLevel: coach.level,
        coachSpecialty: coach.specialty.join("・"),
        location: lessonType === "online" ? "オンライン" : selectedVenue?.address || coach.location,
        date: selectedDate,
        slots: selectedSlots,
        timeRange: getTimeRange(),
        duration: totalMinutes,
        pricePerHour: selectedMenu?.price || coach.pricePerHour,
        slotCount,
        lessonType,
        venueName: lessonType === "onsite" ? selectedVenue?.name : undefined,
        venueAddress: lessonType === "onsite" ? selectedVenue?.address : undefined,
        courtFeePerHour: lessonType === "onsite" ? selectedVenue?.courtFeePerHour : undefined,
      },
    });
  };

  const openBookingDrawer = () => {
    setSelectedSlots([]);
    setSelectedDate(todayStr);
    setSelectedMenuId(coach.lessonMenus[0]?.id || "");
    setSelectedVenueId(coach.venues[0]?.id || "");
    setShowBookingDrawer(true);
  };

  return (
    <InnerPageLayout
      title="コーチ詳細"
      onBack={() => navigate(-1)}
      ctaLabel="今すぐ予約する"
      onCtaClick={openBookingDrawer}
    >
      <div className="space-y-5">
        {/* Profile header - horizontal card style */}
        <div className="flex items-start gap-3 relative">
          {/* Rectangular avatar */}
          <div className="w-24 h-[120px] rounded-[8px] bg-muted flex-shrink-0 overflow-hidden">
            {coach.avatar ? (
              <img src={coach.avatar} alt={coach.name} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>

          {/* Rating badge - top right */}
          <span className="absolute top-0 right-0 bg-accent-yellow/15 text-accent-yellow text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 leading-none">
            ★{coach.rating}
            <span className="text-[10px] font-normal text-accent-yellow/70">({coach.reviewCount})</span>
          </span>

          <div className="flex-1 min-w-0 py-0.5">
            <h2 className="text-lg font-bold text-foreground pr-20">{coach.name}</h2>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${levelColor[coach.level] || "bg-muted text-muted-foreground"}`}>
                {coach.level}
              </span>
              {coach.specialty.map((sp) => (
                <span key={sp} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {sp}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground">{coach.location}</span>
            </div>
            {coach.onlineAvailable && (
              <div className="flex items-center gap-1 mt-0.5">
                <Video className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="text-[10px] font-medium text-primary">オンライン対応</span>
              </div>
            )}
            {(() => {
              const prices = coach.lessonMenus.map((m) => m.price);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              return (
                <p className="text-sm font-bold text-foreground mt-1.5">
                  ¥{minPrice.toLocaleString()}{minPrice !== maxPrice && ` 〜 ¥${maxPrice.toLocaleString()}`}/{coach.duration}分
                </p>
              );
            })()}
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground">{coach.experience}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-[8px] p-4 px-0">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center px-2">
              <p className="text-[11px] text-muted-foreground mb-1">セッション数</p>
              <p className="text-lg font-bold text-foreground">{coach.stats.sessions}<span className="text-xs font-normal text-muted-foreground">回</span></p>
            </div>
            <div className="text-center px-2">
              <p className="text-[11px] text-muted-foreground mb-1">リピート率</p>
              <p className="text-lg font-bold text-foreground">{coach.stats.repeatRate}<span className="text-xs font-normal text-muted-foreground">%</span></p>
            </div>
            <div className="text-center px-2">
              <p className="text-[11px] text-muted-foreground mb-1">満足度</p>
              <p className="text-lg font-bold text-foreground">{coach.stats.satisfaction}<span className="text-xs font-normal text-muted-foreground">%</span></p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">自己紹介</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{coach.bio}</p>
        </div>

        {/* Certifications */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">資格・認定</h3>
          <div className="flex flex-wrap gap-2">
            {coach.certifications.map((c) => (
              <span key={c} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">
            レビュー（{allReviews.length}件）
          </h3>

          {/* Average rating summary */}
          {allReviews.length > 0 && (() => {
            const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            const distribution = [5, 4, 3, 2, 1].map((star) => ({
              star,
              count: allReviews.filter((r) => r.rating === star).length,
            }));
            return (
              <div className="bg-card rounded-[8px] border border-border p-4 mb-3">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{avg.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 mt-1 justify-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(avg)
                              ? "fill-accent-yellow text-accent-yellow"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{allReviews.length}件の評価</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {distribution.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-3 text-right">{star}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-yellow rounded-full"
                            style={{ width: `${(count / allReviews.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-4">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          <div className="space-y-3">
            {allReviews.map((review) => (
              <div key={review.id} className="bg-card rounded-[8px] border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-foreground">{review.name}</span>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < review.rating
                          ? "fill-accent-yellow text-accent-yellow"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Booking Drawer ===== */}
      <BottomSheet
        open={showBookingDrawer}
        title="予約内容を選択"
        onClose={() => setShowBookingDrawer(false)}
        onConfirm={handleProceedToConfirm}
        confirmDisabled={lessonType !== "review" && slotCount === 0}
        confirmLabel={
          lessonType === "review"
            ? `予約に進む（¥${(selectedMenu?.price || 0).toLocaleString()}）`
            : slotCount > 0
            ? `予約に進む（¥${totalPrice.toLocaleString()}）`
            : "時間帯を選択してください"
        }
      >
        <div className="space-y-5">
          {/* Lesson menu selection */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">レッスンメニュー</h3>
            <div className="space-y-2">
              {coach.lessonMenus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => {
                    setSelectedMenuId(menu.id);
                    setSelectedSlots([]);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-[8px] border transition-colors ${
                    selectedMenuId === menu.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      {menu.type === "review" ? (
                        <FileVideo className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      ) : menu.type === "online" ? (
                        <Video className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <p className={`text-sm font-bold ${selectedMenuId === menu.id ? "text-primary" : "text-foreground"}`}>
                        {menu.name}
                      </p>
                    </div>
                    <p className={`text-sm font-bold ${selectedMenuId === menu.id ? "text-primary" : "text-foreground"}`}>
                      ¥{menu.price.toLocaleString()}{menu.duration > 0 && <span className="text-[10px] font-normal text-muted-foreground">/{menu.duration}分</span>}
                    </p>
                  </div>
                  {menu.description && (
                    <p className="text-xs text-muted-foreground pl-5">{menu.description}</p>
                  )}
                  <span className={`inline-block mt-1 ml-5 text-[10px] px-1.5 py-0.5 rounded ${
                    menu.type === "review" ? "bg-accent-yellow/15 text-accent-yellow" : menu.type === "online" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {menu.type === "review" ? "レビュー" : menu.type === "online" ? "オンライン" : "現場"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Venue selector for onsite menus */}
          {lessonType === "onsite" && coach.venues.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">レッスン場所</h3>
              <div className="space-y-2">
                {coach.venues.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => setSelectedVenueId(venue.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-[8px] border transition-colors ${
                      selectedVenueId === venue.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${selectedVenueId === venue.id ? "text-primary" : "text-foreground"}`}>
                        {venue.name}
                      </p>
                      <p className={`text-xs font-bold ${selectedVenueId === venue.id ? "text-primary" : "text-muted-foreground"}`}>
                        ¥{venue.courtFeePerHour.toLocaleString()}/h
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{venue.address}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {lessonType === "online" && (
            <div className="bg-primary/5 border border-primary/20 rounded-[8px] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-primary leading-relaxed">
                  オンラインレッスンはビデオ通話で行います。予約完了後に接続リンクをお送りします。
                </p>
              </div>
            </div>
          )}

          {lessonType === "review" && (
            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-[8px] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-accent-yellow flex-shrink-0" />
                <p className="text-xs text-accent-yellow leading-relaxed">
                  お支払い完了後、メッセージからプレー動画を送信してください。コーチからフィードバックが届きます。
                </p>
              </div>
            </div>
          )}

          {/* Date & Time - hidden for review type */}
          {lessonType !== "review" && (
            <>
              {/* Date selector */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">日付</h3>
                <div className="flex items-center justify-between bg-card rounded-[8px] border border-border p-2">
                  <button
                    onClick={prevDay}
                    disabled={selectedDate <= todayStr}
                    className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setTempDate(selectedDate); setShowDatePicker(true); }}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    {formatDateLabel(selectedDate)}
                  </button>
                  <button
                    onClick={nextDay}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">時間帯を選択（連続選択可）</p>
                <div className="grid grid-cols-4 gap-2">
                  {coach.availableSlots.map((slot) => {
                    const isSelected = selectedSlots.includes(slot.time);
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => toggleSlot(slot.time)}
                        className={`py-2.5 rounded-[6px] text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground border border-primary"
                            : slot.available
                            ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                            : "bg-muted text-muted-foreground/40 cursor-not-allowed line-through"
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
                {slotCount > 0 && (
                  <div className="mt-3 bg-primary/5 border border-primary/20 rounded-[8px] px-3 py-2.5 space-y-1">
                    <p className="text-sm font-bold text-primary">
                      {getTimeRange()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {slotCount}コマ（{formatTotalDuration(totalMinutes)}）
                      {slotCount > 1 && ` = 50分×${slotCount} + 休憩${(slotCount - 1) * 10}分`}
                    </p>
                    <div className="border-t border-primary/10 pt-1 mt-1 space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{selectedMenu?.name || "レッスン料"}</span>
                        <span className="text-foreground">¥{menuPrice.toLocaleString()}</span>
                      </div>
                      {courtFee > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">場地費（{selectedVenue?.name}）</span>
                          <span className="text-foreground">¥{courtFee.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-foreground">合計</span>
                        <span className="text-primary">¥{totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </BottomSheet>

      {/* Date picker (nested) */}
      <BottomSheet
        open={showDatePicker}
        title="日付を選択"
        onClose={() => setShowDatePicker(false)}
        onConfirm={() => {
          setSelectedDate(tempDate);
          setSelectedSlots([]);
          setShowDatePicker(false);
        }}
      >
        <MiniCalendar
          value={tempDate}
          onChange={setTempDate}
          availableDates={coachAvailableDates}
        />
      </BottomSheet>
    </InnerPageLayout>
  );
};

export default CoachDetail;
