import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import WheelPicker from "@/components/pickers/WheelPicker";
import MiniCalendar from "@/components/pickers/MiniCalendar";
import BottomSheet from "@/components/pickers/BottomSheet";
import { PREFECTURES, HOURS } from "@/components/pickers/constants";

const SearchForm = () => {
  const navigate = useNavigate();
  const [area, setArea] = useState("広島市中区");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [openPicker, setOpenPicker] = useState<"area" | "date" | "time" | null>(null);

  const [tempArea, setTempArea] = useState("");
  const [tempDate, setTempDate] = useState("");
  const [tempStart, setTempStart] = useState("09:00");
  const [tempEnd, setTempEnd] = useState("12:00");

  const open = (type: "area" | "date" | "time") => {
    if (type === "area") setTempArea(area || "広島市中区");
    if (type === "date") setTempDate(date || new Date().toISOString().slice(0, 10));
    if (type === "time") { setTempStart(startTime || "09:00"); setTempEnd(endTime || "12:00"); }
    setOpenPicker(type);
  };

  const confirm = () => {
    if (openPicker === "area") setArea(tempArea);
    if (openPicker === "date") setDate(tempDate);
    if (openPicker === "time") { setStartTime(tempStart); setEndTime(tempEnd); }
    setOpenPicker(null);
  };

  const clearCurrent = () => {
    if (openPicker === "date") setDate("");
    if (openPicker === "time") { setStartTime(""); setEndTime(""); }
    setOpenPicker(null);
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`;
  };

  const timeDisplay = startTime && endTime ? `${startTime} 〜 ${endTime}` : "";

  const clearInline = (e: React.MouseEvent, clearFn: () => void) => {
    e.stopPropagation();
    clearFn();
  };

  return (
    <div className="relative">
      <div className="bg-card rounded-[8px] shadow-lg mx-[20px] px-[16px] py-[16px]">
        <h2 className="text-lg font-bold text-center mb-5 text-card-foreground">パデルコートを検索</h2>

        <div className="space-y-0 divide-y divide-border">
          <button onClick={() => open("area")} className="flex items-center gap-3 py-3.5 w-full text-left first:pt-0">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className={`text-sm flex-1 ${area ? "text-foreground" : "text-muted-foreground"}`}>
              {area || "エリアを選択"}
            </span>
          </button>
          <button onClick={() => open("date")} className="flex items-center gap-3 py-3.5 w-full text-left">
            <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className={`text-sm flex-1 ${date ? "text-foreground" : "text-muted-foreground"}`}>
              {date ? formatDate(date) : "利用日を選択"}
            </span>
            {date && (
              <span onClick={(e) => clearInline(e, () => setDate(""))} className="p-1 text-muted-foreground">
                <X className="w-4 h-4" />
              </span>
            )}
          </button>
          <button onClick={() => open("time")} className="flex items-center gap-3 py-3.5 w-full text-left">
            <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className={`text-sm flex-1 ${timeDisplay ? "text-foreground" : "text-muted-foreground"}`}>
              {timeDisplay || "時間を選択"}
            </span>
            {timeDisplay && (
              <span onClick={(e) => clearInline(e, () => { setStartTime(""); setEndTime(""); })} className="p-1 text-muted-foreground">
                <X className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>

        <Button
          onClick={() => navigate("/search", { state: { area, date, startTime, endTime } })}
          disabled={!area}
          className="w-full mt-5 h-12 rounded-[4px] text-base font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          検索する
        </Button>
      </div>

      {/* Area */}
      <BottomSheet open={openPicker === "area"} title="エリアを選択" onClose={() => setOpenPicker(null)} onConfirm={confirm}>
        <WheelPicker items={PREFECTURES} value={tempArea} onChange={setTempArea} />
      </BottomSheet>

      <BottomSheet open={openPicker === "date"} title="利用日を選択" onClose={() => setOpenPicker(null)} onConfirm={confirm} onClear={date ? clearCurrent : undefined}>
        <MiniCalendar value={tempDate} onChange={setTempDate} />
      </BottomSheet>

      <BottomSheet open={openPicker === "time"} title="時間を選択" onClose={() => setOpenPicker(null)} onConfirm={confirm} onClear={(startTime || endTime) ? clearCurrent : undefined}>
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
    </div>
  );
};

export default SearchForm;
