import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import MemberDeleteDialog from "../../../components/dialogs/MemberDeleteDialog";
import MemberEditDialog from "../../../components/dialogs/MemberEditDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import {
  formatSeasonLabel,
  getRankTier,
  getSeasonOf,
  seasonKey,
  useTournamentStore,
} from "@/lib/tournamentStore";

import { useAdminMember } from "../../../lib/adminMembersOverlay";
import { SKILL_LEVEL_JP } from "../../../lib/leagueLabels";
import {
  MEMBER_PREMIUM_STATUS_BADGE_CLS,
  MEMBER_PREMIUM_STATUS_JP,
} from "../../../lib/lstLabels";

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

interface PointLog {
  id: string;
  date: string;
  type: "earn" | "spend";
  amount: number;
  note: string;
}

const MemberDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const member = useAdminMember(userId);
  const { computeSeasonalRanking } = useTournamentStore();
  const { postedMatches } = useLeagueMatchBoardStore();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const leagueStats = useMemo(() => {
    if (!member) return { played: 0, won: 0 };
    let played = 0;
    let won = 0;
    for (const m of postedMatches) {
      if (m.status !== "completed" || !m.result) continue;
      const onSide1 = m.result.side1UserIds.includes(member.userId);
      const onSide2 = m.result.side2UserIds.includes(member.userId);
      if (!onSide1 && !onSide2) continue;
      played += 1;
      const isWin = (onSide1 && m.result.winnerSide === 1) || (onSide2 && m.result.winnerSide === 2);
      if (isWin) won += 1;
    }
    return { played, won };
  }, [postedMatches, member]);

  const seasonRank = useMemo(() => {
    if (!member) return undefined;
    const key = seasonKey(getSeasonOf(new Date()));
    const ranking = computeSeasonalRanking(key);
    const idx = ranking.findIndex((r) => r.userId === member.userId);
    return idx >= 0 ? { rank: idx + 1, season: formatSeasonLabel(getSeasonOf(new Date())) } : undefined;
  }, [member, computeSeasonalRanking]);

  // ポイント履歴 mock — 5 件
  const pointHistory: PointLog[] = useMemo(() => {
    if (!member) return [];
    const h = member.userId.length * 31;
    return [
      { id: "p-1", date: "2026-05-18", type: "earn", amount: 30, note: "リーグ戦勝利" },
      { id: "p-2", date: "2026-05-10", type: "spend", amount: 200, note: "コートクーポン引換" },
      { id: "p-3", date: "2026-04-28", type: "earn", amount: 20, note: "大会参加ボーナス" },
      { id: "p-4", date: "2026-04-15", type: "earn", amount: 100, note: "Premium 継続" },
      { id: "p-5", date: "2026-04-01", type: "earn", amount: 50 + (h % 30), note: "初回登録ボーナス" },
    ];
  }, [member]);

  if (!member) {
    return (
      <AdminLayout role="lst">
        <AdminPageHeader
          title="会員が見つかりません"
          breadcrumbs={[
            { label: "LST HQ" },
            { label: "会員管理", to: "/admin/lst/members" },
            { label: userId ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定された会員 ID（<span className="font-mono">{userId}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/lst/members")}>
            会員一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const tier = getRankTier(member.rating);

  const pointColumns: DataTableColumn<PointLog>[] = [
    { key: "date", header: "日付", width: "20%", render: (p) => <span className="text-sm text-slate-700">{p.date}</span> },
    { key: "type", header: "種別", width: "16%", render: (p) => (
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", p.type === "earn" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
        {p.type === "earn" ? "獲得" : "使用"}
      </span>
    ) },
    { key: "amount", header: "ポイント", width: "20%", className: "text-right", render: (p) => (
      <span className={cn("text-sm font-medium", p.type === "earn" ? "text-emerald-700" : "text-amber-700")}>
        {p.type === "earn" ? "+" : "-"}{p.amount.toLocaleString("ja-JP")}
      </span>
    ) },
    { key: "note", header: "メモ", width: "44%", render: (p) => <span className="text-sm text-slate-700">{p.note}</span> },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title={member.name}
        breadcrumbs={[
          { label: "LST HQ" },
          { label: "会員管理", to: "/admin/lst/members" },
          { label: member.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              編集
            </Button>
            <Button
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              削除
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-[1100px] space-y-6">
        {/* 基本情報 */}
        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-xl font-semibold text-slate-700">
              {member.name.slice(0, 1)}
            </div>
            <div className="grid flex-1 grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
              <InfoRow label="名前">{member.name}</InfoRow>
              <InfoRow label="会員ID">
                <span className="font-mono">{member.displayId}</span>
              </InfoRow>
              <InfoRow label="メール">{member.email}</InfoRow>
              <InfoRow label="電話">{member.phone}</InfoRow>
              <InfoRow label="登録日">{member.extra.registeredAt}</InfoRow>
              <InfoRow label="最終ログイン">{member.extra.lastLoginAt}</InfoRow>
            </div>
          </div>
        </div>

        {/* スキル & レーティング */}
        <div className={cardCls}>
          <SectionHeader title="スキル & レーティング" />
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">スキルレベル</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {SKILL_LEVEL_JP[member.skillLevel]}
              </div>
            </div>
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">レーティング</div>
              <div className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
                {member.rating.toLocaleString("ja-JP")}
              </div>
            </div>
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">ティア</div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-lg font-semibold text-slate-900">
                <span>{tier.emoji}</span>
                <span>{tier.label}</span>
              </div>
            </div>
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">シーズン順位</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {seasonRank ? `${seasonRank.rank} 位` : "—"}
              </div>
              {seasonRank ? <div className="text-xs text-slate-500">{seasonRank.season}</div> : null}
            </div>
          </div>
        </div>

        {/* Premium */}
        <div className={cardCls}>
          <SectionHeader title="Premium ステータス" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="状態">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  MEMBER_PREMIUM_STATUS_BADGE_CLS[member.extra.premiumStatus],
                )}
              >
                {MEMBER_PREMIUM_STATUS_JP[member.extra.premiumStatus]}
              </span>
            </InfoRow>
            <InfoRow label="開始日">{member.extra.premiumStartedAt ?? "—"}</InfoRow>
            <InfoRow label="次回更新日">{member.extra.premiumNextRenewAt ?? "—"}</InfoRow>
            <InfoRow label="累計支払">
              {member.extra.premiumTotalPaid !== undefined
                ? `¥${member.extra.premiumTotalPaid.toLocaleString("ja-JP")}`
                : "—"}
            </InfoRow>
          </div>
        </div>

        {/* リーグ戦績 */}
        <div className={cardCls}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">リーグ戦績</h2>
              <p className="mt-0.5 text-xs text-slate-500">完了したリーグ試合</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/lst/leagues/players/${member.userId}`)}
            >
              詳細を見る
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">試合数</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{leagueStats.played}</div>
            </div>
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">勝利</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{leagueStats.won}</div>
            </div>
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">勝率</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {leagueStats.played === 0
                  ? "—"
                  : `${Math.round((leagueStats.won / leagueStats.played) * 100)}%`}
              </div>
            </div>
          </div>
        </div>

        {/* ポイント */}
        <div className={cardCls}>
          <SectionHeader
            title="ポイント残高 & 履歴"
            description={`現在の残高 ${member.extra.points.toLocaleString("ja-JP")} pt`}
          />
          <DataTable<PointLog>
            columns={pointColumns}
            data={pointHistory}
            rowKey={(p) => p.id}
            emptyTitle="履歴はありません"
          />
        </div>
      </div>

      <MemberEditDialog open={editOpen} onOpenChange={setEditOpen} member={member} />
      <MemberDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        member={member}
        onDeleted={() => navigate("/admin/lst/members")}
      />
    </AdminLayout>
  );
};

export default MemberDetail;
