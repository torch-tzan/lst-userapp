import { useMemo } from "react";

import { AVAILABLE_COUPONS, type Coupon } from "@/lib/couponStore";

import { useAdminCoupons } from "../adminCouponsStore";

const TODAY = "2026-05-21";

/**
 * UserApp 用統合 Coupon hook。
 * - app 側 AVAILABLE_COUPONS（baseline）と admin store をマージ
 * - admin 側は isActive=true かつ 未失効 のみ
 * - 同 code がある場合は admin が勝つ
 */
export const useUserCoupons = (): Coupon[] => {
  const adminCoupons = useAdminCoupons();

  return useMemo(() => {
    const merged = new Map<string, Coupon>();
    // baseline
    for (const c of AVAILABLE_COUPONS) merged.set(c.code, c);
    // admin（active + not expired のみ）
    for (const a of adminCoupons) {
      if (!a.isActive) continue;
      if (a.expiresAt < TODAY) continue;
      // 必要最小限フィールドだけ Coupon shape に降ろす
      const c: Coupon = {
        code: a.code,
        label: a.label,
        description: a.description,
        discount: a.discount,
        type: a.type,
        minAmount: a.minAmount,
        expiresAt: a.expiresAt,
      };
      merged.set(c.code, c);
    }
    return Array.from(merged.values());
  }, [adminCoupons]);
};
