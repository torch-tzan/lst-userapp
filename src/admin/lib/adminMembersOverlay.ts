import { useSyncExternalStore } from "react";

import { getAllPlayers, type PlayerRef, type SkillLevel } from "@/lib/tournamentStore";

import { getMemberAffiliateId } from "./memberAffiliateLink";
import type { MemberPremiumStatus } from "./lstLabels";

/**
 * 会員管理 Overlay Store (LST HQ)
 *
 * PLAYER_DIRECTORY を seed として扱い、ここでは Admin が新規追加した会員 / 削除フラグ /
 * 編集 patch / mock な追加データ（registeredAt / lastLogin / points / premium status / cumulative pay）を持つ。
 *
 * 完全 in-memory（reload で消える）。
 */

export interface MemberExtra {
  registeredAt: string;       // YYYY-MM-DD
  lastLoginAt: string;        // YYYY-MM-DD
  points: number;             // ポイント残高
  premiumStatus: MemberPremiumStatus;
  premiumStartedAt?: string;
  premiumNextRenewAt?: string;
  premiumTotalPaid?: number;
  registeredAffiliateId?: string; // 登録店（加盟店 ID）
}

export interface MemberRecord extends PlayerRef {
  extra: MemberExtra;
}

interface OverlayState {
  added: PlayerRef[];                              // admin が新規追加
  overrides: Record<string, Partial<PlayerRef>>;   // 既存 / added の field 上書き
  extraOverrides: Record<string, Partial<MemberExtra>>;
  deleted: Set<string>;                            // 削除フラグ
}

let state: OverlayState = {
  added: [],
  overrides: {},
  extraOverrides: {},
  deleted: new Set<string>(),
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

// ── seed の extra データを生成 ─────────────────────────────────────────
// PLAYER_DIRECTORY の userId を見て deterministic に振る。
const SEED_REGISTRATION_BASE = new Date(2024, 0, 1);
const SEED_LAST_LOGIN_BASE = new Date(2026, 4, 21);

function userIdSeed(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function defaultExtraFor(p: PlayerRef): MemberExtra {
  const h = userIdSeed(p.userId);
  const regOffset = h % 600; // up to ~600 days after base
  const reg = new Date(SEED_REGISTRATION_BASE);
  reg.setDate(reg.getDate() + regOffset);
  const lastOffset = (h % 30) + 1;
  const last = new Date(SEED_LAST_LOGIN_BASE);
  last.setDate(last.getDate() - lastOffset);
  // points: 1000～5500 の幅
  const points = p.userId === "user-001" ? 1250 : 500 + (h % 5000);
  // premium: user-001 は active、他は h で決める
  let premiumStatus: MemberPremiumStatus;
  let premiumStartedAt: string | undefined;
  let premiumNextRenewAt: string | undefined;
  let premiumTotalPaid: number | undefined;
  if (p.userId === "user-001") {
    premiumStatus = "active";
    premiumStartedAt = "2025-12-29";
    premiumNextRenewAt = "2026-05-29";
    premiumTotalPaid = 2500;
  } else {
    const bucket = h % 4;
    if (bucket === 0) {
      premiumStatus = "active";
      premiumStartedAt = "2026-02-15";
      premiumNextRenewAt = "2026-06-15";
      premiumTotalPaid = 1500;
    } else if (bucket === 1) {
      premiumStatus = "expired";
      premiumStartedAt = "2025-08-01";
      premiumTotalPaid = 4500;
    } else if (bucket === 2) {
      premiumStatus = "cancelled_pending";
      premiumStartedAt = "2026-01-10";
      premiumNextRenewAt = "2026-06-10";
      premiumTotalPaid = 2000;
    } else {
      premiumStatus = "none";
    }
  }
  return {
    registeredAt: reg.toISOString().slice(0, 10),
    lastLoginAt: last.toISOString().slice(0, 10),
    points,
    premiumStatus,
    premiumStartedAt,
    premiumNextRenewAt,
    premiumTotalPaid,
    registeredAffiliateId: getMemberAffiliateId(p.userId),
  };
}

function applyExtra(p: PlayerRef): MemberRecord {
  const base = defaultExtraFor(p);
  const patch = state.extraOverrides[p.userId];
  return { ...p, extra: patch ? { ...base, ...patch } : base };
}

function applyOverride(p: PlayerRef): PlayerRef {
  const patch = state.overrides[p.userId];
  return patch ? { ...p, ...patch } : p;
}

/** seed + added を merge し、deleted を除外し、override を当てた一覧 */
export const getMergedMembers = (): MemberRecord[] => {
  const seedAll = getAllPlayers();
  const merged = [...seedAll, ...state.added]
    .filter((p) => !state.deleted.has(p.userId))
    .map(applyOverride)
    .map(applyExtra);
  return merged;
};

export const useAdminMembers = (): MemberRecord[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return getMergedMembers();
};

export const useAdminMember = (userId: string | undefined): MemberRecord | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!userId) return undefined;
  return getMergedMembers().find((m) => m.userId === userId);
};

// ── 操作 ─────────────────────────────────────────────────────────────

let addedCounter = 0;
function genUserId(): string {
  addedCounter += 1;
  return `user-new-${Date.now().toString().slice(-6)}-${addedCounter}`;
}
function genDisplayId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "LST-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export const addMember = (input: {
  name: string;
  email: string;
  phone: string;
  skillLevel: SkillLevel;
  rating: number;
  registeredAffiliateId: string;
}): MemberRecord => {
  const userId = genUserId();
  const player: PlayerRef = {
    userId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    displayId: genDisplayId(),
    skillLevel: input.skillLevel,
    rating: input.rating,
  };
  state = {
    ...state,
    added: [...state.added, player],
    extraOverrides: {
      ...state.extraOverrides,
      [userId]: {
        ...state.extraOverrides[userId],
        registeredAffiliateId: input.registeredAffiliateId,
      },
    },
  };
  notify();
  return applyExtra(player);
};

export const updateMemberExtra = (userId: string, patch: Partial<MemberExtra>): void => {
  state = {
    ...state,
    extraOverrides: {
      ...state.extraOverrides,
      [userId]: { ...state.extraOverrides[userId], ...patch },
    },
  };
  notify();
};

export const updateMember = (userId: string, patch: Partial<PlayerRef>): void => {
  const isOverlayAdded = state.added.some((p) => p.userId === userId);
  if (isOverlayAdded) {
    state = {
      ...state,
      added: state.added.map((p) => (p.userId === userId ? { ...p, ...patch } : p)),
    };
  } else {
    state = {
      ...state,
      overrides: { ...state.overrides, [userId]: { ...state.overrides[userId], ...patch } },
    };
  }
  notify();
};

export const deleteMember = (userId: string): void => {
  const next = new Set(state.deleted);
  next.add(userId);
  state = { ...state, deleted: next };
  notify();
};
