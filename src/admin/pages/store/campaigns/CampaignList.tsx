import { Calendar, CheckCircle2, Plus, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import NewCampaignDialog from "../../../components/dialogs/NewCampaignDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  CAMPAIGN_PLACEHOLDER_IMAGE,
  useAdminCampaigns,
  type CampaignRecord,
} from "../../../lib/adminCampaignsStore";
import {
  CAMPAIGN_KIND_JP,
  CAMPAIGN_STATUS_BADGE_CLS,
  CAMPAIGN_STATUS_JP,
  type CampaignKind,
  type CampaignStatus,
} from "../../../lib/storeLabels";

const KIND_OPTIONS = (Object.keys(CAMPAIGN_KIND_JP) as CampaignKind[]).map((k) => ({
  value: k,
  label: CAMPAIGN_KIND_JP[k],
}));
const STATUS_OPTIONS = (Object.keys(CAMPAIGN_STATUS_JP) as CampaignStatus[]).map((s) => ({
  value: s,
  label: CAMPAIGN_STATUS_JP[s],
}));

const CampaignList = () => {
  const navigate = useNavigate();
  const campaigns = useAdminCampaigns();

  const [kindFilter, setKindFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);

  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "active").length;
    const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
    const ended = campaigns.filter((c) => c.status === "ended").length;
    return { active, scheduled, ended };
  }, [campaigns]);

  const rows = useMemo(() => {
    return campaigns.filter((c) => {
      if (kindFilter && c.kind !== kindFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      return true;
    });
  }, [campaigns, kindFilter, statusFilter]);

  const columns: DataTableColumn<CampaignRecord>[] = [
    {
      key: "image",
      header: "",
      width: "6%",
      render: (c) => (
        <div className="h-10 w-10 overflow-hidden rounded border bg-slate-50">
          <img
            src={c.imageUrl ?? CAMPAIGN_PLACEHOLDER_IMAGE}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ),
    },
    {
      key: "id",
      header: "ID",
      width: "10%",
      render: (c) => <span className="font-mono text-xs text-slate-600">{c.id}</span>,
    },
    {
      key: "title",
      header: "タイトル",
      width: "22%",
      render: (c) => <span className="text-sm font-medium text-slate-800">{c.title}</span>,
    },
    {
      key: "kind",
      header: "種別",
      width: "12%",
      render: (c) => <span className="text-sm text-slate-700">{CAMPAIGN_KIND_JP[c.kind]}</span>,
    },
    {
      key: "period",
      header: "期間",
      width: "22%",
      render: (c) => (
        <span className="text-xs text-slate-700">
          {c.startDate} 〜 {c.endDate}
        </span>
      ),
    },
    {
      key: "status",
      header: "状態",
      width: "12%",
      render: (c) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            CAMPAIGN_STATUS_BADGE_CLS[c.status],
          )}
        >
          {CAMPAIGN_STATUS_JP[c.status]}
        </span>
      ),
    },
    {
      key: "usage",
      header: "利用数",
      width: "10%",
      className: "text-right",
      render: (c) => <span className="text-sm text-slate-700">{c.usageCount}</span>,
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="キャンペーン・イベント管理"
        description="キャンペーンやイベントの一覧"
        breadcrumbs={[{ label: "店舗管理" }, { label: "キャンペーン" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            新規作成
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="アクティブ"
          value={stats.active.toLocaleString("ja-JP")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="予定"
          value={stats.scheduled.toLocaleString("ja-JP")}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="終了"
          value={stats.ended.toLocaleString("ja-JP")}
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<CampaignRecord>
          columns={columns}
          data={rows}
          rowKey={(c) => c.id}
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
          onRowClick={(c) => navigate(`/admin/store/campaigns/${c.id}`)}
          emptyTitle="該当するキャンペーンはありません"
        />
      </div>

      <NewCampaignDialog open={newOpen} onOpenChange={setNewOpen} />
    </AdminLayout>
  );
};

export default CampaignList;
