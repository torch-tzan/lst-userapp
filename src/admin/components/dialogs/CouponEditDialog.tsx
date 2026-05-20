import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  updateCoupon,
  type AdminCoupon,
} from "../../lib/adminCouponsStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface CouponEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: AdminCoupon;
}

type CouponType = "percent" | "fixed";

const CouponEditDialog = ({ open, onOpenChange, coupon }: CouponEditDialogProps) => {
  const [label, setLabel] = useState(coupon.label);
  const [description, setDescription] = useState(coupon.description);
  const [type, setType] = useState<CouponType>(coupon.type);
  const [value, setValue] = useState(
    coupon.type === "percent" ? String(Math.round(coupon.discount * 100)) : String(coupon.discount),
  );
  const [minAmount, setMinAmount] = useState(
    coupon.minAmount !== undefined ? String(coupon.minAmount) : "",
  );
  const [validFrom, setValidFrom] = useState(coupon.validFrom);
  const [expiresAt, setExpiresAt] = useState(coupon.expiresAt);
  const [usageLimit, setUsageLimit] = useState(
    coupon.usageLimit !== undefined ? String(coupon.usageLimit) : "",
  );
  const [isActive, setIsActive] = useState(coupon.isActive);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLabel(coupon.label);
      setDescription(coupon.description);
      setType(coupon.type);
      setValue(
        coupon.type === "percent"
          ? String(Math.round(coupon.discount * 100))
          : String(coupon.discount),
      );
      setMinAmount(coupon.minAmount !== undefined ? String(coupon.minAmount) : "");
      setValidFrom(coupon.validFrom);
      setExpiresAt(coupon.expiresAt);
      setUsageLimit(coupon.usageLimit !== undefined ? String(coupon.usageLimit) : "");
      setIsActive(coupon.isActive);
      setSubmitting(false);
    }
  }, [open, coupon]);

  const valueNumber = Number.parseFloat(value);
  const canSubmit =
    label.trim().length > 0 &&
    !Number.isNaN(valueNumber) &&
    valueNumber > 0 &&
    validFrom.length > 0 &&
    expiresAt.length > 0 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const discount = type === "percent" ? valueNumber / 100 : valueNumber;
    updateCoupon(coupon.id, {
      label: label.trim(),
      description: description.trim(),
      type,
      discount,
      minAmount: minAmount ? Number.parseInt(minAmount, 10) : undefined,
      validFrom,
      expiresAt,
      usageLimit: usageLimit ? Number.parseInt(usageLimit, 10) : undefined,
      isActive,
    });

    toast.success("クーポンを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>クーポンを編集</AdminDialogTitle>
          <AdminDialogDescription>
            <span className="font-mono">{coupon.code}</span> を更新します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>コード</Label>
            <Input value={coupon.code} disabled className="font-mono" />
            <p className="text-xs text-slate-500">コードは変更できません</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpn-edit-label">ラベル</Label>
            <Input
              id="cpn-edit-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpn-edit-desc">説明</Label>
            <Textarea
              id="cpn-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>種別</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as CouponType)}
              className="flex gap-4"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="percent" id="cpn-edit-percent" />
                <span>%（パーセント）</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="fixed" id="cpn-edit-fixed" />
                <span>円（固定額）</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpn-edit-value">
              値（{type === "percent" ? "%" : "円"}）
            </Label>
            <Input
              id="cpn-edit-value"
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpn-edit-min">最低利用金額（円・任意）</Label>
            <Input
              id="cpn-edit-min"
              type="number"
              min={0}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cpn-edit-from">有効開始日</Label>
              <Input
                id="cpn-edit-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpn-edit-to">有効終了日</Label>
              <Input
                id="cpn-edit-to"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpn-edit-limit">利用上限（空欄 = 無制限）</Label>
            <Input
              id="cpn-edit-limit"
              type="number"
              min={0}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border bg-slate-50 p-3">
            <Label htmlFor="cpn-edit-active" className="cursor-pointer">
              状態（アクティブ）
            </Label>
            <Switch
              id="cpn-edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
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

export default CouponEditDialog;
