import { useEffect, useState } from "react";
import BottomSheet from "@/components/pickers/BottomSheet";
import { Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  open: boolean;
  title: string;
  options: Option[];
  selected: Set<string>;
  onConfirm: (next: Set<string>) => void;
  onClose: () => void;
}

/**
 * Bottom-sheet multi-select with checkbox rows. Holds a temp selection until
 * the user taps the confirm button, mirroring the WheelPicker UX in SearchForm.
 */
const MultiSelectSheet = ({ open, title, options, selected, onConfirm, onClose }: Props) => {
  const [temp, setTemp] = useState<Set<string>>(new Set(selected));

  // Resync temp whenever the sheet opens with a fresh upstream value.
  useEffect(() => {
    if (open) setTemp(new Set(selected));
  }, [open, selected]);

  const toggle = (value: string) => {
    const next = new Set(temp);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setTemp(next);
  };

  return (
    <BottomSheet
      open={open}
      title={title}
      onClose={onClose}
      onConfirm={() => onConfirm(temp)}
      onClear={temp.size > 0 ? () => onConfirm(new Set()) : undefined}
      confirmLabel={temp.size > 0 ? `${temp.size}件を適用` : "適用"}
    >
      <div className="divide-y divide-border">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">選択肢がありません</p>
        ) : (
          options.map((opt) => {
            const checked = temp.has(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center justify-between py-3 text-left hover:bg-muted/30 transition-colors"
              >
                <span className={`text-sm ${checked ? "font-bold text-foreground" : "text-foreground"}`}>
                  {opt.label}
                </span>
                <span
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    checked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border"
                  }`}
                  aria-hidden
                >
                  {checked && <Check className="w-3 h-3" />}
                </span>
              </button>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
};

export default MultiSelectSheet;
