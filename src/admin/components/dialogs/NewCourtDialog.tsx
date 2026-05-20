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
import { Textarea } from "@/components/ui/textarea";
import courtPlaceholder from "@/assets/court-outdoor.webp";

import { addCourtToOverlay, generateNextCourtId } from "../../lib/adminCourtOverlay";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface NewCourtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (courtId: string) => void;
}

const COURT_TYPES = ["屋外ハード", "室内", "室内ハード", "クレー"] as const;

const NewCourtDialog = ({ open, onOpenChange, onCreated }: NewCourtDialogProps) => {
  const [name, setName] = useState("");
  const [courtName, setCourtName] = useState("");
  const [courtType, setCourtType] = useState<string>(COURT_TYPES[0]);
  const [price, setPrice] = useState<string>("");
  const [available, setAvailable] = useState(true);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset on open transitions
  useEffect(() => {
    if (open) {
      setName("");
      setCourtName("");
      setCourtType(COURT_TYPES[0]);
      setPrice("");
      setAvailable(true);
      setAddress("");
      setSubmitting(false);
    }
  }, [open]);

  const priceNumber = Number.parseInt(price, 10);
  const canSubmit =
    name.trim().length > 0 &&
    courtName.trim().length > 0 &&
    !Number.isNaN(priceNumber) &&
    priceNumber >= 0 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const newId = generateNextCourtId();
    addCourtToOverlay({
      id: newId,
      name: name.trim(),
      courtName: courtName.trim(),
      courtType,
      price: priceNumber,
      image: courtPlaceholder,
      available,
    });
    // address は CourtSummary には無いが、将来 detail 化するため握っておく（現状無視）
    void address;
    toast.success("コートを作成しました");
    setSubmitting(false);
    onOpenChange(false);
    onCreated?.(newId);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>新規コート</AdminDialogTitle>
          <AdminDialogDescription>店舗で管理するコートを追加します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="court-name">名前（施設名）</Label>
            <Input
              id="court-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="パデルコート広島"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="court-sub">コート名</Label>
            <Input
              id="court-sub"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              placeholder="コートA"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="court-type">種別</Label>
              <Select value={courtType} onValueChange={setCourtType}>
                <SelectTrigger id="court-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="court-price">料金 / 時間（円）</Label>
              <Input
                id="court-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="court-available" className="text-sm font-medium">
                公開状態
              </Label>
              <p className="text-xs text-slate-500">
                {available ? "ユーザーアプリで予約可能" : "非公開（予約不可）"}
              </p>
            </div>
            <Switch id="court-available" checked={available} onCheckedChange={setAvailable} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="court-address">住所（任意）</Label>
            <Textarea
              id="court-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="広島県広島市中区..."
            />
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

export default NewCourtDialog;
