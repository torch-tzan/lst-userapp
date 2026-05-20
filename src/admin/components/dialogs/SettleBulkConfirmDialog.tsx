import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { settleAllPending } from "../../lib/adminSettlementsStore";
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
  pendingCount: number;
}

const SettleBulkConfirmDialog = ({ open, onOpenChange, pendingCount }: Props) => {
  const handleConfirm = () => {
    const n = settleAllPending();
    if (n === 0) {
      toast.info("精算対象がありません");
    } else {
      toast.success(`${n} 件を精算しました`);
    }
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>一括精算の確認</AdminDialogTitle>
          <AdminDialogDescription>
            今月の未精算 / 処理中の {pendingCount} 件を一括で精算します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          実行後は元に戻せません（プロトタイプではリロードで初期化）。
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700">
            一括で精算する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default SettleBulkConfirmDialog;
