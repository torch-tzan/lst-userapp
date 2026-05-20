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

import { addAnnouncement } from "../../lib/adminAnnouncementsStore";
import {
  ANNOUNCEMENT_AUDIENCE_JP,
  ANNOUNCEMENT_CATEGORY_JP,
  type AnnouncementAudience,
  type AnnouncementCategory,
} from "../../lib/storeLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface NewAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewAnnouncementDialog = ({ open, onOpenChange }: NewAnnouncementDialogProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("notice");
  const [timing, setTiming] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setBody("");
      setCategory("notice");
      setTiming("now");
      setScheduledAt("");
      setAudience("all");
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (timing === "now" || scheduledAt.length > 0) &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const now = new Date();
    const deliveryAt =
      timing === "now"
        ? `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`
        : scheduledAt.replace("T", " ");
    addAnnouncement({
      title: title.trim(),
      body: body.trim(),
      category,
      status: timing === "now" ? "published" : "scheduled",
      deliveryAt,
      audience,
    });
    toast.success(timing === "now" ? "お知らせを公開しました" : "お知らせを予約しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>新規お知らせ</AdminDialogTitle>
          <AdminDialogDescription>会員へのお知らせを作成します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">タイトル</Label>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ann-body">本文</Label>
            <Textarea
              id="ann-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ann-category">カテゴリ</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AnnouncementCategory)}>
                <SelectTrigger id="ann-category">
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
              <Label htmlFor="ann-audience">対象者</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as AnnouncementAudience)}>
                <SelectTrigger id="ann-audience">
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

          <div className="space-y-1.5">
            <Label htmlFor="ann-timing">配信タイミング</Label>
            <Select value={timing} onValueChange={(v) => setTiming(v as typeof timing)}>
              <SelectTrigger id="ann-timing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">即時</SelectItem>
                <SelectItem value="scheduled">予約</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {timing === "scheduled" ? (
            <div className="space-y-1.5">
              <Label htmlFor="ann-scheduled-at">予約日時</Label>
              <Input
                id="ann-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {timing === "now" ? "公開する" : "予約する"}
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default NewAnnouncementDialog;
