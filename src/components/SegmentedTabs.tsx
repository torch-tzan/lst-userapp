interface Tab {
  key: string;
  label: string;
  badge?: number;
}

interface SegmentedTabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

/**
 * iOS-style pill segmented control. Equal-width segments, compact 12px label,
 * smaller inline badges. Use for narrow tab rows where AnimatedTabs underline
 * crowds (4+ tabs / longer Japanese labels).
 */
const SegmentedTabs = ({ tabs, activeKey, onChange, className = "" }: SegmentedTabsProps) => {
  return (
    <div className={`bg-muted rounded-full p-1 flex gap-0.5 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 py-1.5 px-1 rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1 whitespace-nowrap min-w-0 ${
              isActive
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`text-[9px] font-bold min-w-[14px] h-3.5 px-1 rounded-full leading-none flex items-center justify-center flex-shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedTabs;
