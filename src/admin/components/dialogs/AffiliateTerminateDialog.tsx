import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { terminateAffiliate, type Affiliate } from "../../lib/adminAffiliatesStore";
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
  affiliate: Affiliate;
}

function defaultTerminationDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

const AffiliateTerminateDialog = ({ open, onOpenChange, affiliate }: Props) => {
  const [date, setDate] = useState<string>(defaultTerminationDate());
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (open) {
      setDate(affiliate.terminationDate ?? defaultTerminationDate());
      setReason(affiliate.terminationReason ?? "");
    }
  }, [open, affiliate]);

  const canSubmit = date !== "" && reason.trim() !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    terminateAffiliate(affiliate.id, date, reason.trim());
    toast.success("解約手続きを開始しました");
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>契約解約</AdminDialogTitle>
          <AdminDialogDescription>
            {affiliate.storeName}（{affiliate.id}）の契約を解約予定にします。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="term-date">解約日</Label>
            <Input
              id="term-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="term-reason">解約理由</Label>
            <Textarea
              id="term-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例：事業方針の見直しのため"
            />
          </div>
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            解約予定に設定すると、加盟店ステータスが「解約予定」になります。
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-rose-600 hover:bg-rose-700"
          >
            解約手続きを開始
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default AffiliateTerminateDialog;
