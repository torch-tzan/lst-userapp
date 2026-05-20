import { CheckCircle2, Clock, Undo2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import { cn } from "@/lib/utils";

import { useAdminPayments, type PaymentRecord } from "../../../lib/adminPaymentsStore";
import {
  PAYMENT_METHOD_JP,
  PAYMENT_STATUS_BADGE_CLS,
  PAYMENT_STATUS_JP,
  type PaymentMethod,
  type PaymentStatus,
} from "../../../lib/storeLabels";

const STATUS_OPTIONS = (Object.keys(PAYMENT_STATUS_JP) as PaymentStatus[]).map((s) => ({
  value: s,
  label: PAYMENT_STATUS_JP[s],
}));
const METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_JP) as PaymentMethod[]).map((m) => ({
  value: m,
  label: PAYMENT_METHOD_JP[m],
}));
const PERIOD_OPTIONS = [
  { value: "this_month", label: "今月" },
  { value: "last_month", label: "先月" },
];

const TODAY = new Date(2026, 4, 21);

function inPeriod(dateStr: string, period: string | undefined): boolean {
  if (!period) return true;
  const d = new Date(dateStr.slice(0, 10));
  if (Number.isNaN(d.getTime())) return false;
  const y = TODAY.getFullYear();
  const m = TODAY.getMonth();
  if (period === "this_month") return d.getFullYear() === y && d.getMonth() === m;
  if (period === "last_month") {
    const lm = m === 0 ? 11 : m - 1;
    const ly = m === 0 ? y - 1 : y;
    return d.getFullYear() === ly && d.getMonth() === lm;
  }
  return true;
}

const PaymentList = () => {
  const navigate = useNavigate();
  const payments = useAdminPayments();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [methodFilter, setMethodFilter] = useState<string | undefined>(undefined);
  const [periodFilter, setPeriodFilter] = useState<string | undefined>(undefined);

  const stats = useMemo(() => {
    const completed = payments.filter((p) => p.status === "completed").length;
    const failed = payments.filter((p) => p.status === "failed").length;
    const pending = payments.filter((p) => p.status === "pending").length;
    const refunded = payments.filter((p) => p.status === "refunded").length;
    return { completed, failed, pending, refunded };
  }, [payments]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (methodFilter && p.method !== methodFilter) return false;
      if (!inPeriod(p.date, periodFilter)) return false;
      if (!q) return true;
      return (
        p.memberName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [payments, search, statusFilter, methodFilter, periodFilter]);

  const columns: DataTableColumn<PaymentRecord>[] = [
    {
      key: "id",
      header: "支払いID",
      width: "12%",
      render: (p) => <span className="font-mono text-xs text-slate-600">{p.id}</span>,
    },
    {
      key: "date",
      header: "日付",
      width: "14%",
      render: (p) => <span className="text-sm text-slate-700">{p.date}</span>,
    },
    {
      key: "member",
      header: "会員",
      width: "14%",
      render: (p) => <span className="text-sm text-slate-800">{p.memberName}</span>,
    },
    {
      key: "amount",
      header: "金額",
      width: "12%",
      className: "text-right",
      render: (p) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{p.amount.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "method",
      header: "支払い方法",
      width: "12%",
      render: (p) => <span className="text-sm text-slate-700">{PAYMENT_METHOD_JP[p.method]}</span>,
    },
    {
      key: "status",
      header: "ステータス",
      width: "12%",
      render: (p) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            PAYMENT_STATUS_BADGE_CLS[p.status],
          )}
        >
          {PAYMENT_STATUS_JP[p.status]}
        </span>
      ),
    },
    {
      key: "related",
      header: "関連取引",
      width: "16%",
      render: (p) =>
        p.relatedTxId ? (
          <span className="font-mono text-xs text-blue-600 hover:underline">{p.relatedTxId}</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="支払い履歴"
        description="店舗の支払い処理履歴"
        breadcrumbs={[{ label: "店舗管理" }, { label: "支払い履歴" }]}
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="完了"
          value={stats.completed.toLocaleString("ja-JP")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="失敗"
          value={stats.failed.toLocaleString("ja-JP")}
          icon={<XCircle className="h-4 w-4" />}
        />
        <StatCard
          label="保留"
          value={stats.pending.toLocaleString("ja-JP")}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="返金"
          value={stats.refunded.toLocaleString("ja-JP")}
          icon={<Undo2 className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<PaymentRecord>
          columns={columns}
          data={rows}
          rowKey={(p) => p.id}
          searchPlaceholder="会員 / 支払いIDで検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="ステータス"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={setStatusFilter}
              />
              <FilterChip
                label="支払い方法"
                value={methodFilter}
                options={METHOD_OPTIONS}
                onChange={setMethodFilter}
              />
              <FilterChip
                label="期間"
                value={periodFilter}
                options={PERIOD_OPTIONS}
                onChange={setPeriodFilter}
              />
            </>
          }
          onRowClick={(p) => navigate(`/admin/store/payments/${p.id}`)}
          emptyTitle="該当する支払いはありません"
          emptyDescription="フィルタ条件を変更してください。"
        />
      </div>
    </AdminLayout>
  );
};

export default PaymentList;
