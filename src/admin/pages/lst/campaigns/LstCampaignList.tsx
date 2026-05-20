import { Calendar, CheckCircle2, Plus, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import NewLstCampaignDialog from "../../../components/dialogs/NewLstCampaignDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAffiliates } from "../../../lib/adminAffiliatesStore";
import {
  LST_CAMPAIGN_KIND_JP,
  LST_CAMPAIGN_STATUS_BADGE_CLS,
  LST_CAMPAIGN_STATUS_JP,
  useLstCampaigns,
  type LstCampaignKind,
  type LstCampaignRecord,
  type LstCampaignStatus,
} from "../../../lib/adminLstCampaignsStore";

const KIND_OPTIONS = (Object.keys(LST_CAMPAIGN_KIND_JP) as LstCampaignKind[]).map((k) => ({
  value: k,
  label: LST_CAMPAIGN_KIND_JP[k],
}));
const STATUS_OPTIONS = (Object.keys(LST_CAMPAIGN_STATUS_JP) as LstCampaignStatus[]).map((s) => ({
  value: s,
  label: LST_CAMPAIGN_STATUS_JP[s],
}));

const LstCampaignList = () => {
  const navigate = useNavigate();
  const campaigns = useLstCampaigns();
  const affiliates = useAffiliates();

  const [kindFilter, setKindFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [affiliateFilter, setAffiliateFilter] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);

  const totalAffiliates = affiliates.length;

  const affiliateOptions = useMemo(
    () => affiliates.map((a) => ({ value: a.id, label: a.storeName })),
    [affiliates],
  );

  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "active").length;
    const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
    const totalUsage = campaigns.reduce((sum, c) => sum + c.usageCount, 0);
    return { active, scheduled, totalUsage };
  }, [campaigns]);

  const rows = useMemo(() => {
    return campaigns.filter((c) => {
      if (kindFilter && c.kind !== kindFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (affiliateFilter && !c.affiliateIds.includes(affiliateFilter)) return false;
      return true;
    });
  }, [campaigns, kindFilter, statusFilter, affiliateFilter]);

  const columns: DataTableColumn<LstCampaignRecord>[] = [
    {
      key: "id",
      header: "ID",
      width: "10%",
      render: (c) => <span className="font-mono text-xs text-slate-600">{c.id}</span>,
    },
    {
      key: "title",
      header: "タイトル",
      width: "26%",
      render: (c) => <span className="text-sm font-medium text-slate-800">{c.title}</span>,
    },
    {
      key: "kind",
      header: "種別",
      width: "12%",
      render: (c) => (
        <span className="text-sm text-slate-700">{LST_CAMPAIGN_KIND_JP[c.kind]}</span>
      ),
    },
    {
      key: "affs",
      header: "配信加盟店",
      width: "12%",
      render: (c) => {
        const n = c.affiliateIds.length;
        const isAll = n === totalAffiliates;
        return (
          <span className="text-xs text-slate-700">
            {isAll ? `全 ${n} 店（全店）` : `${n} 店`}
          </span>
        );
      },
    },
    {
      key: "period",
      header: "期間",
      width: "18%",
      render: (c) => (
        <span className="text-xs text-slate-700">
          {c.startDate} 〜 {c.endDate}
        </span>
      ),
    },
    {
      key: "status",
      header: "状態",
      width: "10%",
      render: (c) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            LST_CAMPAIGN_STATUS_BADGE_CLS[c.status],
          )}
        >
          {LST_CAMPAIGN_STATUS_JP[c.status]}
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
    <AdminLayout role="lst">
      <AdminPageHeader
        title="キャンペーン・イベント"
        description="LST 本部から全加盟店へ展開するキャンペーン一覧"
        breadcrumbs={[{ label: "LST HQ" }, { label: "キャンペーン" }]}
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
          label="累計利用数"
          value={stats.totalUsage.toLocaleString("ja-JP")}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<LstCampaignRecord>
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
              <FilterChip
                label="配信加盟店"
                value={affiliateFilter}
                options={affiliateOptions}
                onChange={setAffiliateFilter}
              />
            </>
          }
          onRowClick={(c) => navigate(`/admin/lst/campaigns/${c.id}`)}
          emptyTitle="該当するキャンペーンはありません"
        />
      </div>

      <NewLstCampaignDialog open={newOpen} onOpenChange={setNewOpen} />
    </AdminLayout>
  );
};

export default LstCampaignList;
