import { ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface CourtCardProps {
  id?: string;
  name: string;
  courtName: string;
  courtType: string;
  price: number;
  image: string;
  available: boolean;
}

const CourtCard = ({ id, name, courtName, courtType, price, image, available }: CourtCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchState = (location.state as Record<string, string>) || {};

  const handleClick = () => {
    if (id) navigate(`/court/${id}`, { state: { date: searchState.date, startTime: searchState.startTime, endTime: searchState.endTime, people: searchState.people } });
  };

  return (
    <div className="bg-card rounded-[8px] p-3 shadow-sm cursor-pointer" onClick={handleClick}>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-bold text-base text-card-foreground">{name}</h4>
        {available && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-available/10 text-available border-available/30 border-0">
            空き枠あり
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <img src={image} alt={courtName} loading="lazy" className="w-14 h-14 rounded-[8px] object-cover" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{courtName}（{courtType}）</p>
          <p className="text-base font-bold mt-0.5 text-[#573800]">¥{price.toLocaleString()}/時間</p>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
        className="w-full mt-3 h-10 rounded-[4px] bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
      >
        予約する <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CourtCard;
