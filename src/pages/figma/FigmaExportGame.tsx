import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

type ScreenDef = {
  label: string;
  /** App route path (BrowserRouter). figmaExport=1 is appended automatically. */
  path: string;
};

const SCREENS: ScreenDef[] = [
  { label: "ゲームホーム — リーグタブ", path: "/game?tab=league" },
  { label: "ゲームホーム — 順位（今シーズン）", path: "/game?tab=ranking&rankingTab=current" },
  { label: "ゲームホーム — 順位（前シーズン）", path: "/game?tab=ranking&rankingTab=last" },
  { label: "ゲームホーム — 非プレミアム", path: "/figma-export/non-premium-game" },
  { label: "プレミアム登録", path: "/premium/plan" },
  { label: "新規募集", path: "/game/league/new" },
  { label: "募集詳細 — 募集中（応募可）", path: "/game/league/lm-0" },
  { label: "募集詳細 — 応募済（承認待ち）", path: "/game/league/lm-1" },
  { label: "募集詳細 — 参加中", path: "/game/league/lm-2" },
  { label: "募集詳細 — 比分入力待ち（ホスト）", path: "/game/league/lm-3" },
  { label: "募集詳細 — 比分確認（2/4）", path: "/game/league/lm-4" },
  { label: "募集詳細 — 試合完了", path: "/game/league/lm-5" },
  { label: "募集詳細 — キャンセル済", path: "/game/league/lm-6" },
  { label: "比分入力", path: "/game/league/lm-3/score" },
  { label: "メッセージ（グループ）", path: "/messages/thread-league-match-lm-2" },
  { label: "プロフィール", path: "/profile/user-002" },
  { label: "リーグカード — 全状態", path: "/figma-export/cards" },
];

function buildSrc(path: string): string {
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set("figmaExport", "1");
  const qs = params.toString();
  return `${pathname}?${qs}`;
}

function ExportFrame({ label, path }: ScreenDef) {
  const src = buildSrc(path);
  return (
    <div className="flex flex-col items-start gap-2 shrink-0">
      <p className="text-[11px] font-bold text-foreground max-w-[390px] leading-snug">{label}</p>
      <p className="text-[10px] text-muted-foreground font-mono max-w-[390px] break-all">{src}</p>
      <iframe
        title={label}
        src={src}
        width={390}
        height={844}
        className="rounded-[50px] border-[12px] border-foreground/90 bg-background shadow-lg block"
        style={{ minHeight: 844 }}
      />
    </div>
  );
}

const FigmaExportGame = () => {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section");
  const only = searchParams.get("only");

  useEffect(() => {
    if (!section) return;
    document.getElementById(`figma-section-${section}`)?.scrollIntoView({ block: "start" });
  }, [section]);

  const screens = only
    ? SCREENS.filter((s) => s.path.includes(only))
    : SCREENS;

  if (only || section) {
    return (
      <div className="min-h-screen bg-[#e8e8e8] p-6">
        <div className="flex flex-wrap gap-8 items-start">
          {screens.map((s) => (
            <ExportFrame key={s.path} {...s} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8] p-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">LST Game — Figma Export</h1>
        <p className="text-sm text-muted-foreground mt-2">
          各 iframe 為獨立 390×844 畫面（含 status bar + tab bar）。html.to.design plugin → Import URL → 貼下方 mono 路徑（需 dev server 運行中）。
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          分區匯入：<code className="bg-muted px-1 rounded">?section=entry</code>{" "}
          <code className="bg-muted px-1 rounded">cards</code>{" "}
          <code className="bg-muted px-1 rounded">league</code>{" "}
          <code className="bg-muted px-1 rounded">ranking</code>{" "}
          <code className="bg-muted px-1 rounded">tournament</code>
        </p>
      </div>

      <section id="figma-section-entry" className="mb-12">
        <h2 className="text-sm font-bold mb-4 pb-2 border-b">入口とタブ</h2>
        <div className="flex flex-wrap gap-8 items-start">
          {SCREENS.slice(0, 7).map((s) => (
            <ExportFrame key={s.path} {...s} />
          ))}
        </div>
      </section>

      <section id="figma-section-cards" className="mb-12">
        <h2 className="text-sm font-bold mb-4 pb-2 border-b">リーグカード — 全状態</h2>
        <ExportFrame label={SCREENS[25].label} path={SCREENS[25].path} />
      </section>

      <section id="figma-section-league" className="mb-12">
        <h2 className="text-sm font-bold mb-4 pb-2 border-b">リーグ試合フロー</h2>
        <div className="flex flex-wrap gap-8 items-start">
          {SCREENS.slice(7, 17).map((s) => (
            <ExportFrame key={s.path} {...s} />
          ))}
        </div>
      </section>

      <section id="figma-section-ranking" className="mb-12">
        <h2 className="text-sm font-bold mb-4 pb-2 border-b">順位</h2>
        <ExportFrame label={SCREENS[17].label} path={SCREENS[17].path} />
      </section>

      <section id="figma-section-tournament" className="mb-12">
        <h2 className="text-sm font-bold mb-4 pb-2 border-b">大会</h2>
        <div className="flex flex-wrap gap-8 items-start">
          {SCREENS.slice(18, 25).map((s) => (
            <ExportFrame key={s.path} {...s} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default FigmaExportGame;
