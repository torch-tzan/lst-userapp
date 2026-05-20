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

import { updateCampaign, type CampaignRecord } from "../../lib/adminCampaignsStore";
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
      setSubmitting(false);
    }
  }, [open, campaign]);

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    updateCampaign(campaign.id, {
      title: title.trim(),
      description: description.trim(),
      kind,
      startDate,
      endDate,
      status,
      audience,
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

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cp-edit-title">タイトル</Label>
            <Input
              id="cp-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-edit-desc">説明</Label>
            <Textarea
              id="cp-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
