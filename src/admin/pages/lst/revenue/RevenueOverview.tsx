import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import CsvExportDialog from "../../../components/dialogs/CsvExportDialog";
import SettleBulkConfirmDialog from "../../../components/dialogs/SettleBulkConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useRevenueRows } from "../../../lib/adminRevenueStore";
import {
  settleAffiliate,
  useSettlementRows,
  type SettlementStatus,
} from "../../../lib/adminSettlementsStore";

// ─────────────────────────────────────────────────────────────────
// タブ・サブタブの定義
// ─────────────────────────────────────────────────────────────────
type MainTab = "affiliate" | "coach";
type StatusTab = "settled" | "unsettled" | "all" | "pending";
type Period = "this_month" | "last_month" | "3m" | "6m" | "1y";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "this_month", label: "今月" },
  { value: "last_month", label: "先月" },
  { value: "3m", label: "3ヶ月" },
  { value: "6m", label: "6ヶ月" },
  { value: "1y", label: "1年" },
];

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "settled", label: "精算済み" },
  { value: "unsettled", label: "未精算" },
  { value: "all", label: "すべて" },
  { value: "pending", label: "処理中" },
];

// ─────────────────────────────────────────────────────────────────
// 精算状況バッジ
// ─────────────────────────────────────────────────────────────────
const settlementBadge = (s: SettlementStatus) => {
  switch (s) {
    case "settled":
      return { label: "精算済", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "pending":
      return { label: "処理中", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "unsettled":
      return { label: "未精算", cls: "bg-red-50 text-red-700 border-red-200" };
  }
};

function formatSettledAt(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

// ─────────────────────────────────────────────────────────────────
// コーチ Mock データ（プロトタイプ用、5 行で十分）
// ─────────────────────────────────────────────────────────────────
interface CoachPayoutRow {
  id: string;
  name: string;
  sales: number;
  feeRate: number;
  status: SettlementStatus;
  settledAt?: string;
}
const COACH_PAYOUTS: CoachPayoutRow[] = [
  { id: "c1", name: "山田 翔", sales: 180_000, feeRate: 20, status: "settled", settledAt: "2026-05-15T09:00:00Z" },
  { id: "c2", name: "佐々木 涼", sales: 145_000, feeRate: 20, status: "settled", settledAt: "2026-05-15T09:00:00Z" },
  { id: "c3", name: "中村 健", sales: 98_000, feeRate: 20, status: "pending" },
  { id: "c4", name: "三浦 葵", sales: 72_000, feeRate: 20, status: "unsettled" },
  { id: "c5", name: "藤田 美咲", sales: 75_000, feeRate: 20, status: "settled", settledAt: "2026-05-10T09:00:00Z" },
];

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────
const RevenueOverview = () => {
  const revenueRows = useRevenueRows();
  const settlements = useSettlementRows();

  const [mainTab, setMainTab] = useState<MainTab>("affiliate");
  const [statusTab, setStatusTab] = useState<StatusTab>("settled");
  const [period, setPeriod] = useState<Period>("this_month");
  const [csvOpen, setCsvOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  // 加盟店行を期間係数で調整（プロトタイプ用シンプル係数）
  const periodFactor = useMemo(() => {
    switch (period) {
      case "last_month":
        return 0.92;
      case "3m":
        return 2.8;
      case "6m":
        return 5.6;
      case "1y":
        return 11.2;
      default:
        return 1;
    }
  }, [period]);

  // 加盟店 × 精算状況をマージし、上位 10 件
  const affiliateRows = useMemo(() => {
    const merged = revenueRows.map((r) => {
      const settle = settlements.find((s) => s.affiliateId === r.affiliateId);
      const revenue = Math.round(r.revenue * periodFactor);
      const fee = Math.round(r.fee * periodFactor);
      return {
        affiliateId: r.affiliateId,
        affiliateName: r.affiliateName,
        revenue,
        fee,
        feeRate: r.feeRate,
        netToAffiliate: revenue - fee,
        status: settle?.status ?? "unsettled",
        settledAt: settle?.settledAt,
      };
    });
    return merged.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [revenueRows, settlements, periodFactor]);

  // status tab でフィルタ
  const filteredAffiliateRows = useMemo(() => {
    return affiliateRows.filter((r) => {
      if (statusTab === "all") return true;
      if (statusTab === "settled") return r.status === "settled";
      if (statusTab === "unsettled") return r.status === "unsettled";
      if (statusTab === "pending") return r.status === "pending";
      return true;
    });
  }, [affiliateRows, statusTab]);

  // 集計（フィルタ前の affiliateRows ベース）
  const totals = useMemo(() => {
    const totalRevenue = affiliateRows.reduce((s, r) => s + r.revenue, 0);
    const totalFee = affiliateRows.reduce((s, r) => s + r.fee, 0);
    const totalNet = affiliateRows.reduce((s, r) => s + r.netToAffiliate, 0);
    const pendingCount = affiliateRows.filter((r) => r.status !== "settled").length;
    const pendingAmount = affiliateRows
      .filter((r) => r.status !== "settled")
      .reduce((s, r) => s + r.netToAffiliate, 0);
    return { totalRevenue, totalFee, totalNet, pendingCount, pendingAmount };
  }, [affiliateRows]);

  const handleRowSettle = (affiliateId: string, storeName: string) => {
    settleAffiliate(affiliateId);
    toast.success(`${storeName} の精算が完了しました`);
  };

  return (
    <AdminLayout role="lst">
      <AdminPageHeader title="支払い管理" />

      {/* メインタブ（加盟店 / コーチ） */}
      <div className="border-b">
        <div className="flex items-center gap-6">
          {([
            { value: "affiliate" as MainTab, label: "加盟店" },
            { value: "coach" as MainTab, label: "コーチ" },
          ]).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setMainTab(t.value)}
              className={cn(
                "relative px-1 py-3 text-sm transition-colors",
                mainTab === t.value
                  ? "font-semibold text-blue-600"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {t.label}
              {mainTab === t.value ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {mainTab === "affiliate" ? (
        <AffiliateTabContent
          totals={totals}
          period={period}
          setPeriod={setPeriod}
          statusTab={statusTab}
          setStatusTab={setStatusTab}
          rows={filteredAffiliateRows}
          onRowSettle={handleRowSettle}
          onCsvOpen={() => setCsvOpen(true)}
          onBulkOpen={() => setBulkOpen(true)}
        />
      ) : (
        <CoachTabContent />
      )}

      <CsvExportDialog open={csvOpen} onOpenChange={setCsvOpen} />
      <SettleBulkConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        pendingCount={totals.pendingCount}
      />
    </AdminLayout>
  );
};

// ─────────────────────────────────────────────────────────────────
// 加盟店タブ
// ─────────────────────────────────────────────────────────────────
interface AffiliateRowOnPage {
  affiliateId: string;
  affiliateName: string;
  revenue: number;
  fee: number;
  feeRate: number;
  netToAffiliate: number;
  status: SettlementStatus;
  settledAt?: string;
}

interface AffiliateTabContentProps {
  totals: {
    totalRevenue: number;
    totalFee: number;
    totalNet: number;
    pendingCount: number;
    pendingAmount: number;
  };
  period: Period;
  setPeriod: (p: Period) => void;
  statusTab: StatusTab;
  setStatusTab: (s: StatusTab) => void;
  rows: AffiliateRowOnPage[];
  onRowSettle: (affiliateId: string, name: string) => void;
  onCsvOpen: () => void;
  onBulkOpen: () => void;
}

const AffiliateTabContent = ({
  totals,
  period,
  setPeriod,
  statusTab,
  setStatusTab,
  rows,
  onRowSettle,
  onCsvOpen,
  onBulkOpen,
}: AffiliateTabContentProps) => {
  return (
    <>
      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <SmallStatCard
          label="総支払金額"
          value={`¥${totals.totalRevenue.toLocaleString("ja-JP")}`}
          sub="全店舗合計"
          valueColor="text-slate-900"
        />
        <SmallStatCard
          label="決済手数料（10%）"
          value={`¥${totals.totalFee.toLocaleString("ja-JP")}`}
          sub="LST収入"
          valueColor="text-blue-500"
        />
        <SmallStatCard
          label="最終支払金額"
          value={`¥${totals.totalNet.toLocaleString("ja-JP")}`}
          sub="加盟店への支払い"
          valueColor="text-emerald-600"
        />
        <SmallStatCard
          label="未精算金額"
          value={`¥${totals.pendingAmount.toLocaleString("ja-JP")}`}
          sub={`${totals.pendingCount}件 処理待ち`}
          valueColor="text-red-500"
        />
      </div>

      {/* Period pills + CSV */}
      <div className="mt-6 flex items-center gap-2">
        {PERIOD_OPTIONS.map((opt) => {
          const active = opt.value === period;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {opt.label}
            </button>
          );
        })}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={onCsvOpen}>
            <Download className="mr-1.5 h-4 w-4" />
            CSVエクスポート
          </Button>
        </div>
      </div>

      {/* 一括精算 */}
      <div className="mt-4">
        <Button
          onClick={onBulkOpen}
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={totals.pendingCount === 0}
        >
          精算する
        </Button>
        {totals.pendingCount > 0 ? (
          <span className="ml-3 text-xs text-slate-500">
            未精算・処理中の {totals.pendingCount} 件をまとめて精算
          </span>
        ) : (
          <span className="ml-3 text-xs text-slate-400">今月の精算対象はありません</span>
        )}
      </div>

      {/* Sub-tabs (status filter) */}
      <div className="mt-6 border-b">
        <div className="flex items-center gap-6">
          {STATUS_TABS.map((t) => {
            const active = t.value === statusTab;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setStatusTab(t.value)}
                className={cn(
                  "relative px-1 py-2.5 text-sm transition-colors",
                  active ? "font-semibold text-blue-600" : "text-slate-500 hover:text-slate-800",
                )}
              >
                {t.label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* 店舗別 決済・手数料明細 */}
      <div className="mt-4 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">店舗別 決済・手数料明細</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-2.5 text-left font-medium">店舗名</th>
                <th className="px-4 py-2.5 text-right font-medium">支払金額</th>
                <th className="px-4 py-2.5 text-right font-medium">決済手数料</th>
                <th className="px-4 py-2.5 text-right font-medium">手数料率</th>
                <th className="px-4 py-2.5 text-right font-medium">最終支払金額</th>
                <th className="px-4 py-2.5 text-left font-medium">精算状況</th>
                <th className="px-4 py-2.5 text-left font-medium">精算日</th>
                <th className="px-4 py-2.5 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
                    該当する店舗はありません
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const badge = settlementBadge(r.status);
                  return (
                    <tr key={r.affiliateId} className="border-b last:border-b-0">
                      <td className="px-4 py-3 text-slate-800">{r.affiliateName}</td>
                      <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                        ¥{r.revenue.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-500 tabular-nums">
                        ¥{r.fee.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{r.feeRate}%</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600 tabular-nums">
                        ¥{r.netToAffiliate.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            badge.cls,
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">
                        {formatSettledAt(r.settledAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-xs font-medium text-blue-600 hover:underline"
                            onClick={() => toast.info("詳細ページはプロトタイプ未実装")}
                          >
                            詳細
                          </button>
                          {r.status === "pending" || r.status === "unsettled" ? (
                            <button
                              type="button"
                              className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                              onClick={() => onRowSettle(r.affiliateId, r.affiliateName)}
                            >
                              精算する
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* 合計行 */}
            {rows.length > 0 ? (
              <tfoot>
                <tr className="border-t bg-slate-50 font-medium">
                  <td className="px-4 py-3 text-slate-700">合計</td>
                  <td className="px-4 py-3 text-right text-slate-800 tabular-nums">
                    ¥{rows.reduce((s, r) => s + r.revenue, 0).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-500 tabular-nums">
                    ¥{rows.reduce((s, r) => s + r.fee, 0).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">—</td>
                  <td className="px-4 py-3 text-right text-emerald-600 tabular-nums">
                    ¥{rows.reduce((s, r) => s + r.netToAffiliate, 0).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────
// コーチタブ（プロトタイプ — 5 行の簡易テーブル）
// ─────────────────────────────────────────────────────────────────
const CoachTabContent = () => {
  const handleSettle = (name: string) => {
    toast.success(`${name} の精算が完了しました（プロトタイプ）`);
  };

  const totalSales = COACH_PAYOUTS.reduce((s, r) => s + r.sales, 0);
  const totalFee = COACH_PAYOUTS.reduce((s, r) => s + Math.round((r.sales * r.feeRate) / 100), 0);
  const totalNet = totalSales - totalFee;

  return (
    <>
      <div className="mt-6 grid grid-cols-4 gap-4">
        <SmallStatCard
          label="総支払金額"
          value={`¥${totalSales.toLocaleString("ja-JP")}`}
          sub="コーチ合計"
          valueColor="text-slate-900"
        />
        <SmallStatCard
          label="決済手数料（20%）"
          value={`¥${totalFee.toLocaleString("ja-JP")}`}
          sub="LST収入"
          valueColor="text-blue-500"
        />
        <SmallStatCard
          label="最終支払金額"
          value={`¥${totalNet.toLocaleString("ja-JP")}`}
          sub="コーチへの支払い"
          valueColor="text-emerald-600"
        />
        <SmallStatCard
          label="アクティブコーチ"
          value={`${COACH_PAYOUTS.length}名`}
          sub="承認待ち 3名"
          valueColor="text-slate-900"
        />
      </div>

      <div className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">コーチ別 決済・手数料明細</h2>
          <div className="mt-1 text-xs text-slate-500">
            プロトタイプ：5 件のサンプル表示
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs text-slate-500">
              <th className="px-4 py-2.5 text-left font-medium">コーチ名</th>
              <th className="px-4 py-2.5 text-right font-medium">支払金額</th>
              <th className="px-4 py-2.5 text-right font-medium">決済手数料</th>
              <th className="px-4 py-2.5 text-right font-medium">手数料率</th>
              <th className="px-4 py-2.5 text-right font-medium">最終支払金額</th>
              <th className="px-4 py-2.5 text-left font-medium">精算状況</th>
              <th className="px-4 py-2.5 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {COACH_PAYOUTS.map((c) => {
              const badge = settlementBadge(c.status);
              const fee = Math.round((c.sales * c.feeRate) / 100);
              const net = c.sales - fee;
              return (
                <tr key={c.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                    ¥{c.sales.toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-500 tabular-nums">
                    ¥{fee.toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{c.feeRate}%</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600 tabular-nums">
                    ¥{net.toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        badge.cls,
                      )}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "pending" || c.status === "unsettled" ? (
                      <button
                        type="button"
                        className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                        onClick={() => handleSettle(c.name)}
                      >
                        精算する
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────
// 共通 stat card
// ─────────────────────────────────────────────────────────────────
const SmallStatCard = ({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor: string;
}) => (
  <div className="rounded-lg border bg-white p-5 shadow-sm">
    <div className="text-xs font-medium text-slate-500">{label}</div>
    <div className={cn("mt-2 text-2xl font-bold tabular-nums", valueColor)}>{value}</div>
    <div className="mt-1 text-xs text-slate-500">{sub}</div>
  </div>
);

export default RevenueOverview;
