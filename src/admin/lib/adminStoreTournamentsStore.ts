import { useSyncExternalStore } from "react";

/**
 * 店舗側 大会管理 Mock Store
 *
 * 店舗が独自に開催する地域大会の管理データ。
 * リーグや LST 月例大会とは別レイヤー（store-local activity）。
 *
 * 全て in-memory（reload で seed に戻る）。
 */

export type TournamentFormat = "singles" | "doubles";
export type TournamentStatus =
  | "registration_open"
  | "in_progress"
  | "completed"
  | "cancelled";

export const TOURNAMENT_FORMAT_JP: Record<TournamentFormat, string> = {
  singles: "シングルス",
  doubles: "ダブルス",
};

export const TOURNAMENT_STATUS_JP: Record<TournamentStatus, string> = {
  registration_open: "募集中",
  in_progress: "開催中",
  completed: "終了",
  cancelled: "キャンセル",
};

export const TOURNAMENT_STATUS_BADGE_CLS: Record<TournamentStatus, string> = {
  registration_open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export interface StoreTournamentEntry {
  id: string;
  playerName: string;
  enteredAt: string;
}

export interface StoreTournament {
  id: string;
  title: string;
  heldAt: string;            // YYYY-MM-DD
  format: TournamentFormat;
  capacity: number;          // 8 / 16 / 32
  entries: StoreTournamentEntry[];
  status: TournamentStatus;
  venue: string;
  registrationDeadline: string;
  description?: string;
}

const mkEntries = (count: number, prefix: string): StoreTournamentEntry[] => {
  const names = ["田中健", "佐藤美", "鈴木大", "高橋雅", "渡辺涼", "伊藤葵", "山本翔", "中村健", "小林麻", "加藤大", "吉田涼", "山田葵", "斉藤健", "松本美", "井上大", "木村雅"];
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-E${String(i + 1).padStart(2, "0")}`,
    playerName: `${names[i % names.length]} ${(i + 1).toString()}`,
    enteredAt: `2026-05-${String((i % 18) + 1).padStart(2, "0")}`,
  }));
};

const SEED: StoreTournament[] = [
  {
    id: "T-2026-001",
    title: "5月度 シングルス大会",
    heldAt: "2026-05-28",
    format: "singles",
    capacity: 16,
    entries: mkEntries(12, "T-2026-001"),
    status: "registration_open",
    venue: "コートA",
    registrationDeadline: "2026-05-25",
    description: "5月の月例シングルス大会。中級者以上対象。",
  },
  {
    id: "T-2026-002",
    title: "ダブルス交流戦",
    heldAt: "2026-05-22",
    format: "doubles",
    capacity: 16,
    entries: mkEntries(14, "T-2026-002"),
    status: "in_progress",
    venue: "コートB / コートC",
    registrationDeadline: "2026-05-19",
    description: "ダブルスの交流戦。レベル不問。",
  },
  {
    id: "T-2026-003",
    title: "新人歓迎カップ",
    heldAt: "2026-05-15",
    format: "singles",
    capacity: 8,
    entries: mkEntries(8, "T-2026-003"),
    status: "completed",
    venue: "コートA",
    registrationDeadline: "2026-05-12",
    description: "初心者対象のミニトーナメント。",
  },
  {
    id: "T-2026-004",
    title: "ナイトダブルス",
    heldAt: "2026-06-05",
    format: "doubles",
    capacity: 32,
    entries: mkEntries(20, "T-2026-004"),
    status: "registration_open",
    venue: "全コート",
    registrationDeadline: "2026-06-02",
  },
  {
    id: "T-2026-005",
    title: "4月度 上級者杯",
    heldAt: "2026-04-26",
    format: "singles",
    capacity: 16,
    entries: mkEntries(16, "T-2026-005"),
    status: "completed",
    venue: "コートA / コートB",
    registrationDeadline: "2026-04-23",
  },
  {
    id: "T-2026-006",
    title: "雨天中止 ミックスダブルス",
    heldAt: "2026-04-10",
    format: "doubles",
    capacity: 16,
    entries: mkEntries(10, "T-2026-006"),
    status: "cancelled",
    venue: "コートD",
    registrationDeadline: "2026-04-07",
    description: "悪天候により中止。",
  },
];

interface State {
  tournaments: StoreTournament[];
}

let state: State = { tournaments: SEED.slice() };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useStoreTournaments = (): StoreTournament[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.tournaments;
};

export const useStoreTournament = (id: string | undefined): StoreTournament | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.tournaments.find((t) => t.id === id);
};

let addedCounter = 100;
const genId = (): string => {
  addedCounter += 1;
  return `T-2026-${String(addedCounter).padStart(3, "0")}`;
};

export const addStoreTournament = (input: {
  title: string;
  heldAt: string;
  format: TournamentFormat;
  capacity: number;
  venue: string;
  registrationDeadline: string;
  description?: string;
}): StoreTournament => {
  const t: StoreTournament = {
    id: genId(),
    title: input.title,
    heldAt: input.heldAt,
    format: input.format,
    capacity: input.capacity,
    entries: [],
    status: "registration_open",
    venue: input.venue,
    registrationDeadline: input.registrationDeadline,
    description: input.description,
  };
  state = { tournaments: [t, ...state.tournaments] };
  notify();
  return t;
};

export const cancelStoreTournament = (id: string): void => {
  state = {
    tournaments: state.tournaments.map((t) =>
      t.id === id ? { ...t, status: "cancelled" } : t,
    ),
  };
  notify();
};
