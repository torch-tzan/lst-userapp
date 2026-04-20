import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { getThreads, seedDemoThreads, type MessageThread } from "@/lib/messageStore";
import { getCoachAvatar } from "@/lib/coachData";
import { useState, useEffect } from "react";

interface DisplayThread {
  id: string;
  coachName: string;
  coachInitial: string;
  coachAvatar?: string;
  lastMessage: string;
  date: string;
  unread: boolean;
}

const Messages = () => {
  const navigate = useNavigate();
  const bottomNav = <BottomNav active={3} />;
  const [threads, setThreads] = useState<DisplayThread[]>([]);

  useEffect(() => {
    seedDemoThreads();
    const stored = getThreads();
    const display: DisplayThread[] = stored.map((t) => {
      const lastMsg = t.messages[t.messages.length - 1];
      return {
        id: t.id,
        coachName: t.coachName,
        coachInitial: t.coachInitial,
        coachAvatar: t.coachAvatar,
        lastMessage: lastMsg?.text || "",
        date: lastMsg?.time?.split(" ")[0] || "",
        unread: true,
      };
    });
    setThreads(display);
  }, []);

  return (
    <PhoneMockup bottomNav={bottomNav}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-30 bg-background">
          <div className="px-[20px] pt-4 pb-3 flex items-center justify-center">
            <h1 className="text-xl font-bold text-foreground">メッセージ</h1>
          </div>
          <Separator />
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-24 gap-3 px-[20px]">
              <p className="text-sm font-bold text-foreground">メッセージはありません</p>
              <p className="text-xs text-muted-foreground text-center">
                コーチのレッスンを予約すると、<br />ここでやり取りができます。
              </p>
            </div>
          ) : (
            threads.map((thread, i) => (
              <div key={thread.id}>
                <button
                  onClick={() => navigate(`/messages/${thread.id}`)}
                  className={`w-full flex items-center gap-3 px-[20px] py-4 text-left hover:bg-muted/50 transition-colors ${
                    thread.unread ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  {/* Avatar */}
                  {(() => {
                    const avatar = getCoachAvatar(thread.coachName) || thread.coachAvatar;
                    return avatar ? (
                      <img src={avatar} alt={thread.coachName} loading="lazy" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-muted-foreground">{thread.coachInitial}</span>
                      </div>
                    );
                  })()}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${thread.unread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                        {thread.coachName}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 ml-2">{thread.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {thread.unread && <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />}
                      <p className="text-xs text-muted-foreground truncate">{thread.lastMessage}</p>
                    </div>
                  </div>
                </button>
                {i < threads.length - 1 && <Separator />}
              </div>
            ))
          )}
        </div>
      </div>
    </PhoneMockup>
  );
};

export default Messages;
