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

import { addShift } from "../../lib/adminShiftsStore";
import { useAdminStaff } from "../../lib/adminStaffStore";
import { SHIFT_KIND_JP, type ShiftKind } from "../../lib/storeLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface NewShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewShiftDialog = ({ open, onOpenChange }: NewShiftDialogProps) => {
  const staff = useAdminStaff();
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [kind, setKind] = useState<ShiftKind>("regular");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStaffId(staff[0]?.id ?? "");
      setDate("");
      setStart("09:00");
      setEnd("17:00");
      setKind("regular");
      setSubmitting(false);
    }
  }, [open, staff]);

  const canSubmit = staffId.length > 0 && date.length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const s = staff.find((x) => x.id === staffId);
    addShift({
      staffId,
      staffName: s?.name ?? "",
      date,
      startTime: start,
      endTime: end,
      kind,
    });
    toast.success("シフトを追加しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>新規シフト</AdminDialogTitle>
          <AdminDialogDescription>スタッフのシフトを追加します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="shift-staff">スタッフ</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger id="shift-staff">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shift-date">日付</Label>
            <Input
              id="shift-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shift-start">開始時刻</Label>
              <Input
                id="shift-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-end">終了時刻</Label>
              <Input
                id="shift-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shift-kind">種別</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ShiftKind)}>
              <SelectTrigger id="shift-kind">
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

export default NewShiftDialog;
