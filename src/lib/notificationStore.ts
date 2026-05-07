export interface PushNotification {
  id: string;
  type:
    | "booking_confirmed"
    | "booking_rejected"
    | "lesson_started"
    | "lesson_completed"
    | "change_approved"
    | "change_rejected"
    | "booking_cancelled"
    | "online_link"
    | "review_request"
    | "tournament_registration_confirmed"
    | "tournament_partner_invited"
    | "tournament_partner_accepted"
    | "tournament_partner_declined"
    | "tournament_partner_expired"
    | "tournament_partner_cancelled"
    | "tournament_starting_soon"
    | "tournament_results_published"
    | "monthly_ranking_finalized";
  title: string;
  message: string;
  bookingId?: string;
  coachName?: string;
  eventId?: string;
  entryId?: string;
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
      type: "tournament_registration_confirmed",
      title: "エントリーを送信しました（ダブルス）",
      message: "5月度 オープンダブルスへの招待を渡辺 健太さんに送信しました。承諾をお待ちください。",
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      read: false,
    },
    {
      type: "tournament_partner_invited",
      title: "大会の招待が届きました",
      message: "佐藤 花子さんから「5月度 ダブルストーナメント」への招待が届きました。72時間以内に回答してください。",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: false,
    },
    {
      type: "tournament_partner_accepted",
      title: "パートナーが招待を承諾しました",
      message: "渡辺 健太さんが「4月度 ダブルス大会」のエントリーを承諾しました。",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      read: true,
    },
    {
      type: "tournament_partner_declined",
      title: "パートナーが招待を辞退しました",
      message: "山本 大輝さんが「3月度 シニアダブルス」の招待を辞退しました。理由：予定が合わない",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      read: true,
    },
    {
      type: "tournament_partner_expired",
      title: "招待の有効期限が切れました",
      message: "「3月度 ダブルストーナメント」への招待が72時間経過したため失効しました。",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      read: true,
    },
    {
      type: "tournament_starting_soon",
      title: "大会開始まで24時間",
      message: "「5月度 オープンダブルス」が明日 14:00 から開催されます。LST 西支店コート2 にお越しください。",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      read: false,
    },
    {
      type: "tournament_results_published",
      title: "大会の結果が発表されました",
      message: "4月度 ダブルストーナメントで第2位を獲得しました（+160積分）。",
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
      type: "monthly_ranking_finalized",
      title: "4月度ランキングが確定しました",
      message: "あなたの順位は5位です。今月もチャレンジしましょう。",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
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
