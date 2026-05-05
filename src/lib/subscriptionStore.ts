import { useCallback, useSyncExternalStore } from "react";

export type SubscriptionStatus = "none" | "active" | "cancelled_pending" | "expired";

export interface PaymentMethod {
  type: "cc" | "paypay" | "apple";
  last4?: string;
  brand?: string;
}

export interface BillingRecord {
  id: string;
  paidAt: string;
  amount: 500;
  status: "completed";
}

interface SubscriptionState {
  status: SubscriptionStatus;
  startedAt?: string;
  nextRenewAt?: string;
  cancelledAt?: string;
  paymentMethod?: PaymentMethod;
  history: BillingRecord[];
  cancelReason?: string;
}

function addDaysISO(dateIso: string, days: number): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function buildInitialState(): SubscriptionState {
  // Demo: 預設 active，加入日 2026-04-29
  const startedAt = "2026-04-29T00:00:00.000Z";
  return {
    status: "active",
    startedAt,
    nextRenewAt: addDaysISO(startedAt, 30),
    paymentMethod: { type: "cc", brand: "Mastercard", last4: "3456" },
    history: [
      { id: "bill-1", paidAt: "2025-12-29T00:00:00.000Z", amount: 500, status: "completed" },
      { id: "bill-2", paidAt: "2026-01-29T00:00:00.000Z", amount: 500, status: "completed" },
      { id: "bill-3", paidAt: "2026-02-28T00:00:00.000Z", amount: 500, status: "completed" },
      { id: "bill-4", paidAt: "2026-03-29T00:00:00.000Z", amount: 500, status: "completed" },
      { id: "bill-5", paidAt: "2026-04-29T00:00:00.000Z", amount: 500, status: "completed" },
    ],
  };
}

let state: SubscriptionState = buildInitialState();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

export function useSubscription() {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  const isPremium = useCallback(() => {
    return data.status === "active" || data.status === "cancelled_pending";
  }, [data.status]);

  const daysUntilRenew = useCallback(() => {
    if (!data.nextRenewAt) return 0;
    const ms = new Date(data.nextRenewAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 86400000));
  }, [data.nextRenewAt]);

  const currentPeriodStartedAt = useCallback(() => data.startedAt, [data.startedAt]);

  const subscribePremium = useCallback((method: PaymentMethod) => {
    const startedAt = new Date().toISOString();
    const newBilling: BillingRecord = {
      id: `bill-${Date.now()}`,
      paidAt: startedAt,
      amount: 500,
      status: "completed",
    };
    state = {
      status: "active",
      startedAt,
      nextRenewAt: addDaysISO(startedAt, 30),
      paymentMethod: method,
      history: [...state.history, newBilling],
    };
    emit();
  }, []);

  const updatePaymentMethod = useCallback((method: PaymentMethod) => {
    state = { ...state, paymentMethod: method };
    emit();
  }, []);

  const cancelPremium = useCallback((reason?: string) => {
    state = {
      ...state,
      status: "cancelled_pending",
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
    };
    emit();
  }, []);

  // Demo helper: 立即將狀態切到 expired（測未訂閱畫面用）
  const expireNow = useCallback(() => {
    state = { ...state, status: "expired" };
    emit();
  }, []);

  return {
    ...data,
    isPremium,
    daysUntilRenew,
    currentPeriodStartedAt,
    subscribePremium,
    updatePaymentMethod,
    cancelPremium,
    expireNow,
  };
}
