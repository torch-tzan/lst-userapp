import courtA from "@/assets/court-a.webp";
import courtB from "@/assets/court-b.webp";
import courtC from "@/assets/court-c.webp";
import courtOutdoor from "@/assets/court-outdoor.webp";
import courtIndoor from "@/assets/court-indoor.webp";

// ─── Types ───────────────────────────────────────────────

export interface CourtSummary {
  id: string;
  name: string;
  courtName: string;
  courtType: string;
  price: number;
  image: string;
  available: boolean;
}

export interface ExternalLink {
  icon: "map" | "globe" | "list";
  title: string;
  description: string;
  url: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  priceType: "hourly" | "perUse";
  price: number;
  maxQty: number;
}

export interface CourtDetail extends CourtSummary {
  rating: number;
  reviews: number;
  address: string;
  description: string;
  amenities: string[];

  availableSlots: { time: string; available: boolean }[];
  externalLinks?: ExternalLink[];
  equipment?: EquipmentItem[];
}

/** 1 人練習特價公式：hourly × 0.25 × 1.2 */
export const SOLO_PRICE_MULTIPLIER = 0.25 * 1.2;
export const getSoloHourlyPrice = (hourly: number) => Math.round(hourly * SOLO_PRICE_MULTIPLIER);

// ─── Data ────────────────────────────────────────────────

/** Courts shown in search results */
export const COURTS: CourtSummary[] = [
  { id: "1", name: "パデルコート広島", courtName: "コートA", courtType: "屋外ハード", price: 2000, image: courtA, available: true },
  { id: "2", name: "北広島パデルクラブ", courtName: "コートB", courtType: "室内", price: 3500, image: courtB, available: true },
  { id: "3", name: "広島中央スポーツ", courtName: "コートC", courtType: "室内ハード", price: 2800, image: courtC, available: true },
];

/** Courts shown on the home page (recent views) */
export const HOME_COURTS: CourtSummary[] = [
  { id: "1", name: "テニスパーク大阪", courtName: "コートA", courtType: "屋外ハード", price: 2000, image: courtOutdoor, available: true },
  { id: "2", name: "スポーツセンター難波", courtName: "コートB", courtType: "室内", price: 3500, image: courtIndoor, available: true },
];

export const COURTS_DETAIL: Record<string, CourtDetail> = {
  "1": {
    ...COURTS[0],
    rating: 4.5,
    reviews: 128,
    address: "広島県広島市中区大手町1-2-3",
    description: "広島市中心部にある本格的なパデルコート。屋外ハードコートで、初心者から上級者まで楽しめます。ナイター設備完備。",
    amenities: ["駐車場", "シャワー", "ロッカー", "レンタル用具", "ナイター"],
    availableSlots: [
      { time: "09:00", available: true }, { time: "10:00", available: true },
      { time: "11:00", available: false }, { time: "12:00", available: false },
      { time: "13:00", available: true }, { time: "14:00", available: true },
      { time: "15:00", available: false }, { time: "16:00", available: true },
      { time: "17:00", available: true }, { time: "18:00", available: true },
    ],
    externalLinks: [
      { icon: "map", title: "広島市観光情報", description: "広島市公式観光サイト", url: "https://www.hiroshima-navi.or.jp" },
      { icon: "globe", title: "公式観光サイト", description: "Visit Hiroshima", url: "https://visithiroshima.net" },
      { icon: "list", title: "関連URL一覧", description: "パートナーサイト・提携施設リンク", url: "#" },
    ],
    equipment: [
      { id: "racket", name: "パデルラケット", priceType: "hourly", price: 300, maxQty: 4 },
      { id: "balls", name: "ボール (3個セット)", priceType: "perUse", price: 500, maxQty: 3 },
      { id: "shoes", name: "シューズレンタル", priceType: "perUse", price: 400, maxQty: 4 },
    ],
  },
  "2": {
    ...COURTS[1],
    rating: 4.8,
    reviews: 86,
    address: "広島県北広島市中央5-10-1",
    description: "全天候型室内パデルコート。空調完備で一年中快適にプレー可能。プロコーチによるレッスンも実施中。",
    amenities: ["駐車場", "シャワー", "ロッカー", "レンタル用具", "空調", "カフェ"],
    availableSlots: [
      { time: "09:00", available: false }, { time: "10:00", available: true },
      { time: "11:00", available: true }, { time: "12:00", available: false },
      { time: "13:00", available: false }, { time: "14:00", available: true },
      { time: "15:00", available: true }, { time: "16:00", available: true },
      { time: "17:00", available: false }, { time: "18:00", available: true },
    ],
    externalLinks: [
      { icon: "globe", title: "北広島パデルクラブ公式", description: "施設情報・アクセス", url: "#" },
      { icon: "map", title: "北広島市スポーツ施設", description: "市営スポーツ施設一覧", url: "#" },
    ],
    equipment: [
      { id: "racket-pro", name: "プロ仕様ラケット", priceType: "hourly", price: 500, maxQty: 4 },
      { id: "racket", name: "パデルラケット", priceType: "hourly", price: 300, maxQty: 4 },
      { id: "balls", name: "ボール (3個セット)", priceType: "perUse", price: 500, maxQty: 3 },
      { id: "towel", name: "タオル", priceType: "perUse", price: 200, maxQty: 4 },
    ],
  },
  "3": {
    ...COURTS[2],
    rating: 4.3,
    reviews: 54,
    address: "広島県広島市南区松原町3-1-1",
    description: "広島駅から徒歩5分の好立地。室内ハードコートで雨の日でも安心。初心者向けクリニックも開催中。",
    amenities: ["シャワー", "ロッカー", "レンタル用具", "売店"],
    availableSlots: [
      { time: "09:00", available: true }, { time: "10:00", available: true },
      { time: "11:00", available: true }, { time: "12:00", available: true },
      { time: "13:00", available: false }, { time: "14:00", available: false },
      { time: "15:00", available: true }, { time: "16:00", available: false },
      { time: "17:00", available: true }, { time: "18:00", available: true },
    ],
    externalLinks: [
      { icon: "globe", title: "広島中央スポーツ公式", description: "公式ホームページ", url: "#" },
      { icon: "list", title: "初心者クリニック情報", description: "開催スケジュール・申込", url: "#" },
    ],
    equipment: [
      { id: "racket", name: "パデルラケット", priceType: "hourly", price: 250, maxQty: 4 },
      { id: "balls", name: "ボール (3個セット)", priceType: "perUse", price: 400, maxQty: 3 },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────

export const getCourtById = (id: string): CourtDetail | undefined => COURTS_DETAIL[id];

/** Map court name → court image (for booking history display) */
const _courtImages = new Map<string, string>();
COURTS.forEach((c) => _courtImages.set(c.name, c.image));

export const getCourtImage = (name: string): string | undefined => _courtImages.get(name);
