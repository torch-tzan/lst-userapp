import { useSyncExternalStore } from "react";

/**
 * アカウント招待 Mock Store（店舗 admin）
 *
 * 用途：店舗を管理できる別ユーザを admin アカウントとして招待する。
 * スタッフ招待ではない（スタッフ管理は別モジュール）。
 *
 * 全て in-memory（reload で seed に戻る）。
 */

export type InvitationRole = "owner" | "manager" | "receptionist";
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export const INVITATION_ROLE_JP: Record<InvitationRole, string> = {
  owner: "オーナー",
  manager: "管理者",
  receptionist: "受付",
};

export const INVITATION_STATUS_JP: Record<InvitationStatus, string> = {
  pending: "招待中",
  accepted: "承認済み",
  expired: "期限切れ",
  revoked: "取消",
};

export const INVITATION_STATUS_BADGE_CLS: Record<InvitationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expired: "bg-slate-100 text-slate-600 border-slate-200",
  revoked: "bg-rose-50 text-rose-700 border-rose-200",
};

export interface Invitation {
  id: string;
  email: string;
  role: InvitationRole;
  invitedAt: string;     // YYYY-MM-DD
  expiresAt: string;     // YYYY-MM-DD
  status: InvitationStatus;
  message?: string;
}

const SEED: Invitation[] = [
  {
    id: "INV-001",
    email: "tanaka@example.com",
    role: "manager",
    invitedAt: "2026-05-15",
    expiresAt: "2026-05-22",
    status: "pending",
  },
  {
    id: "INV-002",
    email: "sato.h@example.com",
    role: "receptionist",
    invitedAt: "2026-05-10",
    expiresAt: "2026-05-17",
    status: "accepted",
  },
  {
    id: "INV-003",
    email: "yamada@example.com",
    role: "owner",
    invitedAt: "2026-04-25",
    expiresAt: "2026-05-02",
    status: "expired",
  },
  {
    id: "INV-004",
    email: "suzuki@example.com",
    role: "manager",
    invitedAt: "2026-05-18",
    expiresAt: "2026-05-25",
    status: "pending",
    message: "新店舗オープンサポートのため",
  },
  {
    id: "INV-005",
    email: "takahashi@example.com",
    role: "receptionist",
    invitedAt: "2026-05-05",
    expiresAt: "2026-05-12",
    status: "accepted",
  },
  {
    id: "INV-006",
    email: "watanabe@example.com",
    role: "manager",
    invitedAt: "2026-04-20",
    expiresAt: "2026-04-27",
    status: "revoked",
  },
  {
    id: "INV-007",
    email: "kobayashi@example.com",
    role: "receptionist",
    invitedAt: "2026-05-19",
    expiresAt: "2026-05-26",
    status: "pending",
  },
  {
    id: "INV-008",
    email: "ito@example.com",
    role: "manager",
    invitedAt: "2026-04-10",
    expiresAt: "2026-04-17",
    status: "expired",
  },
];

interface State {
  invitations: Invitation[];
}

let state: State = { invitations: SEED.slice() };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useInvitations = (): Invitation[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.invitations;
};

let addedCounter = 0;
const genId = (): string => {
  addedCounter += 1;
  return `INV-NEW-${String(addedCounter).padStart(3, "0")}`;
};

export const addInvitation = (input: {
  email: string;
  role: InvitationRole;
  expiresAt: string;
  message?: string;
}): Invitation => {
  const today = new Date().toISOString().slice(0, 10);
  const inv: Invitation = {
    id: genId(),
    email: input.email,
    role: input.role,
    invitedAt: today,
    expiresAt: input.expiresAt,
    status: "pending",
    message: input.message,
  };
  state = { invitations: [inv, ...state.invitations] };
  notify();
  return inv;
};

export const revokeInvitation = (id: string): void => {
  state = {
    invitations: state.invitations.map((i) =>
      i.id === id ? { ...i, status: "revoked" } : i,
    ),
  };
  notify();
};
