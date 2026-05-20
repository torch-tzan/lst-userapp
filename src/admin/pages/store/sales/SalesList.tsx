import { Download, Plus, Receipt, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import CsvExportDialog from "../../../components/dialogs/CsvExportDialog";
import SalesAdjustDialog from "../../../components/dialogs/SalesAdjustDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAdminSales, type SalesTransaction } from "../../../lib/adminSalesStore";
import {
  SALES_KIND_BADGE_CLS,
  SALES_KIND_JP,
  SALES_STATUS_BADGE_CLS,
  SALES_STATUS_JP,
  type SalesKind,
  type SalesStatus,
} from "../../../lib/storeLabels";

const KIND_OPTIONS = (Object.keys(SALES_KIND_JP) as SalesKind[]).map((k) => ({
  value: k,
  label: SALES_KIND_JP[k],
}));
const STATUS_OPTIONS = (Object.keys(SALES_STATUS_JP) as SalesStatus[]).map((s) => ({
  value: s,
  label: SALES_STATUS_JP[s],
}));
const PERIOD_OPTIONS = [
  { value: "this_month", label: "今月" },
  { value: "last_month", label: "先月" },
  { value: "this_quarter", label: "今四半期" },
];

const TODAY = new Date(2026, 4, 21);

function inPeriod(dateStr: string, period: string | undefined): boolean {
  if (!period) return true;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const y = TODAY.getFullYear();
  const m = TODAY.getMonth();
  if (period === "this_month") return d.getFullYear() === y && d.getMonth() === m;
  if (period === "last_month") {
    const lm = m === 0 ? 11 : m - 1;
    const ly = m === 0 ? y - 1 : y;
    return d.getFullYear() === ly && d.getMonth() === lm;
  }
  if (period === "this_quarter") {
    const qStart = Math.floor(m / 3) * 3;
    return d.getFullYear() === y && d.getMonth() >= qStart && d.getMonth() <= qStart + 2;
  }
  return true;
}

const SalesList = () => {
  const navigate = useNavigate();
  const transactions = useAdminSales();

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [periodFilter, setPeriodFilter] = useState<string | undefined>(undefined);
  const [csvOpen, setCsvOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const stats = useMemo(() => {
    const thisMonth = transactions.filter(
      (t) =>
        inPeriod(t.date, "this_month") && t.status !== "refunded",
    );
    const lastMonth = transactions.filter(
      (t) =>
        inPeriod(t.date, "last_month") && t.status !== "refunded",
    );
    const thisSum = thisMonth.reduce((s, t) => s + t.amount, 0);
    const lastSum = lastMonth.reduce((s, t) => s + t.amount, 0);
    const change = lastSum === 0 ? 0 : Math.round(((thisSum - lastSum) / lastSum) * 100);
    return { thisSum, change, count: thisMonth.length };
  }, [transactions]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (kindFilter && t.kind !== kindFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (!inPeriod(t.date, periodFilter)) return false;
      if (!q) return true;
      return (
        t.customerName.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [transactions, search, kindFilter, statusFilter, periodFilter]);

  const columns: DataTableColumn<SalesTransaction>[] = [
    {
      key: "id",
      header: "取引ID",
      width: "14%",
      render: (t) => <span className="font-mono text-xs text-slate-600">{t.id}</span>,
    },
    {
      key: "date",
      header: "日付",
      width: "10%",
      render: (t) => <span className="text-sm text-slate-700">{t.date}</span>,
    },
    {
      key: "kind",
      header: "種別",
      width: "12%",
      render: (t) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            SALES_KIND_BADGE_CLS[t.kind],
          )}
        >
          {SALES_KIND_JP[t.kind]}
        </span>
      ),
    },
    {
      key: "customer",
      header: "顧客",
      width: "14%",
      render: (t) => <span className="text-sm text-slate-800">{t.customerName}</span>,
    },
    {
      key: "amount",
      header: "金額",
      width: "12%",
      className: "text-right",
      render: (t) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{t.amount.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "fee",
      header: "手数料",
      width: "10%",
      className: "text-right",
      render: (t) => (
        <span className="text-sm text-slate-600">¥{t.fee.toLocaleString("ja-JP")}</span>
      ),
    },
    {
      key: "net",
      header: "純額",
      width: "12%",
      className: "text-right",
      render: (t) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{t.net.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "status",
      header: "ステータス",
      width: "10%",
      render: (t) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            SALES_STATUS_BADGE_CLS[t.status],
          )}
        >
          {SALES_STATUS_JP[t.status]}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="売上管理"
        description="店舗の売上取引一覧"
        breadcrumbs={[{ label: "店舗管理" }, { label: "売上管理" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCsvOpen(true)}>
              <Download className="mr-1.5 h-4 w-4" />
              CSVエクスポート
            </Button>
            <Button onClick={() => setAdjustOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              手動調整
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="今月売上"
          value={`¥${stats.thisSum.toLocaleString("ja-JP")}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="前月比"
          value={`${stats.change >= 0 ? "+" : ""}${stats.change}%`}
          deltaDirection={stats.change > 0 ? "up" : stats.change < 0 ? "down" : "flat"}
          deltaLabel={stats.change > 0 ? "前月より増加" : stats.change < 0 ? "前月より減少" : "前月と同等"}
        />
        <StatCard
          label="取引件数"
          value={`${stats.count.toLocaleString("ja-JP")} 件`}
          icon={<Receipt className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<SalesTransaction>
          columns={columns}
          data={rows}
          rowKey={(t) => t.id}
          searchPlaceholder="顧客 / 取引IDで検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="種別"
                value={kindFilter}
                options={KIND_OPTIONS}
                onChange={setKindFilter}
              />
              <FilterChip
                label="ステータス"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={setStatusFilter}
              />
              <FilterChip
                label="期間"
                value={periodFilter}
                options={PERIOD_OPTIONS}
                onChange={setPeriodFilter}
              />
            </>
          }
          onRowClick={(t) => navigate(`/admin/store/sales/${t.id}`)}
          emptyTitle="該当する取引はありません"
          emptyDescription="フィルタ条件を変更してください。"
        />
      </div>

      <CsvExportDialog open={csvOpen} onOpenChange={setCsvOpen} />
      <SalesAdjustDialog open={adjustOpen} onOpenChange={setAdjustOpen} />
    </AdminLayout>
  );
};

export default SalesList;
