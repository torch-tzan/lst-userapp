import { useNavigate, useLocation } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { CreditCard, ChevronRight } from "lucide-react";
import paypayIcon from "@/assets/paypay-icon.webp";

interface PaymentState {
  total: number;
  [key: string]: unknown;
}

const METHODS = [
  {
    id: "credit_card",
    label: "クレジットカード",
    sub: "Visa / Mastercard / JCB / AMEX",
    icon: CreditCard,
    route: "/booking/payment/card",
  },
  {
    id: "paypay",
    label: "PayPay",
    sub: "PayPay残高から支払い",
    iconImg: paypayIcon,
    route: null, // mock — go straight to complete
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    sub: "Face ID / Touch IDで簡単決済",
    iconComponent: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
    route: null,
  },
];

const PaymentMethod = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as PaymentState;

  const handleSelect = (method: typeof METHODS[0]) => {
    if (method.route) {
      navigate(method.route, { state });
    } else {
      // Mock: go directly to complete for PayPay / Apple Pay
      navigate("/booking/complete");
    }
  };

  return (
    <InnerPageLayout
      title="お支払い方法"
      onBack={() => navigate(-1)}
    >
      <div className="space-y-4">
        {/* Amount display */}
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-foreground">¥{(state.total || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">お支払い金額</p>
        </div>

        <p className="text-sm text-muted-foreground">
          お支払い方法を選択してください
        </p>

        <div className="space-y-3">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              className="w-full flex items-center gap-4 bg-card rounded-[8px] border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {m.icon ? (
                  <m.icon className="w-5 h-5 text-foreground" />
                ) : m.iconImg ? (
                  <img src={m.iconImg} alt={m.label} loading="lazy" className="w-6 h-6 object-contain" />
                ) : m.iconComponent ? (
                  <m.iconComponent />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </InnerPageLayout>
  );
};

export default PaymentMethod;
