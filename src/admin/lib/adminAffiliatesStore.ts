import { useSyncExternalStore } from "react";

import type { AffiliateStatus } from "./lstLabels";

/**
 * 加盟店管理 Mock Store (LST HQ)
 *
 * - seed: 12 加盟店（status mix / 都道府県 mix）
 * - overlay: 新規追加 / 編集 / 解約手続き
 * - 全部 in-memory（reload で seed に戻る）
 */

export interface Affiliate {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  prefecture: string;
  openedAt: string;       // YYYY-MM-DD（開業日）
  contractStartAt: string; // YYYY-MM-DD（契約開始日）
  status: AffiliateStatus;
  courtCount: number;
  monthlyRevenue: number;   // 今月売上（円）
  totalRevenue: number;     // 累計売上（円）
  feeRateOverride?: number; // 加盟店別の手数料率（%）— 未設定なら global 値を使う
  avatarUrl?: string;       // 任意（mock では未使用）
  terminationDate?: string; // 解約日（解約予定の場合）
  terminationReason?: string;
}

const SEED: Affiliate[] = [
  {
    id: "AFF-001",
    storeName: "パデルコート広島",
    ownerName: "田中 健太",
    email: "tanaka@padel-hiroshima.jp",
    phone: "082-111-2222",
    address: "広島県広島市中区大手町1-2-3",
    prefecture: "広島県",
    openedAt: "2022-04-01",
    contractStartAt: "2022-03-15",
    status: "active",
    courtCount: 3,
    monthlyRevenue: 1_280_000,
    totalRevenue: 38_400_000,
    feeRateOverride: undefined,
  },
  {
    id: "AFF-002",
    storeName: "北広島パデルクラブ",
    ownerName: "佐藤 美紀",
    email: "sato@kita-padel.jp",
    phone: "082-333-4444",
    address: "広島県北広島市朝日1-2-3",
    prefecture: "広島県",
    openedAt: "2023-01-10",
    contractStartAt: "2022-12-20",
    status: "active",
    courtCount: 2,
    monthlyRevenue: 980_000,
    totalRevenue: 22_540_000,
    feeRateOverride: 8,
  },
  {
    id: "AFF-003",
    storeName: "広島中央スポーツ",
    ownerName: "鈴木 大輔",
    email: "suzuki@chuo-sports.jp",
    phone: "082-555-6666",
    address: "広島県広島市東区光町2-1-1",
    prefecture: "広島県",
    openedAt: "2021-06-01",
    contractStartAt: "2021-05-10",
    status: "active",
    courtCount: 4,
    monthlyRevenue: 1_820_000,
    totalRevenue: 87_500_000,
    feeRateOverride: undefined,
  },
  {
    id: "AFF-004",
    storeName: "東京湾パデルセンター",
    ownerName: "高橋 雅之",
    email: "takahashi@tokyo-bay.jp",
    phone: "03-1111-2222",
    address: "東京都江東区豊洲5-6-7",
    prefecture: "東京都",
    openedAt: "2024-03-15",
    contractStartAt: "2024-03-01",
    status: "active",
    courtCount: 5,
    monthlyRevenue: 2_450_000,
    totalRevenue: 41_300_000,
    feeRateOverride: 12,
  },
  {
    id: "AFF-005",
    storeName: "渋谷インドアコート",
    ownerName: "渡辺 涼",
    email: "watanabe@shibuya-indoor.jp",
    phone: "03-3333-4444",
    address: "東京都渋谷区円山町1-2",
    prefecture: "東京都",
    openedAt: "2023-09-01",
    contractStartAt: "2023-08-15",
    status: "active",
    courtCount: 3,
    monthlyRevenue: 1_980_000,
    totalRevenue: 35_200_000,
    feeRateOverride: undefined,
  },
  {
    id: "AFF-006",
    storeName: "大阪南港パデル",
    ownerName: "伊藤 雅子",
    email: "ito@osaka-nanko.jp",
    phone: "06-1111-2222",
    address: "大阪府大阪市住之江区南港北1-2-3",
    prefecture: "大阪府",
    openedAt: "2022-11-01",
    contractStartAt: "2022-10-10",
    status: "active",
    courtCount: 4,
    monthlyRevenue: 1_650_000,
    totalRevenue: 56_700_000,
    feeRateOverride: undefined,
  },
  {
    id: "AFF-007",
    storeName: "なんばスポーツパーク",
    ownerName: "山本 翔",
    email: "yamamoto@namba-sports.jp",
    phone: "06-3333-4444",
    address: "大阪府大阪市浪速区難波中2-1-1",
    prefecture: "大阪府",
    openedAt: "2024-01-15",
    contractStartAt: "2023-12-25",
    status: "paused",
    courtCount: 2,
    monthlyRevenue: 0,
    totalRevenue: 12_400_000,
    feeRateOverride: undefined,
  },
  {
    id: "AFF-008",
    storeName: "横浜ベイサイドパデル",
    ownerName: "中村 健",
    email: "nakamura@yokohama-bay.jp",
    phone: "045-1111-2222",
    address: "神奈川県横浜市中区新港2-2-1",
    prefecture: "神奈川県",
    openedAt: "2023-04-20",
    contractStartAt: "2023-04-01",
    status: "active",
    courtCount: 3,
    monthlyRevenue: 1_750_000,
    totalRevenue: 42_800_000,
    feeRateOverride: 9,
  },
  {
    id: "AFF-009",
    storeName: "川崎リバーサイドコート",
    ownerName: "小林 麻衣",
    email: "kobayashi@kawasaki-river.jp",
    phone: "044-1111-2222",
    address: "神奈川県川崎市川崎区港町1-1",
    prefecture: "神奈川県",
    openedAt: "2022-08-01",
    contractStartAt: "2022-07-15",
    status: "active",
    courtCount: 2,
    monthlyRevenue: 1_120_000,
    totalRevenue: 32_100_000,
    feeRateOverride: undefined,
  },
  {
    id: "AFF-010",
    storeName: "博多ステーションパデル",
    ownerName: "加藤 大輔",
    email: "kato@hakata-station.jp",
    phone: "092-1111-2222",
    address: "福岡県福岡市博多区博多駅前2-3-4",
    prefecture: "福岡県",
    openedAt: "2023-07-01",
    contractStartAt: "2023-06-15",
    status: "active",
    courtCount: 3,
    monthlyRevenue: 1_420_000,
    totalRevenue: 28_900_000,
    feeRateOverride: undefined,
  },
  {
    id: "AFF-011",
    storeName: "天神スポーツプラザ",
    ownerName: "吉田 涼",
    email: "yoshida@tenjin-sports.jp",
    phone: "092-3333-4444",
    address: "福岡県福岡市中央区天神2-1-1",
    prefecture: "福岡県",
    openedAt: "2024-05-10",
    contractStartAt: "2024-04-20",
    status: "terminating",
    courtCount: 2,
    monthlyRevenue: 480_000,
    totalRevenue: 5_200_000,
    feeRateOverride: undefined,
    terminationDate: "2026-08-31",
    terminationReason: "事業方針の見直しのため",
  },
  {
    id: "AFF-012",
    storeName: "札幌雪上パデル",
    ownerName: "山田 葵",
    email: "yamada@sapporo-snow.jp",
    phone: "011-1111-2222",
    address: "北海道札幌市中央区南2条西3丁目",
    prefecture: "北海道",
    openedAt: "2023-12-01",
    contractStartAt: "2023-11-10",
    status: "active",
    courtCount: 2,
    monthlyRevenue: 920_000,
    totalRevenue: 18_400_000,
    feeRateOverride: undefined,
  },
];

