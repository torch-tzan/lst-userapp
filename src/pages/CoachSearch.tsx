import InnerPageLayout from "@/components/InnerPageLayout";
import CoachCard, { CoachCardProps } from "@/components/CoachCard";
import BottomSheet from "@/components/pickers/BottomSheet";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COACHES } from "@/lib/coachData";

const COACHES_LIST: CoachCardProps[] = COACHES.map((c) => ({
  id: c.id,
  name: c.name,
  avatar: c.avatar,
  level: c.level,
  specialty: c.specialty,
  area: c.area,
  onlineAvailable: c.onlineAvailable,
  reviewAvailable: c.reviewAvailable,
  rating: c.rating,
  reviewCount: c.reviewCount,
  pricePerHour: c.pricePerHour,
  duration: c.duration,
  availableToday: c.availableToday,
}));

const LEVELS = ["S級", "A級", "B級"];
const SPECIALTIES = ["初心者指導", "競技向け", "ジュニア育成", "ダブルス戦術", "フォーム改善", "体力強化", "戦術分析", "メンタル強化", "フィジカル", "試合形式", "基礎トレーニング", "レクリエーション", "ポジショニング"];
const LESSON_TYPES = [
  { key: "onsite", label: "現場" },
  { key: "online", label: "オンライン" },
  { key: "review", label: "レビュー" },
] as const;
type LessonTypeKey = typeof LESSON_TYPES[number]["key"];
const LEVEL_ORDER: Record<string, number> = { "S級": 0, "A級": 1, "B級": 2 };

type SortKey = "default" | "rating" | "price_asc" | "price_desc" | "level";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "おすすめ" },
  { key: "rating", label: "評価が高い順" },
  { key: "price_asc", label: "料金が安い順" },
  { key: "price_desc", label: "料金が高い順" },
  { key: "level", label: "等級が高い順" },
];

const CoachSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Active filters
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const [selectedLessonTypes, setSelectedLessonTypes] = useState<LessonTypeKey[]>([]);

  // Temp filters (inside bottom sheet)
  const [tmpLevels, setTmpLevels] = useState<string[]>([]);
  const [tmpPrice, setTmpPrice] = useState<[number, number]>([0, 10000]);
  const [tmpAvailable, setTmpAvailable] = useState(false);
  const [tmpLessonTypes, setTmpLessonTypes] = useState<LessonTypeKey[]>([]);
  const [tmpSpecialties, setTmpSpecialties] = useState<string[]>([]);

  const openFilter = () => {
    setTmpLevels([...selectedLevels]);
    setTmpPrice([...priceRange]);
    setTmpAvailable(onlyAvailableToday);
    setTmpLessonTypes([...selectedLessonTypes]);
    setTmpSpecialties([...selectedSpecialties]);
    setShowFilter(true);
  };

  const applyFilter = () => {
    setSelectedLevels(tmpLevels);
    setPriceRange(tmpPrice);
    setOnlyAvailableToday(tmpAvailable);
    setSelectedLessonTypes(tmpLessonTypes);
    setSelectedSpecialties(tmpSpecialties);
    setShowFilter(false);
  };

  const clearFilter = () => {
    setTmpLevels([]);
    setTmpPrice([0, 10000]);
    setTmpAvailable(false);
    setTmpLessonTypes([]);
    setTmpSpecialties([]);
  };

  const hasActiveFilter =
    selectedLevels.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000 || onlyAvailableToday || selectedLessonTypes.length > 0 || selectedSpecialties.length > 0;

  const toggleLevel = (lv: string) => {
    setTmpLevels((prev) =>
      prev.includes(lv) ? prev.filter((l) => l !== lv) : [...prev, lv]
    );
  };

  const toggleSpecialty = (sp: string) => {
    setTmpSpecialties((prev) =>
      prev.includes(sp) ? prev.filter((s) => s !== sp) : [...prev, sp]
    );
  };

  const toggleLessonType = (lt: LessonTypeKey) => {
    setTmpLessonTypes((prev) =>
      prev.includes(lt) ? prev.filter((l) => l !== lt) : [...prev, lt]
    );
  };

  const filtered = COACHES_LIST.filter((c) => {
    const matchQuery =
      !query || c.name.includes(query) || c.specialty.some((s) => s.includes(query)) || c.level.includes(query);
    const matchLevel = selectedLevels.length === 0 || selectedLevels.includes(c.level);
    const matchPrice = c.pricePerHour >= priceRange[0] && c.pricePerHour <= priceRange[1];
    const matchAvailable = !onlyAvailableToday || c.availableToday;
    const matchLessonType = selectedLessonTypes.length === 0 || (
      (selectedLessonTypes.includes("onsite")) ||
      (selectedLessonTypes.includes("online") && c.onlineAvailable) ||
      (selectedLessonTypes.includes("review") && c.reviewAvailable)
    );
    const matchSpecialty = selectedSpecialties.length === 0 || selectedSpecialties.some((sp) => c.specialty.includes(sp));
    return matchQuery && matchLevel && matchPrice && matchAvailable && matchLessonType && matchSpecialty;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "rating": return b.rating - a.rating;
      case "price_asc": return a.pricePerHour - b.pricePerHour;
      case "price_desc": return b.pricePerHour - a.pricePerHour;
      case "level": return (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99);
      default: return 0;
    }
  });

  // Remove a single active filter chip
  const removeLevel = (lv: string) => setSelectedLevels((prev) => prev.filter((l) => l !== lv));
  const removeAvailable = () => setOnlyAvailableToday(false);
  const removeLessonType = (lt: LessonTypeKey) => setSelectedLessonTypes((prev) => prev.filter((l) => l !== lt));
  const removeSpecialty = (sp: string) => setSelectedSpecialties((prev) => prev.filter((s) => s !== sp));
  const removePrice = () => setPriceRange([0, 10000]);

  return (
    <InnerPageLayout title="コーチを探す">
      {/* Search input */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="名前・専門で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-[8px] border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={openFilter}
          className={`h-10 w-10 flex items-center justify-center rounded-[8px] border flex-shrink-0 ${
            hasActiveFilter
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Sort capsule + active filter chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {/* Sort dropdown capsule */}
        <div ref={sortRef} className="relative flex-shrink-0">
          <button
            onClick={() => setShowSortDropdown((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-card text-xs font-medium text-foreground"
          >
            {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
          </button>
          {showSortDropdown && (
            <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] bg-card border border-border rounded-[8px] shadow-lg py-1">
              {SORT_OPTIONS.map((opt) => (
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

        {/* Active filter chips */}
        {selectedLevels.map((lv) => (
          <button
            key={lv}
            onClick={() => removeLevel(lv)}
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"
          >
            {lv}
            <X className="w-3 h-3" />
          </button>
        ))}
        {(priceRange[0] > 0 || priceRange[1] < 10000) && (
          <button
            onClick={removePrice}
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"
          >
            ¥{priceRange[0].toLocaleString()}〜¥{priceRange[1].toLocaleString()}
            <X className="w-3 h-3" />
          </button>
        )}
        {onlyAvailableToday && (
          <button
            onClick={removeAvailable}
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"
          >
            本日空きあり
            <X className="w-3 h-3" />
          </button>
        )}
        {selectedLessonTypes.map((lt) => (
          <button
            key={lt}
            onClick={() => removeLessonType(lt)}
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"
          >
            {LESSON_TYPES.find((t) => t.key === lt)?.label}
            <X className="w-3 h-3" />
          </button>
        ))}
        {selectedSpecialties.map((sp) => (
          <button
            key={sp}
            onClick={() => removeSpecialty(sp)}
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"
          >
            {sp}
            <X className="w-3 h-3" />
          </button>
        ))}
      </div>

      {/* Results */}
      {sorted.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sorted.map((coach) => <CoachCard key={coach.id} {...coach} onClick={() => navigate(`/coaches/${coach.id}`)} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center py-10 gap-2">
          <p className="text-sm text-muted-foreground">該当するコーチが見つかりません</p>
        </div>
      )}

      {/* Filter Bottom Sheet */}
      <BottomSheet
        open={showFilter}
        title="絞り込み"
        onClose={() => setShowFilter(false)}
        onConfirm={applyFilter}
        onClear={clearFilter}
      >
        <div className="space-y-5">
          {/* Level */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">等級</p>
            <div className="flex gap-2">
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  onClick={() => toggleLevel(lv)}
                  className={`px-4 py-2 rounded-[4px] text-sm font-medium border transition-colors ${
                    tmpLevels.includes(lv)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <p className="text-sm font-bold text-foreground mb-1">料金（1時間あたり）</p>
            <p className="text-xs text-muted-foreground mb-3">
              ¥{tmpPrice[0].toLocaleString()} 〜 ¥{tmpPrice[1].toLocaleString()}
            </p>
            <Slider
              min={0}
              max={10000}
              step={500}
              value={tmpPrice}
              onValueChange={(v) => setTmpPrice(v as [number, number])}
            />
          </div>

          {/* Specialty */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">専門領域</p>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((sp) => (
                <button
                  key={sp}
                  onClick={() => toggleSpecialty(sp)}
                  className={`px-4 py-2 rounded-[4px] text-sm font-medium border transition-colors ${
                    tmpSpecialties.includes(sp)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Available Today */}
          <div>
            <button
              onClick={() => setTmpAvailable(!tmpAvailable)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-[8px] border transition-colors ${
                tmpAvailable
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              <span className="text-sm font-medium text-foreground">本日空きありのみ</span>
              <div
                className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-colors ${
                  tmpAvailable ? "border-primary bg-primary" : "border-muted-foreground"
                }`}
              >
                {tmpAvailable && (
                  <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Lesson Type */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">レッスン形式</p>
            <div className="flex gap-2">
              {LESSON_TYPES.map((lt) => (
                <button
                  key={lt.key}
                  onClick={() => toggleLessonType(lt.key)}
                  className={`px-4 py-2 rounded-[4px] text-sm font-medium border transition-colors ${
                    tmpLessonTypes.includes(lt.key)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  {lt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </InnerPageLayout>
  );
};

export default CoachSearch;
