import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { deleteLstCampaign, type LstCampaignRecord } from "../../lib/adminLstCampaignsStore";
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
  campaign: LstCampaignRecord;
  onDeleted?: () => void;
}

const LstCampaignDeleteDialog = ({ open, onOpenChange, campaign, onDeleted }: Props) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    setSubmitting(true);
    deleteLstCampaign(campaign.id);
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

export default LstCampaignDeleteDialog;
