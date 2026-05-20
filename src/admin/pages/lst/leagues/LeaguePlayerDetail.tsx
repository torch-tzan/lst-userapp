import { format } from "date-fns";
import { Lightbulb } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import RatingAdjustDialog from "../../../components/dialogs/RatingAdjustDialog";
import { Button } from "@/components/ui/button";
import {
  computeLeaguePP,
  useLeagueMatchBoardStore,
  type PostedMatch,
} from "@/lib/leagueMatchBoardStore";
import {
  getPlayer,
  getRankTier,
  getSeasonOf,
  seasonKey,
  useTournamentStore,
} from "@/lib/tournamentStore";
import { cn } from "@/lib/utils";

import { skillLevelLabel } from "../../../lib/leagueLabels";

interface MatchRow {
  match: PostedMatch;
  side: 1 | 2;
  isWin: boolean;
  opponents: string[];
  completedAt: string;
}

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-4">
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
  </div>
);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm text-slate-800">{children}</span>
  </>
);

const LeaguePlayerDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const { postedMatches } = useLeagueMatchBoardStore();
  const { computeSeasonalRanking } = useTournamentStore();

  const player = userId ? getPlayer(userId) : undefined;

  // Current season info
  const currentSeasonKey = seasonKey(getSeasonOf(new Date()));
  const seasonRanking = useMemo(
    () => computeSeasonalRanking(currentSeasonKey),
    [computeSeasonalRanking, currentSeasonKey],
  );
  const rank = useMemo(() => {
    if (!userId) return null;
    const idx = seasonRanking.findIndex((r) => r.userId === userId);
    return idx >= 0 ? idx + 1 : null;
  }, [seasonRanking, userId]);

  // League PP total (all completed league matches)
  const leaguePP = useMemo(
    () => (userId ? computeLeaguePP(userId, postedMatches) : 0),
    [postedMatches, userId],
  );

  // League match history for this player
  const matchRows = useMemo<MatchRow[]>(() => {
    if (!userId) return [];
    const rows: MatchRow[] = [];
    for (const m of postedMatches) {
      if (m.status !== "completed" || !m.result) continue;
      const onSide1 = m.result.side1UserIds.includes(userId);
      const onSide2 = m.result.side2UserIds.includes(userId);
      if (!onSide1 && !onSide2) continue;
      const side: 1 | 2 = onSide1 ? 1 : 2;
      const isWin = (onSide1 && m.result.winnerSide === 1) || (onSide2 && m.result.winnerSide === 2);
      const opponentIds = onSide1 ? m.result.side2UserIds : m.result.side1UserIds;
      const opponents = opponentIds.map((u) => getPlayer(u)?.name ?? u);
      rows.push({
        match: m,
        side,
        isWin,
        opponents,
        completedAt: m.result.completedAt ?? m.result.hostSubmittedAt,
      });
    }
    return rows.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }, [postedMatches, userId]);

  if (!player) {
    return (
      <AdminLayout role="lst">
        <AdminPageHeader
          title="プレイヤーが見つかりません"
          breadcrumbs={[
            { label: "LST HQ" },
            { label: "リーグ管理", to: "/admin/lst/leagues" },
            { label: "シーズン順位", to: "/admin/lst/leagues/rankings" },
            { label: userId ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定されたユーザー ID（<span className="font-mono">{userId}</span>）が見つかりませんでした。
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate("/admin/lst/leagues/rankings")}
          >
            シーズン順位へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const tier = getRankTier(player.rating);

  const columns: DataTableColumn<MatchRow>[] = [
    {
      key: "date",
      header: "試合日",
      width: "14%",
      render: (r) => (
        <span className="text-sm text-slate-700">
          {format(new Date(r.completedAt), "yyyy/M/d")}
        </span>
      ),
    },
    {
      key: "side",
      header: "自分の Side",
      width: "12%",
      render: (r) => (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
          Side {r.side}
        </span>
      ),
    },
    {
      key: "opponents",
      header: "対戦相手",
      width: "26%",
      render: (r) => (
        <span className="text-sm text-slate-700">{r.opponents.join(" / ")}</span>
      ),
    },
    {
      key: "result",
      header: "勝敗",
      width: "10%",
      render: (r) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            r.isWin
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          {r.isWin ? "勝" : "負"}
        </span>
      ),
    },
    {
      key: "score",
      header: "スコア",
      width: "14%",
      render: (r) => (
        <span className="text-sm text-slate-700">{r.match.result?.score ?? "—"}</span>
      ),
    },
    {
      key: "host",
      header: "主催者",
      width: "24%",
      render: (r) => {
        const host = getPlayer(r.match.hostUserId);
        return <span className="text-sm text-slate-700">{host?.name ?? r.match.hostUserId}</span>;
      },
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title={player.name}
        breadcrumbs={[
          { label: "LST HQ" },
          { label: "リーグ管理", to: "/admin/lst/leagues" },
          { label: "シーズン順位", to: "/admin/lst/leagues/rankings" },
          { label: player.name },
        ]}
        actions={
          <Button onClick={() => setRatingDialogOpen(true)}>
            レーティング調整
          </Button>
        }
      />

      <div className="mx-auto max-w-[1100px] space-y-6">
        {/* Section 1: プレイヤー情報 */}
        <div className={cardCls}>
          <SectionHeader title="プレイヤー情報" />
          <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="名前">{player.name}</InfoRow>
            <InfoRow label="LST-ID">
              <span className="font-mono">{player.displayId}</span>
            </InfoRow>
            <InfoRow label="メール">{player.email}</InfoRow>
            <InfoRow label="電話番号">{player.phone}</InfoRow>
            <InfoRow label="スキルレベル">{skillLevelLabel(player.skillLevel)}</InfoRow>
            <InfoRow label="現在のレーティング">
              <span className="font-semibold text-slate-900">{player.rating}</span>
            </InfoRow>
            <InfoRow label="現在のティア">
              <span className="inline-flex items-center gap-1.5">
                <span>{tier.emoji}</span>
                <span>{tier.label}</span>
                <span className="text-xs text-slate-500">
                  ({tier.min}〜{tier.max === 9999 ? "∞" : tier.max})
                </span>
              </span>
            </InfoRow>
            <InfoRow label="当季順位">
              {rank ? (
                <span className="font-medium text-slate-900">{rank} 位</span>
              ) : (
                <span className="text-slate-500">ランキング外（今季試合記録なし）</span>
              )}
            </InfoRow>
            <InfoRow label="通算 リーグ PP">
              <span className="font-medium">
                {leaguePP > 0 ? `${leaguePP.toLocaleString("ja-JP")} PP` : "—"}
              </span>
            </InfoRow>
          </div>
        </div>

        {/* Section 2: リーグ戦績 */}
        <div className={cardCls}>
          <SectionHeader title="リーグ戦績" description={`完了した試合 ${matchRows.length} 件`} />
          <DataTable<MatchRow>
            columns={columns}
            data={matchRows}
            rowKey={(r) => r.match.id}
            emptyTitle="まだ完了した試合がありません"
            emptyDescription="このプレイヤーが参加した完了試合は記録されていません。"
            pageSize={10}
            className="border-0 shadow-none"
          />
        </div>

        {/* Section 3: レーティング履歴 */}
        <div className={cardCls}>
          <SectionHeader title="レーティング履歴" />
          <div className="rounded-md border bg-slate-50 p-4">
            <div className="text-sm text-slate-700">
              現在値：<span className="font-semibold">{player.rating}</span>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
              <span>レーティング変更履歴は今後の機能です（audit_log テーブル整備後に表示予定）。</span>
            </div>
          </div>
        </div>
      </div>

      <RatingAdjustDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        userId={player.userId}
      />
    </AdminLayout>
  );
};

export default LeaguePlayerDetail;
