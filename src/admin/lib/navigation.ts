import type { LucideIcon } from "lucide-react";
import {
  Award,
  CalendarDays,
  Clock,
  DollarSign,
  LayoutDashboard,
  Mail,
  MapPin,
  Megaphone,
  Receipt,
  Settings,
  Sliders,
  Sparkles,
  Store,
  Ticket,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

// ── LST HQ サイドバー（グループ構造）────────────────────────────────
export const LST_NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: "メイン",
    items: [
      { key: "dashboard", label: "ダッシュボード", icon: LayoutDashboard, path: "/admin/lst/dashboard" },
      { key: "members", label: "会員管理", icon: Users, path: "/admin/lst/members" },
      { key: "affiliates", label: "企業管理", icon: Store, path: "/admin/lst/affiliates" },
      { key: "courts", label: "コート管理", icon: MapPin, path: "/admin/lst/courts" },
      { key: "bookings", label: "予約管理", icon: CalendarDays, path: "/admin/lst/bookings" },
      { key: "coaches", label: "コーチ管理", icon: Award, path: "/admin/lst/coaches" },
      { key: "leagues", label: "リーグ管理", icon: Trophy, path: "/admin/lst/leagues" },
    ],
  },
  {
    groupLabel: "売上/決済",
    items: [
      { key: "revenue", label: "支払い管理", icon: DollarSign, path: "/admin/lst/revenue" },
      { key: "payments", label: "支払い履歴", icon: Receipt, path: "/admin/lst/payments" },
    ],
  },
  {
    groupLabel: "お知らせ/イベント",
    items: [
      { key: "announcements", label: "お知らせ配信", icon: Megaphone, path: "/admin/lst/announcements" },
      { key: "campaigns", label: "キャンペーン・イベント管理", icon: Sparkles, path: "/admin/lst/campaigns" },
      { key: "coupons", label: "クーポン管理", icon: Ticket, path: "/admin/lst/coupons" },
    ],
  },
  {
    groupLabel: "システム",
    items: [
      { key: "system", label: "システム設定", icon: Sliders, path: "/admin/lst/system" },
      { key: "fees", label: "手数料設定", icon: Settings, path: "/admin/lst/fees" },
    ],
  },
];

// ── 店舗 サイドバー（グループ構造）─────────────────────────────────
export const STORE_NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: "会員/アカウント",
    items: [
      { key: "members", label: "会員管理", icon: Users, path: "/admin/store/members" },
      { key: "invitations", label: "アカウント招待", icon: Mail, path: "/admin/store/invitations" },
    ],
  },
  {
    groupLabel: "施設/予約",
    items: [
      { key: "courts", label: "コート管理", icon: MapPin, path: "/admin/store/courts" },
      { key: "bookings", label: "予約管理", icon: CalendarDays, path: "/admin/store/bookings" },
      { key: "leagues", label: "リーグ管理", icon: Trophy, path: "/admin/store/leagues" },
    ],
  },
  {
    groupLabel: "売上/決済",
    items: [
      { key: "sales", label: "売上管理", icon: TrendingUp, path: "/admin/store/sales" },
      { key: "payments", label: "支払い履歴", icon: Receipt, path: "/admin/store/payments" },
    ],
  },
  {
    groupLabel: "スタッフ/勤務",
    items: [
      { key: "staff", label: "スタッフ管理", icon: Users, path: "/admin/store/staff" },
      { key: "shifts", label: "シフト管理", icon: Clock, path: "/admin/store/shifts" },
    ],
  },
  {
    groupLabel: "お知らせ/イベント",
    items: [
      { key: "announcements", label: "お知らせ配信", icon: Megaphone, path: "/admin/store/announcements" },
      { key: "campaigns", label: "キャンペーン・イベント管理", icon: Sparkles, path: "/admin/store/campaigns" },
    ],
  },
];

// ── 後方互換: flat array（既存 consumer 用）────────────────────────
export const LST_NAV_ITEMS: NavItem[] = LST_NAV_GROUPS.flatMap((g) => g.items);
export const STORE_NAV_ITEMS: NavItem[] = STORE_NAV_GROUPS.flatMap((g) => g.items);
