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

import { addCampaign, CAMPAIGN_PLACEHOLDER_IMAGE } from "../../lib/adminCampaignsStore";
import {
  CAMPAIGN_AUDIENCE_JP,
  CAMPAIGN_KIND_JP,
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

interface NewCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewCampaignDialog = ({ open, onOpenChange }: NewCampaignDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<CampaignKind>("discount");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [audience, setAudience] = useState<CampaignAudience>("all");
  const [imageUrl, setImageUrl] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [location, setLocation] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setKind("discount");
      setStartDate("");
      setEndDate("");
      setDiscountPercent("");
      setDiscountAmount("");
      setCouponCode("");
      setAudience("all");
      setImageUrl("");
      setSubtitle("");
      setBody("");
      setLocation("");
      setCtaLabel("");
      setCtaLink("");
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit =
    title.trim().length > 0 &&
    startDate.length > 0 &&
    endDate.length > 0 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);

    // 開始日に基づいて status を判定
    const TODAY = new Date(2026, 4, 21).toISOString().slice(0, 10);
    const status: CampaignStatus =
      startDate > TODAY ? "scheduled" : endDate < TODAY ? "ended" : "active";

    const trimmedCode =
      kind === "coupon" && couponCode.trim().length > 0 ? couponCode.trim() : undefined;
    const trimmedAmount =
      kind === "coupon" && discountAmount ? Number.parseInt(discountAmount, 10) : undefined;
    const trimmedPercent =
      kind === "discount" && discountPercent ? Number.parseInt(discountPercent, 10) : undefined;

    addCampaign({
      title: title.trim(),
      description: description.trim(),
      kind,
      startDate,
      endDate,
      status,
      discountPercent: trimmedPercent,
      discountAmount: trimmedAmount,
      couponCode: trimmedCode,
      audience,
      imageUrl: imageUrl.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      body: body.trim() || undefined,
      location: location.trim() || undefined,
      ctaLabel: ctaLabel.trim() || undefined,
      ctaLink: ctaLink.trim() || undefined,
    });

    toast.success("キャンペーンを作成しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>新規キャンペーン</AdminDialogTitle>
          <AdminDialogDescription>キャンペーンやイベントを作成します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="cp-title">タイトル</Label>
            <Input id="cp-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-subtitle">サブタイトル</Label>
            <Input
              id="cp-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="例: 初回予約で"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-desc">説明（短文）</Label>
            <Textarea
              id="cp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-body">本文</Label>
            <Textarea
              id="cp-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="キャンペーン詳細（改行可）"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-image">画像 URL</Label>
            <Input
              id="cp-image"
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
            <Label htmlFor="cp-location">開催場所</Label>
            <Input
              id="cp-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: パデルコート広島 コートA"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-kind">種別</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as CampaignKind)}>
              <SelectTrigger id="cp-kind">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cp-start">開始日</Label>
              <Input
                id="cp-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-end">終了日</Label>
              <Input
                id="cp-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {kind === "discount" ? (
            <div className="space-y-1.5">
              <Label htmlFor="cp-percent">割引率（%）</Label>
              <Input
                id="cp-percent"
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="例: 15"
              />
            </div>
          ) : null}

          {kind === "coupon" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cp-amount">割引額（円）</Label>
                <Input
                  id="cp-amount"
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-code">クーポンコード</Label>
                <Input
                  id="cp-code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="SUMMER500"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="cp-audience">対象</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as CampaignAudience)}>
              <SelectTrigger id="cp-audience">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cp-cta-label">CTA ラベル</Label>
              <Input
                id="cp-cta-label"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="予約する"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-cta-link">CTA リンク</Label>
              <Input
                id="cp-cta-link"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="/search or https://..."
              />
            </div>
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            作成する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default NewCampaignDialog;
