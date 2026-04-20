export interface ChatMessage {
  id: string;
  sender: "coach" | "user" | "system";
  text: string;
  time: string;
  /** For system messages like online lesson link or video review */
  type?: "text" | "online_link" | "video_upload" | "video_review_reply";
  /** Link URL for online lesson */
  linkUrl?: string;
  /** Whether the link has expired */
  linkExpired?: boolean;
  /** Video filename for review */
  videoFileName?: string;
}

export interface MessageThread {
  id: string;
  coachName: string;
  coachInitial: string;
  coachAvatar?: string;
  bookingId: string;
  messages: ChatMessage[];
  createdAt: string;
  readCount?: number; // number of messages the user has seen
  threadType?: "normal" | "review"; // review = online video review thread
}

const STORAGE_KEY = "padel_messages";

export const getThreads = (): MessageThread[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveThreads = (threads: MessageThread[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
};

export const getThreadByBookingId = (bookingId: string): MessageThread | undefined => {
  return getThreads().find((t) => t.bookingId === bookingId);
};

export const getThreadById = (threadId: string): MessageThread | undefined => {
  return getThreads().find((t) => t.id === threadId);
};

const now = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Create a thread with canned confirmation message when coach approves */
export const createThreadOnApproval = (
  bookingId: string,
  coachName: string,
  date: string,
  startTime: string,
  endTime: string,
  lessonType?: "onsite" | "online",
  venueName?: string,
): MessageThread => {
  const threads = getThreads();

  // Check if thread already exists
  const existing = threads.find((t) => t.bookingId === bookingId);
  if (existing) {
    // Just add the confirmation message
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "coach",
      text: `ご予約が確定しました！\n\n📅 ${date} ${startTime}〜${endTime}\n${lessonType === "online" ? "💻 オンラインレッスン" : `📍 ${venueName || "現地レッスン"}`}\n\n当日お会いできるのを楽しみにしています！何かご質問があればお気軽にどうぞ😊`,
      time: now(),
    };
    existing.messages.push(msg);
    saveThreads(threads);
    return existing;
  }

  const initial = coachName.charAt(0);
  const thread: MessageThread = {
    id: `thread-${bookingId}`,
    coachName,
    coachInitial: initial,
    bookingId,
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "coach",
        text: `ご予約が確定しました！\n\n📅 ${date} ${startTime}〜${endTime}\n${lessonType === "online" ? "💻 オンラインレッスン" : `📍 ${venueName || "現地レッスン"}`}\n\n当日お会いできるのを楽しみにしています！何かご質問があればお気軽にどうぞ😊`,
        time: now(),
      },
    ],
  };

  threads.unshift(thread);
  saveThreads(threads);
  return thread;
};

/** Add an online lesson link message (10 min before lesson) */
export const addOnlineLessonLink = (bookingId: string): void => {
  const threads = getThreads();
  const thread = threads.find((t) => t.bookingId === bookingId);
  if (!thread) return;

  // Don't duplicate
  if (thread.messages.some((m) => m.type === "online_link")) return;

  const meetingUrl = `https://meet.padel-base.app/room/${bookingId.slice(0, 8)}`;
  const msg: ChatMessage = {
    id: `msg-link-${Date.now()}`,
    sender: "system",
    text: "オンラインレッスンの開始時間が近づきました。下のリンクから参加してください。",
    time: now(),
    type: "online_link",
    linkUrl: meetingUrl,
    linkExpired: false,
  };
  thread.messages.push(msg);
  saveThreads(threads);
};

/** Expire the online lesson link (10 min after lesson ends) */
export const expireOnlineLessonLink = (bookingId: string): void => {
  const threads = getThreads();
  const thread = threads.find((t) => t.bookingId === bookingId);
  if (!thread) return;

  thread.messages = thread.messages.map((m) =>
    m.type === "online_link" ? { ...m, linkExpired: true } : m
  );
  saveThreads(threads);
};

/** Add a user message to a thread */
export const addUserMessage = (threadId: string, text: string): ChatMessage | null => {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return null;

  const msg: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender: "user",
    text,
    time: now(),
  };
  thread.messages.push(msg);
  saveThreads(threads);
  return msg;
};

/** Add a coach auto-reply message to a thread */
export const addCoachReply = (threadId: string, text: string): ChatMessage | null => {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return null;

  const msg: ChatMessage = {
    id: `msg-${Date.now()}-auto`,
    sender: "coach",
    text,
    time: now(),
  };
  thread.messages.push(msg);
  saveThreads(threads);
  return msg;
};

/** Mark a thread as read */
export const markThreadRead = (threadId: string): void => {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return;
  thread.readCount = thread.messages.length;
  saveThreads(threads);
};

