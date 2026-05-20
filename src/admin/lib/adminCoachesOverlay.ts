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
 * - overrides: 既存コーチの field を上書きする部分パッチ（summary + detail 拡張 field）
 * - detail:   added coach に紐づく追加 detail 情報（bio/experience/...）
 * - suspended / deleted: 状態フラグ
 *
 * すべて in-memory（reload で消える）。
 */

export type CoachStatus = "active" | "suspended";

/**
 * Detail-level 拡張 field。Summary には無いが App 側 CoachDetail で表示される。
 * 既存 COACHES_DETAIL と merge するときの override にも、added coach の
 * 追加情報にもこの形を使う。
 */
export interface CoachDetailOverlayFields {
  avatarUrl?: string;
  bio?: string;
  experience?: string;
  location?: string;
  certifications?: string[];
}

interface OverlayState {
  added: CoachSummary[];
  /** 既存 COACHES への summary 上書き */
  overrides: Record<string, Partial<CoachSummary>>;
  /** 既存・追加 coach 共通の detail 拡張 field */
  detailOverrides: Record<string, CoachDetailOverlayFields>;
  status: Record<string, CoachStatus>; // 既存・新規 coach の状態
  deleted: Set<string>;
}

let state: OverlayState = {
  added: [],
  overrides: {},
  detailOverrides: {},
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
    const detailPatch = state.detailOverrides[c.id];
    const avatar = detailPatch?.avatarUrl ?? c.avatar;
    return patch
      ? ({ ...c, ...patch, avatar: patch.avatar ?? avatar } as CoachSummary)
      : ({ ...c, avatar } as CoachSummary);
  });
  const added = state.added
    .filter((c) => !state.deleted.has(c.id))
    .map((c) => {
      const detailPatch = state.detailOverrides[c.id];
      const avatar = detailPatch?.avatarUrl ?? c.avatar;
      return { ...c, avatar };
    });
  return [...base, ...added];
};

export const getMergedCoach = (id: string): CoachSummary | undefined => {
  return getMergedCoaches().find((c) => c.id === id);
};

/** Detail overlay fields（read-side helper） */
export const getCoachDetailOverlay = (id: string): CoachDetailOverlayFields | undefined =>
  state.detailOverrides[id];

const dedupe = (arr: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
};

export const getMergedCoachDetail = (id: string): CoachDetail | undefined => {
  const baseDetail = COACHES_DETAIL[id];
  const summary = getMergedCoach(id);
  if (!summary) return undefined;
  const detailPatch = state.detailOverrides[id];

  if (baseDetail) {
    // patch summary fields onto base detail, then apply detail-level overrides
    const merged: CoachDetail = { ...baseDetail, ...summary };
    if (detailPatch) {
      if (detailPatch.bio !== undefined) merged.bio = detailPatch.bio;
      if (detailPatch.experience !== undefined) merged.experience = detailPatch.experience;
      if (detailPatch.location !== undefined) merged.location = detailPatch.location;
      if (detailPatch.certifications && detailPatch.certifications.length > 0) {
        // union of base + overlay, deduped
        merged.certifications = dedupe([
          ...(baseDetail.certifications ?? []),
          ...detailPatch.certifications,
        ]);
      }
    }
    return merged;
  }
  // overlay added — synthesize minimal detail
  return {
    ...summary,
    bio: detailPatch?.bio ?? "新規追加されたコーチです。",
    experience: detailPatch?.experience ?? "—",
    location: detailPatch?.location ?? summary.area,
    certifications: detailPatch?.certifications ?? [],
    lessonMenus: [],
    venues: [],
    availableSlots: [],
    stats: { sessions: 0, repeatRate: 0, satisfaction: 0 },
    reviews: [],
  };
};

export interface AddCoachInput {
  name: string;
  level: string;
  specialty: string[];
  area: string;
  pricePerHour: number;
  onlineAvailable: boolean;
  reviewAvailable: boolean;
  avatar: string;
  // detail-level
  avatarUrl?: string;
  bio?: string;
  experience?: string;
  location?: string;
  certifications?: string[];
}

export const addCoachToOverlay = (input: AddCoachInput): string => {
  const allIds = [...COACHES.map((c) => c.id), ...state.added.map((c) => c.id)];
  const numeric = allIds.map((id) => Number.parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  const max = numeric.length > 0 ? Math.max(...numeric) : 0;
  const id = String(max + 1);
  const coach: CoachSummary = {
    id,
    name: input.name,
    avatar: input.avatarUrl && input.avatarUrl.length > 0 ? input.avatarUrl : input.avatar,
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
  const detailPatch: CoachDetailOverlayFields = {};
  if (input.avatarUrl && input.avatarUrl.length > 0) detailPatch.avatarUrl = input.avatarUrl;
  if (input.bio !== undefined) detailPatch.bio = input.bio;
  if (input.experience !== undefined) detailPatch.experience = input.experience;
  if (input.location !== undefined) detailPatch.location = input.location;
  if (input.certifications !== undefined) detailPatch.certifications = input.certifications;
  const hasDetailPatch = Object.keys(detailPatch).length > 0;
  state = {
    ...state,
    added: [...state.added, coach],
    detailOverrides: hasDetailPatch
      ? { ...state.detailOverrides, [id]: detailPatch }
      : state.detailOverrides,
  };
  notify();
  return id;
};

export const updateCoachOverlay = (
  id: string,
  patch: Partial<CoachSummary>,
  detailPatch?: CoachDetailOverlayFields,
): void => {
  const isAdded = state.added.some((c) => c.id === id);
  let nextState = state;
  if (isAdded) {
    nextState = {
      ...nextState,
      added: nextState.added.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    };
  } else {
    nextState = {
      ...nextState,
      overrides: { ...nextState.overrides, [id]: { ...nextState.overrides[id], ...patch } },
    };
  }
  if (detailPatch) {
    nextState = {
      ...nextState,
      detailOverrides: {
        ...nextState.detailOverrides,
        [id]: { ...nextState.detailOverrides[id], ...detailPatch },
      },
    };
  }
  state = nextState;
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

/** Detail overlay raw fields（dialog で初期値として読むため） */
export const useCoachDetailOverlay = (
  id: string | undefined,
): CoachDetailOverlayFields | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.detailOverrides[id];
};

export const useCoachStatus = (id: string | undefined): CoachStatus => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return "active";
  return getCoachStatus(id);
};
