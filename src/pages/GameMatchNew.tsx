import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/pickers/BottomSheet";
import MiniCalendar from "@/components/pickers/MiniCalendar";
import { useGameStore } from "@/lib/gameStore";
import { Users, Swords, Calendar, Clock, ChevronRight, X } from "lucide-react";

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

const formatDateLabel = (d: string) => {
  const dt = new Date(d + "T00:00:00");
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const label = `${dt.getMonth() + 1}月${dt.getDate()}日（${weekdays[dt.getDay()]}）`;
  if (d === todayStr) return `本日 ${label}`;
  if (d === tomorrowStr) return `明日 ${label}`;
  return label;
};

const GameMatchNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedVs = searchParams.get("vs");
  const { getUserTeams, getActiveTeams, proposeMatch } = useGameStore();

  const myTeams = getUserTeams();
  const [myTeamId, setMyTeamId] = useState(myTeams[0]?.id ?? "");
  const myTeam = myTeams.find((t) => t.id === myTeamId);
  const opponents = useMemo(
    () => getActiveTeams().filter((t) => !myTeams.some((mt) => mt.id === t.id)),
    [getActiveTeams, myTeams]
  );

  const [selectedTeamId, setSelectedTeamId] = useState(preselectedVs ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tempDate, setTempDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState("");

  if (myTeams.length === 0) {
    return (
      <InnerPageLayout title="試合を申込む" onBack={() => navigate(-1)} bottomNav={<BottomNav active={2} />}>
        <div className="bg-muted/30 border border-border rounded-[8px] p-4 text-center">
          <p className="text-sm text-muted-foreground">先にチームを組んでください</p>
          <button onClick={() => navigate("/game/team/new")} className="mt-3 text-xs text-primary font-bold">
            チームを組む →
          </button>
        </div>
      </InnerPageLayout>
    );
  }

  const handlePropose = () => {
    if (!selectedTeamId || !myTeam) return;
    let scheduledAt: string | undefined;
    if (date && time) {
      const [h, m] = time.split(":").map(Number);
      const dt = new Date(date + "T00:00:00");
      dt.setHours(h, m, 0, 0);
      scheduledAt = dt.toISOString();
    }
    const match = proposeMatch(myTeam.id, selectedTeamId, scheduledAt);
    navigate(`/game/match/${match.id}`, { replace: true });
  };

  return (
    <InnerPageLayout
      title="試合を申込む"
      onBack={() => navigate(-1)}
      ctaLabel="試合を申込む"
      ctaDisabled={!selectedTeamId}
      onCtaClick={handlePropose}
      bottomNav={<BottomNav active={2} />}
    >
      <div className="space-y-5 pb-6">
        {/* My team selector */}
        {myTeams.length > 1 ? (
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-2">使用するマイチーム</p>
            <div className="space-y-2">
              {myTeams.map((t) => {
                const active = myTeamId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setMyTeamId(t.id)}
                    className={`w-full p-3 rounded-[8px] border flex items-center gap-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{t.members.map((m) => m.name).join(" × ")}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-[8px] p-3">
            <p className="text-[11px] text-muted-foreground mb-1">マイチーム</p>
            <p className="text-sm font-bold text-foreground">{myTeam?.name}</p>
            <p className="text-[11px] text-muted-foreground">{myTeam?.members.map((m) => m.name).join(" × ")}</p>
          </div>
        )}

        {/* Opponent */}
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
            <Swords className="w-3.5 h-3.5" />
            対戦相手を選択
          </p>
          {opponents.length === 0 ? (
            <div className="bg-primary/5 border border-primary/30 rounded-[8px] p-4 text-center space-y-3">
              <p className="text-sm font-bold text-foreground">対戦可能なチームがまだありません</p>
              <p className="text-xs text-muted-foreground leading-relaxed">選手を招待してチーム対戦を盛り上げよう</p>
              <button
                onClick={() => navigate("/game/team/new")}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-[6px] bg-primary text-primary-foreground text-xs font-bold"
              >
                パートナーのいない選手を見に行く
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {opponents.map((t) => {
                const active = selectedTeamId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeamId(t.id)}
                    className={`w-full p-3 rounded-[8px] border flex items-center gap-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{t.members.map((m) => m.name).join(" × ")}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            希望日時（任意）
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setTempDate(date); setShowDatePicker(true); }}
              className="flex items-center justify-between bg-card rounded-[8px] border border-border p-3"
            >
              <span className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className={date ? "text-foreground" : "text-muted-foreground"}>
                  {date ? formatDateLabel(date) : "日付"}
                </span>
              </span>
              {date ? (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); setDate(""); setTime(""); }}
                  className="text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={() => { setTempTime(time); setShowTimePicker(true); }}
              disabled={!date}
              className="flex items-center justify-between bg-card rounded-[8px] border border-border p-3 disabled:opacity-40"
            >
              <span className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className={time ? "text-foreground" : "text-muted-foreground"}>
                  {time || "時間"}
                </span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">※ 対戦相手の承諾後、場地は別途予約してください</p>
        </div>
      </div>

      {/* Date picker */}
      <BottomSheet
        open={showDatePicker}
        title="日付を選択"
        onClose={() => setShowDatePicker(false)}
        onConfirm={() => {
          setDate(tempDate);
          setShowDatePicker(false);
        }}
        confirmDisabled={!tempDate}
      >
        <MiniCalendar value={tempDate} onChange={setTempDate} />
      </BottomSheet>

      {/* Time picker */}
      <BottomSheet
        open={showTimePicker}
        title="時間を選択"
        onClose={() => setShowTimePicker(false)}
        onConfirm={() => {
          setTime(tempTime);
          setShowTimePicker(false);
        }}
        confirmDisabled={!tempTime}
      >
        <div className="grid grid-cols-4 gap-2">
          {TIME_SLOTS.map((slot) => {
            const active = tempTime === slot;
            return (
              <button
                key={slot}
                onClick={() => setTempTime(slot)}
                className={`py-2.5 rounded-[6px] text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border border-primary"
                    : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </InnerPageLayout>
  );
};

export default GameMatchNew;
