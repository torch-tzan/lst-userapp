import { BarChart3, Download, LineChart, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import CsvExportDialog from "../../../components/dialogs/CsvExportDialog";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  useRevenueRows,
  useRevenueSummary,
  useRevenueTransactions,
  type AffiliateRevenueRow,
  type RevenueTransaction,
} from "../../../lib/adminRevenueStore";
import {
  REVENUE_TX_KIND_BADGE_CLS,
  REVENUE_TX_KIND_JP,
  REVENUE_TX_STATUS_BADGE_CLS,
  REVENUE_TX_STATUS_JP,
  type RevenueTxKind,
  type RevenueTxStatus,
} from "../../../lib/lstLabels";

const PERIOD_OPTIONS = [
  { value: "this_month", label: "今月" },
  { value: "last_month", label: "先月" },
  { value: "this_quarter", label: "今四半期" },
];

const KIND_OPTIONS = (Object.keys(REVENUE_TX_KIND_JP) as RevenueTxKind[]).map((k) => ({
  value: k,
  label: REVENUE_TX_KIND_JP[k],
}));

const STATUS_OPTIONS = (Object.keys(REVENUE_TX_STATUS_JP) as RevenueTxStatus[]).map((s) => ({
  value: s,
  label: REVENUE_TX_STATUS_JP[s],
}));

