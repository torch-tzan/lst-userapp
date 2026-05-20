import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { setStaffStatus, type StaffRecord } from "../../lib/adminStaffStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface StaffDisableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffRecord;
}

const StaffDisableDialog = ({ open, onOpenChange, staff }: StaffDisableDialogProps) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    setSubmitting(true);
    setStaffStatus(staff.id, "paused");
    toast.success("スタッフを無効化しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>スタッフを無効化しますか？</AdminDialogTitle>
          <AdminDialogDescription>
            {staff.name} を「休止」に設定します。後でアクティブに戻すことが可能です。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            無効化する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default StaffDisableDialog;
