import { useMemo } from "react";

import campaignSpring from "@/assets/campaign-spring.webp";
import campaignSummer from "@/assets/campaign-summer.webp";
import campaignTournament from "@/assets/campaign-tournament.webp";

import {
  CAMPAIGN_PLACEHOLDER_IMAGE,
  useAdminCampaigns,
  type CampaignRecord,
} from "../adminCampaignsStore";
import {
  useLstCampaigns,
  type LstCampaignRecord,
} from "../adminLstCampaignsStore";

/**
 * UserApp 表示用に揃えた Campaign 形（CampaignDetail + CampaignCarousel 両用）
 */
export interface UserVisibleCampaign {
  id: string; // "1"..."6" (hard-coded) or "CP-XXX" / "LCP-XXX" (admin)
  image: string;
  title: string;
  subtitle: string;
  discount: string;
  dateLabel: string;
  location?: string;
  body: string;
  ctaLabel?: string;
  ctaLink?: string;
}

/** App 側 hard-coded baseline（既存 CampaignDetail.tsx の seed と一致）。
 *  admin record が無い場合、これがユーザーに表示される baseline。 */
export const HARDCODED_USER_CAMPAIGNS: UserVisibleCampaign[] = [
  {
    id: "1",
    image: campaignSpring,
    title: "春のキャンペーン開催中",
    subtitle: "初回予約で",
    discount: "10%OFF",
    dateLabel: "2026/03/01 〜 2026/04/30",
    body: "PADEL BASEでは、春の新規入会キャンペーンを実施中です！\n\n■ キャンペーン内容\n期間中に初回予約をされた方全員に、10%OFFクーポンをプレゼントいたします。\n\n■ 対象期間\n2026年3月1日〜4月30日\n\n■ 条件\n・期間中に初回のコート予約を完了すること\n・クーポンは予約完了後、自動的に付与されます\n\nこの機会にぜひPADEL BASEをお試しください！",
    ctaLabel: "コートを予約する",
    ctaLink: "/search",
  },
  {
    id: "2",
    image: campaignTournament,
    title: "パデル大会",
    subtitle: "チームで戦おう！ランキングに挑戦",
    discount: "",
    dateLabel: "2026/05/03（土）〜 開催中",
    body: "チームで戦おう！ランキングに挑戦しましょう。\n\n毎週開催されるパデル大会に参加して、ポイントを貯めてランキング上位を目指しましょう。\n\n■ 参加方法\nゲーム・大会ページからエントリーできます。\n\n■ ランキング\n累積ポイントでランキングが決まります。上位入賞者には豪華賞品あり！",
    ctaLabel: "大会ページへ",
    ctaLink: "/game",
  },
  {
    id: "3",
    image: campaignSummer,
    title: "夏季トーナメント",
    subtitle: "参加者募集中",
    discount: "エントリー受付中",
    dateLabel: "2026/07/01 〜 2026/08/31",
    body: "夏の大型トーナメントの参加者を募集中です！\n\n■ 大会概要\n・期間: 2026年7月〜8月の毎週土曜日\n・形式: ダブルス（2名1組）\n・会場: 各提携パデルコート\n\n■ エントリー受付中\nゲーム・大会ページからお申し込みください。\n\n■ 賞品\n総合優勝ペアには¥30,000分のポイントを進呈！",
    ctaLabel: "エントリーする",
    ctaLink: "/game",
  },
  {
    id: "4",
    image: campaignSpring,
    title: "友達紹介キャンペーン",
    subtitle: "招待で",
    discount: "500pt",
    dateLabel: "2026/04/01 〜 2026/05/31",
    body: "お友達をPADEL BASEに招待して、お互いにポイントをもらおう！\n\n■ キャンペーン内容\n招待した方・された方の両方に500ポイントをプレゼント！\n\n■ 参加方法\n1. マイページの「友達を招待」から招待リンクを取得\n2. お友達にリンクを共有\n3. お友達が会員登録を完了\n4. 両者にポイントが自動付与されます\n\n■ 注意事項\n・紹介人数の上限はありません\n・ポイントは登録完了後、即時付与されます\n・ポイントの有効期限は付与日から1年間です",
  },
  {
    id: "5",
    image: campaignSummer,
    title: "夏のナイター割引",
    subtitle: "18時以降の予約で",
    discount: "15%OFF",
    dateLabel: "2026/06/01 〜 2026/08/31",
    body: "夏の夜を楽しもう！ナイター割引キャンペーン実施中！\n\n■ キャンペーン内容\n18時以降のコート予約が15%OFF！\n\n■ 対象期間\n2026年6月1日〜8月31日\n\n■ 対象時間帯\n18:00〜22:00の予約\n\n■ 割引方法\n対象時間帯の予約時に自動適用されます。クーポンコードの入力は不要です。\n\n涼しい夜にパデルを楽しみましょう！",
    ctaLabel: "コートを予約する",
    ctaLink: "/search",
  },
  {
    id: "6",
    image: campaignTournament,
    title: "ビギナーズカップ 2026",
    subtitle: "初心者限定",
    discount: "参加無料",
    dateLabel: "2026/06/21（土）09:00〜17:00",
    location: "パデルコート広島 コートA・B",
    body: "初心者限定の大会を開催します！\n\n■ 参加資格\n・パデル歴1年未満の方\n・PADEL BASE会員であること\n\n■ 大会形式\n・ダブルス（2名1組）\n・予選リーグ + 決勝トーナメント\n\n■ 参加費\n無料！\n\n■ 賞品\n・優勝ペア: ¥5,000分のポイント\n・準優勝ペア: ¥3,000分のポイント\n\n初心者の方でも気軽に参加できる大会です。ぜひチャレンジしてください！",
    ctaLabel: "大会ページへ",
    ctaLink: "/game",
  },
];

