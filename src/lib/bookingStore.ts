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
