import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription } from "@/lib/subscriptionStore";
import { Diamond, Check } from "lucide-react";

const formatJP = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const PremiumManage = () => {
  const navigate = useNavigate();
  const { status, startedAt, nextRenewAt, paymentMethod, history } = useSubscription();

  const isActive = status === "active" || status === "cancelled_pending";
  const recentHistory = [...history].reverse().slice(0, 3);

  return (
    <InnerPageLayout title="プラン管理">
      {/* Current plan */}
      <div className="bg-gray-5 text-primary-foreground rounded-[12px] p-5 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Diamond className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs text-primary opacity-80">現在のプラン</p>
              <p className="text-xl font-bold mt-0.5">プレミアム会員</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {status === "cancelled_pending" ? "解約予定" : "利用中"}
          </span>
        </div>
        <div className="border-t border-white/20 mt-4 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="opacity-70">月額</span>
            <span>¥500（税込）</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="opacity-70">次回更新日</span>
            <span>{formatJP(nextRenewAt)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="opacity-70">加入日</span>
            <span>{formatJP(startedAt)}</span>
          </div>
        </div>
      </div>

      {/* This month usage */}
      <p className="text-sm font-bold text-foreground mb-2">今月の特典利用状況</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[11px] text-muted-foreground">獲得ポイント</p>
          <p className="text-xl font-bold text-foreground mt-1">+420 <span className="text-xs">pt</span></p>
          <p className="text-[10px] text-green-600 mt-0.5">通常会員より +168pt</p>
        </div>
        <div className="bg-card border border-border rounded-[8px] p-3">
          <p className="text-[11px] text-muted-foreground">使用クーポン</p>
          <p className="text-xl font-bold text-foreground mt-1">¥2,000</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">レビュー無料券 ×1 利用</p>
        </div>
      </div>
      <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex items-center gap-2 mb-6">
        <Check className="w-4 h-4 text-accent-yellow flex-shrink-0" />
        <p className="text-[11px] text-foreground">
          月会費以上の特典をご利用中です<br />¥500 → ¥2,420 相当の還元
        </p>
      </div>

      {/* Payment method */}
      <p className="text-sm font-bold text-foreground mb-2">お支払い方法</p>
      <div className="bg-card border border-border rounded-[8px] p-4 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-orange-600">{paymentMethod?.brand?.[0] ?? "?"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{paymentMethod?.brand ?? "未設定"}</p>
          <p className="text-[11px] text-muted-foreground">
            **** **** **** {paymentMethod?.last4 ?? "----"}
          </p>
        </div>
        <button
          onClick={() => navigate("/premium/payment-method")}
          className="text-xs font-bold text-primary"
        >
          変更 ›
        </button>
      </div>

      {/* Billing history (preview) */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-foreground">課金履歴</p>
        <button
          onClick={() => navigate("/premium/billing-history")}
          className="text-xs font-bold text-primary"
        >
          すべて表示 ›
        </button>
      </div>
      <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden mb-6">
        {recentHistory.map((b) => (
          <div key={b.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">{formatJP(b.paidAt)}</p>
              <p className="text-[11px] text-muted-foreground">プレミアム会員（月額）</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">¥{b.amount}</span>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">完了</span>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits checklist */}
      <p className="text-sm font-bold text-foreground mb-2">特典の確認</p>
      <div className="bg-card border border-border rounded-[8px] p-4 space-y-2 mb-6">
        {[
          { label: "ポイント還元 5pt / 100円", state: "利用中" },
          { label: "月1回 コーチレビュー無料", state: "残 1枚" },
          { label: "月例ゲーム ボーナスポイント", state: "利用中" },
          { label: "人気時間帯の優先予約枠", state: "利用中" },
        ].map((b, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs text-foreground">{b.label}</span>
            </div>
            <span className={`text-xs ${b.state === "利用中" ? "text-green-600" : "text-muted-foreground"}`}>
              {b.state}
            </span>
          </div>
        ))}
      </div>

      {/* Cancel link */}
      {isActive && status !== "cancelled_pending" && (
        <div className="text-center">
          <button
            onClick={() => navigate("/premium/cancel")}
            className="text-sm text-destructive font-bold underline"
          >
            プレミアムを解約する
          </button>
          <p className="text-[10px] text-muted-foreground mt-1">
            解約しても、{formatJP(nextRenewAt)}までは特典をご利用いただけます
          </p>
        </div>
      )}
    </InnerPageLayout>
  );
};

export default PremiumManage;
