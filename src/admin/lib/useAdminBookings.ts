import { useSyncExternalStore } from "react";

import {
  getBookings,
  subscribeBookings,
  type StoredBooking,
} from "@/lib/bookingStore";

/**
 * Admin 用の reactive bookings hook。
 * bookingStore は localStorage に書き込み、subscribeBookings で listener 通知。
 * useSyncExternalStore が必要とする stable snapshot を保つため、module-level の
 * cachedBookings を subscribe 内で更新してから listener を呼ぶ。
 */

let cachedBookings: StoredBooking[] = getBookings();

const refreshCache = () => {
  cachedBookings = getBookings();
};

const subscribeWithRefresh = (l: () => void): (() => void) => {
  return subscribeBookings(() => {
    refreshCache();
    l();
  });
};

const getSnapshot = (): StoredBooking[] => cachedBookings;

export const useAdminBookings = (): StoredBooking[] => {
  return useSyncExternalStore(subscribeWithRefresh, getSnapshot, getSnapshot);
};

export const useAdminBooking = (id: string | undefined): StoredBooking | undefined => {
  const bookings = useAdminBookings();
  if (!id) return undefined;
  return bookings.find((b) => b.id === id);
};

/** Force-refresh the cache (e.g. on route mount, in case storage changed outside listeners) */
export const refreshAdminBookings = (): void => {
  refreshCache();
};
