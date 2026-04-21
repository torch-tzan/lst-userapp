import { useParams, useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { getThreadById, syncReviewLifecycle } from "@/lib/messageStore";
import { getCoachAvatar } from "@/lib/coachData";
import { Play, FileVideo, AlertCircle, Clock, Lock, Check, Video } from "lucide-react";

const ReviewDetail = () => {
  const { threadId, msgId } = useParams<{ threadId: string; msgId: string }>();
  const navigate = useNavigate();

  if (!threadId || !msgId) {
    return (
      <InnerPageLayout title="レビュー詳細" onBack={() => navigate(-1)}>
        <p className="text-sm text-muted-foreground text-center py-12">不正なリクエストです</p>
      </InnerPageLayout>
    );
  }

  syncReviewLifecycle(threadId);
  const thread = getThreadById(threadId);
  const msg = thread?.messages.find((m) => m.id === msgId);

  if (!thread || !msg) {
    return (
      <InnerPageLayout title="レビュー詳細" onBack={() => navigate(-1)}>
        <p className="text-sm text-muted-foreground text-center py-12">レビューが見つかりません</p>
      </InnerPageLayout>
    );
  }

  const isRequest = msg.type === "review_request";
  const isReply = msg.type === "review_reply";
  const coachAvatar = getCoachAvatar(thread.coachName) || thread.coachAvatar;

  // If reply, find the original request
  const originalRequest = isReply && msg.replyTo
    ? thread.messages.find((m) => m.id === msg.replyTo && m.type === "review_request")
    : null;
  const videos = (isRequest ? msg.reviewVideos : originalRequest?.reviewVideos) ?? [];

  // Status label
  let statusBadge: { label: string; cls: string; icon: React.ReactNode } | null = null;
  if (thread.reviewState === "awaiting_coach") {
    statusBadge = { label: "回答待ち", cls: "bg-primary/10 text-primary", icon: <Clock className="w-3 h-3" /> };
  } else if (thread.reviewState === "in_review") {
    statusBadge = { label: "レビュー中", cls: "bg-accent-yellow/20 text-accent-yellow", icon: <AlertCircle className="w-3 h-3" /> };
  } else if (thread.reviewState === "completed") {
    statusBadge = { label: "完了", cls: "bg-muted text-muted-foreground", icon: <Check className="w-3 h-3" /> };
  } else if (thread.reviewState === "refunded") {
    statusBadge = { label: "返金済み", cls: "bg-destructive/10 text-destructive", icon: <Lock className="w-3 h-3" /> };
  }

  return (
    <InnerPageLayout title={isReply ? "レビュー回答" : "レビュー依頼"} onBack={() => navigate(-1)}>
      <div className="space-y-4 pb-6">
        {/* Coach header */}
        <div className="bg-card border border-border rounded-[8px] p-3 flex items-center gap-3">
          {coachAvatar ? (
            <img src={coachAvatar} alt={thread.coachName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-base font-bold text-primary">{thread.coachInitial}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{thread.coachName}</p>
            <p className="text-[11px] text-muted-foreground">コーチ</p>
          </div>
          {statusBadge && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${statusBadge.cls}`}>
              {statusBadge.icon}
              {statusBadge.label}
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">
            {isReply ? "依頼内容" : "依頼タイトル"}
          </p>
          <h2 className="text-base font-bold text-foreground leading-snug flex items-center gap-2">
            <FileVideo className="w-4 h-4 text-accent-yellow flex-shrink-0" />
            {msg.reviewTitle || msg.text}
          </h2>
        </div>

        {/* Video player placeholder */}
        {videos.length > 0 && (
          <div className="space-y-2">
            {videos.map((v, i) => (
              <div key={i} className="relative w-full aspect-video bg-black rounded-[8px] overflow-hidden flex items-center justify-center">
                {thread.videosDeleted ? (
                  <div className="flex flex-col items-center gap-2 text-white/60 text-xs">
                    <Lock className="w-8 h-8" />
                    <p>保存期限が過ぎ、削除されました</p>
                  </div>
                ) : v.url ? (
                  <video src={v.url} className="w-full h-full object-contain" controls playsInline />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                    <button className="relative w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-foreground ml-1" fill="currentColor" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                      <p className="text-xs text-white truncate">{v.name}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Request body (always visible) */}
        {isRequest && msg.reviewBody && (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">依頼メモ</p>
            <div className="bg-card border border-border rounded-[8px] p-3">
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{msg.reviewBody}</p>
            </div>
          </div>
        )}

        {/* Reply body */}
        {isReply && (
          <>
            {originalRequest?.reviewBody && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">元の依頼メモ</p>
                <div className="bg-muted/40 border border-border rounded-[8px] p-3">
                  <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{originalRequest.reviewBody}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                <Video className="w-3 h-3" />
                コーチのフィードバック
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-[8px] p-4">
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{msg.reviewBody}</p>
              </div>
              <p className="text-[10px] text-muted-foreground text-right mt-1">{msg.time}</p>
            </div>
          </>
        )}

        {/* Retention hint */}
        {thread.videoRetentionUntil && !thread.videosDeleted && (
          <div className="bg-muted/40 border border-border rounded-[8px] p-3 flex items-start gap-2">
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              動画は {new Date(thread.videoRetentionUntil).toLocaleDateString("ja-JP")} まで閲覧できます。
              保存期限を過ぎると自動的に削除されます。
            </p>
          </div>
        )}

        {/* Back to thread */}
        <button
          onClick={() => navigate(`/messages/${thread.id}`)}
          className="w-full h-11 rounded-[6px] border border-border text-sm font-bold hover:bg-muted/30 transition-colors"
        >
          メッセージに戻る
        </button>
      </div>
    </InnerPageLayout>
  );
};

export default ReviewDetail;
