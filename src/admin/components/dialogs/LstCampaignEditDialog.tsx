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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(campaign.title);
      setDescription(campaign.description);
      setKind(campaign.kind);
      setStartDate(campaign.startDate);
      setEndDate(campaign.endDate);
      setStatus(campaign.status);
      setSubmitting(false);
    }
  }, [open, campaign]);

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    updateLstCampaign(campaign.id, {
      title: title.trim(),
      description: description.trim(),
      kind,
      startDate,
      endDate,
      status,
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
            <Label htmlFor="lcp-edit-title">タイトル</Label>
            <Input id="lcp-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lcp-edit-desc">説明</Label>
            <Textarea
              id="lcp-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
