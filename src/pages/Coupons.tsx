import { useState } from "react";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Ticket, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { AVAILABLE_COUPONS } from "@/lib/couponStore";

const formatDate = (d: string) => d.replace(/-/g, "/");

const Coupons = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success("クーポンコードをコピーしました");
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  return (
    <InnerPageLayout title="クーポン">
      <p className="text-xs text-muted-foreground mb-4">
        利用可能なクーポン（{AVAILABLE_COUPONS.length}枚）
      </p>

      <div className="space-y-3">
        {AVAILABLE_COUPONS.map((coupon) => (
          <div
            key={coupon.code}
            className="bg-card border border-border rounded-[8px] overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-1 bg-primary" />

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-bold text-foreground">{coupon.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                  〜{formatDate(coupon.expiresAt)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-3 pl-6">
                {coupon.description}
              </p>

              {coupon.minAmount && (
                <p className="text-[10px] text-muted-foreground/60 mb-3 pl-6">
                  ※ {coupon.minAmount.toLocaleString()}円以上のご利用が対象
                </p>
              )}

              {/* Code + copy */}
              <div className="flex items-center gap-2 pl-6">
                <div className="flex-1 flex items-center justify-between bg-muted/50 border border-border rounded-[4px] px-3 py-2">
                  <span className="text-sm font-mono font-bold tracking-wider text-foreground">
                    {coupon.code}
                  </span>
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copiedCode === coupon.code ? (
                      <Check className="w-4 h-4 text-available" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </InnerPageLayout>
  );
};

export default Coupons;
