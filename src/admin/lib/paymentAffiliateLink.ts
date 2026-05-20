import { getAffiliatesSnapshot } from "./adminAffiliatesStore";

/**
 * Payment → Affiliate Link helper（LST HQ 視点）
 *
 * 既存の adminPaymentsStore.PaymentRecord に affiliateId が無いため、
 * payment id の hash で決定論的に振り分け（mock）。
 */
const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

export const getPaymentAffiliateId = (paymentId: string): string => {
  const affiliates = getAffiliatesSnapshot();
  if (affiliates.length === 0) return "AFF-001";
  const idx = hashString(paymentId) % affiliates.length;
  return affiliates[idx].id;
};
