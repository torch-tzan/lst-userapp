import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  deleteCoupon,
  type AdminCoupon,
} from "../../lib/adminCouponsStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface CouponDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: AdminCoupon;
  onDeleted?: () => void;
}

const CouponDeleteDialog = ({
  open,
  onOpenChange,
  coupon,
  onDeleted,
}: CouponDeleteDialogProps) => {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = () => {
    setSubmitting(true);
    deleteCoupon(coupon.id);
    toast.success(`${coupon.code} を削除しました`);
    setSubmitting(false);
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-sm">
        <AdminDialogHeader>
          <AdminDialogTitle>クーポンを削除しますか？</AdminDialogTitle>
          <AdminDialogDescription>
            <span className="font-mono font-semibold">{coupon.code}</span> を完全に削除します。
            この操作は取り消せません。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button
            onClick={handleDelete}
            disabled={submitting}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            削除する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default CouponDeleteDialog;
