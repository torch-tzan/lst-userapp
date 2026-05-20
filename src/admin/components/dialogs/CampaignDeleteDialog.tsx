import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { deleteCampaign, type CampaignRecord } from "../../lib/adminCampaignsStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface CampaignDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignRecord;
  onDeleted?: () => void;
}

const CampaignDeleteDialog = ({
  open,
  onOpenChange,
  campaign,
  onDeleted,
}: CampaignDeleteDialogProps) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    setSubmitting(true);
    deleteCampaign(campaign.id);
    toast.success("キャンペーンを削除しました");
    setSubmitting(false);
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>キャンペーンを削除しますか？</AdminDialogTitle>
          <AdminDialogDescription>
            「{campaign.title}」を削除します。この操作は取り消せません。
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

export default CampaignDeleteDialog;
