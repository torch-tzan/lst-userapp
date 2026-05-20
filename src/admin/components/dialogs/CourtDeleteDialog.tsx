import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CourtSummary } from "@/lib/courtData";

import { deleteCourt } from "../../lib/adminCourtOverlay";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface CourtDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  court: CourtSummary;
  onDeleted?: () => void;
}

const CourtDeleteDialog = ({ open, onOpenChange, court, onDeleted }: CourtDeleteDialogProps) => {
  const [considerBookings, setConsiderBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setConsiderBookings(false);
      setSubmitting(false);
    }
  }, [open]);

  const handleConfirm = () => {
    setSubmitting(true);
    deleteCourt(court.id);
    toast.success("コートを削除しました");
    setSubmitting(false);
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>コートを削除しますか？</AdminDialogTitle>
          <AdminDialogDescription>
            {court.name} を削除します。この操作は取り消せません。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="rounded-md border bg-slate-50 p-3 text-sm">
          <div className="grid grid-cols-[80px_1fr] gap-y-1.5 gap-x-3">
            <span className="text-slate-500">名前</span>
            <span className="text-slate-800">{court.name}</span>
            <span className="text-slate-500">コート</span>
            <span className="text-slate-800">{court.courtName}</span>
            <span className="text-slate-500">種別</span>
            <span className="text-slate-800">{court.courtType}</span>
            <span className="text-slate-500">料金</span>
            <span className="text-slate-800">¥{court.price.toLocaleString("ja-JP")}/h</span>
          </div>
        </div>

        <label
          className="flex cursor-pointer items-start gap-2 text-sm text-slate-700"
          htmlFor="consider-bookings"
        >
          <Checkbox
            id="consider-bookings"
            checked={considerBookings}
            onCheckedChange={(v) => setConsiderBookings(v === true)}
            className="mt-0.5"
          />
          <span>
            予約データも考慮する
            <span className="ml-1 text-xs text-slate-500">
              （関連予約は自動削除されません — 別途確認してください）
            </span>
          </span>
        </label>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            削除する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default CourtDeleteDialog;
