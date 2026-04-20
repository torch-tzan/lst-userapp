import { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import BottomSheet from "@/components/pickers/BottomSheet";
import MiniCalendar from "@/components/pickers/MiniCalendar";
import { MapPin, Clock, Star, ChevronLeft, ChevronRight, Calendar, Minus, Plus, LayoutGrid, User, Users } from "lucide-react";
import { COURTS_DETAIL, getSoloHourlyPrice } from "@/lib/courtData";

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

interface SearchState {
  date?: string;
  startTime?: string;
  endTime?: string;
  fromEvent?: string;
  teamId?: string;
}

type BookingMode = "solo" | "standard";

const CourtDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const searchState = (location.state as SearchState) || {};
  const court = COURTS_DETAIL[id || "1"];

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  const initialDate = searchState.date && searchState.date >= todayStr ? searchState.date : todayStr;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [courtCount, setCourtCount] = useState(1);
  const [mode, setMode] = useState<BookingMode>("standard");
  const [equipmentQty, setEquipmentQty] = useState<Record<string, number>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCourtCountPicker, setShowCourtCountPicker] = useState(false);
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);
  const [tempDate, setTempDate] = useState(initialDate);
  const [tempCourtCount, setTempCourtCount] = useState(1);

  const courtAvailableDates = useMemo(() => {
    const dates = new Set<string>();
    const seed = parseInt(id || "1");
    const base = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dayHash = (d.getDate() * 7 + seed * 11 + d.getDay()) % 10;
      if (dayHash > 2) {
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        dates.add(str);
      }
    }
    return dates;
  }, [id]);

  if (!court) {
    return (
      <InnerPageLayout title="コート詳細" onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center pt-20 gap-4">
          <p className="text-base font-bold text-foreground">コートが見つかりません</p>
        </div>
      </InnerPageLayout>
    );
  }

  const toggleSlot = (time: string) => {
    setSelectedSlots((prev) => {
      if (prev.includes(time)) return prev.filter((t) => t !== time);

      const next = [...prev, time].sort();

      const slotTimes = court.availableSlots.map((s) => s.time);
      const rangeStart = slotTimes.indexOf(next[0]);
      const rangeEnd = slotTimes.indexOf(next[next.length - 1]);
      const contiguous: string[] = [];
      for (let i = rangeStart; i <= rangeEnd; i++) {
        if (!court.availableSlots[i].available) return prev;
        contiguous.push(court.availableSlots[i].time);
      }
      return contiguous;
    });
  };

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

  const totalHours = selectedSlots.length;
  const effectiveHourlyPrice = mode === "solo" ? getSoloHourlyPrice(court.price) : court.price;
  const effectiveCourtCount = mode === "solo" ? 1 : courtCount;
  const courtFee = totalHours * effectiveHourlyPrice * effectiveCourtCount;

  const equipmentLines = useMemo(() => {
    if (!court.equipment) return [];
    return court.equipment
      .filter((e) => (equipmentQty[e.id] ?? 0) > 0)
      .map((e) => {
        const qty = equipmentQty[e.id] ?? 0;
        const lineTotal = e.priceType === "hourly" ? e.price * qty * totalHours : e.price * qty;
        return { id: e.id, name: e.name, priceType: e.priceType, unitPrice: e.price, qty, lineTotal };
      });
  }, [court.equipment, equipmentQty, totalHours]);

  const equipmentTotal = equipmentLines.reduce((s, l) => s + l.lineTotal, 0);
  const totalPrice = courtFee + equipmentTotal;

  const adjustEquipment = (id: string, delta: number, max: number) => {
    setEquipmentQty((prev) => {
      const curr = prev[id] ?? 0;
      const next = Math.max(0, Math.min(max, curr + delta));
      return { ...prev, [id]: next };
    });
  };

  const openBookingDrawer = () => {
    setSelectedSlots([]);
    setSelectedDate(initialDate);
    setCourtCount(1);
    setMode("standard");
    setEquipmentQty({});
    setShowBookingDrawer(true);
  };

  const handleProceedToConfirm = () => {
    if (totalHours === 0) return;
    setShowBookingDrawer(false);
    navigate("/booking/confirm", {
      state: {
        courtId: id,
        courtName: court.name,
        courtSubName: `${court.courtName}（${court.courtType}）`,
        courtImage: court.image,
        address: court.address,
        date: selectedDate,
        slots: selectedSlots,
        courtCount: effectiveCourtCount,
        pricePerHour: effectiveHourlyPrice,
        mode,
        equipment: equipmentLines,
        equipmentTotal,
        fromEvent: searchState.fromEvent,
        teamId: searchState.teamId,
      },
    });
  };

  return (
    <InnerPageLayout
      title="コート詳細"
      onBack={() => navigate(-1)}
      ctaLabel={`予約する ¥${court.price.toLocaleString()}/時間`}
      onCtaClick={openBookingDrawer}
    >
      <div className="space-y-5 -mx-[20px] -mt-6">
        {/* Hero image */}
        <div className="relative">
          <img
            src={court.image}
            alt={court.name}
            className="w-full h-48 object-cover"
            width={400}
            height={192}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-4">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-available/90 text-primary-foreground">
              空き枠あり
            </span>
          </div>
        </div>

        <div className="px-[20px] space-y-5">
          {/* Title & Rating */}
          <div>
            <h2 className="text-lg font-bold text-foreground">{court.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{court.courtName}（{court.courtType}）</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent-yellow text-accent-yellow" />
                <span className="text-sm font-bold text-foreground">{court.rating}</span>
              </div>
              <span className="text-xs text-muted-foreground">({court.reviews}件のレビュー)</span>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">{court.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground">¥{court.price.toLocaleString()}/時間</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">施設紹介</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{court.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">設備・サービス</h3>
            <div className="flex flex-wrap gap-2">
              {court.amenities.map((a) => (
                <span key={a} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Booking Drawer ===== */}
      <BottomSheet
        open={showBookingDrawer}
        title="予約内容を選択"
        onClose={() => setShowBookingDrawer(false)}
        onConfirm={handleProceedToConfirm}
        confirmDisabled={totalHours === 0}
        confirmLabel={
          totalHours > 0
            ? `予約に進む ¥${totalPrice.toLocaleString()}`
            : "時間帯を選択してください"
        }
      >
        <div className="space-y-5">
          {/* Mode selector: solo vs standard */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">利用人数</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("standard")}
                className={`rounded-[8px] border p-3 text-left transition-colors ${
                  mode === "standard" ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-bold">2〜4人 通常</span>
                </div>
                <p className="text-xs text-muted-foreground">¥{court.price.toLocaleString()}/時間</p>
              </button>
              <button
                onClick={() => setMode("solo")}
                className={`rounded-[8px] border p-3 text-left transition-colors ${
                  mode === "solo" ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-bold">1人 特価</span>
                </div>
                <p className="text-xs text-primary font-medium">¥{getSoloHourlyPrice(court.price).toLocaleString()}/時間</p>
              </button>
            </div>
            {mode === "solo" && (
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                ※ 1人練習特価：通常料金の1/4 + 手数料20%。1面のみ予約可。
              </p>
            )}
          </div>

          {/* Court count selector (hidden in solo mode) */}
          {mode === "standard" && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">コート数</h3>
              <button
                onClick={() => { setTempCourtCount(courtCount); setShowCourtCountPicker(true); }}
                className="w-full flex items-center justify-between bg-card rounded-[8px] border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{courtCount}面</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {courtCount > 1 ? `料金 ${courtCount}倍` : "複数面の予約可"}
                </span>
              </button>
            </div>
          )}

          {/* Date selector */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">日付を選択</h3>
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">時間帯を選択（複数可・連続のみ）</p>
              {selectedSlots.length > 0 && (
                <button onClick={() => setSelectedSlots([])} className="text-xs text-muted-foreground">
                  クリア
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {court.availableSlots.map((slot) => {
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
            {selectedSlots.length > 0 && (
              <div className="mt-3 p-3 rounded-[8px] bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedSlots[0]} 〜 {(() => {
                      const last = selectedSlots[selectedSlots.length - 1];
                      const h = parseInt(last.split(":")[0]) + 1;
                      return `${String(h).padStart(2, "0")}:00`;
                    })()}（{totalHours}時間{mode === "standard" && courtCount > 1 ? ` × ${courtCount}面` : ""}）
                  </span>
                  <span className="font-bold text-foreground">¥{courtFee.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Equipment rental */}
          {court.equipment && court.equipment.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">用具レンタル（任意）</h3>
              <div className="space-y-2">
                {court.equipment.map((item) => {
                  const qty = equipmentQty[item.id] ?? 0;
                  const lineTotal = item.priceType === "hourly" ? item.price * qty * totalHours : item.price * qty;
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-card rounded-[8px] border border-border p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          ¥{item.price.toLocaleString()}{item.priceType === "hourly" ? "/時間" : "/回"}
                          {qty > 0 && totalHours > 0 && (
                            <span className="ml-2 text-primary font-medium">小計 ¥{lineTotal.toLocaleString()}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => adjustEquipment(item.id, -1, item.maxQty)}
                          disabled={qty <= 0}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{qty}</span>
                        <button
                          onClick={() => adjustEquipment(item.id, 1, item.maxQty)}
                          disabled={qty >= item.maxQty}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {equipmentTotal > 0 && (
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">用具レンタル小計</span>
                  <span className="font-medium text-foreground">¥{equipmentTotal.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Grand total */}
          {totalHours > 0 && (
            <div className="p-3 rounded-[8px] bg-foreground/5 border border-border flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">合計</span>
              <span className="text-base font-bold text-foreground">¥{totalPrice.toLocaleString()}</span>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Date picker bottom sheet */}
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
          availableDates={courtAvailableDates}
        />
      </BottomSheet>

      {/* Court count picker bottom sheet */}
      <BottomSheet
        open={showCourtCountPicker}
        title="コート数を選択"
        onClose={() => setShowCourtCountPicker(false)}
        onConfirm={() => {
          setCourtCount(tempCourtCount);
          setShowCourtCountPicker(false);
        }}
      >
        <div className="flex items-center justify-center gap-8 py-6">
          <button
            onClick={() => setTempCourtCount(Math.max(1, tempCourtCount - 1))}
            disabled={tempCourtCount <= 1}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
          <div className="text-center">
            <span className="text-4xl font-bold text-foreground">{tempCourtCount}</span>
            <p className="text-sm text-muted-foreground mt-1">面</p>
          </div>
          <button
            onClick={() => setTempCourtCount(Math.min(4, tempCourtCount + 1))}
            disabled={tempCourtCount >= 4}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center">コート数に応じて料金が加算されます</p>
      </BottomSheet>
    </InnerPageLayout>
  );
};

export default CourtDetail;
