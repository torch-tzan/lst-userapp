import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useLeagueMatchBoardStore } from "@/lib/leagueMatchBoardStore";
import type { SkillLevel } from "@/lib/tournamentStore";
import { useToast } from "@/components/ui/use-toast";

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: "初心者",
  intermediate: "中級",
  advanced: "上級",
};

const LeagueBoardNew = () => {
  const navigate = useNavigate();
  const { createPostedMatch } = useLeagueMatchBoardStore();
  const { toast } = useToast();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");

  const canSubmit = date && time && venue.trim();

  const submit = () => {
    if (!canSubmit) return;
    const desiredDate = new Date(`${date}T${time}`).toISOString();
    const r = createPostedMatch({
      desiredDate,
      preferredVenue: venue.trim(),
      description: description.trim() || undefined,
      desiredSkillLevel: skillLevel || undefined,
    });
    if (r.ok) {
      toast({ title: "募集を作成しました", description: "他のメンバーから応募を待ちましょう" });
      navigate(r.id ? `/game/league/${r.id}` : "/game/league");
    }
  };

  return (
    <InnerPageLayout
      title="募集を作成"
      ctaLabel="作成する"
      ctaDisabled={!canSubmit}
      onCtaClick={submit}
    >
      <p className="text-sm font-bold text-foreground mb-2">希望日時</p>
      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 bg-card border border-border rounded-[8px] p-3 text-sm"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-[120px] bg-card border border-border rounded-[8px] p-3 text-sm"
        />
      </div>

      <p className="text-sm font-bold text-foreground mb-2">希望場地</p>
      <input
        type="text"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        placeholder="例：LST 本店コートB"
        className="w-full bg-card border border-border rounded-[8px] p-3 text-sm mb-4"
      />

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
    </InnerPageLayout>
  );
};

export default LeagueBoardNew;
