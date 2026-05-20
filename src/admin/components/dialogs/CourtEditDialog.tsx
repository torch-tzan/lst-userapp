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
import type { CourtSummary } from "@/lib/courtData";

import { upsertCourtOverride } from "../../lib/adminCourtOverlay";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface CourtEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  court: CourtSummary;
  /** detail から渡される住所（CourtDetail のみ持つ）。なくても OK。 */
  currentAddress?: string;
}

const COURT_TYPES = ["屋外ハード", "室内", "室内ハード", "クレー"] as const;

const CourtEditDialog = ({ open, onOpenChange, court, currentAddress }: CourtEditDialogProps) => {
  const [name, setName] = useState(court.name);
  const [courtName, setCourtName] = useState(court.courtName);
  const [courtType, setCourtType] = useState<string>(court.courtType);
  const [price, setPrice] = useState<string>(String(court.price));
  const [available, setAvailable] = useState(court.available);
  const [address, setAddress] = useState(currentAddress ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(court.name);
      setCourtName(court.courtName);
      setCourtType(court.courtType);
      setPrice(String(court.price));
      setAvailable(court.available);
      setAddress(currentAddress ?? "");
      setSubmitting(false);
    }
  }, [open, court, currentAddress]);

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
    upsertCourtOverride(court.id, {
      name: name.trim(),
      courtName: courtName.trim(),
      courtType,
      price: priceNumber,
      available,
    });
    // address は detail 専用 field のため overlay の現スキーマ外（無視）
    void address;
    toast.success("コートを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>コートを編集</AdminDialogTitle>
          <AdminDialogDescription>{court.name} を更新します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="court-edit-name">名前（施設名）</Label>
            <Input
              id="court-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="court-edit-sub">コート名</Label>
            <Input
              id="court-edit-sub"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="court-edit-type">種別</Label>
              <Select value={courtType} onValueChange={setCourtType}>
                <SelectTrigger id="court-edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                  {/* If incoming court has unusual type, keep it as option */}
                  {COURT_TYPES.includes(court.courtType as (typeof COURT_TYPES)[number])
                    ? null
                    : (
                      <SelectItem value={court.courtType}>{court.courtType}</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="court-edit-price">料金 / 時間（円）</Label>
              <Input
                id="court-edit-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="court-edit-available" className="text-sm font-medium">
                公開状態
              </Label>
              <p className="text-xs text-slate-500">
                {available ? "ユーザーアプリで予約可能" : "非公開（予約不可）"}
              </p>
            </div>
            <Switch
              id="court-edit-available"
              checked={available}
              onCheckedChange={setAvailable}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="court-edit-address">住所（任意）</Label>
            <Textarea
              id="court-edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
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

export default CourtEditDialog;
