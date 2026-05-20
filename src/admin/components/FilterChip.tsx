import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface FilterChipOption {
  value: string;
  label: string;
}

interface FilterChipProps {
  label: string;
  value?: string;
  options: FilterChipOption[];
  onChange?: (value: string | undefined) => void;
  className?: string;
}

const FilterChip = ({ label, value, options, onChange, className }: FilterChipProps) => {
  const active = value !== undefined && value !== "";
  const selected = options.find((opt) => opt.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            active
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            className,
          )}
        >
          <span>
            {label}
            {selected ? `: ${selected.label}` : ""}
          </span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onChange?.(undefined)}>すべて</DropdownMenuItem>
        {options.map((opt) => (
          <DropdownMenuItem key={opt.value} onSelect={() => onChange?.(opt.value)}>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FilterChip;
