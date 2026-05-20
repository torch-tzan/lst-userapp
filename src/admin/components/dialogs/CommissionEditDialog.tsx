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

import { updateStaffCommission, useAdminStaff } from "../../lib/adminStaffStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface CommissionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = ["2026-03", "2026-04", "2026-05"];

const CommissionEditDialog = ({ open, onOpenChange }: CommissionEditDialogProps) => {
  const staff = useAdminStaff();
  const [staffId, setStaffId] = useState("");
  const [month, setMonth] = useState(MONTHS[MONTHS.length - 1]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStaffId(staff[0]?.id ?? "");
      setMonth(MONTHS[MONTHS.length - 1]);
      setAmount("");
      setReason("");
      setSubmitting(false);
    }
  }, [open, staff]);

  const amountNum = Number.parseInt(amount, 10);
  const canSubmit =
    staffId.length > 0 && !Number.isNaN(amountNum) && amountNum >= 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    updateStaffCommission(staffId, amountNum);
    void reason; // mock 用、保存先は今回省略
    toast.success("成果報酬を更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>成果報酬編集</AdminDialogTitle>
          <AdminDialogDescription>月次の成果報酬額を編集します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="commission-staff">スタッフ</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger id="commission-staff">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}（{s.id}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="commission-month">月</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="commission-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission-amount">成果報酬額（円）</Label>
              <Input
                id="commission-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="30000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="commission-reason">理由（任意）</Label>
            <Textarea
              id="commission-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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

export default CommissionEditDialog;
