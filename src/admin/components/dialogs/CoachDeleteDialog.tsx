import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CoachSummary } from "@/lib/coachData";

import { deleteCoach } from "../../lib/adminCoachesOverlay";
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
  coach: CoachSummary;
  onDeleted?: () => void;
}

const CoachDeleteDialog = ({ open, onOpenChange, coach, onDeleted }: Props) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    setSubmitting(true);
    deleteCoach(coach.id);
    toast.success("コーチを削除しました");
    setSubmitting(false);
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>コーチを削除しますか？</AdminDialogTitle>
          <AdminDialogDescription>
            「{coach.name}」を削除します。この操作は取り消せません。
          </AdminDialogDescription>
        </AdminDialogHeader>

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

export default CoachDeleteDialog;