const RevenueOverview = () => {
  const summary = useRevenueSummary();
  const rows = useRevenueRows();
  const tx = useRevenueTransactions();

  const [csvOpen, setCsvOpen] = useState(false);
  const [rowSearch, setRowSearch] = useState("");
  const [period, setPeriod] = useState<string | undefined>("this_month");
  const [txSearch, setTxSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // ── タブ 2: 加盟店別 ──
  const periodFactor = period === "last_month" ? 0.85 : period === "this_quarter" ? 3 : 1;
  const filteredRows = useMemo(() => {
    const q = rowSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (!q) return true;
      return r.affiliateName.toLowerCase().includes(q) || r.affiliateId.toLowerCase().includes(q);
    }).map((r) => ({
      ...r,
      revenue: Math.round(r.revenue * periodFactor),
      fee: Math.round(r.fee * periodFactor),
      netToAffiliate: Math.round(r.netToAffiliate * periodFactor),
      txCount: Math.round(r.txCount * periodFactor),
    }));
  }, [rows, rowSearch, periodFactor]);

  const affColumns: DataTableColumn<AffiliateRevenueRow>[] = [
    {
      key: "affiliate",
      header: "加盟店",
      width: "26%",
      render: (r) => (
        <div>
          <div className="text-sm font-medium text-slate-800">{r.affiliateName}</div>
          <div className="font-mono text-xs text-slate-500">{r.affiliateId}</div>
        </div>
      ),
    },
    {
      key: "revenue",
      header: "売上",
      width: "16%",
      className: "text-right",
      render: (r) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{r.revenue.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "fee",
      header: "手数料",
      width: "14%",
      className: "text-right",
      render: (r) => (
        <span className="text-sm text-slate-700">
          ¥{r.fee.toLocaleString("ja-JP")}
          <span className="ml-1 text-xs text-slate-400">({r.feeRate}%)</span>
        </span>
      ),
    },
    {
      key: "net",
      header: "純額（LST 取り分）",
      width: "16%",
      className: "text-right",
      render: (r) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{r.fee.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "count",
      header: "件数",
      width: "10%",
      className: "text-right",
      render: (r) => <span className="text-sm text-slate-700">{r.txCount}</span>,
    },
    {
      key: "change",
      header: "前月比",
      width: "10%",
      className: "text-right",
      render: (r) => (
        <span
          className={cn(
            "text-sm font-medium",
            r.changePct > 0 ? "text-emerald-600" : r.changePct < 0 ? "text-rose-600" : "text-slate-500",
          )}
        >
          {r.changePct >= 0 ? "+" : ""}
          {r.changePct}%
        </span>
      ),
    },
  ];

  // ── タブ 3: 取引明細 ──
  const filteredTx = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return tx.filter((t) => {
      if (kindFilter && t.kind !== kindFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.affiliateName.toLowerCase().includes(q)
      );
    });
  }, [tx, txSearch, kindFilter, statusFilter]);

  const txColumns: DataTableColumn<RevenueTransaction>[] = [
    {
      key: "id",
      header: "取引ID",
      width: "16%",
      render: (t) => <span className="font-mono text-xs text-slate-600">{t.id}</span>,
    },
    {
      key: "date",
      header: "日付",
      width: "12%",
      render: (t) => <span className="text-sm text-slate-700">{t.date}</span>,
    },
    {
      key: "affiliate",
      header: "加盟店",
      width: "22%",
      render: (t) => <span className="text-sm text-slate-800">{t.affiliateName}</span>,
    },
    {
      key: "kind",
      header: "種別",
      width: "12%",
      render: (t) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            REVENUE_TX_KIND_BADGE_CLS[t.kind],
          )}
        >
          {REVENUE_TX_KIND_JP[t.kind]}
        </span>
      ),
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
      width: "12%",
      className: "text-right",
      render: (t) => (
        <span className="text-sm text-slate-700">¥{t.fee.toLocaleString("ja-JP")}</span>
      ),
    },
    {
      key: "status",
      header: "状態",
      width: "10%",
      render: (t) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            REVENUE_TX_STATUS_BADGE_CLS[t.status],
          )}
        >
          {REVENUE_TX_STATUS_JP[t.status]}
        </span>
      ),
    },
  ];

  // ── 加盟店別売上ランキング（概要タブ用） ──
  const topAffiliates = useMemo(
    () => rows.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    [rows],
  );
  const maxRevenue = topAffiliates[0]?.revenue ?? 1;

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="手数料・売上"
        description="LST 本部から見た全加盟店の売上 / 手数料 / 取引明細"
        breadcrumbs={[{ label: "LST HQ" }, { label: "手数料・売上" }]}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="affiliates">加盟店別売上</TabsTrigger>
          <TabsTrigger value="transactions">取引明細</TabsTrigger>
        </TabsList>

        {/* 概要 */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="今月総売上"
              value={`¥${summary.totalRevenue.toLocaleString("ja-JP")}`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label="今月手数料収入"
              value={`¥${summary.totalFee.toLocaleString("ja-JP")}`}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <StatCard
              label="加盟店平均売上"
              value={`¥${summary.avgRevenue.toLocaleString("ja-JP")}`}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="前月比"
              value={`${summary.changePct >= 0 ? "+" : ""}${summary.changePct}%`}
              deltaDirection={summary.changePct > 0 ? "up" : summary.changePct < 0 ? "down" : "flat"}
              deltaLabel={
                summary.changePct > 0
                  ? "前月より増加"
                  : summary.changePct < 0
                  ? "前月より減少"
                  : "前月と同等"
              }
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">売上推移</h3>
                <LineChart className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex h-[200px] items-end gap-2">
                {/* シンプルな mock bar chart（直近 6 ヶ月） */}
                {[55, 62, 68, 71, 78, 92].map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-blue-500"
                      style={{ height: `${v}%` }}
                    />
                    <div className="text-xs text-slate-500">
                      {2025 + (i >= 4 ? 1 : 0)}/{((11 + i) % 12) + 1}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-400">直近 6 ヶ月の総売上推移（mock）</div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">加盟店別売上 Top5</h3>
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-2">
                {topAffiliates.map((a) => {
                  const pct = maxRevenue === 0 ? 0 : Math.round((a.revenue / maxRevenue) * 100);
                  return (
                    <div key={a.affiliateId} className="flex items-center gap-2">
                      <div className="w-[160px] truncate text-xs text-slate-700">{a.affiliateName}</div>
                      <div className="relative h-6 flex-1 overflow-hidden rounded bg-slate-100">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-[100px] text-right text-xs text-slate-600">
                        ¥{a.revenue.toLocaleString("ja-JP")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 加盟店別売上 */}
        <TabsContent value="affiliates" className="mt-6">
          <DataTable<AffiliateRevenueRow>
            columns={affColumns}
            data={filteredRows}
            rowKey={(r) => r.affiliateId}
            searchPlaceholder="加盟店名 / IDで検索"
            onSearch={setRowSearch}
            searchValue={rowSearch}
            filters={
              <FilterChip
                label="期間"
                value={period}
                options={PERIOD_OPTIONS}
                onChange={setPeriod}
              />
            }
            toolbarRight={
              <Button variant="outline" onClick={() => setCsvOpen(true)}>
                <Download className="mr-1.5 h-4 w-4" />
                CSVエクスポート
              </Button>
            }
            emptyTitle="該当する加盟店はありません"
            pageSize={15}
          />
        </TabsContent>

        {/* 取引明細 */}
        <TabsContent value="transactions" className="mt-6">
          <DataTable<RevenueTransaction>
            columns={txColumns}
            data={filteredTx}
            rowKey={(t) => t.id}
            searchPlaceholder="取引ID / 加盟店で検索"
            onSearch={setTxSearch}
            searchValue={txSearch}
            filters={
              <>
                <FilterChip
                  label="種別"
                  value={kindFilter}
                  options={KIND_OPTIONS}
                  onChange={setKindFilter}
                />
                <FilterChip
                  label="状態"
                  value={statusFilter}
                  options={STATUS_OPTIONS}
                  onChange={setStatusFilter}
                />
              </>
            }
            emptyTitle="取引はありません"
            pageSize={20}
          />
        </TabsContent>
      </Tabs>

      <CsvExportDialog open={csvOpen} onOpenChange={setCsvOpen} />
    </AdminLayout>
  );
};

export default RevenueOverview;
