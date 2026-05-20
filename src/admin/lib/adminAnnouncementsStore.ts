import { useSyncExternalStore } from "react";

import type { AnnouncementAudience, AnnouncementCategory, AnnouncementStatus } from "./storeLabels";

/**
 * お知らせ配信 Mock Store
 * - seed: 12 件
 */

export interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  deliveryAt: string; // YYYY-MM-DD HH:mm
  audience: AnnouncementAudience;
  readRate: number; // 0〜100
}

const SEED: AnnouncementRecord[] = [
  { id: "AN-001", title: "ゴールデンウィーク休業のお知らせ", body: "5月3日〜5月5日は休業いたします。ご了承ください。", category: "notice", status: "published", deliveryAt: "2026-04-25 10:00", audience: "all", readRate: 78 },
  { id: "AN-002", title: "コートB メンテナンス実施", body: "5月10日（日）9:00〜12:00、コートBにてメンテナンスを実施します。", category: "maintenance", status: "published", deliveryAt: "2026-05-05 09:00", audience: "all", readRate: 65 },
  { id: "AN-003", title: "夏のスペシャル大会開催決定！", body: "7月開催の夏大会の詳細を後日公開予定です。お楽しみに！", category: "event", status: "published", deliveryAt: "2026-05-15 18:00", audience: "all", readRate: 82 },
  { id: "AN-004", title: "新規コーチ加入のお知らせ", body: "6月から新しいコーチが加入します。詳細は近日公開。", category: "notice", status: "scheduled", deliveryAt: "2026-05-25 12:00", audience: "all", readRate: 0 },
  { id: "AN-005", title: "プレミアム会員限定キャンペーン", body: "プレミアム会員限定で 6月コート料金 20% OFF キャンペーン実施中。", category: "event", status: "published", deliveryAt: "2026-05-18 10:00", audience: "premium", readRate: 91 },
  { id: "AN-006", title: "営業時間変更のご案内", body: "6月から営業時間が 7:00 〜 22:00 に変更となります。", category: "notice", status: "draft", deliveryAt: "", audience: "all", readRate: 0 },
  { id: "AN-007", title: "アプリ機能アップデート", body: "新機能「リーグ募集ボード」が公開されました。ぜひお試しください！", category: "notice", status: "published", deliveryAt: "2026-05-12 14:00", audience: "all", readRate: 54 },
  { id: "AN-008", title: "停電予告（電力会社からの連絡）", body: "5月28日 1:00 〜 5:00、近隣エリアで計画停電が予定されています。", category: "maintenance", status: "scheduled", deliveryAt: "2026-05-26 09:00", audience: "all", readRate: 0 },
  { id: "AN-009", title: "ジュニアコース体験会", body: "小学生向け体験会を開催します。参加費無料。", category: "event", status: "ended", deliveryAt: "2026-03-10 10:00", audience: "all", readRate: 88 },
  { id: "AN-010", title: "コーチ予約システム変更のお知らせ", body: "コーチ予約画面の操作方法が変更になりました。詳細は FAQ をご確認ください。", category: "notice", status: "published", deliveryAt: "2026-05-08 11:00", audience: "all", readRate: 49 },
  { id: "AN-011", title: "ポイント有効期限のお知らせ", body: "保有ポイントの有効期限は付与から 1 年間です。ご注意ください。", category: "other", status: "published", deliveryAt: "2026-05-01 09:00", audience: "all", readRate: 38 },
  { id: "AN-012", title: "新人スタッフ歓迎キャンペーン", body: "新人スタッフの応援企画、コート料金 10% OFF！", category: "event", status: "draft", deliveryAt: "", audience: "all", readRate: 0 },
];

let state: { announcements: AnnouncementRecord[] } = { announcements: SEED };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useAdminAnnouncements = (): AnnouncementRecord[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.announcements;
};

export const useAdminAnnouncement = (id: string | undefined): AnnouncementRecord | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.announcements.find((a) => a.id === id);
};

export const addAnnouncement = (input: Omit<AnnouncementRecord, "id" | "readRate">): string => {
  const nums = state.announcements
    .map((a) => Number.parseInt(a.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  const id = `AN-${String(next).padStart(3, "0")}`;
  state = {
    announcements: [...state.announcements, { ...input, id, readRate: 0 }],
  };
  notify();
  return id;
};

export const updateAnnouncement = (id: string, patch: Partial<AnnouncementRecord>): void => {
  state = {
    announcements: state.announcements.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  };
  notify();
};

export const deleteAnnouncement = (id: string): void => {
  state = {
    announcements: state.announcements.filter((a) => a.id !== id),
  };
  notify();
};
