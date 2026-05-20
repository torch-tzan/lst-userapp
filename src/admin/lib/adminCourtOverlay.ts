import { useSyncExternalStore } from "react";

import { COURTS, COURTS_DETAIL, type CourtSummary } from "@/lib/courtData";

/**
 * Admin Court Overlay Store
 *
 * 既存の COURTS は imported 画像を持つため immutable として扱う。
 * Admin が runtime で追加・編集・削除した内容はこの overlay に持ち、
 * 既存 COURTS と merge して表示する。
 *
 * - added:   admin が新規追加した court 一覧（AdminCourtRecord）
 * - overrides: 既存 court の field を上書きする部分パッチ
 * - deleted: 既存または overlay added の削除フラグ
 *
 * すべて in-memory（reload で消える）。phone app の courtData.ts には影響しない。
 */

// ─── Admin extension fields ─────────────────────────────────
// CourtSummary に admin が追加管理する field を足した型。
// imageUrl / description / amenities / address は CourtDetail には存在するが
// CourtSummary には無いため、overlay 経由で持つ。
export interface AdminCourtExtras {
  /** 画像 URL（runtime 入力）。空なら base の image / placeholder を使う */
  imageUrl?: string;
  /** 説明（長文） */
  description?: string;
  /** 設備（AMENITY_OPTIONS から選択） */
  amenities?: string[];
  /** 住所（CourtDetail 由来 field を admin で編集可能に） */
  address?: string;
}

export interface AdminCourtRecord extends CourtSummary, AdminCourtExtras {}

/** 設備選択肢 — admin プロトタイプで使う固定リスト */
export const AMENITY_OPTIONS: string[] = [
  "駐車場",
  "シャワー",
  "ロッカー",
  "更衣室",
  "ナイター照明",
  "クラブハウス",
  "売店",
  "観覧席",
  "Wi-Fi",
  "自動販売機",
];

interface CourtOverlayState {
  added: AdminCourtRecord[];
  overrides: Record<string, Partial<AdminCourtRecord>>;
  deleted: Set<string>;
}

let state: CourtOverlayState = {
  added: [],
  overrides: {},
  deleted: new Set<string>(),
};

const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const notify = () => {
  listeners.forEach((l) => l());
};

const getSnapshot = (): CourtOverlayState => state;

/**
 * 既存 COURTS と overlay を merge した、admin 用 court 一覧。
 * 既存 court の場合：COURTS + overlay override のマージ。
 * overlay added の場合：そのままレコードを返す。
 */
export const getMergedCourts = (): AdminCourtRecord[] => {
  const baseMerged: AdminCourtRecord[] = COURTS.filter((c) => !state.deleted.has(c.id)).map(
    (c) => {
      const patch = state.overrides[c.id];
      // base AdminCourtRecord は CourtSummary 拡張なので、まず CourtSummary を AdminCourtRecord として扱う
      return patch ? ({ ...c, ...patch } as AdminCourtRecord) : (c as AdminCourtRecord);
    },
  );
  const addedFiltered = state.added.filter((c) => !state.deleted.has(c.id));
  return [...baseMerged, ...addedFiltered];
};

/** 単体取得（merged 版） */
export const getMergedCourt = (id: string): AdminCourtRecord | undefined => {
  return getMergedCourts().find((c) => c.id === id);
};

/** 新規追加 — id は呼び出し側で生成 */
export const addCourtToOverlay = (court: AdminCourtRecord): void => {
  state = {
    ...state,
    added: [...state.added, court],
  };
  notify();
};

/** 既存 court の部分上書き（admin extras 含む） */
export const upsertCourtOverride = (id: string, patch: Partial<AdminCourtRecord>): void => {
  // overlay added の場合は added 配列内を直接更新
  const isOverlayAdded = state.added.some((c) => c.id === id);
  if (isOverlayAdded) {
    state = {
      ...state,
      added: state.added.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    };
  } else {
    state = {
      ...state,
      overrides: { ...state.overrides, [id]: { ...state.overrides[id], ...patch } },
    };
  }
  notify();
};

/** 削除 — 削除フラグを立てるだけ */
export const deleteCourt = (id: string): void => {
  const next = new Set(state.deleted);
  next.add(id);
  state = { ...state, deleted: next };
  notify();
};

/** 次の新規 court 用 id を生成 — 既存 COURTS と overlay の max+1 */
export const generateNextCourtId = (): string => {
  const allIds = [...COURTS.map((c) => c.id), ...state.added.map((c) => c.id)];
  const numeric = allIds.map((id) => Number.parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  const max = numeric.length > 0 ? Math.max(...numeric) : 0;
  return String(max + 1);
};

// ─── Display helpers — overlay 優先 → CourtDetail → fallback ───
/**
 * 画像 URL を解決:
 * 1. overlay imageUrl（admin 入力 URL）があればそれ
 * 2. なければ base court.image（imported asset）
 * 3. それも無ければ placeholder（呼び出し側で onError fallback 推奨）
 */
export const resolveCourtImage = (court: AdminCourtRecord): string => {
  if (court.imageUrl && court.imageUrl.trim().length > 0) return court.imageUrl;
  return court.image;
};

/**
 * 住所を解決: overlay 優先 → COURTS_DETAIL → undefined
 */
export const resolveCourtAddress = (court: AdminCourtRecord): string | undefined => {
  if (court.address && court.address.trim().length > 0) return court.address;
  return COURTS_DETAIL[court.id]?.address;
};

/**
 * 説明を解決: overlay 優先 → COURTS_DETAIL → undefined
 */
export const resolveCourtDescription = (court: AdminCourtRecord): string | undefined => {
  if (court.description && court.description.trim().length > 0) return court.description;
  return COURTS_DETAIL[court.id]?.description;
};

/**
 * 設備を解決: COURTS_DETAIL の amenities ∪ overlay amenities（順序維持、重複除去）
 */
export const resolveCourtAmenities = (court: AdminCourtRecord): string[] => {
  const fromDetail = COURTS_DETAIL[court.id]?.amenities ?? [];
  const fromOverlay = court.amenities ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of [...fromDetail, ...fromOverlay]) {
    if (!seen.has(a)) {
      seen.add(a);
      out.push(a);
    }
  }
  return out;
};

/** React hook — overlay state が変わるたびに再 render */
export const useAdminCourts = (): AdminCourtRecord[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return getMergedCourts();
};

/** 単体取得 hook */
export const useAdminCourt = (id: string | undefined): AdminCourtRecord | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return getMergedCourt(id);
};

// ─── LST HQ: 加盟店との紐付け ───────────────────────────
/**
 * adminCourtStoreLink: courtId → affiliateId のマップ。
 * 既存 COURTS (id=1/2/3) と overlay added を、SEED の加盟店に振り分ける。
 * 新規追加されたコートは AFF-001 に紐付け（簡易ルール）。
 */
export const adminCourtStoreLink: Record<string, string> = {
  "1": "AFF-001", // パデルコート広島
  "2": "AFF-002", // 北広島パデルクラブ
  "3": "AFF-003", // 広島中央スポーツ
};

/** courtId → affiliateId（未登録なら AFF-001 fallback） */
export const getCourtAffiliateId = (courtId: string): string => {
  return adminCourtStoreLink[courtId] ?? "AFF-001";
};

/** LST HQ: コート ↔ 加盟店紐付けを更新（mock — in-memory のみ） */
export const setCourtAffiliateId = (courtId: string, affiliateId: string): void => {
  adminCourtStoreLink[courtId] = affiliateId;
};
