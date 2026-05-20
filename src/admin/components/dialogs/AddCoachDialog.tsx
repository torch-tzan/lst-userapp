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

import coachDefaultAvatar from "@/assets/coach-1.webp";

import { addCoachToOverlay } from "../../lib/adminCoachesOverlay";
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
  onCreated?: (id: string) => void;
}

const LEVEL_OPTIONS = ["S級", "A級", "B級", "C級"];

const AddCoachDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("A級");
  const [specialty, setSpecialty] = useState("");
  const [area, setArea] = useState("");
  const [pricePerHour, setPricePerHour] = useState("4000");
  const [onlineAvailable, setOnlineAvailable] = useState(false);
  const [reviewAvailable, setReviewAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setLevel("A級");
      setSpecialty("");
      setArea("");
      setPricePerHour("4000");
      setOnlineAvailable(false);
      setReviewAvailable(false);
      setSubmitting(false);
    }
  }, [open]);

  const priceNum = Number.parseInt(pricePerHour, 10);
  const canSubmit =
    name.trim().length > 0 &&
    area.trim().length > 0 &&
    !Number.isNaN(priceNum) &&
    priceNum > 0 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const id = addCoachToOverlay({
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
      avatar: coachDefaultAvatar,
    });
    toast.success("コーチを追加しました");
    setSubmitting(false);
    onOpenChange(false);
    onCreated?.(id);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>コーチ追加</AdminDialogTitle>
          <AdminDialogDescription>新しいコーチを登録します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="coach-name">名前</Label>
            <Input id="coach-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="coach-level">レベル</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="coach-level">
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
              <Label htmlFor="coach-area">エリア</Label>
              <Input
                id="coach-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="例: 広島市中区"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-specialty">専門（カンマ区切り）</Label>
            <Input
              id="coach-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="初心者指導, フォーム改善, 体力強化"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-price">料金（円 / h）</Label>
            <Input
              id="coach-price"
              type="number"
              min={0}
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="coach-online" className="cursor-pointer">
              オンライン対応
            </Label>
            <Switch
              id="coach-online"
              checked={onlineAvailable}
              onCheckedChange={setOnlineAvailable}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="coach-review" className="cursor-pointer">
              振り返り（動画レビュー）対応
            </Label>
            <Switch
              id="coach-review"
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
            追加する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default AddCoachDialog;
