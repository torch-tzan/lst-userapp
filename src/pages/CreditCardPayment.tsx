import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { CreditCard, Lock } from "lucide-react";

interface PaymentState {
  total: number;
  [key: string]: unknown;
}

const CreditCardPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as PaymentState;
  const total = state.total || 0;

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const isValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvc.length >= 3 &&
    name.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    setProcessing(true);
    setTimeout(() => {
      navigate("/booking/complete");
    }, 1500);
  };

  const cardBrand = (() => {
    const num = cardNumber.replace(/\s/g, "");
    if (num.startsWith("4")) return "Visa";
    if (num.startsWith("5")) return "Mastercard";
    if (num.startsWith("35")) return "JCB";
    if (num.startsWith("3") && !num.startsWith("35")) return "AMEX";
    return null;
  })();

  return (
    <InnerPageLayout
      title="カード情報入力"
      onBack={() => navigate(-1)}
      ctaLabel={processing ? "処理中..." : `¥${total.toLocaleString()} を支払う`}
      ctaDisabled={!isValid || processing}
      onCtaClick={handleSubmit}
    >
      <div className="space-y-6">
        {/* Card preview */}
        <div className="relative bg-gradient-to-br from-foreground/90 to-foreground/70 rounded-[12px] p-5 text-primary-foreground aspect-[1.6/1] max-h-[180px] flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <CreditCard className="w-8 h-8 opacity-60" />
            {cardBrand && (
              <span className="text-xs font-bold opacity-80 bg-primary-foreground/20 px-2 py-0.5 rounded">
                {cardBrand}
              </span>
            )}
          </div>
          <div>
            <p className="text-base tracking-[0.2em] font-mono opacity-90">
              {cardNumber || "•••• •••• •••• ••••"}
            </p>
            <div className="flex justify-between mt-2">
              <span className="text-xs opacity-70 uppercase">{name || "YOUR NAME"}</span>
              <span className="text-xs opacity-70">{expiry || "MM/YY"}</span>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">カード番号</label>
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              className="w-full h-12 px-4 text-sm rounded-[8px] border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">有効期限</label>
              <input
                type="text"
                inputMode="numeric"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className="w-full h-12 px-4 text-sm rounded-[8px] border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">セキュリティコード</label>
              <input
                type="text"
                inputMode="numeric"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                className="w-full h-12 px-4 text-sm rounded-[8px] border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">カード名義人</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="TARO YAMADA"
              className="w-full h-12 px-4 text-sm rounded-[8px] border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors uppercase"
            />
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 justify-center pt-2">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">SSL暗号化通信で安全に処理されます</span>
        </div>

        {/* Total */}
        <div className="bg-card rounded-[8px] border border-border p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">お支払い金額</span>
            <span className="text-lg font-bold text-foreground">¥{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </InnerPageLayout>
  );
};

export default CreditCardPayment;
