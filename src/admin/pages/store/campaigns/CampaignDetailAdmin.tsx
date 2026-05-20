import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import CampaignDeleteDialog from "../../../components/dialogs/CampaignDeleteDialog";
import CampaignEditDialog from "../../../components/dialogs/CampaignEditDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  CAMPAIGN_PLACEHOLDER_IMAGE,
  useAdminCampaign,
} from "../../../lib/adminCampaignsStore";
import {
  CAMPAIGN_AUDIENCE_JP,
  CAMPAIGN_KIND_JP,
  CAMPAIGN_STATUS_BADGE_CLS,
  CAMPAIGN_STATUS_JP,
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

const CampaignDetailAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const c = useAdminCampaign(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!c) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="キャンペーンが見つかりません"
          breadcrumbs={[
            { label: "店舗管理" },
            { label: "キャンペーン", to: "/admin/store/campaigns" },
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
            onClick={() => navigate("/admin/store/campaigns")}
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
        title={c.title}
        breadcrumbs={[
          { label: "店舗管理" },
          { label: "キャンペーン", to: "/admin/store/campaigns" },
          { label: c.title },
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

      <div className="mx-auto max-w-[1000px] space-y-6">
        <div className={cardCls}>
          <SectionHeader title="ヒーロー画像" />
          <div className="aspect-[16/9] w-full max-w-[480px] overflow-hidden rounded-md border bg-slate-50">
            <img
              src={c.imageUrl ?? CAMPAIGN_PLACEHOLDER_IMAGE}
              alt={c.title}
              className="h-full w-full object-cover"
            />
          </div>
          {c.subtitle ? (
            <p className="mt-3 text-sm text-slate-600">サブタイトル: {c.subtitle}</p>
          ) : null}
          {c.location ? (
            <p className="mt-1.5 text-sm text-slate-600">開催場所: {c.location}</p>
          ) : null}
          {c.ctaLabel || c.ctaLink ? (
            <p className="mt-1.5 text-xs text-slate-500">
              CTA: <span className="font-medium text-slate-700">{c.ctaLabel ?? "—"}</span>
              {c.ctaLink ? <> → <span className="font-mono">{c.ctaLink}</span></> : null}
            </p>
          ) : null}
        </div>

        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="ID">
              <span className="font-mono text-xs">{c.id}</span>
            </InfoRow>
            <InfoRow label="種別">{CAMPAIGN_KIND_JP[c.kind]}</InfoRow>
            <InfoRow label="期間">
              {c.startDate} 〜 {c.endDate}
            </InfoRow>
            <InfoRow label="対象">{CAMPAIGN_AUDIENCE_JP[c.audience]}</InfoRow>
            <InfoRow label="状態">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  CAMPAIGN_STATUS_BADGE_CLS[c.status],
                )}
              >
                {CAMPAIGN_STATUS_JP[c.status]}
              </span>
            </InfoRow>
            {c.discountPercent !== undefined ? (
              <InfoRow label="割引率">{c.discountPercent}%</InfoRow>
            ) : null}
            {c.discountAmount !== undefined ? (
              <InfoRow label="割引額">¥{c.discountAmount.toLocaleString("ja-JP")}</InfoRow>
            ) : null}
            {c.couponCode ? (
              <InfoRow label="クーポンコード">
                <span className="font-mono">{c.couponCode}</span>
              </InfoRow>
            ) : null}
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="説明" />
          <p className="whitespace-pre-wrap text-sm text-slate-700">{c.description}</p>
        </div>

        {c.body ? (
          <div className={cardCls}>
            <SectionHeader title="本文" />
            <p className="whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
          </div>
        ) : null}

        <div className={cardCls}>
          <SectionHeader title="統計" />
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500">利用数</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {c.usageCount.toLocaleString("ja-JP")}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">コンバージョン率</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {c.conversionRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <CampaignEditDialog open={editOpen} onOpenChange={setEditOpen} campaign={c} />
      <CampaignDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        campaign={c}
        onDeleted={() => navigate("/admin/store/campaigns")}
      />
    </AdminLayout>
  );
};

export default CampaignDetailAdmin;
