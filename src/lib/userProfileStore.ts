import { useCallback, useSyncExternalStore } from "react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  points: number;
  xp: number;
}

let profile: UserProfile = {
  name: "田中 太郎",
  email: "tanaka@example.com",
  phone: "090-1234-5678",
  avatar: null,
  points: 1250,
  xp: 0,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return profile;
}

export function useUserProfile() {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  const update = useCallback((partial: Partial<UserProfile>) => {
    profile = { ...profile, ...partial };
    emitChange();
  }, []);

  const addXpAndPoints = useCallback((xp: number, points: number) => {
    profile = { ...profile, xp: profile.xp + xp, points: profile.points + points };
    emitChange();
  }, []);

  return { profile: data, updateProfile: update, addXpAndPoints };
}
