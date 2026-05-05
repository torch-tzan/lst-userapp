import InnerPageLayout from "@/components/InnerPageLayout";
import { useSubscription } from "@/lib/subscriptionStore";
import { formatJP } from "@/lib/utils";

const PremiumBillingHistory = () => {
  const { history } = useSubscription();
  const sorted = [...history].sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  return (
    <InnerPageLayout title="課金履歴">
      <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
        {sorted.map((b) => (
          <div key={b.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{formatJP(b.paidAt)}</p>
              <p className="text-[11px] text-muted-foreground">プレミアム会員（月額）</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">¥{b.amount}</span>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">完了</span>
            </div>
          </div>
        ))}
      </div>
    </InnerPageLayout>
  );
};

export default PremiumBillingHistory;
