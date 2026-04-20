import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import CourtCard from "@/components/CourtCard";
import { SearchX, ChevronDown, X } from "lucide-react";
import WheelPicker from "@/components/pickers/WheelPicker";
import MiniCalendar from "@/components/pickers/MiniCalendar";
import BottomSheet from "@/components/pickers/BottomSheet";
import { PREFECTURES, HOURS } from "@/components/pickers/constants";
import { COURTS } from "@/lib/courtData";

const MOCK_RESULTS = COURTS;

interface SearchState {
  area?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

type CourtSortKey = "default" | "price_asc" | "price_desc" | "name";
const COURT_SORT_OPTIONS: { key: CourtSortKey; label: string }[] = [
  { key: "default", label: "おすすめ" },
  { key: "price_asc", label: "料金が安い順" },
  { key: "price_desc", label: "料金が高い順" },
  { key: "name", label: "名前順" },
];

const SearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as SearchState) || {};

  const [area, setArea] = useState(state.area || "");
  const [date, setDate] = useState(state.date || "");
  const [startTime, setStartTime] = useState(state.startTime || "");
  const [endTime, setEndTime] = useState(state.endTime || "");

  const [openFilter, setOpenFilter] = useState<"area" | "date" | "time" | null>(null);
  const [sortKey, setSortKey] = useState<CourtSortKey>("default");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [tempArea, setTempArea] = useState("");
  const [tempDate, setTempDate] = useState("");
  const [tempStart, setTempStart] = useState("09:00");
  const [tempEnd, setTempEnd] = useState("12:00");

  const openPicker = (type: "area" | "date" | "time") => {
    if (type === "area") setTempArea(area || "広島市中区");
    if (type === "date") setTempDate(date || new Date().toISOString().slice(0, 10));
    if (type === "time") { setTempStart(startTime || "09:00"); setTempEnd(endTime || "12:00"); }
    setOpenFilter(type);
  };

  const confirmFilter = () => {
    if (openFilter === "area") setArea(tempArea);
    if (openFilter === "date") setDate(tempDate);
    if (openFilter === "time") { setStartTime(tempStart); setEndTime(tempEnd); }
    setOpenFilter(null);
  };

  const clearFilter = () => {
    if (openFilter === "date") setDate("");
    if (openFilter === "time") { setStartTime(""); setEndTime(""); }
    setOpenFilter(null);
  };

  const results = area ? MOCK_RESULTS : [];

  const formatDate = (d: string) => {
    if (!d) return "利用日";
    const dt = new Date(d + "T00:00:00");
    return `${dt.getMonth() + 1}/${dt.getDate()}`;
  };

  const timeLabel = startTime && endTime ? `${startTime}〜${endTime}` : "時間";

  const sorted = [...results].sort((a, b) => {
    switch (sortKey) {
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "name": return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  return (
    <InnerPageLayout title="検索結果一覧" onBack={() => navigate("/")}>
      <div className="space-y-3">
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          <FilterChip label={area || "エリア"} active={!!area} onClick={() => openPicker("area")} />
          <FilterChip label={formatDate(date)} active={!!date} onClick={() => openPicker("date")} onClear={date ? () => setDate("") : undefined} />
          <FilterChip label={timeLabel} active={!!startTime} onClick={() => openPicker("time")} onClear={startTime ? () => { setStartTime(""); setEndTime(""); } : undefined} />
        </div>

        {/* Sort capsule + result count */}
        <div className="flex items-center gap-2">
          <div ref={sortRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowSortDropdown((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-card text-xs font-medium text-foreground"
            >
              {COURT_SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
              <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
            </button>
            {showSortDropdown && (
              <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] bg-card border border-border rounded-[8px] shadow-lg py-1">
                {COURT_SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setShowSortDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      sortKey === opt.key
                        ? "font-bold text-primary bg-primary/5"
                        : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{results.length}件</p>
        </div>

        {sorted.length > 0 ? (
          <div className="space-y-3">
            {sorted.map((court, i) => (
              <CourtCard key={i} {...court} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <SearchX className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base font-bold text-foreground">検索結果が見つかりません</p>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              条件を変更して
              <br />
              もう一度検索してください
            </p>
          </div>
        )}
      </div>

      {/* Area picker */}
      <BottomSheet open={openFilter === "area"} title="エリアを選択" onClose={() => setOpenFilter(null)} onConfirm={confirmFilter}>
        <WheelPicker items={PREFECTURES} value={tempArea} onChange={setTempArea} />
      </BottomSheet>

      {/* Date picker */}
      <BottomSheet open={openFilter === "date"} title="利用日を選択" onClose={() => setOpenFilter(null)} onConfirm={confirmFilter} onClear={date ? clearFilter : undefined}>
        <MiniCalendar value={tempDate} onChange={setTempDate} />
      </BottomSheet>

      {/* Time picker */}
      <BottomSheet open={openFilter === "time"} title="時間を選択" onClose={() => setOpenFilter(null)} onConfirm={confirmFilter} onClear={(startTime || endTime) ? clearFilter : undefined}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-muted-foreground text-center mb-1">開始</p>
            <WheelPicker items={HOURS} value={tempStart} onChange={(v) => {
              setTempStart(v);
              const h = parseInt(v.split(":")[0], 10);
              setTempEnd(`${String(Math.min(h + 1, 23)).padStart(2, "0")}:00`);
            }} />
          </div>
          <span className="text-lg font-bold text-muted-foreground mt-5">〜</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-muted-foreground text-center mb-1">終了</p>
            <WheelPicker items={HOURS} value={tempEnd} onChange={setTempEnd} />
          </div>
        </div>
      </BottomSheet>
    </InnerPageLayout>
  );
};

const FilterChip = ({ label, active, onClick, onClear }: { label: string; active: boolean; onClick: () => void; onClear?: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-card text-muted-foreground"
    }`}
  >
    {label}
    {active && onClear ? (
      <span
        onClick={(e) => { e.stopPropagation(); onClear(); }}
        className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5"
      >
        <X className="w-3 h-3" />
      </span>
    ) : (
      <ChevronDown className="w-3.5 h-3.5" />
    )}
  </button>
);


export default SearchResults;
