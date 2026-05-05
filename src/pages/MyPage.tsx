import { useState } from "react";
import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  ChevronRight,
  Diamond,
  ExternalLink,
  Globe,
  GraduationCap,
  History,
  Lock,
  LogOut,
  Star,
  Ticket,
  Trophy,
  User,
} from "lucide-react";
import { useUserProfile } from "@/lib/userProfileStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { formatJP } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

const MyPage = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const sub = useSubscription();
  const [showLogout, setShowLogout] = useState(false);
  const isPremium = sub.isPremium();

  const handleLogout = () => {
    setShowLogout(false);
    navigate("/login");
  };

  return (
    <PhoneMockup bottomNav={<BottomNav active={4} />}>
      <div className="flex flex-col h-full bg-background">
        <div className="flex-shrink-0 sticky top-0 z-30 bg-background">
          <div className="px-[20px] pt-4 pb-3 relative flex items-center justify-center">
            <h1 className="text-xl font-bold text-foreground">マイページ</h1>
            <button
              onClick={() => navigate("/notifications")}
              className="absolute right-[20px] w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
            </button>
          </div>
          <Separator />
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {/* User profile */}
          <button onClick={() => navigate("/profile/edit")} className="w-full text-left">
            <div className="px-[20px] pt-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground">{profile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1 mt-1.5 bg-gray-5 text-primary text-[10px] font-bold px-2 py-0.5 rounded">
                      <Diamond className="w-3 h-3" />
                      プレミアム
                    </span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </button>

          {/* Points card */}
          <div className="px-[20px] mb-4">
            <div className="bg-gray-5 rounded-[8px] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-foreground/60 font-medium">保有ポイント</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-primary">{profile.points.toLocaleString()}</span>
                  <span className="text-sm font-medium text-primary-foreground/70">pt</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/points/history")}
                className="bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-[4px]"
              >
                履歴を見る
              </button>
            </div>
          </div>

          {/* Premium recommendation card (未訂閱者) */}
          {!isPremium && (
            <div className="px-[20px] mb-4">
              <button
                onClick={() => navigate("/premium/plan")}
                className="w-full bg-gray-5 rounded-[8px] p-5 text-left"
              >
                <p className="text-xs text-primary font-bold">プレミアム会員になりませんか？</p>
                <p className="text-base font-bold text-primary-foreground mt-1">
                  特典で、もっとお得に楽しもう。
                </p>
                <ul className="text-[11px] text-primary-foreground/80 mt-3 space-y-0.5">
                  <li>・ポイント還元 3pt → <span className="text-primary font-bold">5pt</span></li>
                  <li>・月1回 コーチレビュー無料クーポン</li>
                  <li>・月例ゲームのボーナスポイント</li>
                </ul>
                <div className="bg-primary text-primary-foreground text-center py-2.5 rounded-[6px] mt-3 text-sm font-bold">
                  月額 ¥500 で始める
                </div>
              </button>
            </div>
          )}

          <Separator />

          {/* Standard menu */}
          <button
            onClick={() => navigate("/coupons")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Ticket className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">クーポン</span>
            <span className="text-xs text-muted-foreground">2枚利用可能</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/bookings/past")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <History className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">予約履歴</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/coaching-history")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <GraduationCap className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">コーチング履歴</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/reviews")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Star className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">評価履歴</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          {isPremium && (
            <button
              onClick={() => navigate("/game/my-results")}
              className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
            >
              <Trophy className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">大会成績</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          )}

          {/* Plan management section (訂閱者) */}
          {isPremium && (
            <>
              <Separator />
              <p className="px-[20px] pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                プラン管理
              </p>
              <div className="px-[20px] pb-2">
                <button
                  onClick={() => navigate("/premium/manage")}
                  className="w-full bg-gray-5 rounded-[8px] p-4 flex items-center gap-3 text-left"
                >
                  <Diamond className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-foreground">プレミアム会員</p>
                    <p className="text-[11px] text-primary-foreground/70 mt-0.5">
                      次回更新：{formatJP(sub.nextRenewAt)}（¥500）
                    </p>
                  </div>
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded">
                    管理
                  </span>
                </button>
              </div>
            </>
          )}

          <Separator />

          <p className="px-[20px] pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
            設定
          </p>
          <button
            onClick={() => navigate("/notification-settings")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">通知設定</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/password-change")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Lock className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">パスワード変更</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/language")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">言語切替</span>
            <span className="text-xs text-muted-foreground">日本語</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/related-sites")}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">関連サイト</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>

          <Separator />
          <button
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 px-[20px] py-3.5 hover:bg-muted/50 text-left"
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="flex-1 text-sm font-medium text-destructive">ログアウト</span>
          </button>

          <p className="text-center text-[10px] text-muted-foreground mt-6">PADEL BASE v1.0.0</p>
        </div>
      </div>

      <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
        <AlertDialogContent className="rounded-[8px] max-w-[320px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">ログアウト</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              ログアウトしてもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[4px]">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground rounded-[4px]"
            >
              ログアウト
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PhoneMockup>
  );
};

export default MyPage;
