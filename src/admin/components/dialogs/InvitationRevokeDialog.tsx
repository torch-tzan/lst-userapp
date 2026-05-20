import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { revokeInvitation, type Invitation } from "../../lib/adminInvitationsStore";
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
  invitation: Invitation | null;
}

const InvitationRevokeDialog = ({ open, onOpenChange, invitation }: Props) => {
  const handleConfirm = () => {
    if (!invitation) return;
    revokeInvitation(invitation.id);
    toast.success("招待を取り消しました");
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-sm">
        <AdminDialogHeader>
          <AdminDialogTitle>招待を取り消しますか？</AdminDialogTitle>
          <AdminDialogDescription>
            {invitation?.email} への招待が無効化されます。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-rose-600 hover:bg-rose-700"
          >
            取り消す
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default InvitationRevokeDialog;
