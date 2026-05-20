import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CoachSummary } from "@/lib/coachData";

import {
  getCoachStatus,
  reactivateCoach,
  suspendCoach,
} from "../../lib/adminCoachesOverlay";
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
}

const CoachSuspendDialog = ({ open, onOpenChange, coach }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const isSuspended = getCoachStatus(coach.id) === "suspended";

  const handleConfirm = () => {
    setSubmitting(true);
    if (isSuspended) {
      reactivateCoach(coach.id);
      toast.success("コーチを再有効化しました");
    } else {
      suspendCoach(coach.id);
      toast.success("コーチを無効化しました");
    }
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>
            {isSuspended ? "コーチを再有効化しますか？" : "コーチを無効化しますか？"}
          </AdminDialogTitle>
          <AdminDialogDescription>
            {isSuspended
              ? `${coach.name} を再有効化します。`
              : `${coach.name} を無効化します。会員からの予約が一時停止されます。`}
          </AdminDialogDescription>
        </AdminDialogHeader>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button
            variant={isSuspended ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {isSuspended ? "再有効化する" : "無効化する"}
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default CoachSuspendDialog;
