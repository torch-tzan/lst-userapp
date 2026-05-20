import { Pencil, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import CouponDeleteDialog from "../../../components/dialogs/CouponDeleteDialog";
import CouponEditDialog from "../../../components/dialogs/CouponEditDialog";
import CouponToggleDialog from "../../../components/dialogs/CouponToggleDialog";

import { useAdminCoupon } from "../../../lib/adminCouponsStore";

const TODAY = "2026-05-21";

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

const formatDate = (d: string): string => d.replace(/-/g, "/");

const CouponDetail = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const decodedCode = code ? decodeURIComponent(code) : undefined;
  const coupon = useAdminCoupon(decodedCode);

  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!coupon) {
    return (
      <AdminLayout role="lst">
        <AdminPageHeader
          title="クーポンが見つかりません"
          breadcrumbs={[
            { label: "LST HQ" },
            { label: "クーポン管理", to: "/admin/lst/coupons" },
            { label: decodedCode ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定されたコード（<span className="font-mono">{decodedCode}</span>）が見つかりませんでした。
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate("/admin/lst/coupons")}
          >
            一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const isExpired = coupon.expiresAt < TODAY;
  const stateLabel = !coupon.isActive
    ? "無効"
    : isExpired
      ? "期限切れ"
      : "アクティブ";
  const stateCls = !coupon.isActive
    ? "bg-gray-100 text-gray-600 border-gray-200"
    : isExpired
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title={coupon.label}
        breadcrumbs={[
          { label: "LST HQ" },
          { label: "クーポン管理", to: "/admin/lst/coupons" },
          { label: coupon.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              編集
            </Button>
            <Button variant="outline" onClick={() => setToggleOpen(true)}>
              <Power className="mr-1.5 h-4 w-4" />
              {coupon.isActive ? "無効化" : "有効化"}
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
          <div className="grid grid-cols-[140px_1fr_140px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="コード">
              <span className="font-mono font-semibold tracking-wide">{coupon.code}</span>
            </InfoRow>
            <InfoRow label="ラベル">{coupon.label}</InfoRow>
            <InfoRow label="種別">
              {coupon.type === "percent" ? "% パーセント" : "円 固定額"}
            </InfoRow>
            <InfoRow label="値">
              {coupon.type === "percent"
                ? `${Math.round(coupon.discount * 100)}%`
                : `¥${coupon.discount.toLocaleString("ja-JP")}`}
            </InfoRow>
            <InfoRow label="最低利用金額">
              {coupon.minAmount
                ? `¥${coupon.minAmount.toLocaleString("ja-JP")}`
                : "—"}
            </InfoRow>
            <InfoRow label="状態">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  stateCls,
                )}
              >
                {stateLabel}
              </span>
            </InfoRow>
            <InfoRow label="有効開始">{formatDate(coupon.validFrom)}</InfoRow>
            <InfoRow label="有効終了">{formatDate(coupon.expiresAt)}</InfoRow>
          </div>
          {coupon.description ? (
            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
              {coupon.description}
            </p>
          ) : null}
        </div>

        <div className={cardCls}>
          <SectionHeader title="利用状況" />
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500">使用回数</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {coupon.currentUsage.toLocaleString("ja-JP")}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">利用上限</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {coupon.usageLimit !== undefined
                  ? coupon.usageLimit.toLocaleString("ja-JP")
                  : "無制限"}
              </div>
            </div>
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="関連" />
          <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="ソース">
              {coupon.source === "manual" ? "手動作成" : "キャンペーン由来"}
            </InfoRow>
            <InfoRow label="紐付けキャンペーン">
              {coupon.linkedCampaignId ? (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/lst/campaigns/${coupon.linkedCampaignId}`)}
                  className="font-mono text-blue-700 hover:text-blue-900 hover:underline"
                >
                  {coupon.linkedCampaignId}
                </button>
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow label="作成日">
              {new Date(coupon.createdAt).toLocaleDateString("ja-JP")}
            </InfoRow>
          </div>
        </div>
      </div>

      <CouponEditDialog open={editOpen} onOpenChange={setEditOpen} coupon={coupon} />
      <CouponToggleDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        coupon={coupon}
      />
      <CouponDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        coupon={coupon}
        onDeleted={() => navigate("/admin/lst/coupons")}
      />
    </AdminLayout>
  );
};

export default CouponDetail;
