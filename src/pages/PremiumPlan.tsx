import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Diamond, AlertCircle } from "lucide-react";

const BENEFITS = [
  {
    title: "ポイント還元率アップ",
    desc: "100円ごとに 3pt → 5pt（約1.7倍）\n予約・コーチング・ゲーム全てに適用",
  },
  {
    title: "コーチ動画レビュー無料",
    desc: "月1回、専用クーポンを自動配布",
  },
  {
    title: "ゲーム参加でボーナスポイント",
    desc: "月例大会の参加・勝利で追加ポイント",
  },
];

const PremiumPlan = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <InnerPageLayout
      title="プレミアムプラン"
      ctaLabel="プレミアムをはじめる"
      ctaDisabled={!agreed}
      onCtaClick={() => navigate("/premium/payment-confirm")}
    >
      {/* Hero */}
      <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5 mb-6">
        <Diamond className="w-6 h-6 text-primary mb-2" />
        <p className="text-sm opacity-80">もっと楽しく、もっとお得に。</p>
        <p className="text-2xl font-bold mt-1">プレミアム会員</p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-bold text-primary">¥500</span>
          <span className="text-sm opacity-80">/ 月（税込）</span>
        </div>
        <p className="text-xs opacity-70 mt-2">いつでも解約可能</p>
      </div>

      <p className="text-sm font-bold text-foreground mb-3">プレミアム特典</p>
      <div className="space-y-3 mb-6">
        {BENEFITS.map((b, i) => (
          <div key={i} className="bg-card border border-border rounded-[8px] p-4 flex gap-3">
            <Diamond className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">{b.title}</p>
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-accent-yellow flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground">自動更新について</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            毎月同日に自動更新されます。マイページからいつでも解約可能です。
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-5 h-5 accent-primary"
        />
        <span className="text-xs text-foreground">利用規約・プライバシーポリシーに同意する</span>
      </label>
      <p className="text-[10px] text-muted-foreground text-center mb-2">
        タップすると利用規約に同意したものとみなします
      </p>
    </InnerPageLayout>
  );
};

export default PremiumPlan;
