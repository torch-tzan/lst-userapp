import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useAffiliates } from "../../lib/adminAffiliatesStore";
import {
  addLstAnnouncement,
  LST_ANNOUNCEMENT_CATEGORY_JP,
  LST_AUDIENCE_MODE_JP,
  type LstAnnouncementCategory,
  type LstAudienceMode,
} from "../../lib/adminLstAnnouncementsStore";
import { SKILL_LEVEL_JP } from "../../lib/leagueLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface NewLstAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SKILL_LEVELS = Object.keys(SKILL_LEVEL_JP) as Array<keyof typeof SKILL_LEVEL_JP>;

const NewLstAnnouncementDialog = ({ open, onOpenChange }: NewLstAnnouncementDialogProps) => {
  const affiliates = useAffiliates();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<LstAnnouncementCategory>("notice");
  const [audienceMode, setAudienceMode] = useState<LstAudienceMode>("all");
  const [audienceAffiliateIds, setAudienceAffiliateIds] = useState<string[]>([]);
  const [audienceSkillLevels, setAudienceSkillLevels] = useState<string[]>([]);
  const [timing, setTiming] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setBody("");
      setCategory("notice");
      setAudienceMode("all");
      setAudienceAffiliateIds([]);
      setAudienceSkillLevels([]);
      setTiming("now");
      setScheduledAt("");
      setSubmitting(false);
    }
  }, [open]);

  const toggleAffiliate = (id: string) => {
    setAudienceAffiliateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSkillLevel = (lv: string) => {
    setAudienceSkillLevels((prev) =>
      prev.includes(lv) ? prev.filter((x) => x !== lv) : [...prev, lv],
    );
  };

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (title.trim().length === 0) return false;
    if (body.trim().length === 0) return false;
    if (timing === "scheduled" && scheduledAt.length === 0) return false;
    if (audienceMode === "affiliates" && audienceAffiliateIds.length === 0) return false;
    if (audienceMode === "skill_levels" && audienceSkillLevels.length === 0) return false;
    return true;
  }, [
    submitting,
    title,
    body,
    timing,
    scheduledAt,
    audienceMode,
    audienceAffiliateIds.length,
    audienceSkillLevels.length,
  ]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const now = new Date();
    const deliveryAt =
      timing === "now"
        ? `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`
        : scheduledAt.replace("T", " ");
    addLstAnnouncement({
      title: title.trim(),
      body: body.trim(),
      category,
      status: timing === "now" ? "published" : "scheduled",
      deliveryAt,
      audienceMode,
      audienceAffiliateIds: audienceMode === "affiliates" ? audienceAffiliateIds : undefined,
      audienceSkillLevels: audienceMode === "skill_levels" ? audienceSkillLevels : undefined,
    });
    toast.success(timing === "now" ? "お知らせを公開しました" : "お知らせを予約しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>新規お知らせ（LST HQ）</AdminDialogTitle>
          <AdminDialogDescription>
            LST 本部から配信するお知らせを作成します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="lan-title">タイトル</Label>
            <Input id="lan-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lan-body">本文</Label>
            <Textarea
              id="lan-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lan-category">カテゴリ</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as LstAnnouncementCategory)}>
              <SelectTrigger id="lan-category">
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
            <Label>配信対象</Label>
            <RadioGroup
              value={audienceMode}
              onValueChange={(v) => setAudienceMode(v as LstAudienceMode)}
              className="grid grid-cols-2 gap-2"
            >
              {(Object.keys(LST_AUDIENCE_MODE_JP) as LstAudienceMode[]).map((m) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <RadioGroupItem value={m} id={`aud-${m}`} />
                  <span>{LST_AUDIENCE_MODE_JP[m]}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {audienceMode === "affiliates" ? (
            <div className="space-y-1.5">
              <Label>対象加盟店</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                {affiliates.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <Checkbox
                      checked={audienceAffiliateIds.includes(a.id)}
                      onCheckedChange={() => toggleAffiliate(a.id)}
                    />
                    <span>{a.storeName}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {audienceMode === "skill_levels" ? (
            <div className="space-y-1.5">
              <Label>対象スキルレベル</Label>
              <div className="flex flex-wrap gap-2 rounded-md border p-2">
                {SKILL_LEVELS.map((lv) => (
                  <label
                    key={lv}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={audienceSkillLevels.includes(lv)}
                      onCheckedChange={() => toggleSkillLevel(lv)}
                    />
                    <span>{SKILL_LEVEL_JP[lv]}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="lan-timing">配信タイミング</Label>
            <Select value={timing} onValueChange={(v) => setTiming(v as typeof timing)}>
              <SelectTrigger id="lan-timing">
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
              <Label htmlFor="lan-scheduled-at">予約日時</Label>
              <Input
                id="lan-scheduled-at"
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

export default NewLstAnnouncementDialog;
