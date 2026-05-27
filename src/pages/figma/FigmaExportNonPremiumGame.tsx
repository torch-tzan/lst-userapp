import BottomNav from "@/components/BottomNav";
import PhoneMockup from "@/components/PhoneMockup";
import { formatSeasonLabel, getSeasonOf } from "@/lib/tournamentStore";
import { Diamond } from "lucide-react";

/** Standalone non-premium GameHome for Figma export (?figmaExport=1). */
const FigmaExportNonPremiumGame = () => {
  const currentSeason = getSeasonOf(new Date());
  return (
    <PhoneMockup exportMode bottomNav={<BottomNav active={2} />}>
      <div className="bg-background pb-4">
        <header className="bg-gray-5 px-[20px] pt-3 pb-5">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-lg font-bold text-primary-foreground">ゲーム</h1>
          </div>
          <div className="text-center space-y-2 py-2">
            <p className="text-[11px] text-primary-foreground/70">{formatSeasonLabel(currentSeason)}</p>
            <p className="text-sm font-bold text-primary-foreground">プレミアム会員になってリーグに参加</p>
            <p className="text-[11px] text-primary-foreground/70">大会・リーグ参加・成績確認はプレミアム限定</p>
            <button type="button" className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-[6px] mt-1">
              <Diamond className="w-3 h-3" />
              プレミアム登録
            </button>
          </div>
        </header>
        <div className="mt-3 px-[20px]">
          <div className="flex bg-muted rounded-[8px] p-1">
            <span className="flex-1 py-2 text-xs font-bold text-center rounded-[6px] bg-background shadow text-foreground">リーグ</span>
            <span className="flex-1 py-2 text-xs font-bold text-center text-muted-foreground">順位</span>
          </div>
        </div>
        <div className="px-[20px] mt-4">
          <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
            <Diamond className="w-8 h-8 text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">リーグはプレミアム会員限定です</p>
            <p className="text-xs text-primary font-bold mt-1">プレミアム登録 ›</p>
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
};

export default FigmaExportNonPremiumGame;
