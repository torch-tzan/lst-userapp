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
import { Switch } from "@/components/ui/switch";
import type { CoachSummary } from "@/lib/coachData";

import { updateCoachOverlay } from "../../lib/adminCoachesOverlay";
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
  coach: CoachSummary;
}

const LEVEL_OPTIONS = ["S級", "A級", "B級", "C級"];

const CoachEditDialog = ({ open, onOpenChange, coach }: Props) => {
  const [name, setName] = useState(coach.name);
  const [level, setLevel] = useState(coach.level);
  const [specialty, setSpecialty] = useState(coach.specialty.join(", "));
  const [area, setArea] = useState(coach.area);
  const [pricePerHour, setPricePerHour] = useState(String(coach.pricePerHour));
  const [onlineAvailable, setOnlineAvailable] = useState(coach.onlineAvailable);
  const [reviewAvailable, setReviewAvailable] = useState(coach.reviewAvailable);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(coach.name);
      setLevel(coach.level);
      setSpecialty(coach.specialty.join(", "));
      setArea(coach.area);
      setPricePerHour(String(coach.pricePerHour));
      setOnlineAvailable(coach.onlineAvailable);
      setReviewAvailable(coach.reviewAvailable);
      setSubmitting(false);
    }
  }, [open, coach]);

  const priceNum = Number.parseInt(pricePerHour, 10);
  const canSubmit =
    name.trim().length > 0 &&
    area.trim().length > 0 &&
    !Number.isNaN(priceNum) &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    updateCoachOverlay(coach.id, {
      name: name.trim(),
      level,
      specialty: specialty
        .split(/[,、，]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      area: area.trim(),
      pricePerHour: priceNum,
      onlineAvailable,
      reviewAvailable,
    });
    toast.success("コーチを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>コーチを編集</AdminDialogTitle>
          <AdminDialogDescription>{coach.name} を更新します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ce-name">名前</Label>
            <Input id="ce-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ce-level">レベル</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="ce-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((lv) => (
                    <SelectItem key={lv} value={lv}>
                      {lv}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ce-area">エリア</Label>
              <Input id="ce-area" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-specialty">専門（カンマ区切り）</Label>
            <Input
              id="ce-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-price">料金（円 / h）</Label>
            <Input
              id="ce-price"
              type="number"
              min={0}
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="ce-online" className="cursor-pointer">
              オンライン対応
            </Label>
            <Switch
              id="ce-online"
              checked={onlineAvailable}
              onCheckedChange={setOnlineAvailable}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="ce-review" className="cursor-pointer">
              振り返り対応
            </Label>
            <Switch
              id="ce-review"
              checked={reviewAvailable}
              onCheckedChange={setReviewAvailable}
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

export default CoachEditDialog;
