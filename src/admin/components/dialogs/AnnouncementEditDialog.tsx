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
  updateAnnouncement,
  type AnnouncementRecord,
} from "../../lib/adminAnnouncementsStore";
import {
  ANNOUNCEMENT_AUDIENCE_JP,
  ANNOUNCEMENT_CATEGORY_JP,
  ANNOUNCEMENT_STATUS_JP,
  type AnnouncementAudience,
  type AnnouncementCategory,
  type AnnouncementStatus,
} from "../../lib/storeLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface AnnouncementEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: AnnouncementRecord;
}

const AnnouncementEditDialog = ({ open, onOpenChange, announcement }: AnnouncementEditDialogProps) => {
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const [category, setCategory] = useState<AnnouncementCategory>(announcement.category);
  const [status, setStatus] = useState<AnnouncementStatus>(announcement.status);
  const [audience, setAudience] = useState<AnnouncementAudience>(announcement.audience);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(announcement.title);
      setBody(announcement.body);
      setCategory(announcement.category);
      setStatus(announcement.status);
      setAudience(announcement.audience);
      setSubmitting(false);
    }
  }, [open, announcement]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    updateAnnouncement(announcement.id, {
      title: title.trim(),
      body: body.trim(),
      category,
      status,
      audience,
    });
    toast.success("お知らせを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>お知らせを編集</AdminDialogTitle>
          <AdminDialogDescription>
            {announcement.id} の情報を更新します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ann-edit-title">タイトル</Label>
            <Input
              id="ann-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-edit-body">本文</Label>
            <Textarea
              id="ann-edit-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ann-edit-category">カテゴリ</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AnnouncementCategory)}>
                <SelectTrigger id="ann-edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ANNOUNCEMENT_CATEGORY_JP) as AnnouncementCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {ANNOUNCEMENT_CATEGORY_JP[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-edit-status">状態</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AnnouncementStatus)}>
                <SelectTrigger id="ann-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ANNOUNCEMENT_STATUS_JP) as AnnouncementStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {ANNOUNCEMENT_STATUS_JP[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-edit-audience">対象</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as AnnouncementAudience)}>
                <SelectTrigger id="ann-edit-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ANNOUNCEMENT_AUDIENCE_JP) as AnnouncementAudience[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      {ANNOUNCEMENT_AUDIENCE_JP[a]}
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

export default AnnouncementEditDialog;
