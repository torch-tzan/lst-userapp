import coach1Img from "@/assets/coach-1.webp";
import coach2Img from "@/assets/coach-2.webp";
import coach3Img from "@/assets/coach-3.webp";
import coach4Img from "@/assets/coach-4.webp";
import coach5Img from "@/assets/coach-5.webp";
import coach6Img from "@/assets/coach-6.webp";
import coach7Img from "@/assets/coach-7.webp";
import coach8Img from "@/assets/coach-8.webp";

// ─── Types ───────────────────────────────────────────────

export interface CoachSummary {
  id: string;
  name: string;
  avatar: string;
  level: string;
  specialty: string[];
  area: string;
  onlineAvailable: boolean;
  reviewAvailable: boolean;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  duration: number;
  availableToday: boolean;
}

export interface CoachReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
}

export interface CoachVenue {
  id: string;
  name: string;
  address: string;
  courtFeePerHour: number;
}

export interface LessonMenu {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // minutes
  type: "onsite" | "online" | "review";
}

export interface CoachDetail extends CoachSummary {
  bio: string;
  experience: string;
  location: string;
  certifications: string[];
  lessonMenus: LessonMenu[];
  venues: CoachVenue[];
  stats: { sessions: number; repeatRate: number; satisfaction: number };
  availableSlots: { time: string; available: boolean }[];
  reviews: CoachReview[];
}

// ─── Data ────────────────────────────────────────────────

export const COACHES: CoachSummary[] = [
  { id: "1", name: "佐藤翔太", avatar: coach1Img, level: "A級", specialty: ["初心者指導", "フォーム改善", "体力強化"], area: "広島市中区", onlineAvailable: true, reviewAvailable: true, rating: 4.8, reviewCount: 156, pricePerHour: 4000, duration: 50, availableToday: true },
  { id: "2", name: "田中美咲", avatar: coach2Img, level: "S級", specialty: ["競技向け", "メンタル強化", "戦術分析"], area: "広島市南区", onlineAvailable: false, reviewAvailable: false, rating: 4.9, reviewCount: 203, pricePerHour: 6000, duration: 50, availableToday: false },
  { id: "3", name: "鈴木健太", avatar: coach3Img, level: "B級", specialty: ["ジュニア育成", "基礎トレーニング"], area: "北広島市", onlineAvailable: false, reviewAvailable: false, rating: 4.6, reviewCount: 89, pricePerHour: 3500, duration: 50, availableToday: true },
  { id: "4", name: "山本大輔", avatar: coach4Img, level: "A級", specialty: ["ダブルス戦術", "ポジショニング", "試合形式"], area: "広島市中区", onlineAvailable: true, reviewAvailable: true, rating: 4.7, reviewCount: 124, pricePerHour: 4500, duration: 50, availableToday: true },
  { id: "5", name: "中村あかり", avatar: coach5Img, level: "A級", specialty: ["体力強化", "フィジカル", "初心者指導"], area: "広島市西区", onlineAvailable: true, reviewAvailable: true, rating: 4.5, reviewCount: 67, pricePerHour: 3800, duration: 50, availableToday: true },
  { id: "6", name: "高橋誠一", avatar: coach6Img, level: "S級", specialty: ["戦術分析", "試合形式", "メンタル強化", "競技向け"], area: "広島市中区", onlineAvailable: true, reviewAvailable: true, rating: 4.9, reviewCount: 312, pricePerHour: 7000, duration: 50, availableToday: false },
  { id: "7", name: "伊藤陽介", avatar: coach7Img, level: "B級", specialty: ["初心者指導", "レクリエーション"], area: "東広島市", onlineAvailable: false, reviewAvailable: false, rating: 4.4, reviewCount: 45, pricePerHour: 3000, duration: 50, availableToday: true },
  { id: "8", name: "松本恵理", avatar: coach8Img, level: "A級", specialty: ["ジュニア育成", "フォーム改善", "基礎トレーニング"], area: "広島市安佐南区", onlineAvailable: false, reviewAvailable: true, rating: 4.7, reviewCount: 98, pricePerHour: 4200, duration: 50, availableToday: false },
];

