import { AlertCircle, CheckCircle2, PauseCircle, Plus, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAffiliates, type Affiliate } from "../../../lib/adminAffiliatesStore";
import {
  AFFILIATE_STATUS_BADGE_CLS,
  AFFILIATE_STATUS_JP,
  type AffiliateStatus,
} from "../../../lib/lstLabels";

const STATUS_OPTIONS = (Object.keys(AFFILIATE_STATUS_JP) as AffiliateStatus[]).map((s) => ({
  value: s,
  label: AFFILIATE_STATUS_JP[s],
}));

const AffiliateList = () => {
  const navigate = useNavigate();
  const affiliates = useAffiliates();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [prefFilter, setPrefFilter] = useState<string | undefined>(undefined);

  const prefOptions = useMemo(() => {
    const set = new Set<string>();
    affiliates.forEach((a) => set.add(a.prefecture));
    return Array.from(set).map((p) => ({ value: p, label: p }));
  }, [affiliates]);

  const stats = useMemo(() => {
    const total = affiliates.length;
    const active = affiliates.filter((a) => a.status === "active").length;
    const paused = affiliates.filter((a) => a.status === "paused").length;
    const terminating = affiliates.filter((a) => a.status === "terminating").length;
    return { total, active, paused, terminating };
  }, [affiliates]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return affiliates.filter((a) => {
      if (statusFilter && a.status !== statusFilter) return false;
      if (prefFilter && a.prefecture !== prefFilter) return false;
      if (!q) return true;
      return (
        a.storeName.toLowerCase().includes(q) ||
        a.ownerName.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    });
  }, [affiliates, search, statusFilter, prefFilter]);

  const columns: DataTableColumn<Affiliate>[] = [
    {
      key: "id",
      header: "加盟店ID",
      width: "10%",
      render: (a) => <span className="font-mono text-xs text-slate-600">{a.id}</span>,
    },
    {
      key: "storeName",
      header: "店舗名",
      width: "20%",
      render: (a) => <span className="text-sm font-medium text-slate-800">{a.storeName}</span>,
    },
    {
      key: "owner",
      header: "代表者",
      width: "12%",
      render: (a) => <span className="text-sm text-slate-700">{a.ownerName}</span>,
    },
    {
      key: "pref",
      header: "都道府県",
      width: "10%",
      render: (a) => <span className="text-sm text-slate-700">{a.prefecture}</span>,
    },
    {
      key: "openedAt",
      header: "開業日",
      width: "10%",
      render: (a) => <span className="text-sm text-slate-700">{a.openedAt}</span>,
    },
    {
      key: "courts",
      header: "コート数",
      width: "8%",
      className: "text-right",
      render: (a) => <span className="text-sm text-slate-700">{a.courtCount}</span>,
    },
    {
      key: "monthlyRevenue",
      header: "今月売上",
      width: "14%",
      className: "text-right",
      render: (a) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{a.monthlyRevenue.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "status",
      header: "状態",
      width: "12%",
      render: (a) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            AFFILIATE_STATUS_BADGE_CLS[a.status],
          )}
        >
          {AFFILIATE_STATUS_JP[a.status]}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="加盟店管理"
        description="LST 本部から見た加盟店の一覧"
        breadcrumbs={[{ label: "LST HQ" }, { label: "加盟店管理" }]}
        actions={
          <Button onClick={() => navigate("/admin/lst/affiliates/new")}>
            <Plus className="mr-1.5 h-4 w-4" />
            新規加盟店追加
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="加盟店数"
          value={stats.total.toLocaleString("ja-JP")}
          icon={<Store className="h-4 w-4" />}
        />
        <StatCard
          label="アクティブ"
          value={stats.active.toLocaleString("ja-JP")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="一時停止"
          value={stats.paused.toLocaleString("ja-JP")}
          icon={<PauseCircle className="h-4 w-4" />}
        />
        <StatCard
          label="解約予定"
          value={stats.terminating.toLocaleString("ja-JP")}
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<Affiliate>
          columns={columns}
          data={rows}
          rowKey={(a) => a.id}
          searchPlaceholder="店舗名 / 代表者 / 加盟店ID で検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="状態"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={setStatusFilter}
              />
              <FilterChip
                label="都道府県"
                value={prefFilter}
                options={prefOptions}
                onChange={setPrefFilter}
              />
            </>
          }
          onRowClick={(a) => navigate(`/admin/lst/affiliates/${a.id}`)}
          emptyTitle="該当する加盟店はありません"
          emptyDescription="フィルタ条件を変更してください。"
          pageSize={15}
        />
      </div>
    </AdminLayout>
  );
};

export default AffiliateList;
