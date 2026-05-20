import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import LstCampaignDeleteDialog from "../../../components/dialogs/LstCampaignDeleteDialog";
import LstCampaignEditDialog from "../../../components/dialogs/LstCampaignEditDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAffiliates } from "../../../lib/adminAffiliatesStore";
import {
  LST_CAMPAIGN_KIND_JP,
  LST_CAMPAIGN_STATUS_BADGE_CLS,
  LST_CAMPAIGN_STATUS_JP,
  useLstCampaign,
} from "../../../lib/adminLstCampaignsStore";

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

const LstCampaignDetailAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const c = useLstCampaign(id);
  const affiliates = useAffiliates();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const targetAffiliates = useMemo(() => {
    if (!c) return [];
    return c.affiliateIds.map((aid) => {
      const found = affiliates.find((a) => a.id === aid);
      return { id: aid, name: found?.storeName ?? aid };
    });
  }, [c, affiliates]);

  if (!c) {
    return (
      <AdminLayout role="lst">
        <AdminPageHeader
          title="キャンペーンが見つかりません"
          breadcrumbs={[
            { label: "LST HQ" },
            { label: "キャンペーン", to: "/admin/lst/campaigns" },
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
            onClick={() => navigate("/admin/lst/campaigns")}
          >
            一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const isAll = c.affiliateIds.length === affiliates.length;

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title={c.title}
        breadcrumbs={[
          { label: "キャンペーン", to: "/admin/lst/campaigns" },
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
          <SectionHeader title="基本情報" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="ID">
              <span className="font-mono text-xs">{c.id}</span>
            </InfoRow>
            <InfoRow label="種別">{LST_CAMPAIGN_KIND_JP[c.kind]}</InfoRow>
            <InfoRow label="期間">
              {c.startDate} 〜 {c.endDate}
            </InfoRow>
            <InfoRow label="状態">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  LST_CAMPAIGN_STATUS_BADGE_CLS[c.status],
                )}
              >
                {LST_CAMPAIGN_STATUS_JP[c.status]}
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

        <div className={cardCls}>
          <SectionHeader title="配信加盟店" />
          <div className="mb-3 text-sm text-slate-600">
            {isAll
              ? `全 ${c.affiliateIds.length} 店舗（全店配信）`
              : `${c.affiliateIds.length} 店舗`}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {targetAffiliates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/admin/lst/affiliates/${t.id}`)}
                className="inline-flex items-center rounded-full border bg-slate-50 px-2 py-0.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

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
              <div className="text-xs text-slate-500">配信店舗数</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {c.affiliateIds.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LstCampaignEditDialog open={editOpen} onOpenChange={setEditOpen} campaign={c} />
      <LstCampaignDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        campaign={c}
        onDeleted={() => navigate("/admin/lst/campaigns")}
      />
    </AdminLayout>
  );
};

export default LstCampaignDetailAdmin;
