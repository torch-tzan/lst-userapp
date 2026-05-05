import { useNavigate } from "react-router-dom";
import PhoneMockup from "@/components/PhoneMockup";
import { useSubscription } from "@/lib/subscriptionStore";
import { useUserProfile } from "@/lib/userProfileStore";
import { Check, Diamond } from "lucide-react";
import { formatJP } from "@/lib/utils";

const PremiumWelcome = () => {
  const navigate = useNavigate();
  const { nextRenewAt } = useSubscription();
  const { profile } = useUserProfile();

  return (
    <PhoneMockup>
      <div className="flex flex-col h-full bg-gray-5 text-primary-foreground p-6">
        <div className="flex-1 flex flex-col items-center justify-start pt-12">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-primary/40" />
            <div className="absolute inset-4 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-10 h-10 text-primary-foreground" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center">
            ようこそ、<br />
            <span className="text-primary">プレミアム会員へ。</span>
          </h1>
          <p className="text-sm opacity-80 mt-3 text-center">
            特典が今すぐご利用いただけます。
          </p>

          <div className="w-full bg-white/10 rounded-[8px] p-4 mt-10">
            <div className="flex items-center gap-3 mb-3">
              <Diamond className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm font-bold">プレミアム会員</p>
                <p className="text-[11px] opacity-70">{profile.name} 様</p>
              </div>
            </div>
            <div className="border-t border-white/20 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="opacity-70">次回更新日</span>
                <span>{formatJP(nextRenewAt)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-70">月額</span>
                <span className="text-primary font-bold">¥500（税込）</span>
              </div>
            </div>
          </div>

          <p className="text-sm font-bold mt-8 mb-3">獲得した特典</p>
          <div className="w-full space-y-2">
            <div className="bg-white/10 rounded-[8px] p-3 flex gap-3">
              <Diamond className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">ポイント還元 5pt / 100円</p>
                <p className="text-[11px] opacity-70 mt-0.5">本日の予約から適用されます</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-[8px] p-3 flex gap-3">
              <Diamond className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">無料レビュークーポン × 1枚</p>
                <p className="text-[11px] opacity-70 mt-0.5">クーポン一覧に追加されました</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/mypage")}
          className="w-full h-14 rounded-[8px] bg-primary text-primary-foreground font-bold mt-8"
        >
          ホームに戻る
        </button>
      </div>
    </PhoneMockup>
  );
};

export default PremiumWelcome;
