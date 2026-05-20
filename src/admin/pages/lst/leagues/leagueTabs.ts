import type { SegmentedTab } from "../../../components/SegmentedTabs";

/** リーグ管理ページの二級ナビ定義 */
export const LEAGUE_ADMIN_TABS: SegmentedTab[] = [
  {
    label: "募集一覧",
    to: "/admin/lst/leagues",
    match: (pathname) =>
      pathname === "/admin/lst/leagues" ||
      // detail / per-match pages should keep "募集一覧" active
      (pathname.startsWith("/admin/lst/leagues/") &&
        !pathname.startsWith("/admin/lst/leagues/rankings") &&
        !pathname.startsWith("/admin/lst/leagues/players")),
  },
  {
    label: "シーズン順位",
    to: "/admin/lst/leagues/rankings",
    match: (pathname) =>
      pathname.startsWith("/admin/lst/leagues/rankings") ||
      pathname.startsWith("/admin/lst/leagues/players"),
  },
];
