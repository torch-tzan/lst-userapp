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
  LST_ANNOUNCEMENT_CATEGORY_JP,
  LST_ANNOUNCEMENT_STATUS_JP,
  LST_AUDIENCE_MODE_JP,
  updateLstAnnouncement,
  type LstAnnouncementCategory,
  type LstAnnouncementRecord,
  type LstAnnouncementStatus,
  type LstAudienceMode,
} from "../../lib/adminLstAnnouncementsStore";
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
  announcement: LstAnnouncementRecord;
}

const LstAnnouncementEditDialog = ({ open, onOpenChange, announcement }: Props) => {
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const [category, setCategory] = useState<LstAnnouncementCategory>(announcement.category);
  const [status, setStatus] = useState<LstAnnouncementStatus>(announcement.status);
  const [audienceMode, setAudienceMode] = useState<LstAudienceMode>(announcement.audienceMode);
  const [deliveryAt, setDeliveryAt] = useState(announcement.deliveryAt);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(announcement.title);
      setBody(announcement.body);
      setCategory(announcement.category);
      setStatus(announcement.status);
      setAudienceMode(announcement.audienceMode);
      setDeliveryAt(announcement.deliveryAt);
      setSubmitting(false);
    }
  }, [open, announcement]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    updateLstAnnouncement(announcement.id, {
      title: title.trim(),
      body: body.trim(),
      category,
      status,
      audienceMode,
      deliveryAt,
    });
    toast.success("お知らせを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>お知らせを編集</AdminDialogTitle>
          <AdminDialogDescription>{announcement.id} を更新します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="lan-edit-title">タイトル</Label>
            <Input id="lan-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lan-edit-body">本文</Label>
            <Textarea
              id="lan-edit-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lan-edit-category">カテゴリ</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as LstAnnouncementCategory)}
              >
                <SelectTrigger id="lan-edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LST_ANNOUNCEMENT_CATEGORY_JP) as LstAnnouncementCategory[]).map(
                    (c) => (
                      <SelectItem key={c} value={c}>
                        {LST_ANNOUNCEMENT_CATEGORY_JP[c]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lan-edit-status">状態</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LstAnnouncementStatus)}>
                <SelectTrigger id="lan-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LST_ANNOUNCEMENT_STATUS_JP) as LstAnnouncementStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {LST_ANNOUNCEMENT_STATUS_JP[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lan-edit-audience">配信対象</Label>
              <Select
                value={audienceMode}
                onValueChange={(v) => setAudienceMode(v as LstAudienceMode)}
              >
                <SelectTrigger id="lan-edit-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LST_AUDIENCE_MODE_JP) as LstAudienceMode[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {LST_AUDIENCE_MODE_JP[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lan-edit-delivery">配信日時</Label>
            <Input
              id="lan-edit-delivery"
              value={deliveryAt}
              onChange={(e) => setDeliveryAt(e.target.value)}
              placeholder="YYYY-MM-DD HH:mm"
            />
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

export default LstAnnouncementEditDialog;
