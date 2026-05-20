// 店舗側 大会管理：店舗が独自に開催する地域大会の管理画面。
// 前端 (user app) には現在エントリー UI はないため、これは prototype として
// 後台のみ存在する。User app に大会機能を復活させる場合は別途リンクが必要。
import { CheckCircle2, Plus, Play, UserPlus, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  TOURNAMENT_FORMAT_JP,
  TOURNAMENT_STATUS_BADGE_CLS,
  TOURNAMENT_STATUS_JP,
  useStoreTournaments,
  type StoreTournament,
  type TournamentFormat,
  type TournamentStatus,
} from "../../../lib/adminStoreTournamentsStore";

const FORMAT_OPTIONS = (Object.keys(TOURNAMENT_FORMAT_JP) as TournamentFormat[]).map((f) => ({
  value: f,
  label: TOURNAMENT_FORMAT_JP[f],
}));

const STATUS_OPTIONS = (Object.keys(TOURNAMENT_STATUS_JP) as TournamentStatus[]).map((s) => ({
  value: s,
  label: TOURNAMENT_STATUS_JP[s],
}));

const PERIOD_OPTIONS = [
  { value: "this-month", label: "今月" },
  { value: "next-month", label: "翌月" },
  { value: "past", label: "過去" },
];

const StoreTournamentList = () => {
  const navigate = useNavigate();
  const tournaments = useStoreTournaments();

  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [periodFilter, setPeriodFilter] = useState<string | undefined>(undefined);

  const stats = useMemo(() => {
    const inProgress = tournaments.filter((t) => t.status === "in_progress").length;
    const registrationOpen = tournaments.filter((t) => t.status === "registration_open").length;
    const completed = tournaments.filter((t) => t.status === "completed").length;
    const cancelled = tournaments.filter((t) => t.status === "cancelled").length;
    return { inProgress, registrationOpen, completed, cancelled };
  }, [tournaments]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tournaments.filter((t) => {
      if (formatFilter && t.format !== formatFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (periodFilter) {
        const heldMonth = t.heldAt.slice(0, 7);
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
        if (periodFilter === "this-month" && heldMonth !== thisMonth) return false;
        if (periodFilter === "next-month" && heldMonth !== nextMonth) return false;
        if (periodFilter === "past" && heldMonth >= thisMonth) return false;
      }
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.venue.toLowerCase().includes(q)
      );
    });
  }, [tournaments, search, formatFilter, statusFilter, periodFilter]);

  const columns: DataTableColumn<StoreTournament>[] = [
    {
      key: "id",
      header: "大会ID",
      width: "12%",
      render: (t) => <span className="font-mono text-xs text-slate-600">{t.id}</span>,
    },
    {
      key: "title",
      header: "タイトル",
      width: "26%",
      render: (t) => <span className="text-sm font-medium text-slate-800">{t.title}</span>,
    },
    {
      key: "heldAt",
      header: "開催日",
      width: "12%",
      render: (t) => <span className="text-sm text-slate-700">{t.heldAt}</span>,
    },
    {
      key: "format",
      header: "種別",
      width: "10%",
      render: (t) => (
        <span className="text-sm text-slate-700">{TOURNAMENT_FORMAT_JP[t.format]}</span>
      ),
    },
    {
      key: "capacity",
      header: "定員",
      width: "8%",
      className: "text-right",
      render: (t) => (
        <span className="text-sm text-slate-700 tabular-nums">{t.capacity}</span>
      ),
    },
    {
      key: "entries",
      header: "エントリー数",
      width: "12%",
      className: "text-right",
      render: (t) => (
        <span className="text-sm text-slate-700 tabular-nums">
          {t.entries.length} / {t.capacity}
        </span>
      ),
    },
    {
      key: "status",
      header: "状態",
      width: "12%",
      render: (t) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            TOURNAMENT_STATUS_BADGE_CLS[t.status],
          )}
        >
          {TOURNAMENT_STATUS_JP[t.status]}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="大会管理"
        description="店舗主催の地域大会"
        breadcrumbs={[{ label: "店舗" }, { label: "大会管理" }]}
        actions={
          <Button onClick={() => navigate("/admin/store/tournaments/new")}>
            <Plus className="mr-1.5 h-4 w-4" />
            新規大会
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="開催中" value={stats.inProgress.toLocaleString("ja-JP")} icon={<Play className="h-4 w-4" />} />
        <StatCard label="募集中" value={stats.registrationOpen.toLocaleString("ja-JP")} icon={<UserPlus className="h-4 w-4" />} />
        <StatCard label="終了" value={stats.completed.toLocaleString("ja-JP")} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="キャンセル" value={stats.cancelled.toLocaleString("ja-JP")} icon={<XCircle className="h-4 w-4" />} />
      </div>

      <div className="mt-6">
        <DataTable<StoreTournament>
          columns={columns}
          data={rows}
          rowKey={(t) => t.id}
          searchPlaceholder="タイトル / 大会ID / 会場で検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="種別"
                value={formatFilter}
                options={FORMAT_OPTIONS}
                onChange={setFormatFilter}
              />
              <FilterChip
                label="状態"
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
          onRowClick={(t) => navigate(`/admin/store/tournaments/${t.id}`)}
          emptyTitle="該当する大会はありません"
          emptyDescription="フィルタ条件を変更するか、右上の「新規大会」から追加してください。"
          pageSize={15}
        />
      </div>
    </AdminLayout>
  );
};

export default StoreTournamentList;
