import { Search, CalendarDays, MessageSquare, User, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getUnreadMessageCount } from "@/lib/messageStore";
import { getUnreadCount as getUnreadNotifCount } from "@/lib/notificationStore";

const tabs = [
  { icon: Search, label: "検索", path: "/" },
  { icon: CalendarDays, label: "予約", path: "/bookings" },
  { icon: Trophy, label: "ゲーム", path: "/game" },
  { icon: MessageSquare, label: "メッセージ", path: "/messages" },
  { icon: User, label: "マイページ", path: "/mypage" },
];

interface BottomNavProps {
  active?: number;
}

const BottomNav = ({ active = 0 }: BottomNavProps) => {
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const update = () => {
      setUnreadMessages(getUnreadMessageCount());
      setUnreadNotifs(getUnreadNotifCount());
    };
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="flex-shrink-0">
      <div className="flex">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors relative ${
              i === active ? "text-primary" : "text-primary-foreground/50"
            }`}
          >
            <div className="relative">
              <tab.icon className="w-5 h-5" />
              {tab.label === "メッセージ" && unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
              {tab.label === "マイページ" && unreadNotifs > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                  {unreadNotifs > 99 ? "99+" : unreadNotifs}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
