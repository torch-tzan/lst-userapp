import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  deleteAnnouncement,
  type AnnouncementRecord,
} from "../../lib/adminAnnouncementsStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface AnnouncementDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: AnnouncementRecord;
  onDeleted?: () => void;
}

const AnnouncementDeleteDialog = ({
  open,
  onOpenChange,
  announcement,
  onDeleted,
}: AnnouncementDeleteDialogProps) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    setSubmitting(true);
    deleteAnnouncement(announcement.id);
    toast.success("お知らせを削除しました");
    setSubmitting(false);
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
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

export default AnnouncementDeleteDialog;