export const COACHES_DETAIL: Record<string, CoachDetail> = {
  "1": {
    ...COACHES[0],
    bio: "パデル歴10年。初心者から中級者まで、楽しみながら上達できるレッスンを提供します。基礎フォームの習得を重視し、ケガのないプレーを目指します。",
    experience: "指導歴8年・JPA公認コーチ",
    location: "広島県広島市中区",
    certifications: ["JPA公認A級", "スポーツ指導者資格", "救急救命講習修了"],
    lessonMenus: [
      { id: "m1-1", name: "初心者レッスン", description: "基礎フォームと打ち方を丁寧に指導", price: 4000, duration: 50, type: "onsite" },
      { id: "m1-2", name: "フォーム改善", description: "動画分析で効率的なフォームを身につける", price: 5000, duration: 50, type: "onsite" },
      { id: "m1-3", name: "オンライン相談", description: "動画を見ながらアドバイス", price: 2500, duration: 50, type: "online" },
      { id: "m1-4", name: "オンラインレビュー", description: "プレー動画を送信してコーチからフィードバック", price: 2000, duration: 0, type: "review" },
    ],
    venues: [
      { id: "v1", name: "PADEL HIROSHIMA 中区コート", address: "広島県広島市中区大手町1-2-3", courtFeePerHour: 2000 },
      { id: "v2", name: "パデルパーク広島駅前", address: "広島県広島市南区松原町5-1", courtFeePerHour: 3500 },
    ],
    availableSlots: [
      { time: "09:00", available: true }, { time: "10:00", available: true }, { time: "11:00", available: false },
      { time: "13:00", available: true }, { time: "14:00", available: true }, { time: "15:00", available: false },
      { time: "16:00", available: true }, { time: "17:00", available: true },
    ],
    stats: { sessions: 156, repeatRate: 78, satisfaction: 96 },
    reviews: [
      { id: "r2", name: "高橋花子", rating: 5, date: "2025-04-05", comment: "楽しい雰囲気で緊張せずにレッスンを受けられます。毎週通いたいです！" },
      { id: "r3", name: "小林健", rating: 4, date: "2025-03-28", comment: "基礎を丁寧に教えてくれます。少し時間が短く感じました。" },
    ],
  },
  "2": {
    ...COACHES[1],
    bio: "元日本代表選手。競技レベルの向上を目指す方に、戦術・メンタル面も含めた総合的なコーチングを行います。大会出場を目指す方に最適です。",
    experience: "元日本代表・指導歴12年",
    location: "広島県広島市南区",
    certifications: ["JPA公認S級", "元日本代表", "スポーツ心理学修了"],
    lessonMenus: [
      { id: "m2-1", name: "戦術レッスン", description: "試合で勝つための戦術を徹底指導", price: 6000, duration: 50, type: "onsite" },
      { id: "m2-2", name: "メンタルコーチング", description: "試合本番で力を発揮するメンタルトレーニング", price: 7000, duration: 50, type: "onsite" },
      { id: "m2-3", name: "試合映像分析", description: "映像を見ながら弱点と改善点を解説", price: 5000, duration: 50, type: "onsite" },
    ],
    venues: [
      { id: "v3", name: "PADEL ARENA 広島南", address: "広島県広島市南区東雲2-10-5", courtFeePerHour: 2800 },
    ],
    availableSlots: [
      { time: "10:00", available: false }, { time: "11:00", available: false },
      { time: "13:00", available: true }, { time: "14:00", available: true },
      { time: "15:00", available: true }, { time: "16:00", available: false },
    ],
    stats: { sessions: 203, repeatRate: 85, satisfaction: 99 },
    reviews: [
      { id: "r2", name: "中村真理", rating: 5, date: "2025-04-08", comment: "ハイレベルなレッスンですが、丁寧に説明してくれるので理解しやすいです。" },
      { id: "r3", name: "吉田大輝", rating: 5, date: "2025-03-30", comment: "メンタル面のコーチングも素晴らしく、試合での緊張感が減りました。" },
    ],
  },
  "3": {
    ...COACHES[2],
    bio: "子どもたちが楽しくパデルを学べる環境づくりを大切にしています。運動能力の基礎向上とスポーツマンシップの育成を目指します。",
    experience: "ジュニア指導歴6年",
    location: "広島県北広島市",
    certifications: ["JPA公認B級", "ジュニアスポーツ指導員"],
    lessonMenus: [
      { id: "m3-1", name: "ジュニアレッスン", description: "小学生〜中学生向けの基礎レッスン", price: 3500, duration: 50, type: "onsite" },
      { id: "m3-2", name: "基礎トレーニング", description: "運動能力向上のための総合トレーニング", price: 3000, duration: 50, type: "onsite" },
    ],
    venues: [
      { id: "v4", name: "パデルクラブ北広島", address: "広島県北広島市中央3-8-1", courtFeePerHour: 2500 },
      { id: "v5", name: "PADEL HIROSHIMA 中区コート", address: "広島県広島市中区大手町1-2-3", courtFeePerHour: 2000 },
    ],
    availableSlots: [
      { time: "09:00", available: true }, { time: "10:00", available: true }, { time: "11:00", available: true },
      { time: "13:00", available: false }, { time: "14:00", available: true },
      { time: "15:00", available: true }, { time: "16:00", available: true },
    ],
    stats: { sessions: 89, repeatRate: 72, satisfaction: 94 },
    reviews: [
      { id: "r2", name: "渡辺誠", rating: 4, date: "2025-04-02", comment: "子どもの運動能力が明らかに向上しました。感謝しています。" },
    ],
  },
  "4": {
    ...COACHES[3],
    bio: "ダブルスのポジショニングと連携プレーに特化したレッスンを提供します。ペアとの動き方を理論的に理解し、試合で勝てるダブルスを目指します。",
    experience: "ダブルス専門指導歴7年",
    location: "広島県広島市中区",
    certifications: ["JPA公認A級", "ダブルス戦術指導認定"],
    lessonMenus: [
      { id: "m4-1", name: "ダブルス実践", description: "ペアとの連携プレーを試合形式で練習", price: 4500, duration: 50, type: "onsite" },
      { id: "m4-2", name: "ポジショニング集中", description: "コート上の最適なポジションを理解する", price: 5000, duration: 50, type: "onsite" },
      { id: "m4-3", name: "オンライン戦術解説", description: "ビデオ通話で戦術理論を解説", price: 3000, duration: 50, type: "online" },
      { id: "m4-4", name: "オンラインレビュー", description: "試合動画を送ってプロの分析を受ける", price: 2500, duration: 0, type: "review" },
    ],
    venues: [
      { id: "v1", name: "PADEL HIROSHIMA 中区コート", address: "広島県広島市中区大手町1-2-3", courtFeePerHour: 2000 },
      { id: "v6", name: "パデルスタジオ広島中央", address: "広島県広島市中区紙屋町1-5-2", courtFeePerHour: 3000 },
      { id: "v3", name: "PADEL ARENA 広島南", address: "広島県広島市南区東雲2-10-5", courtFeePerHour: 2800 },
    ],
    availableSlots: [
      { time: "09:00", available: false }, { time: "10:00", available: true }, { time: "11:00", available: true },
      { time: "13:00", available: true }, { time: "14:00", available: false },
      { time: "15:00", available: true }, { time: "16:00", available: true }, { time: "17:00", available: true },
    ],
    stats: { sessions: 124, repeatRate: 80, satisfaction: 97 },
    reviews: [
      { id: "r2", name: "伊藤さやか", rating: 4, date: "2025-04-01", comment: "戦術を論理的に教えてくれるので、頭で理解してからプレーできます。" },
      { id: "r3", name: "木村拓也", rating: 5, date: "2025-03-25", comment: "試合での勝率が上がりました。ポジショニングの重要性を再認識できました。" },
    ],
  },
  "5": {
    ...COACHES[4],
    bio: "フィジカルトレーニングとパデルを組み合わせた独自のプログラムを提供。体力づくりをしながらパデルの技術も同時に向上させます。",
    experience: "フィットネス指導歴5年・パデル指導歴3年",
    location: "広島県広島市西区",
    certifications: ["JPA公認A級", "NSCA-CPT", "健康運動指導士"],
    lessonMenus: [
      { id: "m5-1", name: "パデル×フィットネス", description: "体力強化しながらパデル技術も向上", price: 3800, duration: 50, type: "onsite" },
      { id: "m5-2", name: "フィジカルトレーニング", description: "パデルに特化した体幹・持久力トレーニング", price: 4500, duration: 50, type: "onsite" },
      { id: "m5-3", name: "オンラインフィットネス", description: "自宅でできるパデル向け体力メニュー", price: 2500, duration: 50, type: "online" },
      { id: "m5-4", name: "オンラインレビュー", description: "トレーニング動画を送信してフィードバック", price: 1800, duration: 0, type: "review" },
    ],
    venues: [
      { id: "v7", name: "パデルフィットネス広島西", address: "広島県広島市西区横川町2-3-1", courtFeePerHour: 2200 },
    ],
    availableSlots: [
      { time: "09:00", available: true }, { time: "10:00", available: true }, { time: "11:00", available: true },
      { time: "14:00", available: true }, { time: "15:00", available: false }, { time: "16:00", available: true },
    ],
    stats: { sessions: 67, repeatRate: 70, satisfaction: 92 },
    reviews: [
      { id: "r2", name: "斉藤健", rating: 4, date: "2025-03-20", comment: "運動不足解消に最適。楽しく続けられます。" },
    ],
  },
  "6": {
    ...COACHES[5],
    bio: "国際大会での豊富な経験を活かし、データに基づいた戦術指導を行います。試合映像の分析やメンタルトレーニングも含めた包括的なコーチングです。",
    experience: "国際大会出場経験・指導歴15年",
    location: "広島県広島市中区",
    certifications: ["JPA公認S級", "国際パデル連盟認定", "スポーツ心理カウンセラー"],
    lessonMenus: [
      { id: "m6-1", name: "プレミアムコーチング", description: "国際レベルの戦術指導・完全マンツーマン", price: 7000, duration: 50, type: "onsite" },
      { id: "m6-2", name: "試合形式トレーニング", description: "実践形式で試合感を磨く", price: 8000, duration: 50, type: "onsite" },
      { id: "m6-3", name: "オンライン映像分析", description: "試合映像をオンラインで徹底分析", price: 5000, duration: 50, type: "online" },
      { id: "m6-4", name: "オンラインレビュー", description: "プレー動画を送信してプロが徹底分析", price: 3500, duration: 0, type: "review" },
    ],
    venues: [
      { id: "v1", name: "PADEL HIROSHIMA 中区コート", address: "広島県広島市中区大手町1-2-3", courtFeePerHour: 2000 },
      { id: "v3", name: "PADEL ARENA 広島南", address: "広島県広島市南区東雲2-10-5", courtFeePerHour: 2800 },
    ],
    availableSlots: [
      { time: "10:00", available: false }, { time: "11:00", available: false }, { time: "13:00", available: false },
      { time: "14:00", available: true }, { time: "15:00", available: true },
    ],
    stats: { sessions: 312, repeatRate: 88, satisfaction: 99 },
    reviews: [
      { id: "r2", name: "森田沙織", rating: 5, date: "2025-04-05", comment: "映像分析が非常に参考になります。自分では気づかない癖を指摘してもらえました。" },
      { id: "r3", name: "岡田拓真", rating: 5, date: "2025-03-28", comment: "メンタル面のアドバイスも的確。大会で緊張しなくなりました。" },
    ],
  },
  "7": {
    ...COACHES[6],
    bio: "パデルを楽しむことを第一に、リラックスした雰囲気でレッスンを行います。運動が苦手な方やシニアの方も歓迎です。",
    experience: "レクリエーション指導歴4年",
    location: "広島県東広島市",
    certifications: ["JPA公認B級", "レクリエーション指導者"],
    lessonMenus: [
      { id: "m7-1", name: "楽しむパデル", description: "初めての方も気軽に楽しめるレッスン", price: 3000, duration: 50, type: "onsite" },
      { id: "m7-2", name: "シニア向けレッスン", description: "無理のないペースで楽しく運動", price: 2800, duration: 50, type: "onsite" },
    ],
    venues: [
      { id: "v8", name: "東広島パデルガーデン", address: "広島県東広島市西条町7-15", courtFeePerHour: 1800 },
    ],
    availableSlots: [
      { time: "09:00", available: true }, { time: "10:00", available: true }, { time: "11:00", available: true },
      { time: "13:00", available: true }, { time: "14:00", available: true },
      { time: "15:00", available: true }, { time: "16:00", available: true },
    ],
    stats: { sessions: 45, repeatRate: 65, satisfaction: 90 },
    reviews: [
      { id: "r2", name: "原田昌弘", rating: 4, date: "2025-03-15", comment: "気軽にパデルを楽しめる雰囲気が良いです。" },
    ],
  },
  "8": {
    ...COACHES[7],
    bio: "ジュニア選手の育成に情熱を注いでいます。正しいフォームを身につけることで、将来の怪我予防と技術向上を両立させます。",
    experience: "ジュニア育成指導歴9年",
    location: "広島県広島市安佐南区",
    certifications: ["JPA公認A級", "ジュニアスポーツ指導員", "スポーツ栄養アドバイザー"],
    lessonMenus: [
      { id: "m8-1", name: "ジュニア育成コース", description: "正しいフォームと基礎技術を徹底指導", price: 4200, duration: 50, type: "onsite" },
      { id: "m8-2", name: "フォーム矯正", description: "一人ひとりの癖に合わせたフォーム改善", price: 4800, duration: 50, type: "onsite" },
      { id: "m8-3", name: "オンラインレビュー", description: "ジュニア選手のフォーム動画を分析してアドバイス", price: 2200, duration: 0, type: "review" },
    ],
    venues: [
      { id: "v9", name: "パデルアカデミー安佐南", address: "広島県広島市安佐南区中筋3-2-8", courtFeePerHour: 2400 },
      { id: "v4", name: "パデルクラブ北広島", address: "広島県北広島市中央3-8-1", courtFeePerHour: 2500 },
    ],
    availableSlots: [
      { time: "09:00", available: false }, { time: "10:00", available: true }, { time: "11:00", available: true },
      { time: "14:00", available: true }, { time: "15:00", available: true }, { time: "16:00", available: false },
    ],
    stats: { sessions: 98, repeatRate: 76, satisfaction: 95 },
    reviews: [
      { id: "r2", name: "藤井由美", rating: 5, date: "2025-04-03", comment: "子どもへの声掛けが素晴らしい。モチベーションを上手に引き出してくれます。" },
      { id: "r3", name: "三浦拓也", rating: 4, date: "2025-03-22", comment: "基礎を大切にしたレッスンで安心して子どもを任せられます。" },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────

/** Map coach name → coach ID */
const _nameToId = new Map<string, string>();
COACHES.forEach((c) => {
  _nameToId.set(c.name, c.id);
  // Also support space-separated names
  const spaced = c.name.replace(/^(.{2})/, "$1 ");
  if (spaced !== c.name) _nameToId.set(spaced, c.id);
});

export const getCoachIdByName = (name: string): string | undefined => _nameToId.get(name);

export const getCoachAvatar = (name: string): string | undefined => {
  const id = _nameToId.get(name);
  if (!id) return undefined;
  const coach = COACHES.find((c) => c.id === id);
  return coach?.avatar;
};

export const getCoachById = (id: string): CoachDetail | undefined => COACHES_DETAIL[id];
export const getCoachSummaryById = (id: string): CoachSummary | undefined => COACHES.find((c) => c.id === id);
