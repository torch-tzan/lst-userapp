import { useSyncExternalStore } from "react";

import { COURTS, type CourtSummary } from "@/lib/courtData";

/**
 * Admin Court Overlay Store
 *
 * 既存の COURTS は imported 画像を持つため immutable として扱う。
 * Admin が runtime で追加・編集・削除した内容はこの overlay に持ち、
 * 既存 COURTS と merge して表示する。
 *
 * - added:   admin が新規追加した court 一覧
 * - overrides: 既存 court の field を上書きする部分パッチ
 * - deleted: 既存または overlay added の削除フラグ
 *
 * すべて in-memory（reload で消える）。phone app の courtData.ts には影響しない。
 */

interface CourtOverlayState {
  added: CourtSummary[];
  overrides: Record<string, Partial<CourtSummary>>;
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

/** 既存 COURTS と overlay を merge した、admin 用 court 一覧 */
export const getMergedCourts = (): CourtSummary[] => {
  const baseMerged: CourtSummary[] = COURTS.filter((c) => !state.deleted.has(c.id)).map((c) => {
    const patch = state.overrides[c.id];
    return patch ? ({ ...c, ...patch } as CourtSummary) : c;
  });
  const addedFiltered = state.added.filter((c) => !state.deleted.has(c.id));
  return [...baseMerged, ...addedFiltered];
};

/** 単体取得（merged 版） */
export const getMergedCourt = (id: string): CourtSummary | undefined => {
  return getMergedCourts().find((c) => c.id === id);
};

/** 新規追加 — id は呼び出し側で生成 */
export const addCourtToOverlay = (court: CourtSummary): void => {
  state = {
    ...state,
    added: [...state.added, court],
  };
  notify();
};

/** 既存 court の部分上書き */
export const upsertCourtOverride = (id: string, patch: Partial<CourtSummary>): void => {
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

/** React hook — overlay state が変わるたびに再 render */
export const useAdminCourts = (): CourtSummary[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return getMergedCourts();
};

/** 単体取得 hook */
export const useAdminCourt = (id: string | undefined): CourtSummary | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return getMergedCourt(id);
};
