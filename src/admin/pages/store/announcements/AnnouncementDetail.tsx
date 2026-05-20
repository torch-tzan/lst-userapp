import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import AnnouncementDeleteDialog from "../../../components/dialogs/AnnouncementDeleteDialog";
import AnnouncementEditDialog from "../../../components/dialogs/AnnouncementEditDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAdminAnnouncement } from "../../../lib/adminAnnouncementsStore";
import {
  ANNOUNCEMENT_AUDIENCE_JP,
  ANNOUNCEMENT_CATEGORY_JP,
  ANNOUNCEMENT_STATUS_BADGE_CLS,
  ANNOUNCEMENT_STATUS_JP,
} from "../../../lib/storeLabels";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm text-slate-800">{children}</span>
  </>
);

const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const a = useAdminAnnouncement(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!a) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="お知らせが見つかりません"
          breadcrumbs={[
            { label: "店舗管理" },
            { label: "お知らせ配信", to: "/admin/store/announcements" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定された ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate("/admin/store/announcements")}
          >
            一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title={a.title}
        breadcrumbs={[
          { label: "店舗管理" },
          { label: "お知らせ配信", to: "/admin/store/announcements" },
          { label: a.title },
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

      <div className="mx-auto max-w-[900px] space-y-6">
        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="ID">
              <span className="font-mono text-xs">{a.id}</span>
            </InfoRow>
            <InfoRow label="カテゴリ">{ANNOUNCEMENT_CATEGORY_JP[a.category]}</InfoRow>
            <InfoRow label="配信日">{a.deliveryAt || "—"}</InfoRow>
            <InfoRow label="対象">{ANNOUNCEMENT_AUDIENCE_JP[a.audience]}</InfoRow>
            <InfoRow label="状態">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  ANNOUNCEMENT_STATUS_BADGE_CLS[a.status],
                )}
              >
                {ANNOUNCEMENT_STATUS_JP[a.status]}
              </span>
            </InfoRow>
            <InfoRow label="既読率">{a.readRate}%</InfoRow>
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="本文" />
          <p className="whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
        </div>
      </div>

      <AnnouncementEditDialog open={editOpen} onOpenChange={setEditOpen} announcement={a} />
      <AnnouncementDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        announcement={a}
        onDeleted={() => navigate("/admin/store/announcements")}
      />
    </AdminLayout>
  );
};

export default AnnouncementDetail;
