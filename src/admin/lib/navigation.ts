import type { LucideIcon } from "lucide-react";
import {
  Award,
  CalendarDays,
  Clock,
  DollarSign,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Receipt,
  Settings,
  Sparkles,
  Store,
  TrendingUp,
  Trophy,
  UserCircle,
  Users,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const LST_NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "ダッシュボード", icon: LayoutDashboard, path: "/admin/lst/dashboard" },
  { key: "affiliates", label: "加盟店管理", icon: Store, path: "/admin/lst/affiliates" },
  { key: "members", label: "会員管理", icon: Users, path: "/admin/lst/members" },
  { key: "courts", label: "コート管理", icon: MapPin, path: "/admin/lst/courts" },
  { key: "bookings", label: "予約管理", icon: CalendarDays, path: "/admin/lst/bookings" },
  { key: "payments", label: "支払い履歴", icon: Receipt, path: "/admin/lst/payments" },
  { key: "announcements", label: "お知らせ配信", icon: Megaphone, path: "/admin/lst/announcements" },
  { key: "campaigns", label: "キャンペーン・イベント", icon: Sparkles, path: "/admin/lst/campaigns" },
  { key: "coaches", label: "コーチ管理", icon: Award, path: "/admin/lst/coaches" },
  { key: "leagues", label: "リーグ管理", icon: Trophy, path: "/admin/lst/leagues" },
  { key: "revenue", label: "手数料・売上", icon: DollarSign, path: "/admin/lst/revenue" },
  { key: "fees", label: "手数料設定", icon: Settings, path: "/admin/lst/fees" },
];

export const STORE_NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "ダッシュボード", icon: LayoutDashboard, path: "/admin/store/dashboard" },
  { key: "courts", label: "コート管理", icon: MapPin, path: "/admin/store/courts" },
  { key: "bookings", label: "予約管理", icon: CalendarDays, path: "/admin/store/bookings" },
  { key: "sales", label: "売上管理", icon: TrendingUp, path: "/admin/store/sales" },
  { key: "payments", label: "支払い履歴", icon: Receipt, path: "/admin/store/payments" },
  { key: "staff", label: "スタッフ管理", icon: Users, path: "/admin/store/staff" },
  { key: "shifts", label: "シフト管理", icon: Clock, path: "/admin/store/shifts" },
  { key: "announcements", label: "お知らせ配信", icon: Megaphone, path: "/admin/store/announcements" },
  { key: "campaigns", label: "キャンペーン・イベント", icon: Sparkles, path: "/admin/store/campaigns" },
  { key: "profile", label: "管理者プロフィール", icon: UserCircle, path: "/admin/store/profile" },
];
