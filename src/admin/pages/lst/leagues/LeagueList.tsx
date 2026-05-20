import { format } from "date-fns";
import { CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import SegmentedTabs from "../../../components/SegmentedTabs";
import StatCard from "../../../components/StatCard";
import { cn } from "@/lib/utils";
import { useLeagueMatchBoardStore, type PostedMatch, type PostedMatchStatus } from "@/lib/leagueMatchBoardStore";
import { getPlayer, getRankTier } from "@/lib/tournamentStore";

import {
  POSTED_MATCH_STATUS_BADGE_CLS,
  POSTED_MATCH_STATUS_JP,
  skillLevelLabel,
} from "../../../lib/leagueLabels";
import { LEAGUE_ADMIN_TABS } from "./leagueTabs";

type StatusFilter = PostedMatchStatus | undefined;
type PeriodFilter = "this-month" | "last-month" | undefined;

const STATUS_OPTIONS: { value: PostedMatchStatus; label: string }[] = [
  { value: "open", label: POSTED_MATCH_STATUS_JP.open },
  { value: "filled", label: POSTED_MATCH_STATUS_JP.filled },
  { value: "completed", label: POSTED_MATCH_STATUS_JP.completed },
  { value: "cancelled", label: POSTED_MATCH_STATUS_JP.cancelled },
];

const PERIOD_OPTIONS: { value: "this-month" | "last-month"; label: string }[] = [
  { value: "this-month", label: "今月" },
  { value: "last-month", label: "先月" },
];

/** 「希望日時」が指定 period に該当するか判定 */
function isInPeriod(iso: string, period: PeriodFilter): boolean {
  if (!period) return true;
  const d = new Date(iso);
  const now = new Date();
  if (period === "this-month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  // last-month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
}

const LeagueList = () => {
  const navigate = useNavigate();
  const { postedMatches } = useLeagueMatchBoardStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(undefined);

  // ── Stat cards ──
  const stats = useMemo(() => {
    return postedMatches.reduce(
      (acc, m) => {
        acc[m.status] += 1;
        return acc;
      },
      { open: 0, filled: 0, completed: 0, cancelled: 0 } as Record<PostedMatchStatus, number>,
    );
  }, [postedMatches]);

  // ── Filtered rows ──
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return postedMatches
      .filter((m) => (statusFilter ? m.status === statusFilter : true))
      .filter((m) => isInPeriod(m.desiredDate, periodFilter))
      .filter((m) => {
        if (!q) return true;
        const host = getPlayer(m.hostUserId);
        const hostName = host?.name ?? "";
        return (
          hostName.toLowerCase().includes(q) ||
          m.preferredVenue.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [postedMatches, search, statusFilter, periodFilter]);

  const columns: DataTableColumn<PostedMatch>[] = [
    {
      key: "id",
      header: "ID",
      width: "10%",
      render: (m) => <span className="font-mono text-xs text-slate-600">{m.id}</span>,
    },
    {
      key: "host",
      header: "主催者",
      width: "16%",
      render: (m) => {
        const host = getPlayer(m.hostUserId);
        if (!host) return <span className="text-slate-400">—</span>;
        const tier = getRankTier(host.rating);
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{tier.emoji}</span>
            <span className="text-sm text-slate-800">{host.name}</span>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "希望日時",
      width: "13%",
      render: (m) => (
        <span className="text-sm text-slate-700">
          {format(new Date(m.desiredDate), "M/d HH:mm")}
        </span>
      ),
    },
    {
      key: "venue",
      header: "希望会場",
      width: "20%",
      render: (m) => <span className="text-sm text-slate-700">{m.preferredVenue}</span>,
    },
    {
      key: "level",
      header: "希望レベル",
      width: "10%",
      render: (m) => (
        <span className="text-sm text-slate-700">{skillLevelLabel(m.desiredSkillLevel)}</span>
      ),
    },
    {
      key: "apps",
      header: "応募数",
      width: "8%",
      render: (m) => {
        const approved = m.applications.filter((a) => a.status === "approved").length;
        return <span className="text-sm text-slate-700">{approved}/3</span>;
      },
    },
    {
      key: "status",
      header: "ステータス",
      width: "12%",
      render: (m) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            POSTED_MATCH_STATUS_BADGE_CLS[m.status],
          )}
        >
          {POSTED_MATCH_STATUS_JP[m.status]}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "作成日",
      width: "11%",
      render: (m) => (
        <span className="text-xs text-slate-500">{format(new Date(m.createdAt), "yyyy/M/d")}</span>
      ),
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="リーグ管理"
        description="全リーグ募集と試合結果"
        breadcrumbs={[{ label: "LST HQ" }, { label: "リーグ管理" }]}
      />

      <SegmentedTabs tabs={LEAGUE_ADMIN_TABS} />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="募集中"
          value={stats.open.toLocaleString("ja-JP")}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="確定済み"
          value={stats.filled.toLocaleString("ja-JP")}
          icon={<Trophy className="h-4 w-4" />}
        />
        <StatCard
          label="完了"
          value={stats.completed.toLocaleString("ja-JP")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="キャンセル"
          value={stats.cancelled.toLocaleString("ja-JP")}
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<PostedMatch>
          columns={columns}
          data={rows}
          rowKey={(m) => m.id}
          searchPlaceholder="主催者名 / 会場で検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="ステータス"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
              />
              <FilterChip
                label="期間"
                value={periodFilter}
                options={PERIOD_OPTIONS}
                onChange={(v) => setPeriodFilter(v as PeriodFilter)}
              />
            </>
          }
          onRowClick={(m) => navigate(`/admin/lst/leagues/${m.id}`)}
          emptyTitle="該当する募集はありません"
          emptyDescription="フィルタ条件を変更してください。"
        />
      </div>
    </AdminLayout>
  );
};

export default LeagueList;