/** Get total unread message count across all threads */
export const getUnreadMessageCount = (): number => {
  const threads = getThreads();
  let count = 0;
  for (const thread of threads) {
    const read = thread.readCount || 0;
    const unread = thread.messages.length - read;
    if (unread > 0) count += unread;
  }
  return count;
};
/** Create a review thread for online video review */
export const createReviewThread = (bookingId: string, coachName: string): MessageThread => {
  const threads = getThreads();
  const existing = threads.find((t) => t.bookingId === bookingId);
  if (existing) return existing;

  const thread: MessageThread = {
    id: `thread-review-${bookingId}`,
    coachName,
    coachInitial: coachName.charAt(0),
    bookingId,
    createdAt: new Date().toISOString(),
    threadType: "review",
    messages: [
      {
        id: `msg-review-${Date.now()}`,
        sender: "system",
        text: "オンラインレビューのお支払いが完了しました。下のボタンからプレー動画を送信してください。コーチからフィードバックが届きます。",
        time: now(),
        type: "video_upload",
      },
    ],
  };

  threads.unshift(thread);
  saveThreads(threads);
  return thread;
};

/** Add a video upload message to a review thread */
export const addVideoUploadMessage = (threadId: string, fileName: string): ChatMessage | null => {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return null;

  const msg: ChatMessage = {
    id: `msg-video-${Date.now()}`,
    sender: "user",
    text: `動画を送信しました: ${fileName}`,
    time: now(),
    type: "video_upload",
    videoFileName: fileName,
  };
  thread.messages.push(msg);
  saveThreads(threads);
  return msg;
};


export const seedDemoThreads = (): void => {
  let threads = getThreads();
  // Re-seed if demo threads lack avatars
  const hasOldDemo = threads.some((t) => t.id.startsWith("demo-") && !t.coachAvatar);
  if (hasOldDemo) {
    threads = threads.filter((t) => !t.id.startsWith("demo-"));
    localStorage.setItem("padel_messages", JSON.stringify(threads));
  }
  if (threads.some((t) => t.id.startsWith("demo-"))) return;

  const demoThreads: MessageThread[] = [
    {
      id: "demo-online-pending",
      coachName: "田中 美咲",
      coachInitial: "田",
      coachAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      bookingId: "demo-bp",
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: "dm1",
          sender: "coach",
          text: "ご予約が確定しました！\n\n📅 2026/04/20 14:00〜15:00\n💻 オンラインレッスン\n\n当日お会いできるのを楽しみにしています！何かご質問があればお気軽にどうぞ😊",
          time: "04/14 10:00",
        },
        {
          id: "dm2",
          sender: "user",
          text: "よろしくお願いします！初めてのオンラインレッスンなので楽しみです。",
          time: "04/14 10:05",
        },
        {
          id: "dm3",
          sender: "coach",
          text: "こちらこそよろしくお願いします！一緒に楽しみましょう🎉\nレッスン開始10分前にリンクをお送りしますね。",
          time: "04/14 10:06",
        },
      ],
    },
    {
      id: "demo-online-active",
      coachName: "佐藤 翔太",
      coachInitial: "佐",
      coachAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      bookingId: "demo-ba",
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: "da1",
          sender: "coach",
          text: "ご予約が確定しました！\n\n📅 2026/04/14 15:00〜16:00\n💻 オンラインレッスン\n\n当日お会いできるのを楽しみにしています！",
          time: "04/13 09:00",
        },
        {
          id: "da2",
          sender: "system",
          text: "オンラインレッスンの開始時間が近づきました。下のリンクから参加してください。",
          time: "04/14 14:50",
          type: "online_link",
          linkUrl: "https://meet.padel-base.app/room/demo-ba",
          linkExpired: false,
        },
      ],
    },
    {
      id: "demo-online-expired",
      coachName: "鈴木 健太",
      coachInitial: "鈴",
      coachAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
      bookingId: "demo-be",
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: "de1",
          sender: "coach",
          text: "ご予約が確定しました！\n\n📅 2026/04/10 10:00〜11:00\n💻 オンラインレッスン\n\n当日お会いできるのを楽しみにしています！",
          time: "04/09 18:00",
        },
        {
          id: "de2",
          sender: "system",
          text: "オンラインレッスンの開始時間が近づきました。下のリンクから参加してください。",
          time: "04/10 09:50",
          type: "online_link",
          linkUrl: "https://meet.padel-base.app/room/demo-be",
          linkExpired: true,
        },
        {
          id: "de3",
          sender: "coach",
          text: "本日はありがとうございました！フォアハンドのフォームがとても良くなりましたね💪 次回も頑張りましょう！",
          time: "04/10 11:05",
        },
        {
          id: "de4",
          sender: "user",
          text: "ありがとうございました！とても分かりやすかったです。次回もよろしくお願いします！",
          time: "04/10 11:10",
        },
      ],
    },
  ];

  const updated = [...demoThreads, ...threads];
  localStorage.setItem("padel_messages", JSON.stringify(updated));
};
