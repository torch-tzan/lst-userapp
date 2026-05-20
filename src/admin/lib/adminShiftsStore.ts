import { useSyncExternalStore } from "react";

import type { ShiftKind, ShiftStatus } from "./storeLabels";

/**
 * シフト管理 Mock Store
 * - seed: 20 件（今後 7 日）
 */

export interface ShiftRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  kind: ShiftKind;
  status: ShiftStatus;
  note?: string;
}

const STAFF_LIST = [
  { id: "ST-001", name: "山田 健一" },
  { id: "ST-002", name: "鈴木 美咲" },
  { id: "ST-003", name: "佐藤 健太郎" },
  { id: "ST-004", name: "高橋 由美" },
  { id: "ST-005", name: "渡辺 直樹" },
  { id: "ST-007", name: "山本 沙希" },
];

const KINDS: ShiftKind[] = ["regular", "early", "late", "regular", "regular"];
const STATUSES: ShiftStatus[] = ["confirmed", "confirmed", "confirmed", "requested"];

function dateOffsetForward(daysAhead: number): string {
  const d = new Date(2026, 4, 21);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function seedShifts(): ShiftRecord[] {
  const rows: ShiftRecord[] = [];
  for (let i = 0; i < 20; i++) {
    const staff = STAFF_LIST[i % STAFF_LIST.length];
    const kind = KINDS[i % KINDS.length];
    const daysAhead = Math.floor(i / 3); // 0〜6 日
    const start = kind === "early" ? "07:00" : kind === "late" ? "14:00" : "09:00";
    const end = kind === "early" ? "13:00" : kind === "late" ? "21:00" : "17:00";
    rows.push({
      id: `SH-${String(1000 + i).padStart(4, "0")}`,
      staffId: staff.id,
      staffName: staff.name,
      date: dateOffsetForward(daysAhead),
      startTime: start,
      endTime: end,
      kind,
      status: STATUSES[i % STATUSES.length],
    });
  }
  return rows.sort((a, b) => (a.date + a.startTime < b.date + b.startTime ? -1 : 1));
}

let state: { shifts: ShiftRecord[] } = { shifts: seedShifts() };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useAdminShifts = (): ShiftRecord[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.shifts;
};

export const addShift = (input: Omit<ShiftRecord, "id" | "status"> & { status?: ShiftStatus }): string => {
  const nums = state.shifts
    .map((s) => Number.parseInt(s.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 1000) + 1;
  const id = `SH-${String(next).padStart(4, "0")}`;
  state = {
    shifts: [...state.shifts, { ...input, id, status: input.status ?? "confirmed" }],
  };
  notify();
  return id;
};

export const updateShift = (id: string, patch: Partial<ShiftRecord>): void => {
  state = {
    shifts: state.shifts.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  };
  notify();
};

export const deleteShift = (id: string): void => {
  state = { shifts: state.shifts.filter((s) => s.id !== id) };
  notify();
};
