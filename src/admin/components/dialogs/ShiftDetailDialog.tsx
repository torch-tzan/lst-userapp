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

import { deleteShift, updateShift, type ShiftRecord } from "../../lib/adminShiftsStore";
import { SHIFT_KIND_JP, type ShiftKind } from "../../lib/storeLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface ShiftDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftRecord;
}

const ShiftDetailDialog = ({ open, onOpenChange, shift }: ShiftDetailDialogProps) => {
  const [date, setDate] = useState(shift.date);
  const [start, setStart] = useState(shift.startTime);
  const [end, setEnd] = useState(shift.endTime);
  const [kind, setKind] = useState<ShiftKind>(shift.kind);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(shift.date);
      setStart(shift.startTime);
      setEnd(shift.endTime);
      setKind(shift.kind);
      setSubmitting(false);
    }
  }, [open, shift]);

  const handleSave = () => {
    setSubmitting(true);
    updateShift(shift.id, { date, startTime: start, endTime: end, kind });
    toast.success("シフトを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  const handleDelete = () => {
    setSubmitting(true);
    deleteShift(shift.id);
    toast.success("シフトを削除しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>シフト編集</AdminDialogTitle>
          <AdminDialogDescription>
            {shift.staffName}（{shift.id}）のシフトを編集します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="shift-edit-date">日付</Label>
            <Input
              id="shift-edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shift-edit-start">開始時刻</Label>
              <Input
                id="shift-edit-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-edit-end">終了時刻</Label>
              <Input
                id="shift-edit-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shift-edit-kind">種別</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ShiftKind)}>
              <SelectTrigger id="shift-edit-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SHIFT_KIND_JP) as ShiftKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {SHIFT_KIND_JP[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AdminDialogFooter>
          <Button
            variant="outline"
            className="mr-auto border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            onClick={handleDelete}
            disabled={submitting}
          >
            削除
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            更新する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default ShiftDetailDialog;
