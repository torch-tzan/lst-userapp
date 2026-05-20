import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

import type { NavItem } from "../lib/navigation";

interface AdminSidebarProps {
  items: NavItem[];
  title: string;
  subtitle?: string;
}

const AdminSidebar = ({ items, title, subtitle }: AdminSidebarProps) => {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-60 flex-col bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="text-lg font-semibold tracking-wide">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-slate-400">{subtitle}</div> : null}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <li key={item.key}>
                <Link
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-y-1 left-0 w-1 rounded-r bg-blue-500" aria-hidden />
                  ) : null}
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">v0.1 prototype</div>
    </aside>
  );
};

export default AdminSidebar;
