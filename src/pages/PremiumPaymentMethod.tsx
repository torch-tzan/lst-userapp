import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription, type PaymentMethod } from "@/lib/subscriptionStore";
import { CreditCard, Smartphone, Apple, ChevronRight } from "lucide-react";

const PremiumPaymentMethod = () => {
  const navigate = useNavigate();
  const { updatePaymentMethod } = useSubscription();

  const choose = (method: PaymentMethod) => {
    updatePaymentMethod(method);
    navigate(-1);
  };

  const Row = ({
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
    <InnerPageLayout title="お支払い方法の変更">
      <p className="text-xs text-muted-foreground mb-3">お支払い方法を選択してください</p>
      <div className="space-y-2.5">
        <Row
          icon={CreditCard}
          iconBg="bg-muted"
          iconColor="text-foreground"
          title="クレジットカード"
          sub="Visa / Mastercard / JCB / AMEX"
          onClick={() => choose({ type: "cc", brand: "Mastercard", last4: "3456" })}
        />
        <Row
          icon={Smartphone}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          title="PayPay"
          sub="PayPay残高から支払い"
          onClick={() => choose({ type: "paypay" })}
        />
        <Row
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

export default PremiumPaymentMethod;
