import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setPendingBooking, BookingEquipmentLine, BookingMode, ReviewVideoMeta } from "@/lib/bookingStore";
import InnerPageLayout from "@/components/InnerPageLayout";
import { MapPin, Calendar, Clock, LayoutGrid, Tag, ChevronRight, Check, X, Coins, User, Video, Upload, FileVideo, Trash2 } from "lucide-react";

interface CourtBookingState {
  type?: "court";
  courtId: string;
  courtName: string;
  courtSubName: string;
  courtImage: string;
  address: string;
  date: string;
  slots: string[];
  courtCount: number;
  pricePerHour: number;
  mode?: BookingMode;
  equipment?: BookingEquipmentLine[];
  equipmentTotal?: number;
  fromEvent?: string;
  teamId?: string;
}

interface CoachBookingState {
  type: "coach";
  coachId: string;
  coachName: string;
  coachAvatar?: string;
  coachLevel: string;
  coachSpecialty: string;
  location: string;
  date: string;
  slots: string[];
  timeRange: string;
  duration: number;
  pricePerHour: number;
  slotCount?: number;
  lessonType?: "onsite" | "online" | "review";
  venueName?: string;
  venueAddress?: string;
  courtFeePerHour?: number;
}

type BookingState = CourtBookingState | CoachBookingState;

// Use shared coupon data
import { AVAILABLE_COUPONS } from "@/lib/couponStore";
const MOCK_COUPONS = AVAILABLE_COUPONS;

