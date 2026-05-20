import { CheckCircle2, Clock, FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import NewAnnouncementDialog from "../../../components/dialogs/NewAnnouncementDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  useAdminAnnouncements,
  type AnnouncementRecord,
} from "../../../lib/adminAnnouncementsStore";
import {
  ANNOUNCEMENT_CATEGORY_JP,
  ANNOUNCEMENT_STATUS_BADGE_CLS,
  ANNOUNCEMENT_STATUS_JP,
  type AnnouncementCategory,
  type AnnouncementStatus,
} from "../../../lib/storeLabels";

const CATEGORY_OPTIONS = (Object.keys(ANNOUNCEMENT_CATEGORY_JP) as AnnouncementCategory[]).map(
  (c) => ({ value: c, label: ANNOUNCEMENT_CATEGORY_JP[c] }),
);
const STATUS_OPTIONS = (Object.keys(ANNOUNCEMENT_STATUS_JP) as AnnouncementStatus[]).map((s) => ({
  value: s,
  label: ANNOUNCEMENT_STATUS_JP[s],
}));

const AnnouncementList = () => {
  const navigate = useNavigate();
  const announcements = useAdminAnnouncements();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
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
      if (!q) return true;
      return a.title.toLowerCase().includes(q);
    });
  }, [announcements, search, categoryFilter, statusFilter]);

  const columns: DataTableColumn<AnnouncementRecord>[] = [
    {
      key: "id",
      header: "ID",
      width: "10%",
      render: (a) => <span className="font-mono text-xs text-slate-600">{a.id}</span>,
    },
    {
      key: "title",
      header: "タイトル",
      width: "32%",
      render: (a) => <span className="text-sm font-medium text-slate-800">{a.title}</span>,
    },
    {
      key: "category",
      header: "カテゴリ",
      width: "14%",
      render: (a) => (
        <span className="text-sm text-slate-700">{ANNOUNCEMENT_CATEGORY_JP[a.category]}</span>
      ),
    },
    {
      key: "status",
      header: "状態",
      width: "10%",
      render: (a) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            ANNOUNCEMENT_STATUS_BADGE_CLS[a.status],
          )}
        >
          {ANNOUNCEMENT_STATUS_JP[a.status]}
        </span>
      ),
    },
    {
      key: "delivery",
      header: "配信日",
      width: "16%",
      render: (a) => (
        <span className="text-xs text-slate-700">{a.deliveryAt || "—"}</span>
      ),
    },
    {
      key: "rate",
      header: "既読率",
      width: "10%",
      className: "text-right",
      render: (a) => <span className="text-sm text-slate-700">{a.readRate}%</span>,
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="お知らせ配信"
        description="会員向けのお知らせ一覧"
        breadcrumbs={[{ label: "店舗管理" }, { label: "お知らせ配信" }]}
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
        <DataTable<AnnouncementRecord>
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
            </>
          }
          onRowClick={(a) => navigate(`/admin/store/announcements/${a.id}`)}
          emptyTitle="該当するお知らせはありません"
        />
      </div>

      <NewAnnouncementDialog open={newOpen} onOpenChange={setNewOpen} />
    </AdminLayout>
  );
};

export default AnnouncementList;
