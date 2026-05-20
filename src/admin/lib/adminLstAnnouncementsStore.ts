import { useSyncExternalStore } from "react";

/**
 * LST HQ お知らせ配信 Mock Store
 *
 * 店舗版（adminAnnouncementsStore）と異なり、
 * 配信対象が「全会員 / プレミアム会員 / 特定加盟店 / 特定スキルレベル」の 4 種類。
 * - seed: 15 件
 */

export type LstAnnouncementCategory = "notice" | "maintenance" | "event" | "premium" | "other";
export const LST_ANNOUNCEMENT_CATEGORY_JP: Record<LstAnnouncementCategory, string> = {
  notice: "お知らせ",
  maintenance: "メンテナンス",
  event: "イベント",
  premium: "プレミアム特典",
  other: "その他",
};

export type LstAnnouncementStatus = "published" | "draft" | "scheduled" | "ended";
export const LST_ANNOUNCEMENT_STATUS_JP: Record<LstAnnouncementStatus, string> = {
  published: "公開",
  draft: "下書き",
  scheduled: "予約",
  ended: "終了",
};
export const LST_ANNOUNCEMENT_STATUS_BADGE_CLS: Record<LstAnnouncementStatus, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  ended: "bg-slate-100 text-slate-600 border-slate-200",
};

export type LstAudienceMode = "all" | "premium" | "affiliates" | "skill_levels";
export const LST_AUDIENCE_MODE_JP: Record<LstAudienceMode, string> = {
  all: "全会員",
  premium: "プレミアム会員",
  affiliates: "特定加盟店",
  skill_levels: "特定スキルレベル",
};

export interface LstAnnouncementRecord {
  id: string;
  title: string;
  body: string;
  category: LstAnnouncementCategory;
  status: LstAnnouncementStatus;
  deliveryAt: string;
  audienceMode: LstAudienceMode;
  audienceAffiliateIds?: string[];
  audienceSkillLevels?: string[];
  readRate: number;
}

const SEED: LstAnnouncementRecord[] = [
  { id: "LAN-001", title: "LST 全店共通: ゴールデンウィーク休業のお知らせ", body: "5月3日〜5月5日は全加盟店で休業いたします。", category: "notice",      status: "published", deliveryAt: "2026-04-25 10:00", audienceMode: "all",          readRate: 78 },
  { id: "LAN-002", title: "プレミアム会員: 6月限定 20% OFF キャンペーン",        body: "プレミアム会員限定で 6月コート料金 20% OFF。",        category: "premium",     status: "published", deliveryAt: "2026-05-18 10:00", audienceMode: "premium",      readRate: 91 },
  { id: "LAN-003", title: "東京エリア: 新店舗オープンのお知らせ",                  body: "東京湾パデルセンターが新規開店しました。",                category: "notice",      status: "published", deliveryAt: "2026-04-01 09:00", audienceMode: "affiliates",   audienceAffiliateIds: ["AFF-004", "AFF-005"], readRate: 82 },
  { id: "LAN-004", title: "コートシステム全国メンテナンス",                          body: "5月30日 23:00 〜 翌 3:00、システムメンテナンスを実施。", category: "maintenance", status: "scheduled", deliveryAt: "2026-05-29 09:00", audienceMode: "all",          readRate: 0 },
  { id: "LAN-005", title: "夏のスペシャル大会（全国）",                              body: "7月開催の夏大会の詳細を後日公開予定。",                category: "event",       status: "published", deliveryAt: "2026-05-15 18:00", audienceMode: "all",          readRate: 65 },
  { id: "LAN-006", title: "上級者向けイベント: マスタークラス開催",                  body: "S級・A級レベル向けマスタークラスを 6月に開催。",        category: "event",       status: "published", deliveryAt: "2026-05-12 14:00", audienceMode: "skill_levels", audienceSkillLevels: ["advanced"], readRate: 54 },
  { id: "LAN-007", title: "アプリ機能アップデート: リーグ募集ボード公開",            body: "新機能「リーグ募集ボード」が公開されました。",            category: "notice",      status: "published", deliveryAt: "2026-05-10 11:00", audienceMode: "all",          readRate: 72 },
  { id: "LAN-008", title: "プレミアム会員: 限定コーチング体験",                       body: "プレミアム会員限定でトップコーチによる無料体験レッスン。", category: "premium",     status: "scheduled", deliveryAt: "2026-05-25 12:00", audienceMode: "premium",      readRate: 0 },
  { id: "LAN-009", title: "大阪エリア: 営業時間変更のご案内",                          body: "大阪エリア全店、6月から営業時間が変更となります。",     category: "notice",      status: "draft",     deliveryAt: "",                  audienceMode: "affiliates",   audienceAffiliateIds: ["AFF-006", "AFF-007"], readRate: 0 },
  { id: "LAN-010", title: "ジュニア向け体験会（広島エリア）",                          body: "小学生向け体験会を広島エリアで開催。",                    category: "event",       status: "ended",     deliveryAt: "2026-03-10 10:00", audienceMode: "affiliates",   audienceAffiliateIds: ["AFF-001", "AFF-002", "AFF-003"], readRate: 88 },
  { id: "LAN-011", title: "ポイント有効期限のお知らせ",                                body: "保有ポイントの有効期限は付与から 1 年間です。",          category: "other",       status: "published", deliveryAt: "2026-05-01 09:00", audienceMode: "all",          readRate: 38 },
  { id: "LAN-012", title: "中級者向けコーチング講座",                                  body: "中級者向けコーチングを 7月から開講。",                  category: "event",       status: "draft",     deliveryAt: "",                  audienceMode: "skill_levels", audienceSkillLevels: ["intermediate"], readRate: 0 },
  { id: "LAN-013", title: "停電予告: 福岡エリア",                                       body: "5月28日 1:00 〜 5:00、福岡エリアで計画停電が予定。",   category: "maintenance", status: "scheduled", deliveryAt: "2026-05-26 09:00", audienceMode: "affiliates",   audienceAffiliateIds: ["AFF-010", "AFF-011"], readRate: 0 },
  { id: "LAN-014", title: "新人スタッフ歓迎キャンペーン",                              body: "新人スタッフの応援企画、コート料金 10% OFF！",          category: "event",       status: "draft",     deliveryAt: "",                  audienceMode: "all",          readRate: 0 },
  { id: "LAN-015", title: "プレミアム会員: 限定大会エントリー受付開始",                body: "プレミアム会員限定の全国大会、エントリー受付を開始。",   category: "premium",     status: "published", deliveryAt: "2026-05-08 11:00", audienceMode: "premium",      readRate: 67 },
];

let state: { announcements: LstAnnouncementRecord[] } = { announcements: SEED };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useLstAnnouncements = (): LstAnnouncementRecord[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.announcements;
};

export const useLstAnnouncement = (id: string | undefined): LstAnnouncementRecord | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.announcements.find((a) => a.id === id);
};

export const addLstAnnouncement = (
  input: Omit<LstAnnouncementRecord, "id" | "readRate">,
): string => {
  const nums = state.announcements
    .map((a) => Number.parseInt(a.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  const id = `LAN-${String(next).padStart(3, "0")}`;
  state = {
    announcements: [...state.announcements, { ...input, id, readRate: 0 }],
  };
  notify();
  return id;
};

export const updateLstAnnouncement = (
  id: string,
  patch: Partial<LstAnnouncementRecord>,
): void => {
  state = {
    announcements: state.announcements.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  };
  notify();
};

export const deleteLstAnnouncement = (id: string): void => {
  state = {
    announcements: state.announcements.filter((a) => a.id !== id),
  };
  notify();
};
