import { COACHES, COACHES_DETAIL, type CoachDetail } from "@/lib/coachData";

/**
 * Admin 側のコーチ詳細用 seed data。
 *
 * user-app の CoachDetail には無い「運営管理向け」項目（電話 / メール /
 * 契約開始日 / LST 手数料率 / 当月セッション・売上 / セッション履歴 など）を
 * deterministic に算出してダミーで返す。デモ用なので毎回同じ値になるよう
 * coach.id 起点でハッシュする。
 */

export interface AdminCoachSession {
  id: string;
  datetime: string; // "2026/04/03 14:00"
  memberName: string;
  menuName: string;
  durationMin: number;
  priceYen: number;
  rating: number | null; // null = まだ評価なし
}

export interface AdminCoachProfile {
  phone: string;
  email: string;
  availabilityText: string;
  nextBookingAt: string | null;
  contractStartDate: string;
  feeRatePct: number;

  monthlySessions: number;
  monthlySessionsDeltaPct: number; // 前月比
  monthlySalesYen: number;
  monthlyFeeYen: number;
  cumulativeSalesYen: number;

  sessionHistory: AdminCoachSession[];
}

// ── ヘルパー ────────────────────────────────────────────

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const fmtDate = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

const fmtDateTime = (d: Date) =>
  `${fmtDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const fmtDateWithDow = (d: Date) =>
  `${fmtDate(d)} (${WEEKDAYS[d.getDay()]}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const fmtContractDate = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

/** 連絡先：名前ローマ字 + 連番で生成 */
const ROMAJI: Record<string, string> = {
  佐藤翔太: "sato",
  田中美咲: "tanaka",
  鈴木健太: "suzuki",
  山本大輔: "yamamoto",
  中村あかり: "nakamura",
  高橋誠一: "takahashi",
  伊藤陽介: "ito",
  松本恵理: "matsumoto",
};

const seedFor = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const SAMPLE_MEMBERS = [
  "山田太郎",
  "佐藤花子",
  "鈴木一郎",
  "高橋美咲",
  "田村大輝",
  "渡辺結衣",
  "斉藤健",
  "森田沙織",
];

// ── メイン ──────────────────────────────────────────────

export const getAdminCoachProfile = (
  detail: CoachDetail | undefined,
): AdminCoachProfile | null => {
  if (!detail) return null;

  const idx = COACHES.findIndex((c) => c.id === detail.id);
  const slug = ROMAJI[detail.name] ?? `coach${detail.id}`;
  const phoneSeed = seedFor(detail.id);
  const phone = `090-${String(1000 + (phoneSeed % 9000)).padStart(4, "0")}-${String(
    1000 + ((phoneSeed * 7) % 9000),
  ).padStart(4, "0")}`;
  const email = `${slug}@coach.lst.jp`;

  // 対応可能時間：seed に基づき曜日と時間帯を選ぶ
  const allDays = ["月", "火", "水", "木", "金", "土", "日"];
  const dayCount = 2 + (phoneSeed % 3); // 2〜4日
  const days: string[] = [];
  for (let i = 0; i < dayCount; i++) {
    const day = allDays[(phoneSeed + i * 2) % 7];
    if (!days.includes(day)) days.push(day);
  }
  const startHr = 9 + (phoneSeed % 3); // 9-11
  const endHr = 17 + (phoneSeed % 4); // 17-20
  const availabilityText = `${days.join("・")} ${String(startHr).padStart(2, "0")}:00〜${String(endHr).padStart(2, "0")}:00`;

  // 次回来店予定（demo 日時を 2026-04 周辺で生成）
  const baseDate = new Date(2026, 3, 5, 14, 0); // 2026-04-05 14:00
  const nextDate = new Date(baseDate);
  nextDate.setDate(baseDate.getDate() + (idx % 7));
  const hour = 10 + (idx * 2) % 8;
  nextDate.setHours(hour, (idx % 2) * 30, 0, 0);
  const nextBookingAt = detail.availableSlots.some((s) => s.available)
    ? fmtDateWithDow(nextDate)
    : null;

  // 契約開始日：2024〜2025 のいずれかに散らす
  const contractStart = new Date(2024, (idx + 6) % 12, 5 + (idx * 3) % 25);
  const contractStartDate = fmtContractDate(contractStart);

  // 手数料率：S 級 15%, A 級 20%, B 級 22%, default 20%
  const feeRatePct =
    detail.level === "S級"
      ? 15
      : detail.level === "B級"
        ? 22
        : detail.level === "C級"
          ? 25
          : 20;

  // 当月実績：sessions の 10〜15% を当月とする（demo）
  const monthlyRatio = 0.1 + ((phoneSeed % 5) / 100); // 0.10〜0.14
  const monthlySessions = Math.max(0, Math.round(detail.stats.sessions * monthlyRatio));
  const monthlySalesYen = monthlySessions * detail.pricePerHour;
  const monthlyFeeYen = Math.round(monthlySalesYen * (feeRatePct / 100));
  const monthlySessionsDeltaPct = ((phoneSeed % 50) - 10) + ((phoneSeed >> 3) % 10) / 10;
  const cumulativeSalesYen = detail.stats.sessions * detail.pricePerHour;

  // セッション履歴：直近 5 件（demo）
  const sessionHistory: AdminCoachSession[] = [];
  const histBase = new Date(2026, 3, 3, 14, 0);
  const menus = detail.lessonMenus.length > 0
    ? detail.lessonMenus
    : [{ id: "_", name: "レッスン", price: detail.pricePerHour, duration: 50 } as any];
  for (let i = 0; i < Math.min(5, Math.max(2, monthlySessions)); i++) {
    const d = new Date(histBase);
    d.setDate(histBase.getDate() - i * 2);
    d.setHours(10 + ((i + idx) * 2) % 8, ((i + idx) % 2) * 30, 0, 0);
    const menu = menus[(i + idx) % menus.length];
    const member = SAMPLE_MEMBERS[(i + idx) % SAMPLE_MEMBERS.length];
    const rating = i < 4 ? Math.round((4.6 + ((phoneSeed + i) % 4) / 10) * 10) / 10 : null;
    sessionHistory.push({
      id: `sess-${detail.id}-${i}`,
      datetime: fmtDateTime(d),
      memberName: member,
      menuName: menu.name,
      durationMin: menu.duration > 0 ? menu.duration : 60,
      priceYen: menu.price,
      rating,
    });
  }

  return {
    phone,
    email,
    availabilityText,
    nextBookingAt,
    contractStartDate,
    feeRatePct,
    monthlySessions,
    monthlySessionsDeltaPct,
    monthlySalesYen,
    monthlyFeeYen,
    cumulativeSalesYen,
    sessionHistory,
  };
};

/** id で直接引きたいケース用 */
export const getAdminCoachProfileById = (id: string): AdminCoachProfile | null =>
  getAdminCoachProfile(COACHES_DETAIL[id]);
