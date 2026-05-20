import { Pencil, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../../../components/AdminDialog";

import {
  cancelStoreTournament,
  TOURNAMENT_FORMAT_JP,
  TOURNAMENT_STATUS_BADGE_CLS,
  TOURNAMENT_STATUS_JP,
  useStoreTournament,
} from "../../../lib/adminStoreTournamentsStore";

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

const StoreTournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tournament = useStoreTournament(id);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!tournament) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="大会が見つかりません"
          breadcrumbs={[
            { label: "店舗" },
            { label: "大会管理", to: "/admin/store/tournaments" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定された大会 ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/store/tournaments")}>
            大会一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const handleCancel = () => {
    cancelStoreTournament(tournament.id);
    toast.success("大会をキャンセルしました");
    setCancelOpen(false);
  };

  const canCancel =
    tournament.status === "registration_open" || tournament.status === "in_progress";

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title={tournament.title}
        breadcrumbs={[
          { label: "店舗" },
          { label: "大会管理", to: "/admin/store/tournaments" },
          { label: tournament.id },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => toast.info("プロトタイプ: 編集機能は未実装")}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              編集
            </Button>
            {canCancel ? (
              <Button
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                キャンセル
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mx-auto max-w-[1100px] space-y-6">
        {/* 基本情報 */}
        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="grid grid-cols-[140px_1fr_140px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="大会ID">
              <span className="font-mono">{tournament.id}</span>
            </InfoRow>
            <InfoRow label="状態">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  TOURNAMENT_STATUS_BADGE_CLS[tournament.status],
                )}
              >
                {TOURNAMENT_STATUS_JP[tournament.status]}
              </span>
            </InfoRow>
            <InfoRow label="種別">{TOURNAMENT_FORMAT_JP[tournament.format]}</InfoRow>
            <InfoRow label="定員">{tournament.capacity} 名</InfoRow>
            <InfoRow label="開催日">{tournament.heldAt}</InfoRow>
            <InfoRow label="登録締切">{tournament.registrationDeadline}</InfoRow>
            <InfoRow label="会場">{tournament.venue}</InfoRow>
            <InfoRow label="エントリー数">
              {tournament.entries.length} / {tournament.capacity}
            </InfoRow>
            {tournament.description ? (
              <>
                <span className="text-sm text-slate-500">説明</span>
                <span className="col-span-3 text-sm text-slate-800 whitespace-pre-wrap">
                  {tournament.description}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* エントリー一覧 */}
        <div className={cardCls}>
          <SectionHeader
            title="エントリー一覧"
            description={`合計 ${tournament.entries.length} 件`}
          />
          {tournament.entries.length === 0 ? (
            <p className="text-sm text-slate-500">エントリーはまだありません。</p>
          ) : (
            <ul className="divide-y">
              {tournament.entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-500">{e.id}</span>
                    <span className="text-sm font-medium text-slate-800">{e.playerName}</span>
                  </div>
                  <span className="text-xs text-slate-500">エントリー日 {e.enteredAt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 結果 */}
        <div className={cardCls}>
          <SectionHeader title="結果" />
          {tournament.status === "completed" ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md border bg-emerald-50 px-4 py-3">
                <span className="font-medium text-emerald-700">優勝</span>
                <span className="text-emerald-800">
                  {tournament.entries[0]?.playerName ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-600">準優勝</span>
                <span className="text-slate-800">
                  {tournament.entries[1]?.playerName ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-600">3 位</span>
                <span className="text-slate-800">
                  {tournament.entries[2]?.playerName ?? "—"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">未開催</p>
          )}
        </div>
      </div>

      <AdminDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AdminDialogContent className="max-w-sm">
          <AdminDialogHeader>
            <AdminDialogTitle>大会をキャンセルしますか？</AdminDialogTitle>
            <AdminDialogDescription>
              「{tournament.title}」をキャンセル状態に変更します。
            </AdminDialogDescription>
          </AdminDialogHeader>
          <AdminDialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              戻る
            </Button>
            <Button onClick={handleCancel} className="bg-rose-600 hover:bg-rose-700">
              キャンセルを確定
            </Button>
          </AdminDialogFooter>
        </AdminDialogContent>
      </AdminDialog>
    </AdminLayout>
  );
};

export default StoreTournamentDetail;
