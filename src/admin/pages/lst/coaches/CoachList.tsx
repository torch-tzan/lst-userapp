import { Award, CheckCircle2, Plus, Star, Users, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import AddCoachDialog from "../../../components/dialogs/AddCoachDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CoachSummary } from "@/lib/coachData";

import { getCoachStatus, useAdminCoaches } from "../../../lib/adminCoachesOverlay";

const LEVEL_OPTIONS = [
  { value: "S級", label: "S級" },
  { value: "A級", label: "A級" },
  { value: "B級", label: "B級" },
  { value: "C級", label: "C級" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "アクティブ" },
  { value: "suspended", label: "無効化" },
];

const ONLINE_OPTIONS = [
  { value: "yes", label: "対応" },
  { value: "no", label: "非対応" },
];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-rose-50 text-rose-700 border-rose-200",
};

const CoachList = () => {
  const navigate = useNavigate();
  const coaches = useAdminCoaches();

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | undefined>(undefined);
  const [areaFilter, setAreaFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [onlineFilter, setOnlineFilter] = useState<string | undefined>(undefined);
  const [addOpen, setAddOpen] = useState(false);

  const areaOptions = useMemo(() => {
    const set = new Set<string>();
    coaches.forEach((c) => set.add(c.area));
    return Array.from(set).map((a) => ({ value: a, label: a }));
  }, [coaches]);

  const stats = useMemo(() => {
    const total = coaches.length;
    const active = coaches.filter((c) => getCoachStatus(c.id) === "active").length;
    const online = coaches.filter((c) => c.onlineAvailable).length;
    const ratings = coaches.filter((c) => c.rating > 0).map((c) => c.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : 0;
    return { total, active, online, avgRating };
  }, [coaches]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coaches.filter((c) => {
      if (levelFilter && c.level !== levelFilter) return false;
      if (areaFilter && c.area !== areaFilter) return false;
      if (statusFilter && getCoachStatus(c.id) !== statusFilter) return false;
      if (onlineFilter === "yes" && !c.onlineAvailable) return false;
      if (onlineFilter === "no" && c.onlineAvailable) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [coaches, search, levelFilter, areaFilter, statusFilter, onlineFilter]);

  const columns: DataTableColumn<CoachSummary>[] = [
    {
      key: "id",
      header: "コーチID",
      width: "8%",
      render: (c) => <span className="font-mono text-xs text-slate-600">{c.id}</span>,
    },
    {
      key: "name",
      header: "名前",
      width: "12%",
      render: (c) => (
        <div className="flex items-center gap-2">
          <img
            src={c.avatar}
            alt={c.name}
            className="h-7 w-7 rounded-full object-cover"
            loading="lazy"
          />
          <span className="text-sm font-medium text-slate-800">{c.name}</span>
        </div>
      ),
    },
    {
      key: "level",
      header: "レベル",
      width: "8%",
      render: (c) => <span className="text-sm text-slate-700">{c.level}</span>,
    },
    {
      key: "specialty",
      header: "専門",
      width: "20%",
      render: (c) => {
        const first2 = c.specialty.slice(0, 2);
        const extra = c.specialty.length - first2.length;
        return (
          <div className="flex flex-wrap gap-1">
            {first2.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full border bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-700"
              >
                {s}
              </span>
            ))}
            {extra > 0 ? (
              <span className="text-[10px] text-slate-500">+{extra}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "area",
      header: "エリア",
      width: "12%",
      render: (c) => <span className="text-sm text-slate-700">{c.area}</span>,
    },
    {
      key: "rating",
      header: "評価",
      width: "10%",
      render: (c) =>
        c.rating > 0 ? (
          <span className="inline-flex items-center gap-1 text-sm text-slate-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {c.rating}
            <span className="text-xs text-slate-500">({c.reviewCount})</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "price",
      header: "料金/h",
      width: "10%",
      className: "text-right",
      render: (c) => (
        <span className="text-sm text-slate-800">
          ¥{c.pricePerHour.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "online",
      header: "オンライン",
      width: "10%",
      render: (c) =>
        c.onlineAvailable ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <Video className="h-3 w-3" /> 対応
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "status",
      header: "状態",
      width: "10%",
      render: (c) => {
        const s = getCoachStatus(c.id);
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              STATUS_BADGE[s],
            )}
          >
            {s === "active" ? "アクティブ" : "無効化"}
          </span>
        );
      },
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="コーチ管理"
        description="LST 全コーチの一覧と管理"
        breadcrumbs={[{ label: "LST HQ" }, { label: "コーチ管理" }]}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            コーチ追加
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="全コーチ数"
          value={stats.total.toLocaleString("ja-JP")}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="アクティブ"
          value={stats.active.toLocaleString("ja-JP")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="オンライン対応"
          value={stats.online.toLocaleString("ja-JP")}
          icon={<Video className="h-4 w-4" />}
        />
        <StatCard
          label="平均評価"
          value={stats.avgRating > 0 ? String(stats.avgRating) : "—"}
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<CoachSummary>
          columns={columns}
          data={rows}
          rowKey={(c) => c.id}
          searchPlaceholder="名前 / エリアで検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="レベル"
                value={levelFilter}
                options={LEVEL_OPTIONS}
                onChange={setLevelFilter}
              />
              <FilterChip
                label="エリア"
                value={areaFilter}
                options={areaOptions}
                onChange={setAreaFilter}
              />
              <FilterChip
                label="状態"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={setStatusFilter}
              />
              <FilterChip
                label="オンライン対応"
                value={onlineFilter}
                options={ONLINE_OPTIONS}
                onChange={setOnlineFilter}
              />
            </>
          }
          onRowClick={(c) => navigate(`/admin/lst/coaches/${c.id}`)}
          emptyTitle="該当するコーチはいません"
          emptyDescription="フィルタ条件を変更してください。"
        />
      </div>

      <AddCoachDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(id) => navigate(`/admin/lst/coaches/${id}`)}
      />
    </AdminLayout>
  );
};

export default CoachList;
