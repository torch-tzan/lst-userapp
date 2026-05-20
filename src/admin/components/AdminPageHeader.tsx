import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

const AdminPageHeader = ({ title, description, breadcrumbs, actions, className }: AdminPageHeaderProps) => {
  return (
    <div className={cn("mb-6 flex flex-col gap-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="flex items-center text-xs text-slate-500">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${idx}`} className="flex items-center">
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className="hover:text-slate-700">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-slate-700" : ""}>{crumb.label}</span>
                )}
                {!isLast ? <ChevronRight className="mx-1 h-3 w-3" /> : null}
              </span>
            );
          })}
        </nav>
      ) : null}

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
};

export default AdminPageHeader;
