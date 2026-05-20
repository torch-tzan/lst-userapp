import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

export interface SegmentedTab {
  label: string;
  to: string;
  /** Optional match function. Default: location.pathname === to. */
  match?: (pathname: string) => boolean;
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  className?: string;
}

/**
 * セカンダリナビゲーション用の Tab UI。
 * AdminPageHeader 直下に置く想定。
 */
const SegmentedTabs = ({ tabs, className }: SegmentedTabsProps) => {
  const location = useLocation();
  return (
    <div className={cn("mb-4 inline-flex rounded-lg border bg-white p-1 shadow-sm", className)}>
      {tabs.map((tab) => {
        const isActive = tab.match
          ? tab.match(location.pathname)
          : location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

export default SegmentedTabs;
