import { useMemo, useState } from "react";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import SegmentedTabs from "../../../components/SegmentedTabs";
import { cn } from "@/lib/utils";
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

import { STORE_LEAGUE_ADMIN_TABS } from "./storeLeagueTabs";

type SeasonMode = "current" | "previous";

const MEDAL_EMOJI = ["🥇", "🥈", "🥉"];

interface RankingRow extends SeasonalRankingRow {
  rank: number;
  displayId: string;
}

const StoreLeagueRankings = () => {
  const { computeSeasonalRanking } = useTournamentStore();
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
    const withDisplayId = ranking.map((r) => {
      const player = getPlayer(r.userId);
      return {
        ...r,
        displayId: player?.displayId ?? "—",
      };
    });
    const ranked: RankingRow[] = withDisplayId.map((r, idx) => ({ ...r, rank: idx + 1 }));

    const q = search.trim().toLowerCase();
    return ranked.filter((r) => {
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.displayId.toLowerCase().includes(q);
    });
  }, [computeSeasonalRanking, displayKey, search]);

  const columns: DataTableColumn<RankingRow>[] = [
    {
      key: "rank",
      header: "順位",
      width: "10%",
      render: (r) =>
        r.rank <= 3 ? (
          <span className="text-xl leading-none">{MEDAL_EMOJI[r.rank - 1]}</span>
        ) : (
          <span className="font-semibold text-slate-700">{r.rank}</span>
        ),
    },
    {
      key: "player",
      header: "プレイヤー",
      width: "34%",
      render: (r) => {
        const tier = getRankTier(r.rating);
        return (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
              <span>{r.name}</span>
              <span>{tier.emoji}</span>
            </div>
            <div className="font-mono text-xs text-slate-500">{r.displayId}</div>
          </div>
        );
      },
    },
    {
      key: "played",
      header: "試合数",
      width: "12%",
      render: (r) => (
        <span className="text-sm text-slate-700">{r.played}試合</span>
      ),
    },
    {
      key: "won",
      header: "勝数",
      width: "12%",
      render: (r) => <span className="text-sm text-slate-700">{r.won}勝</span>,
    },
    {
      key: "ratingChange",
      header: "変動",
      width: "14%",
      render: (r) => (
        <span
          className={cn(
            "text-sm font-medium",
            r.ratingChange > 0
              ? "text-emerald-600"
              : r.ratingChange < 0
                ? "text-rose-600"
                : "text-slate-500",
          )}
        >
          {r.ratingChange >= 0 ? "+" : ""}
          {r.ratingChange}
        </span>
      ),
    },
    {
      key: "rating",
      header: "レーティング",
      width: "18%",
      render: (r) => (
        <span className="text-base font-bold text-slate-900">
          {r.rating.toLocaleString("ja-JP")}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="シーズン順位"
        description="プレイヤーレーティング順位（参照のみ）"
        breadcrumbs={[
          { label: "店舗" },
          { label: "リーグ管理", to: "/admin/store/leagues" },
          { label: "シーズン順位" },
        ]}
      />

      <SegmentedTabs tabs={STORE_LEAGUE_ADMIN_TABS} />

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
        emptyTitle="このシーズンの記録はまだありません"
        emptyDescription="完了した試合が記録されると順位が表示されます。"
        pageSize={15}
      />
    </AdminLayout>
  );
};

export default StoreLeagueRankings;
