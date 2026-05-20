import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import SegmentedTabs from "../../../components/SegmentedTabs";
import { cn } from "@/lib/utils";
import { useLeagueMatchBoardStore, computeLeaguePP } from "@/lib/leagueMatchBoardStore";
import {
  formatSeasonLabel,
  getPlayer,
  getRankTier,
  getSeasonOf,
  parseSeasonKey,
  seasonKey,
  useTournamentStore,
  type SeasonalRankingRow,
} from "@/lib/tournamentStore";

import { LEAGUE_ADMIN_TABS } from "./leagueTabs";

type SeasonMode = "current" | "previous";

interface RankingRow extends SeasonalRankingRow {
  rank: number;
  displayId: string;
  padelPoints: number;
}

const LeagueRankings = () => {
  const navigate = useNavigate();
  const { computeSeasonalRanking } = useTournamentStore();
  const { postedMatches } = useLeagueMatchBoardStore();
  const [mode, setMode] = useState<SeasonMode>("current");
  const [search, setSearch] = useState("");

  // ── Current / previous season keys ──
  const { currentKey, previousKey, displayKey, displayLabel } = useMemo(() => {
    const now = new Date();
    const current = getSeasonOf(now);
    const previousDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const previous = getSeasonOf(previousDate);
    const cKey = seasonKey(current);
    const pKey = seasonKey(previous);
    const used = mode === "current" ? cKey : pKey;
    return {
      currentKey: cKey,
      previousKey: pKey,
      displayKey: used,
      displayLabel: formatSeasonLabel(parseSeasonKey(used)),
    };
  }, [mode]);

  // ── Compute ranking rows ──
  const rows = useMemo<RankingRow[]>(() => {
    const ranking = computeSeasonalRanking(displayKey);
    // Compute league PP per user
    const withPP = ranking.map((r) => {
      const player = getPlayer(r.userId);
      return {
        ...r,
        displayId: player?.displayId ?? "—",
        padelPoints: computeLeaguePP(r.userId, postedMatches),
      };
    });

    // If no tournament-derived seasonal data, also include all players who have
    // played a completed league match in this season period.
    // (For prototype simplicity we trust whatever ranking is returned.)
    const ranked: RankingRow[] = withPP.map((r, idx) => ({ ...r, rank: idx + 1 }));

    const q = search.trim().toLowerCase();
    return ranked.filter((r) => {
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.displayId.toLowerCase().includes(q);
    });
  }, [computeSeasonalRanking, displayKey, postedMatches, search]);

  const columns: DataTableColumn<RankingRow>[] = [
    {
      key: "rank",
      header: "順位",
      width: "10%",
      render: (r) => (
        <span className={cn("font-semibold", r.rank <= 3 ? "text-amber-600" : "text-slate-700")}>
          {r.rank}
        </span>
      ),
    },
    {
      key: "player",
      header: "プレイヤー",
      width: "30%",
      render: (r) => (
        <div>
          <div className="text-sm font-medium text-slate-800">{r.name}</div>
          <div className="font-mono text-xs text-slate-500">{r.displayId}</div>
        </div>
      ),
    },
    {
      key: "tier",
      header: "ティア",
      width: "18%",
      render: (r) => {
        const tier = getRankTier(r.rating);
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
            <span>{tier.emoji}</span>
            <span>{tier.label}</span>
          </span>
        );
      },
    },
    {
      key: "rating",
      header: "レーティング",
      width: "16%",
      render: (r) => (
        <span className="text-sm font-medium text-slate-800">
          {r.rating.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "pp",
      header: "Padel Points (PP)",
      width: "16%",
      render: (r) => (
        <span className="text-sm text-slate-700">
          {r.padelPoints > 0 ? `${r.padelPoints.toLocaleString("ja-JP")} PP` : "-"}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="シーズン順位"
        description="プレイヤーレーティング順位"
        breadcrumbs={[
          { label: "LST HQ" },
          { label: "リーグ管理", to: "/admin/lst/leagues" },
          { label: "シーズン順位" },
        ]}
      />

      <SegmentedTabs tabs={LEAGUE_ADMIN_TABS} />

      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex rounded-full border bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMode("current")}
            className={cn(
              "rounded-full px-4 py-1 text-xs font-medium transition-colors",
              mode === "current"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            今シーズン
          </button>
          <button
            type="button"
            onClick={() => setMode("previous")}
            className={cn(
              "rounded-full px-4 py-1 text-xs font-medium transition-colors",
              mode === "previous"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            前シーズン
          </button>
        </div>
        <span className="text-sm text-slate-500">
          {displayLabel}
          <span className="ml-2 font-mono text-xs text-slate-400">
            ({mode === "current" ? currentKey : previousKey})
          </span>
        </span>
      </div>

      <DataTable<RankingRow>
        columns={columns}
        data={rows}
        rowKey={(r) => r.userId}
        searchPlaceholder="プレイヤー名 / LST-ID で検索"
        onSearch={setSearch}
        searchValue={search}
        onRowClick={(r) => navigate(`/admin/lst/leagues/players/${r.userId}`)}
        emptyTitle="このシーズンの記録はまだありません"
        emptyDescription="完了した試合が記録されると順位が表示されます。"
        pageSize={15}
      />
    </AdminLayout>
  );
};

export default LeagueRankings;