const formatDateLabel = (start: string, end: string): string => {
  const fmt = (d: string): string => d.replace(/-/g, "/");
  return `${fmt(start)} 〜 ${fmt(end)}`;
};

const deriveDiscountLabel = (
  c: Pick<CampaignRecord, "discountPercent" | "discountAmount" | "subtitle">,
): string => {
  if (c.discountPercent !== undefined) return `${c.discountPercent}%OFF`;
  if (c.discountAmount !== undefined) return `¥${c.discountAmount.toLocaleString("ja-JP")} OFF`;
  return "";
};

const adminToUserCampaign = (c: CampaignRecord): UserVisibleCampaign => ({
  id: c.id,
  image: c.imageUrl ?? CAMPAIGN_PLACEHOLDER_IMAGE,
  title: c.title,
  subtitle: c.subtitle ?? c.description ?? "",
  discount: deriveDiscountLabel(c),
  dateLabel: formatDateLabel(c.startDate, c.endDate),
  location: c.location,
  body: c.body ?? c.description ?? "",
  ctaLabel: c.ctaLabel,
  ctaLink: c.ctaLink,
});

const lstToUserCampaign = (c: LstCampaignRecord): UserVisibleCampaign => ({
  id: c.id,
  image: c.imageUrl ?? CAMPAIGN_PLACEHOLDER_IMAGE,
  title: c.title,
  subtitle: c.subtitle ?? c.description ?? "",
  discount: deriveDiscountLabel(c),
  dateLabel: formatDateLabel(c.startDate, c.endDate),
  location: c.location,
  body: c.body ?? c.description ?? "",
  ctaLabel: c.ctaLabel,
  ctaLink: c.ctaLink,
});

/**
 * UserApp 用統合 Campaign hook。
 * - hard-coded baseline + 店舗 admin published（status=active）+ LST admin
 *   published（status=active）をマージ
 * - 同 id がある場合は admin が勝つ（hard-coded は ID 1-6、admin は CP-XXX /
 *   LCP-XXX で namespace が異なるため通常衝突しないが、念のため）
 */
export const useUserCampaigns = (): UserVisibleCampaign[] => {
  const adminStore = useAdminCampaigns();
  const lstStore = useLstCampaigns();

  return useMemo(() => {
    const merged = new Map<string, UserVisibleCampaign>();
    // 1. hard-coded baseline first（admin に上書きされる優先順）
    for (const c of HARDCODED_USER_CAMPAIGNS) merged.set(c.id, c);
    // 2. 店舗 admin: status=active のみ
    for (const c of adminStore) {
      if (c.status !== "active") continue;
      merged.set(c.id, adminToUserCampaign(c));
    }
    // 3. LST admin: status=active のみ
    for (const c of lstStore) {
      if (c.status !== "active") continue;
      merged.set(c.id, lstToUserCampaign(c));
    }
    return Array.from(merged.values());
  }, [adminStore, lstStore]);
};

/** 単一 id 取得（CampaignDetail.tsx 用）。 */
export const useUserCampaign = (id: string | undefined): UserVisibleCampaign | undefined => {
  const list = useUserCampaigns();
  if (!id) return undefined;
  return list.find((c) => c.id === id);
};
