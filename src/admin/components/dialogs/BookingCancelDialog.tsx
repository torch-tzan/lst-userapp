import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminCancelBooking, type StoredBooking } from "@/lib/bookingStore";

import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface BookingCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: StoredBooking;
  onCancelled?: () => void;
}

const BookingCancelDialog = ({
  open,
  onOpenChange,
  booking,
  onCancelled,
}: BookingCancelDialogProps) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  const target =
    booking.type === "court"
      ? `${booking.courtName ?? "—"}${booking.courtSubName ? " / " + booking.courtSubName : ""}`
      : booking.coachName ?? "—";

  const handleConfirm = () => {
    setSubmitting(true);
    const ok = adminCancelBooking(booking.id, reason.trim() || undefined);
    setSubmitting(false);
    if (ok) {
      toast.success("予約をキャンセルしました");
      onOpenChange(false);
      onCancelled?.();
    } else {
      toast.error("キャンセルできませんでした");
    }
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>この予約をキャンセルしますか？</AdminDialogTitle>
          <AdminDialogDescription>
            キャンセル後、ステータスが「キャンセル」に変わります。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="rounded-md border bg-slate-50 p-3 text-sm">
          <div className="grid grid-cols-[80px_1fr] gap-y-1.5 gap-x-3">
            <span className="text-slate-500">予約 ID</span>
            <span className="font-mono text-xs text-slate-700">{booking.id}</span>
            <span className="text-slate-500">種別</span>
            <span className="text-slate-800">
              {booking.type === "court" ? "コート" : "コーチング"}
            </span>
            <span className="text-slate-500">対象</span>
            <span className="text-slate-800">{target}</span>
            <span className="text-slate-500">日付</span>
            <span className="text-slate-800">
              {booking.date} {booking.startTime}〜{booking.endTime}
            </span>
            <span className="text-slate-500">料金</span>
            <span className="text-slate-800">
              ¥{(booking.totalPrice ?? 0).toLocaleString("ja-JP")}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="bk-cancel-reason">
            キャンセル理由（任意）
          </label>
          <Textarea
            id="bk-cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="例：会員からの依頼で取消"
          />
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            キャンセルする
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default BookingCancelDialog;
