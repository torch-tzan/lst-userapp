import { useMemo } from "react";

import { useAdminAnnouncements } from "../adminAnnouncementsStore";
import { useLstAnnouncements } from "../adminLstAnnouncementsStore";

/**
 * UserApp 用統合 Announcement（システムお知らせ）hook。
 * - app 側 SYSTEM_NOTIFICATIONS（baseline、Notifications.tsx で定義）と
 *   admin store / LST admin store の published 分をマージ
 * - 表示用 shape は最小限（id / title / summary / date / read）。
 */
export interface UserVisibleAnnouncement {
  id: string;
  title: string;
  summary: string;
  date: string; // YYYY/MM/DD
  read: boolean;
  isSystem: true;
}

/** baseline（既存 Notifications.tsx の SYSTEM_NOTIFICATIONS と一致）。 */
export const HARDCODED_USER_ANNOUNCEMENTS: UserVisibleAnnouncement[] = [
  {
    id: "sys-1",
    title: "春の新規登録キャンペーン！",
    summary: "今なら新規登録で500ポイントプレゼント。4月30日まで。",
    date: "2026/04/14",
    read: false,
    isSystem: true,
  },
  {
    id: "sys-2",
    title: "ポイント付与のお知らせ",
    summary: "予約利用によるポイントが付与されました。+3pt",
    date: "2026/04/12",
    read: true,
    isSystem: true,
  },
  {
    id: "sys-3",
    title: "システムメンテナンスのお知らせ",
    summary: "4月20日 2:00〜5:00にメンテナンスを実施します。",
    date: "2026/04/10",
    read: true,
    isSystem: true,
  },
];

// deliveryAt は "2026-04-25 10:00" 形式。YYYY/MM/DD に変換。
const formatDate = (deliveryAt: string): string => {
  if (!deliveryAt) return "";
  const datePart = deliveryAt.split(" ")[0];
  return datePart.replace(/-/g, "/");
};

export const useUserAnnouncements = (): UserVisibleAnnouncement[] => {
  const storeAnns = useAdminAnnouncements();
  const lstAnns = useLstAnnouncements();

  return useMemo(() => {
    const merged = new Map<string, UserVisibleAnnouncement>();
    // baseline
    for (const a of HARDCODED_USER_ANNOUNCEMENTS) merged.set(a.id, a);
    // 店舗 admin: published のみ
    for (const a of storeAnns) {
      if (a.status !== "published") continue;
      merged.set(a.id, {
        id: a.id,
        title: a.title,
        summary: a.body.slice(0, 80),
        date: formatDate(a.deliveryAt),
        read: false,
        isSystem: true,
      });
    }
    // LST admin: published のみ
    for (const a of lstAnns) {
      if (a.status !== "published") continue;
      merged.set(a.id, {
        id: a.id,
        title: a.title,
        summary: a.body.slice(0, 80),
        date: formatDate(a.deliveryAt),
        read: false,
        isSystem: true,
      });
    }
    return Array.from(merged.values()).sort((a, b) => {
      // 新しい日付を上に
      const da = new Date(a.date.replace(/\//g, "-")).getTime();
      const db = new Date(b.date.replace(/\//g, "-")).getTime();
      if (Number.isNaN(da) && Number.isNaN(db)) return 0;
      if (Number.isNaN(da)) return 1;
      if (Number.isNaN(db)) return -1;
      return db - da;
    });
  }, [storeAnns, lstAnns]);
};
