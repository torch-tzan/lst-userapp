import { CheckCircle2, Clock, MailX, Plus, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import InvitationRevokeDialog from "../../../components/dialogs/InvitationRevokeDialog";
import NewInvitationDialog from "../../../components/dialogs/NewInvitationDialog";
import StatCard from "../../../components/StatCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  INVITATION_ROLE_JP,
  INVITATION_STATUS_BADGE_CLS,
  INVITATION_STATUS_JP,
  useInvitations,
  type Invitation,
  type InvitationStatus,
} from "../../../lib/adminInvitationsStore";

const STATUS_OPTIONS = (Object.keys(INVITATION_STATUS_JP) as InvitationStatus[]).map((s) => ({
  value: s,
  label: INVITATION_STATUS_JP[s],
}));

const InvitationList = () => {
  const invitations = useInvitations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null);

  const stats = useMemo(() => {
    const pending = invitations.filter((i) => i.status === "pending").length;
    const accepted = invitations.filter((i) => i.status === "accepted").length;
    const expired = invitations.filter((i) => i.status === "expired").length;
    const revoked = invitations.filter((i) => i.status === "revoked").length;
    return { pending, accepted, expired, revoked };
  }, [invitations]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invitations.filter((i) => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (!q) return true;
      return (
        i.email.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      );
    });
  }, [invitations, search, statusFilter]);

  const columns: DataTableColumn<Invitation>[] = [
    {
      key: "id",
      header: "招待ID",
      width: "14%",
      render: (i) => <span className="font-mono text-xs text-slate-600">{i.id}</span>,
    },
    {
      key: "email",
      header: "メール",
      width: "26%",
      render: (i) => <span className="text-sm text-slate-800">{i.email}</span>,
    },
    {
      key: "role",
      header: "役割",
      width: "12%",
      render: (i) => <span className="text-sm text-slate-700">{INVITATION_ROLE_JP[i.role]}</span>,
    },
    {
      key: "invitedAt",
      header: "招待日",
      width: "12%",
      render: (i) => <span className="text-sm text-slate-700">{i.invitedAt}</span>,
    },
    {
      key: "expiresAt",
      header: "有効期限",
      width: "12%",
      render: (i) => <span className="text-sm text-slate-700">{i.expiresAt}</span>,
    },
    {
      key: "status",
      header: "ステータス",
      width: "10%",
      render: (i) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            INVITATION_STATUS_BADGE_CLS[i.status],
          )}
        >
          {INVITATION_STATUS_JP[i.status]}
        </span>
      ),
    },
    {
      key: "actions",
      header: "操作",
      width: "10%",
      render: (i) =>
        i.status === "pending" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setRevokeTarget(i);
            }}
            className="border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            取消
          </Button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="アカウント招待"
        description="店舗の管理アカウントを別ユーザに発行"
        breadcrumbs={[{ label: "店舗" }, { label: "アカウント招待" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            アカウント招待
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="招待中" value={stats.pending.toLocaleString("ja-JP")} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="承認済み" value={stats.accepted.toLocaleString("ja-JP")} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="期限切れ" value={stats.expired.toLocaleString("ja-JP")} icon={<MailX className="h-4 w-4" />} />
        <StatCard label="取消" value={stats.revoked.toLocaleString("ja-JP")} icon={<XCircle className="h-4 w-4" />} />
      </div>

      <div className="mt-6">
        <DataTable<Invitation>
          columns={columns}
          data={rows}
          rowKey={(i) => i.id}
          searchPlaceholder="メール / 招待ID で検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <FilterChip
              label="ステータス"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
            />
          }
          emptyTitle="招待はありません"
          emptyDescription="右上の「アカウント招待」ボタンから新しい招待を送信できます。"
          pageSize={15}
        />
      </div>

      <NewInvitationDialog open={newOpen} onOpenChange={setNewOpen} />
      <InvitationRevokeDialog
        open={revokeTarget !== null}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null);
        }}
        invitation={revokeTarget}
      />
    </AdminLayout>
  );
};

export default InvitationList;
