export interface PushNotification {
  id: string;
  type: "booking_confirmed" | "booking_rejected" | "lesson_started" | "lesson_completed" | "change_approved" | "change_rejected" | "booking_cancelled" | "online_link" | "review_request" | "team_invite" | "team_invite_accepted" | "team_invite_declined" | "team_disbanded" | "team_auto_matched" | "team_waiting_assignment" | "team_deadline_reminder" | "match_confirm_request" | "match_settled" | "match_disputed";
  title: string;
  message: string;
  bookingId?: string;
  coachName?: string;
  eventId?: string;
  invitationId?: string;
  matchId?: string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = "padel_notifications";

export const getNotifications = (): PushNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const save = (items: PushNotification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const addNotification = (n: Omit<PushNotification, "id" | "createdAt" | "read">) => {
  const items = getNotifications();
  items.unshift({
    ...n,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
  });
  save(items);
};

export const markAllNotificationsRead = () => {
  const items = getNotifications();
  save(items.map((n) => ({ ...n, read: true })));
};

export const markNotificationRead = (id: string) => {
  const items = getNotifications();
  save(items.map((n) => n.id === id ? { ...n, read: true } : n));
};

export const getUnreadCount = (): number => {
  return getNotifications().filter((n) => !n.read).length;
};

/** Seed demo notifications — always resets to initial state on load */
export const seedDemoNotifications = (): void => {
  const demoNotifs: Omit<PushNotification, "id">[] = [
    {
      type: "review_request",
      title: "レッスンの評価をお願いします",
      message: "佐藤 翔太コーチのレッスンはいかがでしたか？ぜひ評価をお寄せください。",
      coachName: "佐藤 翔太",
      bookingId: "demo-ba",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
    },
    {
      type: "booking_confirmed",
      title: "予約が確定しました",
      message: "4/20（日）10:00〜 パデルコート広島 コートA の予約が確定しました。",
      bookingId: "demo-bk1",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      read: false,
    },
    {
      type: "team_invite",
      title: "チーム招待が届いています",
      message: "佐藤 花子さんからミックスダブルス交流戦のチーム招待が届いています。",
      eventId: "5",
      invitationId: "inv-demo-1",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
    },
    {
      type: "lesson_started",
      title: "レッスンが開始されました",
      message: "田中 太郎コーチとのレッスンが開始されました。コートへお向かいください。",
      coachName: "田中 太郎",
      bookingId: "demo-bk2",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      read: false,
    },
    {
      type: "online_link",
      title: "オンラインレッスンのリンク",
      message: "鈴木 健太コーチとのオンラインレッスンのリンクが届きました。",
      coachName: "鈴木 健太",
      bookingId: "demo-bk3",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      read: false,
    },
    {
      type: "change_approved",
      title: "予約変更が承認されました",
      message: "4/22（火）14:00〜への変更が承認されました。",
      bookingId: "demo-bk4",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      read: true,
    },
    {
      type: "lesson_completed",
      title: "レッスンが完了しました",
      message: "佐藤 翔太コーチとのレッスンが完了しました。",
      coachName: "佐藤 翔太",
      bookingId: "demo-ba",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      read: true,
    },
    {
      type: "booking_rejected",
      title: "予約がキャンセルされました",
      message: "4/18（金）16:00〜 の予約がコーチ都合によりキャンセルされました。",
      bookingId: "demo-bk5",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      read: true,
    },
    {
      type: "change_rejected",
      title: "予約変更が却下されました",
      message: "4/19（土）の変更リクエストが却下されました。元の日時のままとなります。",
      bookingId: "demo-bk6",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      read: true,
    },
    {
      type: "booking_cancelled",
      title: "予約がキャンセルされました",
      message: "4/15（火）のコート予約がキャンセルされました。",
      bookingId: "demo-bk7",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      read: true,
    },
    {
      type: "team_invite_accepted",
      title: "チーム招待が承認されました",
      message: "山田 太郎さんがチーム招待を承認しました。",
      eventId: "5",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
      read: true,
    },
    {
      type: "team_invite_declined",
      title: "チーム招待が辞退されました",
      message: "高橋 美咲さんがチーム招待を辞退しました。",
      eventId: "5",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
      read: true,
    },
    {
      type: "team_disbanded",
      title: "チームが解散されました",
      message: "ミックスダブルス交流戦のチームが解散されました。再編成してください。",
      eventId: "5",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      read: true,
    },
    {
      type: "team_auto_matched",
      title: "チームが自動マッチングされました",
      message: "ペア戦カップ 春のチームが自動マッチングで決定しました。",
      eventId: "6",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      read: true,
    },
    {
      type: "team_waiting_assignment",
      title: "チーム割り当て待ち",
      message: "ペア戦カップ 春のチーム割り当てをお待ちください。",
      eventId: "6",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
      read: true,
    },
    {
      type: "team_deadline_reminder",
      title: "チーム編成の締切が近づいています",
      message: "ミックスダブルス交流戦のチーム編成締切まであと1日です。",
      eventId: "5",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
    },
    {
      type: "review_request",
      title: "レッスンの評価をお願いします",
      message: "鈴木 健太コーチのレッスンはいかがでしたか？ぜひ評価をお寄せください。",
      coachName: "鈴木 健太",
      bookingId: "demo-be",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      read: true,
    },
  ];

  const items = demoNotifs.map((n, i) => ({
    ...n,
    id: `notif-seed-${i}`,
  }));
  save(items);
};
