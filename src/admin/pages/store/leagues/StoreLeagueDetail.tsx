import { format } from "date-fns";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import LeagueCancelDialog from "../../../components/dialogs/LeagueCancelDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import { getPlayer, getRankTier } from "@/lib/tournamentStore";

import {
  APPLICATION_STATUS_BADGE_CLS,
  APPLICATION_STATUS_JP,
  POSTED_MATCH_STATUS_BADGE_CLS,
  POSTED_MATCH_STATUS_JP,
  skillLevelLabel,
} from "../../../lib/leagueLabels";

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

const PlayerChip = ({ userId }: { userId: string }) => {
  const p = getPlayer(userId);
  if (!p) return <span className="text-slate-400">—</span>;
  const tier = getRankTier(p.rating);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
      <span>{tier.emoji}</span>
      <span>{p.name}</span>
    </span>
  );
};

const StoreLeagueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPostedMatch } = useLeagueMatchBoardStore();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const match = id ? getPostedMatch(id) : undefined;

  if (!match) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="試合が見つかりません"
          breadcrumbs={[
            { label: "店舗" },
            { label: "リーグ管理", to: "/admin/store/leagues" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定された試合 ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/store/leagues")}>
            リーグ一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const host = getPlayer(match.hostUserId);
  const hostTier = host ? getRankTier(host.rating) : null;
  const isCancellable = match.status === "open" || match.status === "filled";

  const result = match.result;
  const allFour = result ? [...result.side1UserIds, ...result.side2UserIds] : [];
  const approvedIds = new Set(result?.approvals.map((a) => a.userId) ?? []);
  const pendingApprovers = allFour.filter((u) => !approvedIds.has(u));

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title={`試合 ${match.id}`}
        breadcrumbs={[
          { label: "店舗" },
          { label: "リーグ管理", to: "/admin/store/leagues" },
          { label: match.id },
        ]}
        actions={
          isCancellable ? (
            <Button
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => setCancelDialogOpen(true)}
            >
              試合をキャンセル
            </Button>
          ) : null
        }
      />

      <div className="mx-auto max-w-[1100px] space-y-6">
        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="主催者">
              {host ? (
                <span className="inline-flex items-center gap-2">
                  <span>{hostTier?.emoji}</span>
                  <span className="font-medium">{host.name}</span>
                  <span className="font-mono text-xs text-slate-500">{host.displayId}</span>
                  <span className="text-xs text-slate-500">
                    レート {host.rating} ・ {hostTier?.label}
                  </span>
                </span>
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow label="希望日時">
              {format(new Date(match.desiredDate), "yyyy/M/d HH:mm")}
            </InfoRow>
            <InfoRow label="希望会場">{match.preferredVenue}</InfoRow>
            <InfoRow label="希望レベル">{skillLevelLabel(match.desiredSkillLevel)}</InfoRow>
            <InfoRow label="説明">
              {match.description ? (
                <span className="whitespace-pre-wrap">{match.description}</span>
              ) : (
                <span className="text-slate-400">（説明なし）</span>
              )}
            </InfoRow>
            <InfoRow label="作成日時">
              {format(new Date(match.createdAt), "yyyy/M/d HH:mm")}
            </InfoRow>
            <InfoRow label="ステータス">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  POSTED_MATCH_STATUS_BADGE_CLS[match.status],
                )}
              >
                {POSTED_MATCH_STATUS_JP[match.status]}
              </span>
            </InfoRow>
            {match.status === "cancelled" ? (
              <>
                <InfoRow label="キャンセル日時">
                  {match.cancelledAt
                    ? format(new Date(match.cancelledAt), "yyyy/M/d HH:mm")
                    : "—"}
                </InfoRow>
                <InfoRow label="キャンセル理由">
                  {match.cancelledReason ?? <span className="text-slate-400">（理由なし）</span>}
                </InfoRow>
              </>
            ) : null}
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="応募者" description={`合計 ${match.applications.length} 件`} />
          {match.applications.length === 0 ? (
            <p className="text-sm text-slate-500">応募はまだありません。</p>
          ) : (
            <ul className="divide-y">
              {match.applications.map((app) => {
                const applicant = getPlayer(app.applicantUserId);
                const tier = applicant ? getRankTier(applicant.rating) : null;
                return (
                  <li key={app.id} className="flex items-start justify-between gap-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="text-lg leading-none">{tier?.emoji ?? "—"}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {applicant?.name ?? app.applicantUserId}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          応募日時：{format(new Date(app.appliedAt), "yyyy/M/d HH:mm")}
                        </div>
                        {app.rejectedReason ? (
                          <div className="mt-1 text-xs text-rose-700">
                            却下理由：{app.rejectedReason}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        APPLICATION_STATUS_BADGE_CLS[app.status],
                      )}
                    >
                      {APPLICATION_STATUS_JP[app.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {result ? (
          <div className={cardCls}>
            <SectionHeader title="試合結果" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr]">
              <div
                className={cn(
                  "rounded-md border p-4",
                  result.winnerSide === 1
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-slate-50",
                )}
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Side 1</span>
                  {result.winnerSide === 1 ? (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-semibold text-white">
                      勝利
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.side1UserIds.map((u) => (
                    <PlayerChip key={u} userId={u} />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="text-xs text-slate-500">スコア</div>
                <div className="mt-1 text-xl font-semibold text-slate-800">{result.score}</div>
              </div>

              <div
                className={cn(
                  "rounded-md border p-4",
                  result.winnerSide === 2
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-slate-50",
                )}
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Side 2</span>
                  {result.winnerSide === 2 ? (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-semibold text-white">
                      勝利
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.side2UserIds.map((u) => (
                    <PlayerChip key={u} userId={u} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[140px_1fr] gap-y-2 gap-x-4 text-sm">
              <span className="text-slate-500">ホスト入力日時</span>
              <span className="text-slate-800">
                {format(new Date(result.hostSubmittedAt), "yyyy/M/d HH:mm")}
              </span>
              {result.completedAt ? (
                <>
                  <span className="text-slate-500">完了日時</span>
                  <span className="text-slate-800">
                    {format(new Date(result.completedAt), "yyyy/M/d HH:mm")}
                  </span>
                </>
              ) : null}
              <span className="text-slate-500">承認状況</span>
              <span className="text-slate-800">
                <span className="font-medium">{result.approvals.length}/4</span> 承認済み
              </span>
            </div>

            <div className="mt-4 rounded-md border bg-slate-50 p-3">
              <div className="text-xs font-medium text-slate-600">承認者</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.approvals.length === 0 ? (
                  <span className="text-xs text-slate-500">まだ承認者はいません</span>
                ) : (
                  result.approvals.map((a) => <PlayerChip key={a.userId} userId={a.userId} />)
                )}
              </div>
              {pendingApprovers.length > 0 ? (
                <>
                  <div className="mt-3 text-xs font-medium text-slate-600">未承認</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pendingApprovers.map((u) => (
                      <PlayerChip key={u} userId={u} />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <LeagueCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        match={match}
      />
    </AdminLayout>
  );
};

export default StoreLeagueDetail;
