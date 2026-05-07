import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import type { SkillLevel } from "@/lib/tournamentStore";
import { Trophy, Award, Star } from "lucide-react";

const LEVELS: {
  value: SkillLevel;
  label: string;
  description: string;
  icon: typeof Star;
  color: string;
  rating: number;
}[] = [
  {
    value: "beginner",
    label: "初心者",
    description: "ラケットを握ったばかり / ラリーが続きにくい段階",
    icon: Star,
    color: "text-amber-700",
    rating: 1400,
  },
  {
    value: "intermediate",
    label: "中級",
    description: "ラリーが続く / 試合経験がある",
    icon: Award,
    color: "text-gray-500",
    rating: 1600,
  },
  {
    value: "advanced",
    label: "上級",
    description: "競技志向 / 大会で上位を狙えるレベル",
    icon: Trophy,
    color: "text-yellow-600",
    rating: 1800,
  },
];

const SignupLevel = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SkillLevel | null>(null);

  const submit = () => {
    if (!selected) return;
    // For demo: just navigate to complete. In production, save to backend.
    navigate("/signup/complete");
  };

  return (
    <InnerPageLayout
      title="レベル選択"
      ctaLabel="次へ"
      ctaDisabled={!selected}
      onCtaClick={submit}
    >
      <div className="mb-5">
        <p className="text-base font-bold text-foreground mb-2">
          あなたのレベルを選択してください
        </p>
        <p className="text-[11px] text-muted-foreground">
          選択したレベルにより初期レーティングが決まります。後から変更はできませんので、現在の実力に近いものを選んでください。
        </p>
      </div>

      <div className="space-y-3">
        {LEVELS.map((lvl) => {
          const Icon = lvl.icon;
          const isSelected = selected === lvl.value;
          return (
            <button
              key={lvl.value}
              onClick={() => setSelected(lvl.value)}
              className={`w-full text-left p-4 rounded-[8px] border-2 transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${lvl.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-foreground">{lvl.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    初期レート {lvl.rating}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                )}
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {lvl.description}
              </p>
            </button>
          );
        })}
      </div>
    </InnerPageLayout>
  );
};

export default SignupLevel;
