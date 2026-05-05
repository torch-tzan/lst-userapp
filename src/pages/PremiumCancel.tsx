import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription } from "@/lib/subscriptionStore";
import { AlertCircle } from "lucide-react";
import { formatJP } from "@/lib/utils";

const REASONS = [
  "利用頻度が少なくなった",
  "料金が高いと感じた",
  "特典に魅力を感じない",
  "他のサービスを利用するため",
  "アプリの使い勝手が悪い",
  "その他",
];

const PremiumCancel = () => {
  const navigate = useNavigate();
  const { nextRenewAt, cancelPremium } = useSubscription();
  const [reasons, setReasons] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const toggle = (r: string) => {
    const next = new Set(reasons);
    next.has(r) ? next.delete(r) : next.add(r);
    setReasons(next);
  };

  const submit = () => {
    if (!confirmed) return;
    const reasonText = [...reasons].join(", ") + (comment ? ` | ${comment}` : "");
    cancelPremium(reasonText);
    navigate("/mypage");
  };

  return (
    <InnerPageLayout title="解約の最終確認">
      <div className="bg-destructive/5 border border-destructive/30 rounded-[8px] p-3 flex gap-2 mb-6">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-destructive">解約後について</p>
          <p className="text-[11px] text-foreground mt-1 leading-relaxed">
            {formatJP(nextRenewAt)}まで特典をご利用いただけます。
            <br />
            翌日以降、自動的に一般会員になります。
            <br />
            残ポイントはそのままご利用可能です。
          </p>
        </div>
      </div>

      <p className="text-sm font-bold text-foreground">解約理由をお聞かせください</p>
      <p className="text-[11px] text-muted-foreground mt-1 mb-3">
        サービス改善のため、ぜひご協力ください（任意）
      </p>
      <div className="space-y-2 mb-4">
        {REASONS.map((r) => {
          const checked = reasons.has(r);
          return (
            <label
              key={r}
              className={`flex items-center gap-2 px-3 py-3 border rounded-[8px] cursor-pointer ${
                checked ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(r)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">{r}</span>
            </label>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="ご意見・ご要望（任意）&#10;サービス改善の参考にさせていただきます。&#10;よろしければご記入ください。"
        className="w-full min-h-[100px] bg-card border border-border rounded-[8px] p-3 text-xs text-foreground mb-4 resize-none"
      />

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <span className="text-xs text-foreground">解約に関する注意事項を確認しました</span>
      </label>

      <button
        onClick={submit}
        disabled={!confirmed}
        className="w-full h-12 rounded-[8px] bg-destructive text-destructive-foreground font-bold disabled:opacity-40 mb-2"
      >
        解約を確定する
      </button>
      <button
        onClick={() => navigate(-1)}
        className="w-full h-12 rounded-[8px] border border-border bg-background text-foreground font-bold"
      >
        キャンセルして戻る
      </button>
    </InnerPageLayout>
  );
};

export default PremiumCancel;
