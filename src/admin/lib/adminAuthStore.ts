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
  // Figma export 旁路（dev-only）：URL 帶 ?figmaExport=1 時依路徑自動授權
  // /admin/store/* → store role，/admin/lst/* → lst role；只設記憶體 state，不寫 localStorage
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("figmaExport") === "1") {
      const isStore = window.location.pathname.includes("/admin/store");
      return { role: isStore ? "store" : "lst", email: "figma-export@local" };
    }
  } catch {
    // ignore
  }
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
