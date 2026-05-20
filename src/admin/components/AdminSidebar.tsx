import { Link, useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";

import type { NavGroup } from "../lib/navigation";

interface AdminSidebarProps {
  groups: NavGroup[];
  dashboardPath: string;
}

const AdminSidebar = ({ groups, dashboardPath }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col overflow-hidden bg-slate-900 text-slate-100">
      {/* ロゴエリア — クリックでダッシュボード */}
      <button
        type="button"
        onClick={() => navigate(dashboardPath)}
        className="flex h-20 flex-shrink-0 items-center gap-3 border-b border-slate-800 px-6 transition-colors hover:bg-slate-800/60"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500">
          <span className="text-base font-bold text-white">A</span>
        </span>
        <span className="text-lg font-bold tracking-wide text-white">ADMIN</span>
      </button>

      <nav className="flex-1 overflow-hidden py-2">
        {groups.map((group) => (
          <div key={group.groupLabel} className="mb-1">
            <div className="px-6 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {group.groupLabel}
            </div>
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <li key={item.key}>
                    <Link
                      to={item.path}
                      className={cn(
                        "relative flex items-center gap-3 px-6 py-2 text-sm transition-colors",
                        active
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                      )}
                    >
                      {active ? (
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-blue-500" aria-hidden />
                      ) : null}
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
