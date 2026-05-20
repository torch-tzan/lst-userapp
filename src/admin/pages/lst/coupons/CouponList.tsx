import { CheckCircle2, Plus, Ticket, TrendingUp, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import NewCouponDialog from "../../../components/dialogs/NewCouponDialog";

import {
  useAdminCoupons,
  type AdminCoupon,
  type AdminCouponSource,
} from "../../../lib/adminCouponsStore";

const TODAY = "2026-05-21";

// 状態判定
type CouponState = "active" | "inactive" | "expired";
const detectState = (c: AdminCoupon): CouponState => {
  if (!c.isActive) return "inactive";
  if (c.expiresAt < TODAY) return "expired";
  return "active";
};

const STATE_JP: Record<CouponState, string> = {
  active: "アクティブ",
  inactive: "無効",
  expired: "期限切れ",
};
const STATE_CLS: Record<CouponState, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  expired: "bg-rose-50 text-rose-700 border-rose-200",
};

const SOURCE_JP: Record<AdminCouponSource, string> = {
  manual: "手動",
  campaign: "キャンペーン",
};
const SOURCE_CLS: Record<AdminCouponSource, string> = {
  manual: "bg-slate-50 text-slate-700 border-slate-200",
  campaign: "bg-blue-50 text-blue-700 border-blue-200",
};

const TYPE_OPTIONS = [
  { value: "percent", label: "%（パーセント）" },
  { value: "fixed", label: "円（固定額）" },
];
const STATE_OPTIONS = (Object.keys(STATE_JP) as CouponState[]).map((s) => ({
  value: s,
  label: STATE_JP[s],
}));
const SOURCE_OPTIONS = (Object.keys(SOURCE_JP) as AdminCouponSource[]).map((s) => ({
  value: s,
  label: SOURCE_JP[s],
}));

const formatDate = (d: string): string => d.replace(/-/g, "/");

const CouponList = () => {
  const navigate = useNavigate();
  const coupons = useAdminCoupons();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);

  const stats = useMemo(() => {
    let active = 0;
    let expired = 0;
    let totalUsage = 0;
    for (const c of coupons) {
      const s = detectState(c);
      if (s === "active") active += 1;
      if (s === "expired") expired += 1;
      totalUsage += c.currentUsage;
    }
    return { active, expired, totalUsage, total: coupons.length };
  }, [coupons]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons.filter((c) => {
      if (typeFilter && c.type !== typeFilter) return false;
      if (stateFilter && detectState(c) !== stateFilter) return false;
      if (sourceFilter && c.source !== sourceFilter) return false;
      if (q) {
        const target = `${c.code} ${c.label}`.toLowerCase();
        if (!target.includes(q)) return false;
      }
      return true;
    });
  }, [coupons, search, typeFilter, stateFilter, sourceFilter]);

  const columns: DataTableColumn<AdminCoupon>[] = [
    {
      key: "code",
      header: "コード",
      width: "14%",
      render: (c) => (
        <span className="font-mono text-sm font-semibold tracking-wide text-slate-800">
          {c.code}
        </span>
      ),
    },
    {
      key: "label",
      header: "ラベル",
      width: "22%",
      render: (c) => <span className="text-sm font-medium text-slate-800">{c.label}</span>,
    },
    {
      key: "type",
      header: "種別",
      width: "8%",
      render: (c) => (
        <span className="text-sm text-slate-700">{c.type === "percent" ? "%" : "円"}</span>
      ),
    },
    {
      key: "value",
      header: "値",
      width: "10%",
      render: (c) => (
        <span className="text-sm text-slate-800">
          {c.type === "percent"
            ? `${Math.round(c.discount * 100)}%`
            : `¥${c.discount.toLocaleString("ja-JP")}`}
        </span>
      ),
    },
    {
      key: "period",
      header: "有効期間",
      width: "18%",
      render: (c) => (
        <span className="text-xs text-slate-700">
          {formatDate(c.validFrom)} 〜 {formatDate(c.expiresAt)}
        </span>
      ),
    },
    {
      key: "usage",
      header: "使用",
      width: "10%",
      className: "text-right",
      render: (c) => (
        <span className="text-sm text-slate-700">
          {c.currentUsage}
          {c.usageLimit !== undefined ? ` / ${c.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "state",
      header: "状態",
      width: "10%",
      render: (c) => {
        const s = detectState(c);
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              STATE_CLS[s],
            )}
          >
            {STATE_JP[s]}
          </span>
        );
      },
    },
    {
      key: "source",
      header: "ソース",
      width: "8%",
      render: (c) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            SOURCE_CLS[c.source],
          )}
        >
          {SOURCE_JP[c.source]}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="クーポン管理"
        description="クーポンの発行・編集・有効化を一括管理"
        breadcrumbs={[{ label: "LST HQ" }, { label: "クーポン管理" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            クーポン作成
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="アクティブ"
          value={stats.active.toLocaleString("ja-JP")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="期限切れ"
          value={stats.expired.toLocaleString("ja-JP")}
          icon={<XCircle className="h-4 w-4" />}
        />
        <StatCard
          label="使用回数合計"
          value={stats.totalUsage.toLocaleString("ja-JP")}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="クーポン総数"
          value={stats.total.toLocaleString("ja-JP")}
          icon={<Ticket className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<AdminCoupon>
          columns={columns}
          data={rows}
          rowKey={(c) => c.id}
          searchPlaceholder="コード / ラベルで検索"
          searchValue={search}
          onSearch={setSearch}
          filters={
            <>
              <FilterChip
                label="種別"
                value={typeFilter}
                options={TYPE_OPTIONS}
                onChange={setTypeFilter}
              />
              <FilterChip
                label="状態"
                value={stateFilter}
                options={STATE_OPTIONS}
                onChange={setStateFilter}
              />
              <FilterChip
                label="ソース"
                value={sourceFilter}
                options={SOURCE_OPTIONS}
                onChange={setSourceFilter}
              />
            </>
          }
          onRowClick={(c) => navigate(`/admin/lst/coupons/${encodeURIComponent(c.code)}`)}
          emptyTitle="該当するクーポンはありません"
        />
      </div>

      <NewCouponDialog open={newOpen} onOpenChange={setNewOpen} />
    </AdminLayout>
  );
};

export default CouponList;
