import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Send, Video, XCircle, Upload, FileVideo, Check, Clock, AlertCircle, Lock } from "lucide-react";
import {
  getThreadById,
  addUserMessage,
  addCoachReply,
  addVideoUploadMessage,
  markThreadRead,
  syncReviewLifecycle,
  isThreadInputLocked,
  type ChatMessage,
  type MessageThread,
} from "@/lib/messageStore";
import { getCoachAvatar } from "@/lib/coachData";

const MessageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    // Sync review lifecycle (may auto-transition states based on elapsed time)
    syncReviewLifecycle(id);
    const t = getThreadById(id);
    setThread(t || null);
    if (t) markThreadRead(t.id);
  }, [id]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages.length]);

  // Auto-reply templates
  const autoReplies = [
    "承知しました！ご質問ありがとうございます😊",
    "はい、大丈夫ですよ！お気軽にどうぞ。",
    "なるほど、了解です。当日しっかり対応しますね💪",
    "ありがとうございます！楽しみにしています😄",
    "ご連絡ありがとうございます。何かあればいつでもメッセージください！",
    "かしこまりました。では当日よろしくお願いします！",
    "いい質問ですね！レッスンで詳しくお伝えしますね📝",
    "お気遣いありがとうございます！問題ありませんよ😊",
  ];

  const getAutoReply = (userText: string): string => {
    // Context-aware replies
    if (userText.includes("時間") || userText.includes("何時")) {
      return "レッスン時間については予約内容をご確認ください。変更が必要であればお気軽にご相談ください😊";
    }
    if (userText.includes("場所") || userText.includes("どこ") || userText.includes("アクセス")) {
      return "場所については予約詳細に記載の住所をご確認ください。駐車場もありますのでお車でも大丈夫ですよ🚗";
    }
    if (userText.includes("持ち物") || userText.includes("準備") || userText.includes("必要")) {
      return "動きやすい服装とタオル、飲み物をお持ちください。ラケットはこちらでご用意できます🎾";
    }
    if (userText.includes("キャンセル") || userText.includes("変更")) {
      return "キャンセル・変更については予約詳細ページからお手続きいただけます。お早めにご連絡いただけると助かります🙏";
    }
    if (userText.includes("ありがとう") || userText.includes("感謝")) {
      return "こちらこそありがとうございます！レッスンでお会いできるのを楽しみにしています😊";
    }
    if (userText.includes("初めて") || userText.includes("初心者")) {
      return "初心者の方も大歓迎です！基礎からしっかりお教えしますのでご安心ください💪";
    }
    if (userText.includes("よろしく")) {
      return "こちらこそよろしくお願いします！一緒に楽しみましょう🎉";
    }
    // Random reply
    return autoReplies[Math.floor(Math.random() * autoReplies.length)];
  };

  const handleSend = () => {
    if (!input.trim() || !thread) return;
    const userText = input.trim();
    const msg = addUserMessage(thread.id, userText);
    if (msg) {
      const updatedMessages = [...thread.messages, msg];
      setThread({ ...thread, messages: updatedMessages });

      // Auto-reply after delay
      setTimeout(() => {
        const replyText = getAutoReply(userText);
        const replyMsg = addCoachReply(thread.id, replyText);
        if (replyMsg) {
          setThread((prev) => {
            if (!prev) return prev;
            const refreshed = getThreadById(prev.id);
            if (refreshed) {
              markThreadRead(refreshed.id);
              return refreshed;
            }
            return { ...prev, messages: [...prev.messages, replyMsg] };
          });
        }
      }, 1000 + Math.random() * 2000);
    }
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!thread) {
    return (
      <InnerPageLayout title="メッセージ">
        <div className="flex items-center justify-center pt-20">
          <p className="text-sm text-muted-foreground">メッセージが見つかりません</p>
        </div>
      </InnerPageLayout>
    );
  }

  const isReview = thread.threadType === "review";
  const inputLocked = isThreadInputLocked(thread);

  // Human-readable countdown helpers
  const formatMsDiff = (targetMs: number): string => {
    const diff = targetMs - Date.now();
    if (diff <= 0) return "まもなく";
    const days = Math.floor(diff / 86400_000);
    const hrs = Math.floor((diff % 86400_000) / 3600_000);
    const mins = Math.floor((diff % 3600_000) / 60_000);
    if (days > 0) return `あと ${days}日 ${hrs}時間`;
    if (hrs > 0) return `あと ${hrs}時間 ${mins}分`;
    return `あと ${mins}分`;
  };
  const dateLabel = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // Build state banner info
  let banner: { tone: "warn" | "info" | "muted"; icon: React.ReactNode; title: string; body?: string } | null = null;
  if (isReview) {
    if (thread.reviewState === "awaiting_coach" && thread.reviewSubmittedAt) {
      const refundAt = new Date(thread.reviewSubmittedAt).getTime() + 7 * 86400_000;
      banner = {
        tone: "info",
        icon: <Clock className="w-4 h-4 text-primary" />,
        title: "コーチの返信をお待ちください",
        body: `${formatMsDiff(refundAt)}までに返信がない場合は自動返金されます`,
      };
    } else if (thread.reviewState === "in_review" && thread.coachFirstReplyAt) {
      const completeAt = new Date(thread.coachFirstReplyAt).getTime() + 72 * 3600_000;
      banner = {
        tone: "warn",
        icon: <AlertCircle className="w-4 h-4 text-accent-yellow" />,
        title: `72時間以内にレビュー完了（${formatMsDiff(completeAt)}）`,
        body: "期限後、このチャットは閉鎖されます。",
      };
    } else if (thread.reviewState === "completed") {
      banner = {
        tone: "muted",
        icon: <Lock className="w-4 h-4 text-muted-foreground" />,
        title: "レビュー完了・チャット閉鎖",
        body: thread.videoRetentionUntil
          ? thread.videosDeleted
            ? "動画は保存期限が過ぎ、削除されました。"
            : `動画は ${dateLabel(thread.videoRetentionUntil)} まで閲覧できます。`
          : undefined,
      };
    } else if (thread.reviewState === "refunded") {
      banner = {
        tone: "warn",
        icon: <AlertCircle className="w-4 h-4 text-destructive" />,
        title: "自動返金済み",
        body: thread.videoRetentionUntil
          ? thread.videosDeleted
            ? "動画は保存期限が過ぎ、削除されました。"
            : `動画は ${dateLabel(thread.videoRetentionUntil)} まで閲覧できます。`
          : "7日以内にコーチからの返信がありませんでした。",
      };
    }
  }

  const handleVideoUpload = () => {
    if (!thread) return;
    const fileName = `プレー動画_${new Date().toLocaleDateString("ja-JP")}.mp4`;
    const msg = addVideoUploadMessage(thread.id, fileName);
    if (msg) {
      const updatedMessages = [...thread.messages, msg];
      setThread({ ...thread, messages: updatedMessages });

      // Auto-reply from coach after delay
      setTimeout(() => {
        const replyMsg = addCoachReply(
          thread.id,
          "動画を確認しました！🎬\n\nフォアハンドのスイングですが、テイクバック時に少し肘が下がっています。もう少し肩の高さでラケットを引くと、安定したショットが打てますよ💪\n\nまた、フットワークも良くなっていますね！次は壁際でのボレーを意識してみてください。\n\n詳しくは次回のレッスンでも練習しましょう😊"
        );
        if (replyMsg) {
          setThread((prev) => {
            if (!prev) return prev;
            const refreshed = getThreadById(prev.id);
            if (refreshed) {
              markThreadRead(refreshed.id);
              return refreshed;
            }
            return { ...prev, messages: [...prev.messages, replyMsg] };
          });
        }
      }, 2000 + Math.random() * 3000);
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    // System message (online lesson link)
    if (msg.sender === "system" && msg.type === "online_link") {
      return (
        <div key={msg.id} className="flex justify-center my-3">
          <div className="bg-muted border border-border rounded-[8px] px-4 py-3 max-w-[90%] space-y-2">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs font-bold text-foreground">オンラインレッスン</p>
            </div>
            <p className="text-xs text-muted-foreground">{msg.text}</p>
            {msg.linkExpired ? (
              <div className="flex items-center gap-2 bg-destructive/10 rounded-[4px] px-3 py-2">
                <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive font-medium">
                  この会議室は終了しました（レッスン終了後10分経過）
                </p>
              </div>
            ) : (
              <button
                onClick={() => navigate(`/online-lesson?coach=${encodeURIComponent(thread.coachName)}`)}
                className="block w-full text-center py-2.5 rounded-[4px] bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                レッスンに参加する
              </button>
            )}
            <p className="text-[10px] text-muted-foreground/60 text-center">{msg.time}</p>
          </div>
        </div>
      );
    }

    // System message (video upload prompt)
    if (msg.sender === "system" && msg.type === "video_upload") {
      return (
        <div key={msg.id} className="flex justify-center my-3">
          <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-[8px] px-4 py-3 max-w-[90%] space-y-2">
            <div className="flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-accent-yellow flex-shrink-0" />
              <p className="text-xs font-bold text-foreground">オンラインレビュー</p>
            </div>
            <p className="text-xs text-muted-foreground">{msg.text}</p>
            {/* Check if user already uploaded video */}
            {!thread.messages.some((m) => m.sender === "user" && m.type === "video_upload") ? (
              <button
                onClick={handleVideoUpload}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[4px] bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                動画を送信する
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-available/10 rounded-[4px] px-3 py-2">
                <Check className="w-4 h-4 text-available flex-shrink-0" />
                <p className="text-xs text-available font-medium">動画送信済み</p>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/60 text-center">{msg.time}</p>
          </div>
        </div>
      );
    }

    // User video upload message
    if (msg.sender === "user" && msg.type === "video_upload") {
      return (
        <div key={msg.id} className="flex justify-end">
          <div className="flex items-end gap-2 max-w-[80%] flex-row-reverse">
            <div>
              <div className="px-3.5 py-2.5 rounded-[12px] rounded-br-[4px] bg-primary text-primary-foreground text-sm">
                <div className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4 flex-shrink-0" />
                  <span>{msg.videoFileName || "動画"}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1 text-right">{msg.time}</p>
            </div>
          </div>
        </div>
      );
    }

    // System messages (generic)
    if (msg.sender === "system") {
      return (
        <div key={msg.id} className="flex justify-center my-3">
          <div className="bg-muted border border-border rounded-[8px] px-4 py-3 max-w-[90%] space-y-2">
            <p className="text-xs text-muted-foreground">{msg.text}</p>
            <p className="text-[10px] text-muted-foreground/60 text-center">{msg.time}</p>
          </div>
        </div>
      );
    }

    // Regular messages
    return (
      <div
        key={msg.id}
        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
      >
        <div className={`flex items-end gap-2 max-w-[80%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
          {msg.sender === "coach" && (
            (() => {
              const avatar = getCoachAvatar(thread.coachName) || thread.coachAvatar;
              return avatar ? (
                <img src={avatar} alt={thread.coachName} loading="lazy" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{thread.coachInitial}</span>
                </div>
              );
            })()
          )}
          <div>
            <div
              className={`px-3.5 py-2.5 rounded-[12px] text-sm whitespace-pre-line ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-br-[4px]"
                  : "bg-muted text-foreground rounded-bl-[4px]"
              }`}
            >
              {msg.text}
            </div>
            <p className={`text-[10px] text-muted-foreground/60 mt-1 ${msg.sender === "user" ? "text-right" : ""}`}>
              {msg.time}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <InnerPageLayout title={thread.coachName}>
      <div className="-mx-[20px] -mt-6 -mb-6 flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
        {/* Review state banner (sticky) */}
        {banner && (
          <div
            className={`flex items-start gap-2 px-4 py-2.5 border-b text-xs ${
              banner.tone === "warn"
                ? "bg-accent-yellow/10 border-accent-yellow/30"
                : banner.tone === "info"
                ? "bg-primary/5 border-primary/20"
                : "bg-muted border-border"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">{banner.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">{banner.title}</p>
              {banner.body && <p className="text-muted-foreground mt-0.5 leading-relaxed">{banner.body}</p>}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-[20px] py-4 space-y-4">
          {thread.messages.map(renderMessage)}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-[20px] py-3 border-t border-border bg-background">
          {inputLocked ? (
            <div className="flex items-center justify-center gap-2 h-10 rounded-full bg-muted text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              {thread.reviewState === "refunded"
                ? "このチャットは閉鎖されています（自動返金済み）"
                : "このチャットは閉鎖されています（レビュー完了）"}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力..."
                className="flex-1 h-10 px-4 rounded-full border border-border bg-muted/30 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
    </InnerPageLayout>
  );
};

export default MessageDetail;
