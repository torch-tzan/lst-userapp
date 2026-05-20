import { useSyncExternalStore } from "react";

import { COACHES, COACHES_DETAIL, type CoachDetail, type CoachSummary } from "@/lib/coachData";

/**
 * Admin Coaches Overlay Store
 *
 * COACHES / COACHES_DETAIL は imported 画像を持つため immutable として扱う。
 * Admin が runtime で追加・編集・削除した内容はこの overlay に持ち、
 * 既存 COACHES と merge して表示する。
 *
 * - added:    admin が新規追加したコーチ
 * - overrides: 既存コーチの field を上書きする部分パッチ
 * - suspended / deleted: 状態フラグ
 *
 * すべて in-memory（reload で消える）。
 */

export type CoachStatus = "active" | "suspended";

interface OverlayState {
  added: CoachSummary[];
  overrides: Record<string, Partial<CoachSummary>>;
  status: Record<string, CoachStatus>; // 既存・新規 coach の状態
  deleted: Set<string>;
}

let state: OverlayState = {
  added: [],
  overrides: {},
  status: {},
  deleted: new Set<string>(),
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const getCoachStatus = (id: string): CoachStatus => state.status[id] ?? "active";

/** Merged coach list（admin 用） */
export const getMergedCoaches = (): CoachSummary[] => {
  const base = COACHES.filter((c) => !state.deleted.has(c.id)).map((c) => {
    const patch = state.overrides[c.id];
    return patch ? ({ ...c, ...patch } as CoachSummary) : c;
  });
  const added = state.added.filter((c) => !state.deleted.has(c.id));
  return [...base, ...added];
};

export const getMergedCoach = (id: string): CoachSummary | undefined => {
  return getMergedCoaches().find((c) => c.id === id);
};

export const getMergedCoachDetail = (id: string): CoachDetail | undefined => {
  const baseDetail = COACHES_DETAIL[id];
  const summary = getMergedCoach(id);
  if (!summary) return undefined;
  if (baseDetail) {
    // patch summary fields onto base detail
    return { ...baseDetail, ...summary };
  }
  // overlay added — synthesize minimal detail
  return {
    ...summary,
    bio: "新規追加されたコーチです。",
    experience: "—",
    location: summary.area,
    certifications: [],
    lessonMenus: [],
    venues: [],
    availableSlots: [],
    stats: { sessions: 0, repeatRate: 0, satisfaction: 0 },
    reviews: [],
  };
};

export const addCoachToOverlay = (input: {
  name: string;
  level: string;
  specialty: string[];
  area: string;
  pricePerHour: number;
  onlineAvailable: boolean;
  reviewAvailable: boolean;
  avatar: string;
}): string => {
  const allIds = [...COACHES.map((c) => c.id), ...state.added.map((c) => c.id)];
  const numeric = allIds.map((id) => Number.parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  const max = numeric.length > 0 ? Math.max(...numeric) : 0;
  const id = String(max + 1);
  const coach: CoachSummary = {
    id,
    name: input.name,
    avatar: input.avatar,
    level: input.level,
    specialty: input.specialty,
    area: input.area,
    onlineAvailable: input.onlineAvailable,
    reviewAvailable: input.reviewAvailable,
    rating: 0,
    reviewCount: 0,
    pricePerHour: input.pricePerHour,
    duration: 50,
    availableToday: true,
  };
  state = { ...state, added: [...state.added, coach] };
  notify();
  return id;
};

export const updateCoachOverlay = (id: string, patch: Partial<CoachSummary>): void => {
  const isAdded = state.added.some((c) => c.id === id);
  if (isAdded) {
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

export const suspendCoach = (id: string): void => {
  state = { ...state, status: { ...state.status, [id]: "suspended" } };
  notify();
};

export const reactivateCoach = (id: string): void => {
  state = { ...state, status: { ...state.status, [id]: "active" } };
  notify();
};

export const deleteCoach = (id: string): void => {
  const next = new Set(state.deleted);
  next.add(id);
  state = { ...state, deleted: next };
  notify();
};

export const useAdminCoaches = (): CoachSummary[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return getMergedCoaches();
};

export const useAdminCoach = (id: string | undefined): CoachSummary | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return getMergedCoach(id);
};

export const useAdminCoachDetail = (id: string | undefined): CoachDetail | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return getMergedCoachDetail(id);
};

export const useCoachStatus = (id: string | undefined): CoachStatus => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return "active";
  return getCoachStatus(id);
};
