import { useSyncExternalStore } from "react";

import type { StaffEmployment, StaffRole, StaffStatus } from "./storeLabels";

/**
 * スタッフ管理 Mock Store
 * - seed: 8 名
 */

export interface StaffRecord {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  employment: StaffEmployment;
  joinDate: string; // YYYY-MM-DD
  status: StaffStatus;
  hourlyWage: number;
  // 月次成果報酬 mock
  commission?: number;
  // 月次勤務時間 mock
  hoursWorked?: number;
}

const SEED: StaffRecord[] = [
  { id: "ST-001", name: "山田 健一",   email: "yamada@example.com",   role: "owner",     employment: "fulltime", joinDate: "2024-04-01", status: "active",  hourlyWage: 2500, hoursWorked: 160, commission: 50000 },
  { id: "ST-002", name: "鈴木 美咲",   email: "suzuki@example.com",   role: "staff",     employment: "fulltime", joinDate: "2024-06-15", status: "active",  hourlyWage: 1800, hoursWorked: 152, commission: 30000 },
  { id: "ST-003", name: "佐藤 健太郎", email: "sato@example.com",     role: "staff",     employment: "parttime", joinDate: "2025-01-10", status: "active",  hourlyWage: 1500, hoursWorked: 80,  commission: 15000 },
  { id: "ST-004", name: "高橋 由美",   email: "takahashi@example.com",role: "reception", employment: "parttime", joinDate: "2025-03-20", status: "active",  hourlyWage: 1400, hoursWorked: 60,  commission: 0 },
  { id: "ST-005", name: "渡辺 直樹",   email: "watanabe@example.com", role: "staff",     employment: "contract", joinDate: "2025-09-01", status: "active",  hourlyWage: 2000, hoursWorked: 120, commission: 25000 },
  { id: "ST-006", name: "伊藤 雅之",   email: "ito@example.com",      role: "reception", employment: "parttime", joinDate: "2026-01-05", status: "paused",  hourlyWage: 1400, hoursWorked: 0,   commission: 0 },
  { id: "ST-007", name: "山本 沙希",   email: "yamamoto@example.com", role: "staff",     employment: "fulltime", joinDate: "2026-02-15", status: "active",  hourlyWage: 1800, hoursWorked: 144, commission: 28000 },
  { id: "ST-008", name: "中村 翔",     email: "nakamura@example.com", role: "staff",     employment: "parttime", joinDate: "2024-11-01", status: "retired", hourlyWage: 1500, hoursWorked: 0,   commission: 0 },
];

let state: { staff: StaffRecord[] } = { staff: SEED };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useAdminStaff = (): StaffRecord[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.staff;
};

export const useAdminStaffMember = (id: string | undefined): StaffRecord | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.staff.find((s) => s.id === id);
};

export const addStaff = (input: Omit<StaffRecord, "id" | "status" | "hoursWorked" | "commission">): string => {
  const nums = state.staff
    .map((s) => Number.parseInt(s.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  const id = `ST-${String(next).padStart(3, "0")}`;
  state = {
    staff: [
      ...state.staff,
      { ...input, id, status: "active", hoursWorked: 0, commission: 0 },
    ],
  };
  notify();
  return id;
};

export const updateStaff = (id: string, patch: Partial<StaffRecord>): void => {
  state = {
    staff: state.staff.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  };
  notify();
};

export const setStaffStatus = (id: string, status: StaffStatus): void => {
  updateStaff(id, { status });
};

export const updateStaffCommission = (id: string, commission: number): void => {
  updateStaff(id, { commission });
};
