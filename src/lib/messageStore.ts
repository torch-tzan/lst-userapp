export interface ReviewVideo {
  name: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  sender: "coach" | "user" | "system";
  text: string;
  time: string;
  /** For system messages like online lesson link or video review */
  type?:
    | "text"
    | "online_link"
    | "video_upload"
    | "video_review_reply"
    | "review_request"
    | "review_reply";
  /** Link URL for online lesson */
  linkUrl?: string;
  /** Whether the link has expired */
  linkExpired?: boolean;
  /** Video filename for review */
  videoFileName?: string;
  /** review_request / review_reply payload */
  reviewTitle?: string;
  reviewBody?: string;
  reviewVideos?: ReviewVideo[];
  /** For review_reply: points to the original request msgId */
  replyTo?: string;
}

export type ReviewState = "awaiting_coach" | "in_review" | "completed" | "refunded";

export interface ThreadParticipant {
  userId: string;
  name: string;
  role: "host" | "participant";
}

export interface MessageThread {
  id: string;
  coachName: string; // doubles as display title for group threads
  coachInitial: string;
  coachAvatar?: string;
  bookingId: string;
  messages: ChatMessage[];
  createdAt: string;
  readCount?: number; // number of messages the user has seen
  threadType?: "normal" | "review"; // review = online video review thread
  // ── Group / linked-entity (league match chats) ──
  threadKind?: "1on1" | "group"; // undefined → treat as "1on1"
  linkedEntityType?: "league-match" | "booking";
  linkedEntityId?: string;
  participantList?: ThreadParticipant[];
  // Review lifecycle (review threads only)
  reviewState?: ReviewState;
  reviewSubmittedAt?: string;        // ISO — thread 建立時間（7天退費倒數起點）
  coachFirstReplyAt?: string;        // ISO — 教練首次回覆（72h 結案倒數起點）
  reviewCompletedAt?: string;        // ISO — 72h 到期，結案
  reviewRefundedAt?: string;         // ISO — 7d 到期，自動退費
  videoRetentionUntil?: string;      // ISO — 影片保存到期日（結案/退費 +7d）
  videosDeleted?: boolean;            // 過期刪除
  uploadedVideoNames?: string[];      // 實際上傳的檔名
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

export const getThreadByLinkedEntity = (
  entityType: "league-match" | "booking",
  entityId: string,
): MessageThread | undefined => {
  return getThreads().find(
    (t) => t.linkedEntityType === entityType && t.linkedEntityId === entityId,
  );
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

  // Review lifecycle: first coach reply → enter 72h window
  if (thread.threadType === "review" && thread.reviewState === "awaiting_coach" && !thread.coachFirstReplyAt) {
    thread.coachFirstReplyAt = new Date().toISOString();
    thread.reviewState = "in_review";
    thread.messages.push({
      id: `msg-sys-${Date.now()}-1st`,
      sender: "system",
      text: "コーチが初回返信しました。72時間以内にレビューを完了する必要があります。期限後はこのチャットは閉鎖されます。",
      time: now(),
    });
  }

  saveThreads(threads);
  return msg;
};

/** Auto-sync review thread lifecycle based on elapsed time. Mutates & saves. */
export const syncReviewLifecycle = (threadId: string): MessageThread | null => {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);
  if (!thread || thread.threadType !== "review") return thread ?? null;
  const nowMs = Date.now();
  const MS_DAY = 86400_000;
  const MS_HOUR = 3600_000;

  // Awaiting → Refunded (7 days)
  if (thread.reviewState === "awaiting_coach" && thread.reviewSubmittedAt) {
    const elapsed = nowMs - new Date(thread.reviewSubmittedAt).getTime();
    if (elapsed > 7 * MS_DAY) {
      thread.reviewState = "refunded";
      thread.reviewRefundedAt = new Date(new Date(thread.reviewSubmittedAt).getTime() + 7 * MS_DAY).toISOString();
      thread.videoRetentionUntil = new Date(new Date(thread.reviewRefundedAt).getTime() + 7 * MS_DAY).toISOString();
      thread.messages.push({
        id: `msg-refund-${Date.now()}`,
        sender: "system",
        text: "7日以内にコーチからの返信がなかったため、自動返金されました。動画は保存期限まで閲覧できます。",
        time: now(),
      });
    }
  }

  // In review → Completed (72h)
  if (thread.reviewState === "in_review" && thread.coachFirstReplyAt) {
    const elapsed = nowMs - new Date(thread.coachFirstReplyAt).getTime();
    if (elapsed > 72 * MS_HOUR) {
      thread.reviewState = "completed";
      thread.reviewCompletedAt = new Date(new Date(thread.coachFirstReplyAt).getTime() + 72 * MS_HOUR).toISOString();
      thread.videoRetentionUntil = new Date(new Date(thread.reviewCompletedAt).getTime() + 7 * MS_DAY).toISOString();
      thread.messages.push({
        id: `msg-complete-${Date.now()}`,
        sender: "system",
        text: "レビューが完了し、料金がコーチへ支払われました。このチャットは閉鎖されました。",
        time: now(),
      });
    }
  }

