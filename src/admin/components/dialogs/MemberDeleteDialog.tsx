import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { deleteMember, type MemberRecord } from "../../lib/adminMembersOverlay";
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
  member: MemberRecord;
  onDeleted?: () => void;
}

const MemberDeleteDialog = ({ open, onOpenChange, member, onDeleted }: Props) => {
  const handleSubmit = () => {
    deleteMember(member.userId);
    toast.success(`${member.name} を削除しました`);
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>会員を削除</AdminDialogTitle>
          <AdminDialogDescription>
            {member.name}（{member.displayId}）を削除します。この操作は取り消せません。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          削除すると会員一覧から見えなくなります（プロトタイプでは reload で復活します）。
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} className="bg-rose-600 hover:bg-rose-700">
            削除する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default MemberDeleteDialog;
