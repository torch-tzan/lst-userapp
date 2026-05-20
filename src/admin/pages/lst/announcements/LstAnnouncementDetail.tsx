import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import LstAnnouncementDeleteDialog from "../../../components/dialogs/LstAnnouncementDeleteDialog";
import LstAnnouncementEditDialog from "../../../components/dialogs/LstAnnouncementEditDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAffiliates } from "../../../lib/adminAffiliatesStore";
import {
  LST_ANNOUNCEMENT_CATEGORY_JP,
  LST_ANNOUNCEMENT_STATUS_BADGE_CLS,
  LST_ANNOUNCEMENT_STATUS_JP,
  LST_AUDIENCE_MODE_JP,
  useLstAnnouncement,
} from "../../../lib/adminLstAnnouncementsStore";
import { SKILL_LEVEL_JP } from "../../../lib/leagueLabels";
import type { SkillLevel } from "@/lib/tournamentStore";

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

const LstAnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const a = useLstAnnouncement(id);
  const affiliates = useAffiliates();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const affNames = useMemo(() => {
    if (!a?.audienceAffiliateIds) return [];
    return a.audienceAffiliateIds.map((id) => {
      const aff = affiliates.find((af) => af.id === id);
      return aff?.storeName ?? id;
    });
  }, [a, affiliates]);

  if (!a) {
    return (
      <AdminLayout role="lst">
        <AdminPageHeader
          title="お知らせが見つかりません"
          breadcrumbs={[
            { label: "LST HQ" },
            { label: "お知らせ配信", to: "/admin/lst/announcements" },
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
            onClick={() => navigate("/admin/lst/announcements")}
          >
            一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title={a.title}
        breadcrumbs={[
          { label: "お知らせ配信", to: "/admin/lst/announcements" },
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
            <InfoRow label="カテゴリ">{LST_ANNOUNCEMENT_CATEGORY_JP[a.category]}</InfoRow>
            <InfoRow label="配信日">{a.deliveryAt || "—"}</InfoRow>
            <InfoRow label="状態">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  LST_ANNOUNCEMENT_STATUS_BADGE_CLS[a.status],
                )}
              >
                {LST_ANNOUNCEMENT_STATUS_JP[a.status]}
              </span>
            </InfoRow>
            <InfoRow label="既読率">{a.readRate}%</InfoRow>
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="配信対象" />
          <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="対象モード">{LST_AUDIENCE_MODE_JP[a.audienceMode]}</InfoRow>
            {a.audienceMode === "affiliates" ? (
              <InfoRow label="対象加盟店">
                <div className="flex flex-wrap gap-1.5">
                  {affNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-full border bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </InfoRow>
            ) : null}
            {a.audienceMode === "skill_levels" && a.audienceSkillLevels ? (
              <InfoRow label="対象レベル">
                <div className="flex flex-wrap gap-1.5">
                  {a.audienceSkillLevels.map((lv) => (
                    <span
                      key={lv}
                      className="inline-flex items-center rounded-full border bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {SKILL_LEVEL_JP[lv as SkillLevel] ?? lv}
                    </span>
                  ))}
                </div>
              </InfoRow>
            ) : null}
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="本文" />
          <p className="whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
        </div>
      </div>

      <LstAnnouncementEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        announcement={a}
      />
      <LstAnnouncementDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        announcement={a}
        onDeleted={() => navigate("/admin/lst/announcements")}
      />
    </AdminLayout>
  );
};

export default LstAnnouncementDetail;
