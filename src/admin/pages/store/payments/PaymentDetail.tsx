import { RefreshCw, Undo2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import RefundDialog from "../../../components/dialogs/RefundDialog";
import RetryPaymentDialog from "../../../components/dialogs/RetryPaymentDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { refundPayment, retryPayment, useAdminPayment } from "../../../lib/adminPaymentsStore";
import {
  PAYMENT_METHOD_JP,
  PAYMENT_STATUS_BADGE_CLS,
  PAYMENT_STATUS_JP,
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

const PaymentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const payment = useAdminPayment(id);
  const [refundOpen, setRefundOpen] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);

  if (!payment) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="支払いが見つかりません"
          breadcrumbs={[
            { label: "店舗管理" },
            { label: "支払い履歴", to: "/admin/store/payments" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定された支払い ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/store/payments")}>
            支払い一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const canRefund = payment.status === "completed";
  const canRetry = payment.status === "failed";

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title={`支払い ${payment.id}`}
        breadcrumbs={[
          { label: "店舗管理" },
          { label: "支払い履歴", to: "/admin/store/payments" },
          { label: payment.id },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {canRetry ? (
              <Button variant="outline" onClick={() => setRetryOpen(true)}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                再試行
              </Button>
            ) : null}
            {canRefund ? (
              <Button
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() => setRefundOpen(true)}
              >
                <Undo2 className="mr-1.5 h-4 w-4" />
                返金処理
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mx-auto max-w-[1000px] space-y-6">
        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="支払い ID">
              <span className="font-mono text-xs">{payment.id}</span>
            </InfoRow>
            <InfoRow label="日付">{payment.date}</InfoRow>
            <InfoRow label="会員">{payment.memberName}</InfoRow>
            <InfoRow label="金額">¥{payment.amount.toLocaleString("ja-JP")}</InfoRow>
            <InfoRow label="支払い方法">{PAYMENT_METHOD_JP[payment.method]}</InfoRow>
            <InfoRow label="ステータス">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  PAYMENT_STATUS_BADGE_CLS[payment.status],
                )}
              >
                {PAYMENT_STATUS_JP[payment.status]}
              </span>
            </InfoRow>
            {payment.refundReason ? <InfoRow label="返金理由">{payment.refundReason}</InfoRow> : null}
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="関連取引" />
          {payment.relatedTxId ? (
            <button
              type="button"
              onClick={() => navigate(`/admin/store/sales/${payment.relatedTxId}`)}
              className="text-sm text-blue-600 hover:underline"
            >
              {payment.relatedTxId} を見る →
            </button>
          ) : (
            <p className="text-sm text-slate-500">関連取引はありません。</p>
          )}
        </div>
      </div>

      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        targetId={payment.id}
        amount={payment.amount}
        onConfirm={(reason) => refundPayment(payment.id, reason)}
      />
      <RetryPaymentDialog
        open={retryOpen}
        onOpenChange={setRetryOpen}
        paymentId={payment.id}
        onConfirm={() => retryPayment(payment.id)}
      />
    </AdminLayout>
  );
};

export default PaymentDetail;
