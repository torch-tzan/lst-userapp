import { MapPin, Video, MessageSquareText } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export interface CoachCardProps {
  id: string;
  name: string;
  avatar?: string;
  level: string;
  specialty: string[];
  area: string;
  onlineAvailable?: boolean;
  reviewAvailable?: boolean;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  duration: number;
  availableToday?: boolean;
  onClick?: () => void;
}

const levelColor: Record<string, string> = {
  "S級": "bg-red-100 text-red-700",
  "A級": "bg-primary/15 text-primary",
  "B級": "bg-blue-100 text-blue-700",
};

/** Renders level + specialty tags, capping at 2 visual rows via ref measurement */
const SpecialtyTags = ({ level, specialty }: { level: string; specialty: string[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(specialty.length);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Temporarily show all tags to measure
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;

    // Get the top of the first tag (after level badge)
    const firstTag = children[1] || children[0]; // skip level badge
    if (!firstTag) return;

    const baseTop = children[0].offsetTop;
    let lineCount = 1;
    let prevTop = baseTop;
    let cutIndex = specialty.length;

    // Count lines - we want max 2 lines. Level badge is children[0], specialty starts at children[1]
    for (let i = 1; i < children.length; i++) {
      const child = children[i];
      if (child.dataset.overflow) continue; // skip the +N badge itself
      if (child.offsetTop > prevTop) {
        lineCount++;
        prevTop = child.offsetTop;
      }
      if (lineCount > 2) {
        cutIndex = i - 1; // -1 because index 0 is the level badge
        break;
      }
    }

    if (lineCount > 2) {
      setVisibleCount(cutIndex);
    }
    setMeasured(true);
  }, [specialty, level]);

  const hidden = specialty.length - visibleCount;

  return (
    <div ref={containerRef} className="flex items-center gap-1 mt-1 flex-wrap">
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${levelColor[level] || "bg-muted text-muted-foreground"}`}>
        {level}
      </span>
      {specialty.slice(0, visibleCount).map((sp) => (
        <span key={sp} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
          {sp}
        </span>
      ))}
      {hidden > 0 && (
        <span data-overflow="true" className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
          +{hidden}
        </span>
      )}
    </div>
  );
};

const CoachCard = ({
  name,
  avatar,
  level,
  specialty,
  area,
  onlineAvailable,
  reviewAvailable,
  rating,
  reviewCount,
  pricePerHour,
  duration,
  onClick,
}: CoachCardProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full h-[140px] bg-card rounded-[8px] border border-border flex overflow-hidden text-left"
    >
      {/* Left: Avatar */}
      <div className="w-24 self-stretch flex-shrink-0 bg-muted">
        {avatar ? (
          <img src={avatar} alt={name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>

      {/* Right: Info */}
      <div className="flex-1 p-3 flex flex-col justify-between relative min-w-0">
        {/* Rating badge - top right */}
        <span className="absolute top-2 right-2 bg-accent-yellow/15 text-accent-yellow text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 leading-none">
          ★{rating}
        </span>

        {/* Top section */}
        <div>
          <p className="text-sm font-bold text-foreground truncate pr-12">{name}</p>

          {/* Level & Specialty */}
          <SpecialtyTags level={level} specialty={specialty} />

          {/* Area & Online */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">{area}</span>
            </div>
            {onlineAvailable && (
              <div className="flex items-center gap-0.5">
                <Video className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="text-[10px] font-medium text-primary">オンライン</span>
              </div>
            )}
            {reviewAvailable && (
              <div className="flex items-center gap-0.5">
                <MessageSquareText className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span className="text-[10px] font-medium text-emerald-600">レビュー</span>
              </div>
            )}
          </div>
        </div>

        {/* Price - bottom right */}
        <p className="text-sm font-bold text-foreground self-end mt-1">
          ¥{pricePerHour.toLocaleString()}/{duration}分
        </p>
      </div>
    </button>
  );
};

export default CoachCard;
