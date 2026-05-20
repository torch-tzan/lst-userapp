import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import { useAffiliates } from "../../lib/adminAffiliatesStore";
import { CAMPAIGN_PLACEHOLDER_IMAGE } from "../../lib/adminCampaignsStore";
import { upsertCouponFromCampaign } from "../../lib/adminCouponsStore";
import {
  addLstCampaign,
  LST_CAMPAIGN_KIND_JP,
  type LstCampaignKind,
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
}

const TODAY = new Date(2026, 4, 21).toISOString().slice(0, 10);

const NewLstCampaignDialog = ({ open, onOpenChange }: Props) => {
  const affiliates = useAffiliates();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<LstCampaignKind>("discount");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [allAffiliates, setAllAffiliates] = useState(true);
  const [selectedAffiliateIds, setSelectedAffiliateIds] = useState<string[]>([]);
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
      setAllAffiliates(true);
      setSelectedAffiliateIds([]);
      setImageUrl("");
      setSubtitle("");
      setBody("");
      setLocation("");
      setCtaLabel("");
      setCtaLink("");
      setSubmitting(false);
    }
  }, [open]);

  const toggleAffiliate = (id: string) => {
    setSelectedAffiliateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (title.trim().length === 0) return false;
    if (startDate.length === 0 || endDate.length === 0) return false;
    if (!allAffiliates && selectedAffiliateIds.length === 0) return false;
    return true;
  }, [submitting, title, startDate, endDate, allAffiliates, selectedAffiliateIds.length]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const status: LstCampaignStatus =
      startDate > TODAY ? "scheduled" : endDate < TODAY ? "ended" : "active";

    const affiliateIds = allAffiliates ? affiliates.map((a) => a.id) : selectedAffiliateIds;
    const trimmedCode =
      kind === "coupon" && couponCode.trim().length > 0 ? couponCode.trim() : undefined;
    const trimmedAmount =
      kind === "coupon" && discountAmount ? Number.parseInt(discountAmount, 10) : undefined;
    const trimmedPercent =
      (kind === "discount" || kind === "premium") && discountPercent
        ? Number.parseInt(discountPercent, 10)
        : undefined;

    const id = addLstCampaign({
      title: title.trim(),
      description: description.trim(),
      kind,
      startDate,
      endDate,
      status,
      affiliateIds,
      discountPercent: trimmedPercent,
      discountAmount: trimmedAmount,
      couponCode: trimmedCode,
      imageUrl: imageUrl.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      body: body.trim() || undefined,
      location: location.trim() || undefined,
      ctaLabel: ctaLabel.trim() || undefined,
      ctaLink: ctaLink.trim() || undefined,
    });

    // Campaign → Coupon linkage
    if (kind === "coupon" && trimmedCode) {
      upsertCouponFromCampaign({
        campaignId: id,
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

    toast.success("キャンペーンを作成しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-lg">
        <AdminDialogHeader>
          <AdminDialogTitle>新規キャンペーン（LST HQ）</AdminDialogTitle>
          <AdminDialogDescription>
            LST 本部から全国の加盟店へ展開するキャンペーンを作成します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="lcp-title">タイトル</Label>
            <Input id="lcp-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lcp-subtitle">サブタイトル</Label>
            <Input
              id="lcp-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lcp-desc">説明（短文）</Label>
            <Textarea
              id="lcp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lcp-body">本文</Label>
            <Textarea
              id="lcp-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lcp-image">画像 URL</Label>
            <Input
              id="lcp-image"
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
            <Label htmlFor="lcp-location">開催場所</Label>
            <Input
              id="lcp-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lcp-kind">種別</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as LstCampaignKind)}>
              <SelectTrigger id="lcp-kind">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lcp-start">開始日</Label>
              <Input
                id="lcp-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lcp-end">終了日</Label>
              <Input
                id="lcp-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {kind === "discount" || kind === "premium" ? (
            <div className="space-y-1.5">
              <Label htmlFor="lcp-percent">割引率（%）</Label>
              <Input
                id="lcp-percent"
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
                <Label htmlFor="lcp-amount">割引額（円）</Label>
                <Input
                  id="lcp-amount"
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lcp-code">クーポンコード</Label>
                <Input
                  id="lcp-code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="SUMMER500"
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lcp-cta-label">CTA ラベル</Label>
              <Input
                id="lcp-cta-label"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="予約する"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lcp-cta-link">CTA リンク</Label>
              <Input
                id="lcp-cta-link"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="/search"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>配信加盟店</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm">
              <Checkbox
                checked={allAffiliates}
                onCheckedChange={(v) => setAllAffiliates(v === true)}
              />
              <span>全店舗（{affiliates.length}店）に配信</span>
            </label>
            {!allAffiliates ? (
              <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                {affiliates.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <Checkbox
                      checked={selectedAffiliateIds.includes(a.id)}
                      onCheckedChange={() => toggleAffiliate(a.id)}
                    />
                    <span>{a.storeName}</span>
                  </label>
                ))}
              </div>
            ) : null}
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

export default NewLstCampaignDialog;
