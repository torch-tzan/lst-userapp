import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  CAMPAIGN_PLACEHOLDER_IMAGE,
  updateCampaign,
  type CampaignRecord,
} from "../../lib/adminCampaignsStore";
import { upsertCouponFromCampaign } from "../../lib/adminCouponsStore";
import {
  CAMPAIGN_AUDIENCE_JP,
  CAMPAIGN_KIND_JP,
  CAMPAIGN_STATUS_JP,
  type CampaignAudience,
  type CampaignKind,
  type CampaignStatus,
} from "../../lib/storeLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface CampaignEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignRecord;
}

const CampaignEditDialog = ({ open, onOpenChange, campaign }: CampaignEditDialogProps) => {
  const [title, setTitle] = useState(campaign.title);
  const [description, setDescription] = useState(campaign.description);
  const [kind, setKind] = useState<CampaignKind>(campaign.kind);
  const [startDate, setStartDate] = useState(campaign.startDate);
  const [endDate, setEndDate] = useState(campaign.endDate);
  const [status, setStatus] = useState<CampaignStatus>(campaign.status);
  const [audience, setAudience] = useState<CampaignAudience>(campaign.audience);
  const [imageUrl, setImageUrl] = useState(campaign.imageUrl ?? "");
  const [subtitle, setSubtitle] = useState(campaign.subtitle ?? "");
  const [body, setBody] = useState(campaign.body ?? "");
  const [location, setLocation] = useState(campaign.location ?? "");
  const [ctaLabel, setCtaLabel] = useState(campaign.ctaLabel ?? "");
  const [ctaLink, setCtaLink] = useState(campaign.ctaLink ?? "");
  const [discountPercent, setDiscountPercent] = useState(
    campaign.discountPercent !== undefined ? String(campaign.discountPercent) : "",
  );
  const [discountAmount, setDiscountAmount] = useState(
    campaign.discountAmount !== undefined ? String(campaign.discountAmount) : "",
  );
  const [couponCode, setCouponCode] = useState(campaign.couponCode ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(campaign.title);
      setDescription(campaign.description);
      setKind(campaign.kind);
      setStartDate(campaign.startDate);
      setEndDate(campaign.endDate);
      setStatus(campaign.status);
      setAudience(campaign.audience);
      setImageUrl(campaign.imageUrl ?? "");
      setSubtitle(campaign.subtitle ?? "");
      setBody(campaign.body ?? "");
      setLocation(campaign.location ?? "");
      setCtaLabel(campaign.ctaLabel ?? "");
      setCtaLink(campaign.ctaLink ?? "");
      setDiscountPercent(
        campaign.discountPercent !== undefined ? String(campaign.discountPercent) : "",
      );
      setDiscountAmount(
        campaign.discountAmount !== undefined ? String(campaign.discountAmount) : "",
      );
      setCouponCode(campaign.couponCode ?? "");
      setSubmitting(false);
    }
  }, [open, campaign]);

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const trimmedCode =
      kind === "coupon" && couponCode.trim().length > 0 ? couponCode.trim() : undefined;
    const trimmedAmount =
      kind === "coupon" && discountAmount ? Number.parseInt(discountAmount, 10) : undefined;
    const trimmedPercent =
      kind === "discount" && discountPercent ? Number.parseInt(discountPercent, 10) : undefined;

    updateCampaign(campaign.id, {
      title: title.trim(),
      description: description.trim(),
      kind,
      startDate,
      endDate,
      status,
      audience,
      imageUrl: imageUrl.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      body: body.trim() || undefined,
      location: location.trim() || undefined,
      ctaLabel: ctaLabel.trim() || undefined,
      ctaLink: ctaLink.trim() || undefined,
      discountPercent: trimmedPercent,
      discountAmount: trimmedAmount,
      couponCode: trimmedCode,
    });

    // Campaign → Coupon linkage（kind=coupon かつ couponCode 入力ありの場合 upsert）
    if (kind === "coupon" && trimmedCode) {
      upsertCouponFromCampaign({
        campaignId: campaign.id,
        code: trimmedCode,
        label: title.trim(),
        description: description.trim(),
        type: "fixed",
        discount: trimmedAmount ?? 0,
        validFrom: startDate,
        expiresAt: endDate,
        isActive: status === "active" || status === "scheduled",
      });
    }

    toast.success("キャンペーンを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>キャンペーンを編集</AdminDialogTitle>
          <AdminDialogDescription>{campaign.id} を更新します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="cp-edit-title">タイトル</Label>
            <Input
              id="cp-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-edit-subtitle">サブタイトル</Label>
            <Input
              id="cp-edit-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-edit-desc">説明（短文）</Label>
            <Textarea
              id="cp-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-edit-body">本文</Label>
            <Textarea
              id="cp-edit-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-edit-image">画像 URL</Label>
            <Input
              id="cp-edit-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
            <div className="mt-1.5 flex h-[108px] w-[192px] items-center justify-center overflow-hidden rounded border bg-slate-50">
              <img
                src={imageUrl.trim() || CAMPAIGN_PLACEHOLDER_IMAGE}
                alt="プレビュー"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-edit-location">開催場所</Label>
            <Input
              id="cp-edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-start">開始日</Label>
              <Input
                id="cp-edit-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-end">終了日</Label>
              <Input
                id="cp-edit-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-kind">種別</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as CampaignKind)}>
                <SelectTrigger id="cp-edit-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CAMPAIGN_KIND_JP) as CampaignKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {CAMPAIGN_KIND_JP[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-status">状態</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
                <SelectTrigger id="cp-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CAMPAIGN_STATUS_JP) as CampaignStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {CAMPAIGN_STATUS_JP[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-audience">対象</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as CampaignAudience)}>
                <SelectTrigger id="cp-edit-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CAMPAIGN_AUDIENCE_JP) as CampaignAudience[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      {CAMPAIGN_AUDIENCE_JP[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {kind === "discount" ? (
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-percent">割引率（%）</Label>
              <Input
                id="cp-edit-percent"
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>
          ) : null}

          {kind === "coupon" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cp-edit-amount">割引額（円）</Label>
                <Input
                  id="cp-edit-amount"
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-edit-code">クーポンコード</Label>
                <Input
                  id="cp-edit-code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-cta-label">CTA ラベル</Label>
              <Input
                id="cp-edit-cta-label"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="予約する"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-cta-link">CTA リンク</Label>
              <Input
                id="cp-edit-cta-link"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="/search"
              />
            </div>
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            更新する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default CampaignEditDialog;