interface State {
  affiliates: Affiliate[];
}

let state: State = { affiliates: SEED.slice() };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const notify = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useAffiliates = (): Affiliate[] => {
  useSyncExternalStore(subscribe, getSnapshot);
  return state.affiliates;
};

export const useAffiliate = (id: string | undefined): Affiliate | undefined => {
  useSyncExternalStore(subscribe, getSnapshot);
  if (!id) return undefined;
  return state.affiliates.find((a) => a.id === id);
};

/** Read-only accessor — outside React tree（mock 紐付け用） */
export const getAffiliatesSnapshot = (): Affiliate[] => state.affiliates;

export const addAffiliate = (input: {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  prefecture: string;
  openedAt: string;
  contractStartAt: string;
  feeRateOverride?: number;
  avatarUrl?: string;
}): Affiliate => {
  const nextNum = state.affiliates.length + 1;
  const id = `AFF-${String(nextNum).padStart(3, "0")}`;
  const newAff: Affiliate = {
    id,
    storeName: input.storeName,
    ownerName: input.ownerName,
    email: input.email,
    phone: input.phone,
    address: input.address,
    prefecture: input.prefecture,
    openedAt: input.openedAt,
    contractStartAt: input.contractStartAt,
    status: "active",
    courtCount: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    feeRateOverride: input.feeRateOverride,
    avatarUrl: input.avatarUrl,
  };
  state = { affiliates: [...state.affiliates, newAff] };
  notify();
  return newAff;
};

export const updateAffiliate = (id: string, patch: Partial<Affiliate>): void => {
  state = {
    affiliates: state.affiliates.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  };
  notify();
};

export const terminateAffiliate = (id: string, terminationDate: string, reason: string): void => {
  state = {
    affiliates: state.affiliates.map((a) =>
      a.id === id
        ? { ...a, status: "terminating", terminationDate, terminationReason: reason }
        : a,
    ),
  };
  notify();
};
