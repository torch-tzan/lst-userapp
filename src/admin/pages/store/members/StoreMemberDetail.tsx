import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import MemberDeleteDialog from "../../../components/dialogs/MemberDeleteDialog";
import MemberEditDialog from "../../../components/dialogs/MemberEditDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRankTier } from "@/lib/tournamentStore";

import { useAdminMember } from "../../../lib/adminMembersOverlay";
import { SKILL_LEVEL_JP } from "../../../lib/leagueLabels";
import {
  MEMBER_PREMIUM_STATUS_BADGE_CLS,
  MEMBER_PREMIUM_STATUS_JP,
} from "../../../lib/lstLabels";
import { getAffiliateNameById } from "../../../lib/memberAffiliateLink";

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

const StoreMemberDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const member = useAdminMember(userId);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const pointHistory: PointLog[] = useMemo(() => {
    if (!member) return [];
    return [
      { id: "p-1", date: "2026-05-18", type: "earn", amount: 30, note: "リーグ戦勝利" },
      { id: "p-2", date: "2026-05-10", type: "spend", amount: 200, note: "コートクーポン引換" },
      { id: "p-3", date: "2026-04-28", type: "earn", amount: 20, note: "大会参加ボーナス" },
      { id: "p-4", date: "2026-04-15", type: "earn", amount: 100, note: "Premium 継続" },
      { id: "p-5", date: "2026-04-01", type: "earn", amount: 50, note: "初回登録ボーナス" },
    ];
  }, [member]);

  if (!member) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="会員が見つかりません"
          breadcrumbs={[
            { label: "店舗" },
            { label: "会員管理", to: "/admin/store/members" },
            { label: userId ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定された会員 ID（<span className="font-mono">{userId}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/store/members")}>
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
    <AdminLayout role="store">
      <AdminPageHeader
        title={member.name}
        breadcrumbs={[
          { label: "店舗" },
          { label: "会員管理", to: "/admin/store/members" },
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
              <InfoRow label="登録店">{getAffiliateNameById(member.extra.registeredAffiliateId)}</InfoRow>
            </div>
          </div>
        </div>

        {/* スキル & レーティング */}
        <div className={cardCls}>
          <SectionHeader title="スキル & レーティング" />
          <div className="grid grid-cols-3 gap-4">
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
        onDeleted={() => navigate("/admin/store/members")}
      />
    </AdminLayout>
  );
};

export default StoreMemberDetail;