  // Videos expire (1 week after retentionUntil passes)
  if (!thread.videosDeleted && thread.videoRetentionUntil) {
    if (nowMs > new Date(thread.videoRetentionUntil).getTime()) {
      thread.videosDeleted = true;
      thread.messages.push({
        id: `msg-video-deleted-${Date.now()}`,
        sender: "system",
        text: "動画の保存期限が過ぎたため、サーバーから削除されました。",
        time: now(),
      });
    }
  }

  saveThreads(threads);
  return thread;
};

/** Is user input locked for this thread (i.e. review closed) */
export const isThreadInputLocked = (thread: MessageThread): boolean => {
  if (thread.threadType !== "review") return false;
  return thread.reviewState === "completed" || thread.reviewState === "refunded";
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
export const createReviewThread = (
  bookingId: string,
  coachName: string,
  uploadedVideos?: { name: string }[],
  memo?: string
): MessageThread => {
  const threads = getThreads();
  const existing = threads.find((t) => t.bookingId === bookingId);
  if (existing) return existing;

  const nowStr = now();
  const trimmed = memo?.trim() ?? "";
  // Derive title from first line of memo, fallback to generic
  const firstLine = trimmed.split("\n")[0]?.slice(0, 40) || "";
  const reviewTitle = firstLine || `動画${uploadedVideos?.length ?? 0}本のレビュー依頼`;
  const messages: ChatMessage[] = [
    {
      id: `msg-sys-${Date.now()}`,
      sender: "system",
      text: `オンラインレビューのお支払いが完了しました。${uploadedVideos?.length ?? 0}本の動画を受け付けました。7日以内にコーチが返信しない場合は自動返金されます。`,
      time: nowStr,
      type: "video_upload",
    },
    {
      id: `msg-req-${Date.now()}`,
      sender: "user",
      text: reviewTitle,
      time: nowStr,
      type: "review_request",
      reviewTitle,
      reviewBody: trimmed || undefined,
      reviewVideos: uploadedVideos ?? [],
    },
  ];

  const thread: MessageThread = {
    id: `thread-review-${bookingId}`,
    coachName,
    coachInitial: coachName.charAt(0),
    bookingId,
    createdAt: new Date().toISOString(),
    threadType: "review",
    reviewState: "awaiting_coach",
    reviewSubmittedAt: new Date().toISOString(),
    uploadedVideoNames: uploadedVideos?.map((v) => v.name) ?? [],
    messages,
  };

  threads.unshift(thread);
  saveThreads(threads);
  return thread;
};

/**
 * Create a group thread linked to an entity (e.g. a league match).
 * Idempotent: if a thread for the same entity already exists, returns it.
 */
export const createGroupThread = (opts: {
  linkedEntityType: "league-match";
  linkedEntityId: string;
  title: string;
  participants: ThreadParticipant[];
  initialSystemMessage?: string;
  initialMessages?: ChatMessage[];
}): MessageThread => {
  const threads = getThreads();
  const existing = threads.find(
    (t) => t.linkedEntityType === opts.linkedEntityType && t.linkedEntityId === opts.linkedEntityId,
  );
  if (existing) return existing;

  const messages: ChatMessage[] = [];
  if (opts.initialSystemMessage) {
    messages.push({
      id: `msg-sys-${Date.now()}`,
      sender: "system",
      text: opts.initialSystemMessage,
      time: now(),
    });
  }
  if (opts.initialMessages) {
    messages.push(...opts.initialMessages);
  }

  const thread: MessageThread = {
    id: `thread-${opts.linkedEntityType}-${opts.linkedEntityId}`,
    coachName: opts.title,
    coachInitial: "👥",
    bookingId: "", // unused for group threads
    createdAt: new Date().toISOString(),
    threadKind: "group",
    linkedEntityType: opts.linkedEntityType,
    linkedEntityId: opts.linkedEntityId,
    participantList: opts.participants,
    messages,
  };

  threads.unshift(thread);
  saveThreads(threads);
  return thread;
};

/** Update a group thread's display title (used when host edits match date/venue). */
export const updateGroupThreadTitle = (
  entityType: "league-match" | "booking",
  entityId: string,
  newTitle: string,
): { ok: boolean } => {
  const threads = getThreads();
  const thread = threads.find(
    (t) => t.linkedEntityType === entityType && t.linkedEntityId === entityId,
  );
  if (!thread) return { ok: false };
  thread.coachName = newTitle;
  thread.messages.push({
    id: `msg-sys-edit-${Date.now()}`,
    sender: "system",
    text: `試合情報が更新されました：${newTitle}`,
    time: now(),
  });
  saveThreads(threads);
  return { ok: true };
};

/** Add a participant to a group thread, with a system "joined" message. */
export const addParticipantToThread = (
  threadId: string,
  participant: ThreadParticipant,
): { ok: boolean; error?: string } => {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return { ok: false, error: "thread not found" };
  if (thread.threadKind !== "group") return { ok: false, error: "not a group thread" };
  if (!thread.participantList) thread.participantList = [];
  if (thread.participantList.some((p) => p.userId === participant.userId)) {
    return { ok: true }; // already in
  }
  thread.participantList.push(participant);
  thread.messages.push({
    id: `msg-sys-join-${Date.now()}`,
    sender: "system",
    text: `${participant.name} さんが参加しました`,
    time: now(),
  });
  saveThreads(threads);
  return { ok: true };
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
  // Re-seed if demo threads lack avatars OR lack review-state demos
  const hasOldDemo = threads.some((t) => t.id.startsWith("demo-") && !t.coachAvatar);
  const hasReviewDemos = threads.some((t) => t.id.startsWith("demo-review-"));
  if (hasOldDemo || !hasReviewDemos) {
    threads = threads.filter((t) => !t.id.startsWith("demo-"));
    localStorage.setItem("padel_messages", JSON.stringify(threads));
  }
  if (threads.some((t) => t.id.startsWith("demo-"))) return;

  const MS_DAY = 86400_000;
  const MS_HOUR = 3600_000;
  const nowD = Date.now();
  const iso = (offsetMs: number) => new Date(nowD - offsetMs).toISOString();
  const iso_future = (offsetMs: number) => new Date(nowD + offsetMs).toISOString();

  const demoThreads: MessageThread[] = [
    // Review state 1: awaiting coach reply (submitted 2 days ago, ~5 days remaining)
    {
      id: "demo-review-awaiting",
      coachName: "田中 美咲",
      coachInitial: "田",
      coachAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      bookingId: "demo-rev-1",
      createdAt: iso(2 * MS_DAY),
      threadType: "review",
      reviewState: "awaiting_coach",
      reviewSubmittedAt: iso(2 * MS_DAY),
      uploadedVideoNames: ["前衛ボレー.mp4", "サーブ練習.mov"],
      messages: [
        { id: "dr1-1", sender: "system", text: "オンラインレビューのお支払いが完了しました。2本の動画を受け付けました。7日以内にコーチが返信しない場合は自動返金されます。", time: "04/19 14:00", type: "video_upload" },
        {
          id: "dr1-2",
          sender: "user",
          text: "前衛ボレーの打点確認",
          time: "04/19 14:00",
          type: "review_request",
          reviewTitle: "前衛ボレーの打点確認",
          reviewBody: "前衛のボレーで打点が安定しません。特にバックボレーが詰まってしまうことが多いです。肘の使い方や体の向きなどアドバイスをお願いします。",
          reviewVideos: [{ name: "前衛ボレー.mp4" }, { name: "サーブ練習.mov" }],
        },
      ],
    },
    // Review state 2: coach replied, in 72h window (replied 27h ago, ~45h remaining)
    {
      id: "demo-review-inreview",
      coachName: "佐藤 翔太",
      coachInitial: "佐",
      coachAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      bookingId: "demo-rev-2",
      createdAt: iso(3 * MS_DAY),
      threadType: "review",
      reviewState: "in_review",
      reviewSubmittedAt: iso(3 * MS_DAY),
      coachFirstReplyAt: iso(27 * MS_HOUR),
      uploadedVideoNames: ["バンデーハ.mp4", "後衛ポジション.mp4"],
      messages: [
        { id: "dr2-1", sender: "system", text: "オンラインレビューのお支払いが完了しました。2本の動画を受け付けました。", time: "04/18 10:00", type: "video_upload" },
        {
          id: "dr2-2",
          sender: "user",
          text: "後衛ポジショニングの改善",
          time: "04/18 10:00",
          type: "review_request",
          reviewTitle: "後衛ポジショニングの改善",
          reviewBody: "後衛でのポジショニングに自信がありません。相手の攻めに対する立ち位置やバンデーハのタイミングについてアドバイスください。",
          reviewVideos: [{ name: "バンデーハ.mp4" }, { name: "後衛ポジション.mp4" }],
        },
        {
          id: "dr2-3",
          sender: "coach",
          text: "「後衛ポジショニングの改善」",
          time: "04/20 10:00",
          type: "review_reply",
          replyTo: "dr2-2",
          reviewTitle: "後衛ポジショニングの改善",
          reviewBody: "動画を確認しました！🎾\n\n【バンデーハ】\nタイミングが少し早いです。ボールが落ちてくる瞬間を待ってから振り抜くと、もっと安定します。\n\n【ポジション】\n全体的に少し後ろすぎます。ベースラインから1歩前に入って、攻撃的な姿勢を意識しましょう。\n\n【次のステップ】\nまずはバンデーハのタイミングを練習してみてください。",
        },
        { id: "dr2-4", sender: "system", text: "コーチが初回返信しました。72時間以内にレビューを完了する必要があります。期限後はこのチャットは閉鎖されます。", time: "04/20 10:00" },
      ],
    },
    // Review state 3: completed — 72h passed, paid out, locked
    {
      id: "demo-review-completed",
      coachName: "鈴木 健太",
      coachInitial: "鈴",
      coachAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
      bookingId: "demo-rev-3",
      createdAt: iso(8 * MS_DAY),
      threadType: "review",
      reviewState: "completed",
      reviewSubmittedAt: iso(8 * MS_DAY),
      coachFirstReplyAt: iso(6 * MS_DAY),
      reviewCompletedAt: iso(3 * MS_DAY),
      videoRetentionUntil: iso_future(4 * MS_DAY),
      uploadedVideoNames: ["試合ハイライト.mov"],
      messages: [
        { id: "dr3-1", sender: "system", text: "オンラインレビューのお支払いが完了しました。1本の動画を受け付けました。", time: "04/13 09:00", type: "video_upload" },
        {
          id: "dr3-2",
          sender: "user",
          text: "公式戦の総合アドバイス",
          time: "04/13 09:00",
          type: "review_request",
          reviewTitle: "公式戦の総合アドバイス",
          reviewBody: "先日の公式戦の映像です。フォーム・ポジショニング・パートナーとの連携など、総合的なアドバイスをお願いします。",
          reviewVideos: [{ name: "試合ハイライト.mov" }],
        },
        {
          id: "dr3-3",
          sender: "coach",
          text: "「公式戦の総合アドバイス」",
          time: "04/15 14:00",
          type: "review_reply",
          replyTo: "dr3-2",
          reviewTitle: "公式戦の総合アドバイス",
          reviewBody: "公式戦お疲れ様でした！映像を拝見しました📹\n\n【全体】\nフォームは安定してきています。\n\n【フォアハンド】\nテイクバックをもう少し大きく。安定感がアップします。\n\n【ネット前】\nパートナーとの声かけを意識。リターンコース読みが早くなります。\n\n【フットワーク】\n素晴らしいです！この調子で👍\n\n次回の試合で試してみてください😊",
        },
        { id: "dr3-4", sender: "system", text: "コーチが初回返信しました。72時間以内にレビューを完了する必要があります。期限後はこのチャットは閉鎖されます。", time: "04/15 14:00" },
        { id: "dr3-5", sender: "user", text: "ありがとうございます！とても参考になりました。早速練習で試してみます！", time: "04/16 20:00" },
        { id: "dr3-6", sender: "system", text: "レビューが完了し、料金がコーチへ支払われました。このチャットは閉鎖されました。", time: "04/18 14:00" },
      ],
    },
    // Review state 4: refunded — 7d no reply, auto-refund
    {
      id: "demo-review-refunded",
      coachName: "山本 大輝",
      coachInitial: "山",
      coachAvatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop&crop=face",
      bookingId: "demo-rev-4",
      createdAt: iso(10 * MS_DAY),
      threadType: "review",
      reviewState: "refunded",
      reviewSubmittedAt: iso(10 * MS_DAY),
      reviewRefundedAt: iso(3 * MS_DAY),
      videoRetentionUntil: iso_future(4 * MS_DAY),
      uploadedVideoNames: ["初心者練習.mp4"],
      messages: [
        { id: "dr4-1", sender: "system", text: "オンラインレビューのお支払いが完了しました。1本の動画を受け付けました。7日以内にコーチが返信しない場合は自動返金されます。", time: "04/11 09:00", type: "video_upload" },
        {
          id: "dr4-2",
          sender: "user",
          text: "基本フォーム確認",
          time: "04/11 09:00",
          type: "review_request",
          reviewTitle: "基本フォーム確認",
          reviewBody: "初心者なので基本フォームのチェックをお願いします。特にフォアハンドとサーブの構え方が不安です。",
          reviewVideos: [{ name: "初心者練習.mp4" }],
        },
        { id: "dr4-3", sender: "system", text: "7日以内にコーチからの返信がなかったため、自動返金されました。動画は保存期限まで閲覧できます。", time: "04/18 09:00" },
      ],
    },
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
