import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import type { SkillLevel } from "@/lib/tournamentStore";
import { useToast } from "@/components/ui/use-toast";
import BottomSheet from "@/components/pickers/BottomSheet";
import MiniCalendar from "@/components/pickers/MiniCalendar";
import WheelPicker from "@/components/pickers/WheelPicker";
import { LEAGUE_HOURS } from "@/components/pickers/constants";
import { COURTS } from "@/lib/courtData";
import { Calendar, Clock, MapPin, Info, Check } from "lucide-react";

const OTHER_VENUE = "__other__";

const VENUE_OPTIONS: { value: string; label: string }[] = [
  ...COURTS.map((c) => ({ value: `${c.name} ${c.courtName}`, label: `${c.name} ${c.courtName}` })),
  { value: OTHER_VENUE, label: "その他（自分で入力）" },
];

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: "初心者",
  intermediate: "中級",
  advanced: "上級",
};

function formatDateLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const LeagueBoardNew = () => {
  const navigate = useNavigate();
  const { createPostedMatch } = useLeagueMatchBoardStore();
  const { toast } = useToast();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venueSelection, setVenueSelection] = useState<string>(""); // "" | court display name | OTHER_VENUE
  const [otherVenue, setOtherVenue] = useState("");
  const [description, setDescription] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");

  // In-app picker state
  const [openPicker, setOpenPicker] = useState<"date" | "time" | "venue" | null>(null);
  const [tempDate, setTempDate] = useState("");
  const [tempTime, setTempTime] = useState("19:00");

  const openDatePicker = () => {
    setTempDate(date || new Date().toISOString().slice(0, 10));
    setOpenPicker("date");
  };
  const openTimePicker = () => {
    setTempTime(time || "19:00");
    setOpenPicker("time");
  };
  const confirmPicker = () => {
    if (openPicker === "date") setDate(tempDate);
    if (openPicker === "time") setTime(tempTime);
    setOpenPicker(null);
  };

  const pickVenue = (value: string) => {
    setVenueSelection(value);
    if (value !== OTHER_VENUE) setOtherVenue(""); // clear custom input on real court select
    setOpenPicker(null);
  };

  const isOtherVenue = venueSelection === OTHER_VENUE;
  const finalVenue = isOtherVenue ? otherVenue.trim() : venueSelection;
  const venueDisplay = !venueSelection
    ? ""
    : isOtherVenue
    ? "その他（自分で入力）"
    : venueSelection;

  const canSubmit = !!date && !!time && !!finalVenue;

  const submit = () => {
    if (!canSubmit) return;
    const desiredDate = new Date(`${date}T${time}`).toISOString();
    const r = createPostedMatch({
      desiredDate,
      preferredVenue: finalVenue,
      description: description.trim() || undefined,
      desiredSkillLevel: skillLevel || undefined,
    });
    if (r.ok) {
      toast({ title: "募集を作成しました", description: "他のメンバーから応募を待ちましょう" });
      navigate(r.id ? `/game/league/${r.id}` : "/game/league");
    }
  };

  const fieldCls = (filled: boolean) =>
    `w-full flex items-center gap-3 px-3 py-3 rounded-[8px] border text-sm text-left transition-colors ${
      filled
        ? "bg-card border-border text-foreground"
        : "bg-card border-border text-muted-foreground hover:border-primary/40"
    }`;

  return (
    <InnerPageLayout
      title="募集を作成"
      ctaLabel="作成する"
      ctaDisabled={!canSubmit}
      onCtaClick={submit}
    >
      <p className="text-sm font-bold text-foreground mb-2">希望日時</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button onClick={openDatePicker} className={fieldCls(!!date)}>
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 truncate">{date ? formatDateLabel(date) : "日付を選択"}</span>
        </button>
        <button onClick={openTimePicker} className={fieldCls(!!time)}>
          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 truncate">{time || "時刻を選択"}</span>
        </button>
      </div>

      <p className="text-sm font-bold text-foreground mb-2">希望場地</p>
      <button onClick={() => setOpenPicker("venue")} className={fieldCls(!!venueSelection) + " w-full mb-1"}>
        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 truncate text-left">
          {venueDisplay || "場地を選択"}
        </span>
      </button>
      {isOtherVenue && (
        <input
          type="text"
          value={otherVenue}
          onChange={(e) => setOtherVenue(e.target.value)}
          placeholder="場地名を入力（例：本店コートB）"
          className="w-full bg-card border border-border rounded-[8px] p-3 text-sm mt-2"
        />
      )}
      {!!finalVenue && (
        <div className="flex items-start gap-1.5 mt-2 p-2.5 bg-accent-yellow/10 border border-accent-yellow/30 rounded-[6px]">
          <Info className="w-3.5 h-3.5 text-accent-yellow flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground leading-relaxed">
            場地の予約は別途ご自身でお済ませください。LST は予約を代行しません。
          </p>
        </div>
      )}
      <div className="mb-4" />

      <p className="text-sm font-bold text-foreground mb-2">希望レベル（任意）</p>
      <div className="flex gap-2 mb-4">
        {(["beginner", "intermediate", "advanced"] as SkillLevel[]).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSkillLevel(skillLevel === lvl ? "" : lvl)}
            className={`flex-1 px-3 py-2 rounded-[6px] text-xs font-bold border ${
              skillLevel === lvl
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {SKILL_LABEL[lvl]}
          </button>
        ))}
      </div>

      <p className="text-sm font-bold text-foreground mb-2">説明（任意）</p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="例：気軽に楽しみたい方を募集中。ブランクある方も歓迎。"
        className="w-full min-h-[100px] bg-card border border-border rounded-[8px] p-3 text-sm resize-none mb-4"
      />

      <div className="bg-muted/30 border border-border rounded-[8px] p-3 text-[11px] text-muted-foreground">
        作成後、他の利用者から応募が届きます。あなたが承認すると 4 名揃って試合が成立します。
      </div>

      {/* In-app pickers */}
      <BottomSheet
        open={openPicker === "date"}
        title="日付を選択"
        onClose={() => setOpenPicker(null)}
        onConfirm={confirmPicker}
        onClear={date ? () => { setDate(""); setOpenPicker(null); } : undefined}
      >
        <MiniCalendar value={tempDate} onChange={setTempDate} />
      </BottomSheet>

      <BottomSheet
        open={openPicker === "time"}
        title="開始時刻を選択"
        onClose={() => setOpenPicker(null)}
        onConfirm={confirmPicker}
        onClear={time ? () => { setTime(""); setOpenPicker(null); } : undefined}
      >
        <WheelPicker items={LEAGUE_HOURS} value={tempTime} onChange={setTempTime} />
      </BottomSheet>

      {/* Venue picker — tap-to-select pattern (auto-closes on choice) */}
      <BottomSheet
        open={openPicker === "venue"}
        title="場地を選択"
        onClose={() => setOpenPicker(null)}
        onConfirm={() => setOpenPicker(null)}
        confirmLabel="閉じる"
      >
        <div className="divide-y divide-border">
          {VENUE_OPTIONS.map((opt) => {
            const selected = venueSelection === opt.value;
            const isOtherRow = opt.value === OTHER_VENUE;
            return (
              <button
                key={opt.value}
                onClick={() => pickVenue(opt.value)}
                className="w-full flex items-center justify-between py-3 text-left hover:bg-muted/30 transition-colors"
              >
                <span
                  className={`text-sm ${selected ? "font-bold text-foreground" : isOtherRow ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {opt.label}
                </span>
                {selected && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </InnerPageLayout>
  );
};

export default LeagueBoardNew;
