import { CheckCircle2, Clock, FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import NewLstAnnouncementDialog from "../../../components/dialogs/NewLstAnnouncementDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  LST_ANNOUNCEMENT_CATEGORY_JP,
  LST_ANNOUNCEMENT_STATUS_BADGE_CLS,
  LST_ANNOUNCEMENT_STATUS_JP,
  LST_AUDIENCE_MODE_JP,
  useLstAnnouncements,
  type LstAnnouncementCategory,
  type LstAnnouncementRecord,
  type LstAnnouncementStatus,
  type LstAudienceMode,
} from "../../../lib/adminLstAnnouncementsStore";

const CATEGORY_OPTIONS = (Object.keys(LST_ANNOUNCEMENT_CATEGORY_JP) as LstAnnouncementCategory[]).map(
  (c) => ({ value: c, label: LST_ANNOUNCEMENT_CATEGORY_JP[c] }),
);
const STATUS_OPTIONS = (Object.keys(LST_ANNOUNCEMENT_STATUS_JP) as LstAnnouncementStatus[]).map(
  (s) => ({ value: s, label: LST_ANNOUNCEMENT_STATUS_JP[s] }),
);
const AUDIENCE_OPTIONS = (Object.keys(LST_AUDIENCE_MODE_JP) as LstAudienceMode[]).map((a) => ({
  value: a,
  label: LST_AUDIENCE_MODE_JP[a],
}));

const LstAnnouncementList = () => {
  const navigate = useNavigate();
  const announcements = useLstAnnouncements();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [audienceFilter, setAudienceFilter] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);

  const stats = useMemo(() => {
    const published = announcements.filter((a) => a.status === "published").length;
    const draft = announcements.filter((a) => a.status === "draft").length;
    const scheduled = announcements.filter((a) => a.status === "scheduled").length;
    return { published, draft, scheduled };
  }, [announcements]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return announcements.filter((a) => {
      if (categoryFilter && a.category !== categoryFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (audienceFilter && a.audienceMode !== audienceFilter) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q);
    });
  }, [announcements, search, categoryFilter, statusFilter, audienceFilter]);

  const columns: DataTableColumn<LstAnnouncementRecord>[] = [
    {
      key: "id",
      header: "ID",
      width: "10%",
      render: (a) => <span className="font-mono text-xs text-slate-600">{a.id}</span>,
    },
    {
      key: "title",
      header: "タイトル",
      width: "28%",
      render: (a) => <span className="text-sm font-medium text-slate-800">{a.title}</span>,
    },
    {
      key: "category",
      header: "カテゴリ",
      width: "12%",
      render: (a) => (
        <span className="text-sm text-slate-700">{LST_ANNOUNCEMENT_CATEGORY_JP[a.category]}</span>
      ),
    },
    {
      key: "audience",
      header: "配信対象",
      width: "14%",
      render: (a) => {
        const base = LST_AUDIENCE_MODE_JP[a.audienceMode];
        let suffix = "";
        if (a.audienceMode === "affiliates" && a.audienceAffiliateIds) {
          suffix = ` (${a.audienceAffiliateIds.length}店)`;
        }
        if (a.audienceMode === "skill_levels" && a.audienceSkillLevels) {
          suffix = ` (${a.audienceSkillLevels.length}レベル)`;
        }
        return <span className="text-sm text-slate-700">{base}{suffix}</span>;
      },
    },
    {
      key: "status",
      header: "状態",
      width: "10%",
      render: (a) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            LST_ANNOUNCEMENT_STATUS_BADGE_CLS[a.status],
          )}
        >
          {LST_ANNOUNCEMENT_STATUS_JP[a.status]}
        </span>
      ),
    },
    {
      key: "delivery",
      header: "配信日",
      width: "14%",
      render: (a) => <span className="text-xs text-slate-700">{a.deliveryAt || "—"}</span>,
    },
    {
      key: "rate",
      header: "既読率",
      width: "8%",
      className: "text-right",
      render: (a) => <span className="text-sm text-slate-700">{a.readRate}%</span>,
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="お知らせ配信"
        description="LST 本部から全加盟店・全会員へのお知らせ"
        breadcrumbs={[{ label: "LST HQ" }, { label: "お知らせ配信" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            新規作成
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="公開中"
          value={stats.published.toLocaleString("ja-JP")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="下書き"
          value={stats.draft.toLocaleString("ja-JP")}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="配信予定"
          value={stats.scheduled.toLocaleString("ja-JP")}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<LstAnnouncementRecord>
          columns={columns}
          data={rows}
          rowKey={(a) => a.id}
          searchPlaceholder="タイトルで検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="カテゴリ"
                value={categoryFilter}
                options={CATEGORY_OPTIONS}
                onChange={setCategoryFilter}
              />
              <FilterChip
                label="状態"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={setStatusFilter}
              />
              <FilterChip
                label="配信対象"
                value={audienceFilter}
                options={AUDIENCE_OPTIONS}
                onChange={setAudienceFilter}
              />
            </>
          }
          onRowClick={(a) => navigate(`/admin/lst/announcements/${a.id}`)}
          emptyTitle="該当するお知らせはありません"
          emptyDescription="フィルタ条件を変更してください。"
        />
      </div>

      <NewLstAnnouncementDialog open={newOpen} onOpenChange={setNewOpen} />
    </AdminLayout>
  );
};

export default LstAnnouncementList;
