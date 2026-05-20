export type BookingStatus = "upcoming" | "completed" | "cancelled" | "failed" | "pending_confirmation" | "change_pending" | "in_progress";
export type BookingType = "court" | "coach";

export interface BookingRating {
  stars: number;
  comment: string;
  createdAt: string;
}

export interface BookingEquipmentLine {
  id: string;
  name: string;
  priceType: "hourly" | "perUse";
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export type BookingMode = "solo" | "standard";

export interface ReviewVideoMeta {
  name: string;
  size: number;
  type: string;
  /** 上傳後的持久 URL（此 mock 使用 ObjectURL，生產版應為 CDN URL） */
  url?: string;
}

export interface StoredBooking {
  id: string;
  type: BookingType;
  // Member linkage
  userId?: string;
  // Court fields
  courtName?: string;
  courtSubName?: string;
  image?: string;
  address?: string;
  // Coach fields
  coachName?: string;
  coachAvatar?: string;
  coachLevel?: string;
  coachSpecialty?: string;
  // Common
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  people?: number;
  pricePerHour?: number;
  totalPrice?: number;
  // Coach extras
  lessonType?: "onsite" | "online" | "review";
  venueName?: string;
  venueAddress?: string;
  timeRange?: string;
  duration?: number;
  slotCount?: number;
  // Reschedule tracking
  rescheduleUsed?: boolean;
  pendingChangeDate?: string;
  pendingChangeStart?: string;
  pendingChangeEnd?: string;
  // Rating
  rating?: BookingRating;
  // New fields
  mode?: BookingMode;
  equipment?: BookingEquipmentLine[];
  equipmentTotal?: number;
  courtFee?: number;
  // Event linkage (tournament court booking)
  eventId?: string;
  teamId?: string;
  // Review lesson videos
  reviewVideos?: ReviewVideoMeta[];
  // Admin operations
  cancelReason?: string;
  cancelledAt?: string;
  createdAt?: string;
}

const STORAGE_KEY = "padel_bookings";

export const getBookings = (): StoredBooking[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addBooking = (booking: StoredBooking) => {
  const bookings = getBookings();
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

export const updateBooking = (id: string, updates: Partial<StoredBooking>) => {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx !== -1) {
    bookings[idx] = { ...bookings[idx], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }
};

export const setPendingBooking = (data: Record<string, unknown>) => {
  localStorage.setItem("padel_pending_booking", JSON.stringify(data));
};

export const getPendingBooking = (): Record<string, unknown> | null => {
  try {
    const raw = localStorage.getItem("padel_pending_booking");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPendingBooking = () => {
  localStorage.removeItem("padel_pending_booking");
};

// ─── Admin operations + subscription helpers ─────────────────────────────

/** 削除 — id 指定。返り値は削除した booking、見つからなければ undefined。 */
export const removeBooking = (id: string): StoredBooking | undefined => {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return undefined;
  const removed = bookings[idx];
  bookings.splice(idx, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  notifyBookingChange();
  return removed;
};

/** Admin: 予約をキャンセル — status=cancelled + reason + cancelledAt をセット */
export const adminCancelBooking = (id: string, reason?: string): boolean => {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  bookings[idx] = {
    ...bookings[idx],
    status: "cancelled",
    cancelReason: reason,
    cancelledAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  notifyBookingChange();
  return true;
};

/** Admin: 予約を上書き更新（reactive notify 付き） */
export const adminUpdateBooking = (id: string, updates: Partial<StoredBooking>): boolean => {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  bookings[idx] = { ...bookings[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  notifyBookingChange();
  return true;
};

/** Admin: 予約を追加（reactive notify 付き） */
export const adminAddBooking = (booking: StoredBooking): void => {
  const bookings = getBookings();
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  notifyBookingChange();
};

// ─── Subscription（admin 用 reactive 更新） ──────────────────────────────

const bookingListeners = new Set<() => void>();

export const subscribeBookings = (l: () => void): (() => void) => {
  bookingListeners.add(l);
  return () => {
    bookingListeners.delete(l);
  };
};

const notifyBookingChange = (): void => {
  bookingListeners.forEach((l) => l());
};
