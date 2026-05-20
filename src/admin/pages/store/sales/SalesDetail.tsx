import { Undo2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import RefundDialog from "../../../components/dialogs/RefundDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { refundTransaction, useAdminSalesTransaction } from "../../../lib/adminSalesStore";
import {
  SALES_KIND_BADGE_CLS,
  SALES_KIND_JP,
  SALES_STATUS_BADGE_CLS,
  SALES_STATUS_JP,
} from "../../../lib/storeLabels";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm text-slate-800">{children}</span>
  </>
);

const SalesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tx = useAdminSalesTransaction(id);
  const [refundOpen, setRefundOpen] = useState(false);

  if (!tx) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="取引が見つかりません"
          breadcrumbs={[
            { label: "店舗管理" },
            { label: "売上管理", to: "/admin/store/sales" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定された取引 ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/store/sales")}>
            売上一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const canRefund = tx.status === "confirmed";

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title={`取引 ${tx.id}`}
        breadcrumbs={[
          { label: "店舗管理" },
          { label: "売上管理", to: "/admin/store/sales" },
          { label: tx.id },
        ]}
        actions={
          canRefund ? (
            <Button
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => setRefundOpen(true)}
            >
              <Undo2 className="mr-1.5 h-4 w-4" />
              返金
            </Button>
          ) : null
        }
      />

      <div className="mx-auto max-w-[1000px] space-y-6">
        <div className={cardCls}>
          <SectionHeader title="取引情報" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="取引 ID">
              <span className="font-mono text-xs">{tx.id}</span>
            </InfoRow>
            <InfoRow label="日付">{tx.date}</InfoRow>
            <InfoRow label="種別">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  SALES_KIND_BADGE_CLS[tx.kind],
                )}
              >
                {SALES_KIND_JP[tx.kind]}
              </span>
            </InfoRow>
            <InfoRow label="顧客">{tx.customerName}</InfoRow>
            <InfoRow label="ステータス">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  SALES_STATUS_BADGE_CLS[tx.status],
                )}
              >
                {SALES_STATUS_JP[tx.status]}
              </span>
            </InfoRow>
            {tx.reason ? (
              <InfoRow label="備考">{tx.reason}</InfoRow>
            ) : null}
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="金額内訳" />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">取引金額</span>
              <span className="font-medium text-slate-800">¥{tx.amount.toLocaleString("ja-JP")}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">手数料</span>
              <span className="text-slate-700">- ¥{tx.fee.toLocaleString("ja-JP")}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium text-slate-700">純額</span>
              <span className="text-lg font-semibold text-slate-900">
                ¥{tx.net.toLocaleString("ja-JP")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        targetId={tx.id}
        amount={tx.amount}
        onConfirm={(reason) => refundTransaction(tx.id, reason)}
      />
    </AdminLayout>
  );
};

export default SalesDetail;
