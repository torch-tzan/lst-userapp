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

import { CAMPAIGN_PLACEHOLDER_IMAGE } from "../../lib/adminCampaignsStore";
import {
  LST_CAMPAIGN_KIND_JP,
  LST_CAMPAIGN_STATUS_JP,
  updateLstCampaign,
  type LstCampaignKind,
  type LstCampaignRecord,
  type LstCampaignStatus,
} from "../../lib/adminLstCampaignsStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: LstCampaignRecord;
}

const LstCampaignEditDialog = ({ open, onOpenChange, campaign }: Props) => {
  const [title, setTitle] = useState(campaign.title);
  const [description, setDescription] = useState(campaign.description);
  const [kind, setKind] = useState<LstCampaignKind>(campaign.kind);
  const [startDate, setStartDate] = useState(campaign.startDate);
  const [endDate, setEndDate] = useState(campaign.endDate);
  const [status, setStatus] = useState<LstCampaignStatus>(campaign.status);
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
      (kind === "discount" || kind === "premium") && discountPercent
        ? Number.parseInt(discountPercent, 10)
        : undefined;

    updateLstCampaign(campaign.id, {
      title: title.trim(),
      description: description.trim(),
      kind,
      startDate,
      endDate,
      status,
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

    toast.success("キャンペーンを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>キャンペーンを編集</AdminDialogTitle>
          <AdminDialogDescription>{campaign.id} を更新します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="lcp-edit-title">タイトル</Label>
            <Input id="lcp-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lcp-edit-subtitle">サブタイトル</Label>
            <Input
              id="lcp-edit-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lcp-edit-desc">説明（短文）</Label>
            <Textarea
              id="lcp-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lcp-edit-body">本文</Label>
            <Textarea
              id="lcp-edit-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lcp-edit-image">画像 URL</Label>
            <Input
              id="lcp-edit-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
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
            <Label htmlFor="lcp-edit-location">開催場所</Label>
            <Input
              id="lcp-edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lcp-edit-start">開始日</Label>
              <Input
                id="lcp-edit-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lcp-edit-end">終了日</Label>
              <Input
                id="lcp-edit-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lcp-edit-kind">種別</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as LstCampaignKind)}>
                <SelectTrigger id="lcp-edit-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LST_CAMPAIGN_KIND_JP) as LstCampaignKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {LST_CAMPAIGN_KIND_JP[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lcp-edit-status">状態</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LstCampaignStatus)}>
                <SelectTrigger id="lcp-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LST_CAMPAIGN_STATUS_JP) as LstCampaignStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {LST_CAMPAIGN_STATUS_JP[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {kind === "discount" || kind === "premium" ? (
            <div className="space-y-1.5">
              <Label htmlFor="lcp-edit-percent">割引率（%）</Label>
              <Input
                id="lcp-edit-percent"
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
                <Label htmlFor="lcp-edit-amount">割引額（円）</Label>
                <Input
                  id="lcp-edit-amount"
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lcp-edit-code">クーポンコード</Label>
                <Input
                  id="lcp-edit-code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lcp-edit-cta-label">CTA ラベル</Label>
              <Input
                id="lcp-edit-cta-label"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lcp-edit-cta-link">CTA リンク</Label>
              <Input
                id="lcp-edit-cta-link"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
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

export default LstCampaignEditDialog;
