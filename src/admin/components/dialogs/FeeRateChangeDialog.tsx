import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { updateGlobalFeeSettings } from "../../lib/adminFeeSettingsStore";
import { useRevenueTransactions } from "../../lib/adminRevenueStore";
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
  newRate: number;
  oldRate: number;
}

const FeeRateChangeDialog = ({ open, onOpenChange, newRate, oldRate }: Props) => {
  const tx = useRevenueTransactions();
  const affectedCount = tx.filter((t) => t.status === "confirmed").length;

  const handleSubmit = () => {
    updateGlobalFeeSettings({ defaultRate: newRate });
    toast.success(`グローバル手数料率を ${newRate}% に変更しました`);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>手数料率の変更を確認</AdminDialogTitle>
          <AdminDialogDescription>
            グローバル手数料率を <b>{oldRate}%</b> から <b>{newRate}%</b> に変更します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
          <div className="font-medium text-amber-900">影響範囲</div>
          <div className="mt-1 text-amber-800">
            次月以降の確定取引 <b>{affectedCount.toLocaleString("ja-JP")} 件</b> に影響します。
          </div>
          <div className="mt-1 text-xs text-amber-700">
            ※ 加盟店別 override が設定されている店舗は影響を受けません。
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit}>変更を適用</Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default FeeRateChangeDialog;
