import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  updateCoupon,
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

interface CouponToggleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: AdminCoupon;
}

const CouponToggleDialog = ({ open, onOpenChange, coupon }: CouponToggleDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const willActivate = !coupon.isActive;

  const handleSubmit = () => {
    setSubmitting(true);
    updateCoupon(coupon.id, { isActive: willActivate });
    toast.success(
      willActivate
        ? `${coupon.code} を有効化しました`
        : `${coupon.code} を無効化しました`,
    );
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-sm">
        <AdminDialogHeader>
          <AdminDialogTitle>
            クーポンを{willActivate ? "有効化" : "無効化"}しますか？
          </AdminDialogTitle>
          <AdminDialogDescription>
            <span className="font-mono font-semibold">{coupon.code}</span> を
            {willActivate ? "有効化" : "無効化"}します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {willActivate ? "有効化する" : "無効化する"}
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default CouponToggleDialog;
