import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { addCoupon, getCouponByCode } from "../../lib/adminCouponsStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface NewCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CouponType = "percent" | "fixed";

const NewCouponDialog = ({ open, onOpenChange }: NewCouponDialogProps) => {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CouponType>("percent");
  const [value, setValue] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCode("");
      setLabel("");
      setDescription("");
      setType("percent");
      setValue("");
      setMinAmount("");
      setValidFrom("");
      setExpiresAt("");
      setUsageLimit("");
      setIsActive(true);
      setSubmitting(false);
    }
  }, [open]);

  const valueNumber = Number.parseFloat(value);
  const canSubmit =
    code.trim().length > 0 &&
    label.trim().length > 0 &&
    !Number.isNaN(valueNumber) &&
    valueNumber > 0 &&
    validFrom.length > 0 &&
    expiresAt.length > 0 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const trimmedCode = code.trim();

    // duplicate check
    if (getCouponByCode(trimmedCode)) {
      toast.error(`コード「${trimmedCode}」は既に存在します`);
      return;
    }

    setSubmitting(true);
    // percent は 0.1 形式に変換、fixed はそのまま整数
    const discount = type === "percent" ? valueNumber / 100 : valueNumber;

    addCoupon({
      code: trimmedCode,
      label: label.trim(),
      description: description.trim(),
      type,
      discount,
      minAmount: minAmount ? Number.parseInt(minAmount, 10) : undefined,
      validFrom,
      expiresAt,
      usageLimit: usageLimit ? Number.parseInt(usageLimit, 10) : undefined,
      isActive,
      source: "manual",
    });

    toast.success("クーポンを作成しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>新規クーポン</AdminDialogTitle>
          <AdminDialogDescription>クーポンを作成します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="cpn-code">コード</Label>
            <Input
              id="cpn-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SUMMER500"
              className="font-mono"
            />
            <p className="text-xs text-slate-500">AaZz0-9 推奨</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpn-label">ラベル</Label>
            <Input
              id="cpn-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpn-desc">説明</Label>
            <Textarea
              id="cpn-desc"
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
                <RadioGroupItem value="percent" id="cpn-type-percent" />
                <span>%（パーセント）</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="fixed" id="cpn-type-fixed" />
                <span>円（固定額）</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpn-value">
              値（{type === "percent" ? "%" : "円"}）
            </Label>
            <Input
              id="cpn-value"
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percent" ? "例: 10" : "例: 500"}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpn-min">最低利用金額（円・任意）</Label>
            <Input
              id="cpn-min"
              type="number"
              min={0}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="2000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cpn-from">有効開始日</Label>
              <Input
                id="cpn-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpn-to">有効終了日</Label>
              <Input
                id="cpn-to"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpn-limit">利用上限（空欄 = 無制限）</Label>
            <Input
              id="cpn-limit"
              type="number"
              min={0}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="500"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border bg-slate-50 p-3">
            <Label htmlFor="cpn-active" className="cursor-pointer">
              状態（アクティブ）
            </Label>
            <Switch id="cpn-active" checked={isActive} onCheckedChange={setIsActive} />
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

export default NewCouponDialog;
