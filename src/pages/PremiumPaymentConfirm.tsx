import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription, type PaymentMethod } from "@/lib/subscriptionStore";
import { CreditCard, Smartphone, Apple, ChevronRight } from "lucide-react";

const PremiumPaymentConfirm = () => {
  const navigate = useNavigate();
  const { subscribePremium } = useSubscription();

  const choose = (method: PaymentMethod) => {
    subscribePremium(method);
    navigate("/premium/welcome");
  };

  const PaymentRow = ({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    sub,
    onClick,
  }: {
    icon: typeof CreditCard;
    iconBg: string;
    iconColor: string;
    title: string;
    sub: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-[8px] p-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
    >
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );

  return (
    <InnerPageLayout title="ご注文内容の確認">
      <div className="bg-card border border-border rounded-[8px] p-4 mb-6">
        <p className="text-sm font-bold text-foreground">ご注文内容</p>
        <p className="text-sm text-foreground mt-3">プレミアム会員プラン</p>
        <p className="text-[11px] text-muted-foreground">月額自動更新</p>

        <div className="border-t border-border mt-3 pt-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">月額料金</span>
            <span className="text-foreground">¥455</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">消費税（10%）</span>
            <span className="text-foreground">¥45</span>
          </div>
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-foreground">合計（税込）</span>
          <div>
            <span className="text-2xl font-bold text-foreground">¥500</span>
            <span className="text-sm text-muted-foreground">/ 月</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">お支払い方法を選択してください</p>
      <div className="space-y-2.5">
        <PaymentRow
          icon={CreditCard}
          iconBg="bg-muted"
          iconColor="text-foreground"
          title="クレジットカード"
          sub="Visa / Mastercard / JCB / AMEX"
          onClick={() => choose({ type: "cc", brand: "Mastercard", last4: "3456" })}
        />
        <PaymentRow
          icon={Smartphone}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          title="PayPay"
          sub="PayPay残高から支払い"
          onClick={() => choose({ type: "paypay" })}
        />
        <PaymentRow
          icon={Apple}
          iconBg="bg-muted"
          iconColor="text-foreground"
          title="Apple Pay"
          sub="Face ID / Touch IDで簡単決済"
          onClick={() => choose({ type: "apple" })}
        />
      </div>
    </InnerPageLayout>
  );
};

export default PremiumPaymentConfirm;
