import type { SegmentedTab } from "../../../components/SegmentedTabs";

/** 店舗側 リーグ管理ページの二級ナビ定義 */
export const STORE_LEAGUE_ADMIN_TABS: SegmentedTab[] = [
  {
    label: "募集一覧",
    to: "/admin/store/leagues",
    match: (pathname) =>
      pathname === "/admin/store/leagues" ||
      (pathname.startsWith("/admin/store/leagues/") &&
        !pathname.startsWith("/admin/store/leagues/rankings")),
  },
  {
    label: "シーズン順位",
    to: "/admin/store/leagues/rankings",
    match: (pathname) => pathname.startsWith("/admin/store/leagues/rankings"),
  },
];
