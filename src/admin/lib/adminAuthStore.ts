import { useCallback, useSyncExternalStore } from "react";

export type AdminRole = "lst" | "store" | null;

interface AdminAuthState {
  role: AdminRole;
  email?: string;
  storeName?: string;
}

const STORAGE_KEY = "lst-admin-auth";

function loadInitialState(): AdminAuthState {
  if (typeof window === "undefined") return { role: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { role: null };
    const parsed = JSON.parse(raw) as AdminAuthState;
    if (parsed.role !== "lst" && parsed.role !== "store") return { role: null };
    return parsed;
  } catch {
    return { role: null };
  }
}

let state: AdminAuthState = loadInitialState();
const listeners = new Set<() => void>();

const emit = () => {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const getSnapshot = () => state;

export function useAdminAuth() {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  const signIn = useCallback(
    (payload: { role: Exclude<AdminRole, null>; email: string; storeName?: string }) => {
      state = {
        role: payload.role,
        email: payload.email,
        storeName: payload.storeName,
      };
      emit();
    },
    [],
  );

  const signOut = useCallback(() => {
    state = { role: null };
    emit();
  }, []);

  return {
    ...data,
    signIn,
    signOut,
  };
}

// Demo helper：給 AdminLogin onMount 用，不需要 hook reactivity
export function clearAdminAuth() {
  state = { role: null };
  emit();
}