const formatDateLabel = (d: string) => {
  const dt = new Date(d + "T00:00:00");
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const dayOfWeek = weekdays[dt.getDay()];
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日（${dayOfWeek}）`;
};

const BookingConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state as BookingState | null;

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<typeof MOCK_COUPONS[0] | null>(null);
  const [couponError, setCouponError] = useState("");
  const [showCouponList, setShowCouponList] = useState(false);
  const [usePoints, setUsePoints] = useState(0);

  // Review video upload state (file = undefined for demo-only fake entries)
  const [reviewVideos, setReviewVideos] = useState<{ file?: File; name: string; size: number; url?: string }[]>([]);
  const [reviewMemo, setReviewMemo] = useState("");
  const [videoError, setVideoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const FAKE_VIDEOS = [
    { name: "前衛ボレー.mp4", size: 42 * 1024 * 1024 },
    { name: "サーブ練習.mov", size: 78 * 1024 * 1024 },
    { name: "バンデーハ.mp4", size: 55 * 1024 * 1024 },
    { name: "後衛ポジション.mp4", size: 61 * 1024 * 1024 },
    { name: "試合ハイライト.mov", size: 89 * 1024 * 1024 },
  ];
  const addFakeVideos = () => {
    setVideoError("");
    setReviewVideos(FAKE_VIDEOS.map((v) => ({ ...v })));
  };

  // Revoke object URLs on unmount to avoid leaks
  useEffect(() => {
    return () => {
      reviewVideos.forEach((v) => { if (v.url) URL.revokeObjectURL(v.url); });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const AVAILABLE_POINTS = 1250; // Mock user points
  const MAX_VIDEOS = 5;
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoError("");
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const remainingSlots = MAX_VIDEOS - reviewVideos.length;
    if (files.length > remainingSlots) {
      setVideoError(`動画は最大${MAX_VIDEOS}本まで（あと${remainingSlots}本追加可能）`);
      if (e.target) e.target.value = "";
      return;
    }
    const accepted: { file: File; name: string; size: number; url: string }[] = [];
    for (const f of files) {
      if (!f.type.startsWith("video/")) {
        setVideoError(`「${f.name}」は動画ファイルではありません`);
        continue;
      }
      if (f.size > MAX_VIDEO_SIZE) {
        setVideoError(`「${f.name}」は100MBを超えています（${formatSize(f.size)}）`);
        continue;
      }
      accepted.push({ file: f, name: f.name, size: f.size, url: URL.createObjectURL(f) });
    }
    if (accepted.length > 0) setReviewVideos((prev) => [...prev, ...accepted]);
    if (e.target) e.target.value = "";
  };
  const removeVideo = (idx: number) => {
    setReviewVideos((prev) => {
      const target = prev[idx];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== idx);
    });
    setVideoError("");
  };

  if (!booking) {
    return (
      <InnerPageLayout title="予約確認" onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center pt-20 gap-4">
          <p className="text-base font-bold text-foreground">予約情報がありません</p>
        </div>
      </InnerPageLayout>
    );
  }

  const isCoach = booking.type === "coach";
  const isReview = isCoach && (booking as CoachBookingState).lessonType === "review";
  const coachSlotCount = isCoach ? ((booking as CoachBookingState).slotCount || booking.slots.length) : 0;
  const totalHours = booking.slots.length;
  const coachFee = isReview ? booking.pricePerHour : (isCoach ? coachSlotCount * booking.pricePerHour : 0);
  const courtFee = isCoach && !isReview && (booking as CoachBookingState).courtFeePerHour
    ? coachSlotCount * (booking as CoachBookingState).courtFeePerHour!
    : 0;
  const courtCount = !isCoach ? ((booking as CourtBookingState).courtCount || 1) : 1;
  const equipmentLines = !isCoach ? ((booking as CourtBookingState).equipment ?? []) : [];
  const equipmentTotal = equipmentLines.reduce((s, l) => s + l.lineTotal, 0);
  const courtOnlyFee = !isCoach ? totalHours * booking.pricePerHour * courtCount : 0;
  const subtotal = isReview
    ? coachFee
    : isCoach
    ? coachFee + courtFee
    : courtOnlyFee + equipmentTotal;
  const courtMode: BookingMode = !isCoach ? ((booking as CourtBookingState).mode ?? "standard") : "standard";

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.floor(subtotal * appliedCoupon.discount)
      : appliedCoupon.discount
    : 0;

  const afterCoupon = Math.max(0, subtotal - discountAmount);
  const maxUsablePoints = Math.min(AVAILABLE_POINTS, afterCoupon);
  const total = Math.max(0, afterCoupon - usePoints);
  const earnedPoints = Math.floor(total / 1000);

  const timeRange = (() => {
    if (isCoach) return (booking as CoachBookingState).timeRange;
    if (booking.slots.length === 0) return "";
    const first = booking.slots[0];
    const last = booking.slots[booking.slots.length - 1];
    const endH = parseInt(last.split(":")[0]) + 1;
    return `${first} 〜 ${String(endH).padStart(2, "0")}:00`;
  })();

  const applyCoupon = () => {
    setCouponError("");
    const found = MOCK_COUPONS.find((c) => c.code === couponCode.toUpperCase().trim());
    if (found) {
      setAppliedCoupon(found);
      setCouponCode("");
    } else {
      setCouponError("無効なクーポンコードです");
    }
  };

  const selectCoupon = (coupon: typeof MOCK_COUPONS[0]) => {
    setAppliedCoupon(coupon);
    setCouponCode("");
    setCouponError("");
    setShowCouponList(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  return (
    <InnerPageLayout
      title="予約確認"
      onBack={() => navigate(-1)}
      ctaLabel={
        isReview && reviewVideos.length === 0
          ? "動画を1本以上選択してください"
          : `お支払いへ ¥${total.toLocaleString()}`
      }
      ctaDisabled={isReview && reviewVideos.length === 0}
      onCtaClick={() => {
        const videoMeta: ReviewVideoMeta[] = reviewVideos.map((v) => ({
          name: v.name,
          size: v.size,
          type: v.file?.type ?? "video/mp4",
          url: v.url,
        }));
        setPendingBooking({
          ...(booking as unknown as Record<string, unknown>),
          totalPrice: total,
          timeRange,
          reviewVideos: videoMeta,
          reviewMemo: reviewMemo.trim(),
        });
        navigate("/booking/payment", { state: { total } });
      }}
    >
      <div className="space-y-5">
        {/* Info card */}
        <div className="bg-card rounded-[8px] border border-border p-4">
          <div className="flex gap-3">
            {isCoach ? (
              <div className="w-16 h-16 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                {(booking as CoachBookingState).coachAvatar ? (
                  <img src={(booking as CoachBookingState).coachAvatar} alt={(booking as CoachBookingState).coachName} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div>
                )}
              </div>
            ) : (
              <img
                src={(booking as CourtBookingState).courtImage}
                alt={(booking as CourtBookingState).courtName}
                className="w-16 h-16 rounded-[8px] object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">
                {isCoach ? (booking as CoachBookingState).coachName : (booking as CourtBookingState).courtName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCoach
                  ? `${(booking as CoachBookingState).coachLevel} / ${(booking as CoachBookingState).coachSpecialty}`
                  : (booking as CourtBookingState).courtSubName}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {isCoach ? (booking as CoachBookingState).location : (booking as CourtBookingState).address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-card rounded-[8px] border border-border divide-y divide-border">
          {!isReview && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">利用日</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{formatDateLabel(booking.date)}</p>
              </div>
            </div>
          )}
          {!isReview && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">時間</p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {isCoach ? `${timeRange}（${(booking as CoachBookingState).duration}分）` : `${timeRange}（${totalHours}時間）`}
                </p>
              </div>
            </div>
          )}
          {!isCoach && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <LayoutGrid className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">利用形態</p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {courtMode === "solo" ? "1人練習（特価）" : `2〜4人通常 / ${courtCount}面`}
                </p>
              </div>
            </div>
          )}
          {isCoach && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              {(booking as CoachBookingState).lessonType === "review" ? (
                <Video className="w-4 h-4 text-accent-yellow flex-shrink-0" />
              ) : (booking as CoachBookingState).lessonType === "online" ? (
                <Video className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">レッスン形式</p>
                {(booking as CoachBookingState).lessonType === "review" ? (
                  <div className="mt-0.5">
                    <p className="text-sm font-medium text-accent-yellow">オンラインレビュー</p>
                    <p className="text-xs text-muted-foreground mt-0.5">動画を送信してフィードバックを受け取る</p>
                  </div>
                ) : (booking as CoachBookingState).lessonType === "online" ? (
                  <p className="text-sm font-medium text-primary mt-0.5">オンラインレッスン</p>
                ) : (
                  <div className="mt-0.5">
                    <p className="text-sm font-medium text-foreground">現場レッスン</p>
                    {(booking as CoachBookingState).venueName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(booking as CoachBookingState).venueName}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Review videos upload — placed above coupon */}
        {isReview && (
          <div className="bg-card rounded-[8px] border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-accent-yellow" />
              <h3 className="text-sm font-bold text-foreground">レビュー動画をアップロード</h3>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {reviewVideos.length} / {MAX_VIDEOS}
              </span>
            </div>

            {reviewVideos.length === 0 ? (
              <button
                onClick={addFakeVideos}
                className="w-full aspect-video rounded-[8px] border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-2 text-primary"
              >
                <Upload className="w-8 h-8" />
                <p className="text-sm font-bold">動画を選択</p>
                <p className="text-[11px] text-muted-foreground">最大{MAX_VIDEOS}本 · 1本100MBまで</p>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {reviewVideos.map((v, i) => (
                  <div key={i} className="relative aspect-video rounded-[6px] bg-black overflow-hidden group">
                    {v.url ? (
                      <video src={v.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                        <FileVideo className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <p className="text-[10px] font-medium text-white truncate">{v.name}</p>
                      <p className="text-[9px] text-white/70">{formatSize(v.size)}</p>
                    </div>
                    <button
                      onClick={() => removeVideo(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {reviewVideos.length < MAX_VIDEOS && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded-[6px] border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-1 text-primary"
                  >
                    <Upload className="w-5 h-5" />
                    <p className="text-[11px] font-bold">追加</p>
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoSelect}
              className="hidden"
            />

            {videoError && (
              <p className="text-[11px] text-destructive flex items-center gap-1">
                <X className="w-3 h-3" />
                {videoError}
              </p>
            )}

            {/* Review memo */}
            <div className="pt-2 border-t border-border space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                コーチに伝えたいこと
                <span className="text-[10px] text-muted-foreground font-normal ml-1">（任意）</span>
              </label>
              <textarea
                value={reviewMemo}
                onChange={(e) => setReviewMemo(e.target.value.slice(0, 500))}
                placeholder="例：前衛のボレーが安定しません。打点のアドバイスをお願いします。"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-[6px] border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">{reviewMemo.length}/500</p>
            </div>
          </div>
        )}

        {/* Coupon section */}
        <div className="bg-card rounded-[8px] border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">クーポン</h3>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-[8px] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{appliedCoupon.label}</p>
                  <p className="text-xs text-muted-foreground">{appliedCoupon.code}</p>
                </div>
              </div>
              <button onClick={removeCoupon} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                  placeholder="クーポンコードを入力"
                  className="flex-1 h-10 px-3 text-sm rounded-[6px] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={applyCoupon}
                  disabled={!couponCode.trim()}
                  className="h-10 px-4 rounded-[6px] bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  適用
                </button>
              </div>
              {couponError && (
                <p className="text-xs text-destructive">{couponError}</p>
              )}
              <button
                onClick={() => setShowCouponList(!showCouponList)}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                利用可能なクーポンを見る
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showCouponList ? "rotate-90" : ""}`} />
              </button>
              {showCouponList && (
                <div className="space-y-2">
                  {MOCK_COUPONS.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => selectCoupon(c)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.code}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Points section */}
        <div className="bg-card rounded-[8px] border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">ポイント利用</h3>
            </div>
            <span className="text-xs text-muted-foreground">保有: {AVAILABLE_POINTS.toLocaleString()}pt</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={usePoints === 0 ? "" : String(usePoints)}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                const num = v ? Math.min(parseInt(v), maxUsablePoints) : 0;
                setUsePoints(num);
              }}
              placeholder="0"
              className="flex-1 h-10 px-3 text-sm rounded-[6px] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-right"
            />
            <span className="text-sm text-muted-foreground">pt</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">1pt = ¥1として利用できます</p>
            {maxUsablePoints > 0 && usePoints < maxUsablePoints && (
              <button
                onClick={() => setUsePoints(maxUsablePoints)}
                className="text-xs text-primary font-medium"
              >
                すべて使う（{maxUsablePoints.toLocaleString()}pt）
              </button>
            )}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-card rounded-[8px] border border-border p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">料金明細</h3>
           <div className="space-y-2">
            {isCoach ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    レッスン料（{coachSlotCount}コマ × ¥{booking.pricePerHour.toLocaleString()}）
                  </span>
                  <span className="text-foreground">¥{coachFee.toLocaleString()}</span>
                </div>
                {courtFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      場地費（{(booking as CoachBookingState).venueName}）
                    </span>
                    <span className="text-foreground">¥{courtFee.toLocaleString()}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {courtMode === "solo" ? "1人特価" : "コート利用料"}（{totalHours}時間{courtMode === "standard" && courtCount > 1 ? ` × ${courtCount}面` : ""} × ¥{booking.pricePerHour.toLocaleString()}）
                  </span>
                  <span className="text-foreground">¥{courtOnlyFee.toLocaleString()}</span>
                </div>
                {equipmentLines.map((l) => (
                  <div key={l.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {l.name}（{l.qty}{l.priceType === "hourly" ? `×${totalHours}h` : "回"} × ¥{l.unitPrice.toLocaleString()}）
                    </span>
                    <span className="text-foreground">¥{l.lineTotal.toLocaleString()}</span>
                  </div>
                ))}
              </>
            )}
            {appliedCoupon && (
              <div className="flex justify-between text-sm">
                <span className="text-primary">{appliedCoupon.label}</span>
                <span className="text-primary">-¥{discountAmount.toLocaleString()}</span>
              </div>
            )}
            {usePoints > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-primary">ポイント利用</span>
                <span className="text-primary">-¥{usePoints.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="text-sm font-bold text-foreground">合計</span>
            <span className="text-lg font-bold text-foreground">¥{total.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <Coins className="w-3.5 h-3.5 text-accent-yellow" />
            <span className="text-xs text-muted-foreground">この予約で <span className="font-bold text-foreground">{earnedPoints}pt</span> 獲得</span>
          </div>
        </div>
      </div>
    </InnerPageLayout>
  );
};

export default BookingConfirm;
