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

import { addCampaign } from "../../lib/adminCampaignsStore";
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

    addCampaign({
      title: title.trim(),
      description: description.trim(),
      kind,
      startDate,
      endDate,
      status,
      discountPercent: kind === "discount" && discountPercent
        ? Number.parseInt(discountPercent, 10)
        : undefined,
      discountAmount: kind === "coupon" && discountAmount
        ? Number.parseInt(discountAmount, 10)
        : undefined,
      couponCode: kind === "coupon" && couponCode ? couponCode.trim() : undefined,
      audience,
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

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cp-title">タイトル</Label>
            <Input id="cp-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-desc">説明</Label>
            <Textarea
              id="cp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
