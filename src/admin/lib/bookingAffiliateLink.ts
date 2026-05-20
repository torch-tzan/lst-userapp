import type { StoredBooking } from "@/lib/bookingStore";

import { getAffiliatesSnapshot } from "./adminAffiliatesStore";
import { adminCourtStoreLink } from "./adminCourtOverlay";

/**
 * Booking → Affiliate Link helper（LST HQ 視点）
 *
 * - court 予約: courtName で加盟店を判定。一致しない場合は court id → affiliate map で fallback。
 * - coach 予約: 既存の booking には affiliateId が無いため、booking id から決定的に振り分け。
 * - 全て in-memory／決定的（同じ booking id は常に同じ加盟店）。
 */

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

export const getBookingAffiliateId = (b: StoredBooking): string => {
  const affiliates = getAffiliatesSnapshot();
  if (affiliates.length === 0) return "AFF-001";

  if (b.type === "court") {
    // 1. courtName を加盟店 storeName と部分一致で照合
    const courtTarget = b.courtName ?? b.location ?? "";
    if (courtTarget) {
      const matched = affiliates.find((a) =>
        courtTarget.includes(a.storeName) || a.storeName.includes(courtTarget),
      );
      if (matched) return matched.id;
    }
    // 2. courtId が存在すれば map で判定
    const linkedId = (b as StoredBooking & { courtId?: string }).courtId;
    if (linkedId && adminCourtStoreLink[linkedId]) {
      return adminCourtStoreLink[linkedId];
    }
  }

  // 3. fallback: booking id の hash で決定論的に振り分け
  const idx = hashString(b.id) % affiliates.length;
  return affiliates[idx].id;
};
