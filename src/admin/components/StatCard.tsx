import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  deltaLabel?: string;
  deltaDirection?: "up" | "down" | "flat";
  icon?: React.ReactNode;
}

const StatCard = ({ label, value, deltaLabel, deltaDirection, icon }: StatCardProps) => {
  const positive = deltaDirection === "up";
  const negative = deltaDirection === "down";

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-slate-500">{label}</div>
        {icon ? <div className="text-slate-400">{icon}</div> : null}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      {deltaLabel ? (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium",
            positive && "text-emerald-600",
            negative && "text-rose-600",
            !positive && !negative && "text-slate-500",
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : null}
          {negative ? <ArrowDownRight className="h-3 w-3" /> : null}
          <span>{deltaLabel}</span>
        </div>
      ) : null}
    </div>
  );
};

export default StatCard;
