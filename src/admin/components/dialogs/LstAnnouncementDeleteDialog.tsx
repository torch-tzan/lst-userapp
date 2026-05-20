import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  deleteLstAnnouncement,
  type LstAnnouncementRecord,
} from "../../lib/adminLstAnnouncementsStore";
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
  announcement: LstAnnouncementRecord;
  onDeleted?: () => void;
}

const LstAnnouncementDeleteDialog = ({ open, onOpenChange, announcement, onDeleted }: Props) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    setSubmitting(true);
    deleteLstAnnouncement(announcement.id);
    toast.success("お知らせを削除しました");
    setSubmitting(false);
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>お知らせを削除しますか？</AdminDialogTitle>
          <AdminDialogDescription>
            「{announcement.title}」を削除します。この操作は取り消せません。
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

export default LstAnnouncementDeleteDialog;
