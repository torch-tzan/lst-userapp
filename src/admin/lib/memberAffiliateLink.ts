import { getAffiliatesSnapshot } from "./adminAffiliatesStore";

/**
 * Member → Affiliate Link helper（LST HQ 視点）
 *
 * - PLAYER_DIRECTORY の seed member には registeredAffiliateId が無いため、
 *   userId から決定論的に振り分け（同じ userId は常に同じ加盟店）。
 * - admin overlay で明示的に registeredAffiliateId を持つ会員はそれを優先。
 */

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

/** 与えられた userId に対して deterministic に登録加盟店 ID を返す */
export const getMemberAffiliateId = (userId: string): string => {
  const affiliates = getAffiliatesSnapshot();
  if (affiliates.length === 0) return "AFF-001";
  const idx = hashString(userId) % affiliates.length;
  return affiliates[idx].id;
};

/** 加盟店 ID から店舗名を解決（見つからなければ "—"） */
export const getAffiliateNameById = (affiliateId: string | undefined): string => {
  if (!affiliateId) return "—";
  const affiliates = getAffiliatesSnapshot();
  const found = affiliates.find((a) => a.id === affiliateId);
  return found ? found.storeName : "—";
};
