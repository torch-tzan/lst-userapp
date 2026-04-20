import { useParams, useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin } from "lucide-react";
import campaignSpring from "@/assets/campaign-spring.webp";
import campaignSummer from "@/assets/campaign-summer.webp";
import campaignTournament from "@/assets/campaign-tournament.webp";

interface CampaignDetailData {
  id: string;
  image: string;
  title: string;
  dateLabel: string;
  location?: string;
  body: string;
  ctaLabel?: string;
  ctaLink?: string;
}

const CAMPAIGN_DETAILS: Record<string, CampaignDetailData> = {
  "1": {
    id: "1",
    image: campaignSpring,
    title: "春のキャンペーン開催中",
    dateLabel: "2026/03/01 〜 2026/04/30",
    body: "PADEL BASEでは、春の新規入会キャンペーンを実施中です！\n\n■ キャンペーン内容\n期間中に初回予約をされた方全員に、10%OFFクーポンをプレゼントいたします。\n\n■ 対象期間\n2026年3月1日〜4月30日\n\n■ 条件\n・期間中に初回のコート予約を完了すること\n・クーポンは予約完了後、自動的に付与されます\n\nこの機会にぜひPADEL BASEをお試しください！",
    ctaLabel: "コートを予約する",
    ctaLink: "/search",
  },
  "2": {
    id: "2",
    image: campaignTournament,
    title: "パデル大会",
    dateLabel: "2026/05/03（土）〜 開催中",
    body: "チームで戦おう！ランキングに挑戦しましょう。\n\n毎週開催されるパデル大会に参加して、ポイントを貯めてランキング上位を目指しましょう。\n\n■ 参加方法\nゲーム・大会ページからエントリーできます。\n\n■ ランキング\n累積ポイントでランキングが決まります。上位入賞者には豪華賞品あり！",
    ctaLabel: "大会ページへ",
    ctaLink: "/game",
  },
  "3": {
    id: "3",
    image: campaignSummer,
    title: "夏季トーナメント",
    dateLabel: "2026/07/01 〜 2026/08/31",
    body: "夏の大型トーナメントの参加者を募集中です！\n\n■ 大会概要\n・期間: 2026年7月〜8月の毎週土曜日\n・形式: ダブルス（2名1組）\n・会場: 各提携パデルコート\n\n■ エントリー受付中\nゲーム・大会ページからお申し込みください。\n\n■ 賞品\n総合優勝ペアには¥30,000分のポイントを進呈！",
    ctaLabel: "エントリーする",
    ctaLink: "/game",
  },
  "4": {
    id: "4",
    image: campaignSpring,
    title: "友達紹介キャンペーン",
    dateLabel: "2026/04/01 〜 2026/05/31",
    body: "お友達をPADEL BASEに招待して、お互いにポイントをもらおう！\n\n■ キャンペーン内容\n招待した方・された方の両方に500ポイントをプレゼント！\n\n■ 参加方法\n1. マイページの「友達を招待」から招待リンクを取得\n2. お友達にリンクを共有\n3. お友達が会員登録を完了\n4. 両者にポイントが自動付与されます\n\n■ 注意事項\n・紹介人数の上限はありません\n・ポイントは登録完了後、即時付与されます\n・ポイントの有効期限は付与日から1年間です",
  },
  "5": {
    id: "5",
    image: campaignSummer,
    title: "夏のナイター割引",
    dateLabel: "2026/06/01 〜 2026/08/31",
    body: "夏の夜を楽しもう！ナイター割引キャンペーン実施中！\n\n■ キャンペーン内容\n18時以降のコート予約が15%OFF！\n\n■ 対象期間\n2026年6月1日〜8月31日\n\n■ 対象時間帯\n18:00〜22:00の予約\n\n■ 割引方法\n対象時間帯の予約時に自動適用されます。クーポンコードの入力は不要です。\n\n涼しい夜にパデルを楽しみましょう！",
    ctaLabel: "コートを予約する",
    ctaLink: "/search",
  },
  "6": {
    id: "6",
    image: campaignTournament,
    title: "ビギナーズカップ 2026",
    dateLabel: "2026/06/21（土）09:00〜17:00",
    location: "パデルコート広島 コートA・B",
    body: "初心者限定の大会を開催します！\n\n■ 参加資格\n・パデル歴1年未満の方\n・PADEL BASE会員であること\n\n■ 大会形式\n・ダブルス（2名1組）\n・予選リーグ + 決勝トーナメント\n\n■ 参加費\n無料！\n\n■ 賞品\n・優勝ペア: ¥5,000分のポイント\n・準優勝ペア: ¥3,000分のポイント\n\n初心者の方でも気軽に参加できる大会です。ぜひチャレンジしてください！",
    ctaLabel: "大会ページへ",
    ctaLink: "/game",
  },
};

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaign = CAMPAIGN_DETAILS[id || ""];

  if (!campaign) {
    return (
      <InnerPageLayout title="キャンペーン詳細">
        <div className="flex items-center justify-center pt-20">
          <p className="text-sm text-muted-foreground">キャンペーンが見つかりません</p>
        </div>
      </InnerPageLayout>
    );
  }

  return (
    <InnerPageLayout
      title="キャンペーン詳細"
      ctaLabel={campaign.ctaLabel}
      onCtaClick={campaign.ctaLink ? () => navigate(campaign.ctaLink!, { state: campaign.ctaLink === "/search" ? { area: "広島市中区" } : undefined }) : undefined}
    >
      <div className="space-y-5 -mx-[20px] -mt-6">
        {/* Hero image */}
        <div className="relative">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-48 object-cover"
          />
        </div>

        <div className="px-[20px] space-y-4">
          {/* Title */}
          <h2 className="text-lg font-bold text-foreground leading-snug">{campaign.title}</h2>

          {/* Meta info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground">{campaign.dateLabel}</span>
            </div>
            {campaign.location && (
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground">{campaign.location}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Body */}
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {campaign.body}
          </div>
        </div>
      </div>
    </InnerPageLayout>
  );
};

export default CampaignDetail;
