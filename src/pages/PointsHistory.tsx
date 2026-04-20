import { useState } from "react";
import AnimatedTabs from "@/components/AnimatedTabs";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Separator } from "@/components/ui/separator";
import { ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react";

type PointType = "earn" | "use" | "expire";

interface PointEntry {
  id: string;
  type: PointType;
  title: string;
  description: string;
  amount: number;
  balance: number;
  date: string;
  expiresAt: string; // YYYY/MM/DD
}

const TYPE_CONFIG: Record<PointType, { icon: React.ElementType; className: string; prefix: string }> = {
  earn: { icon: ArrowDownLeft, className: "bg-primary/10 text-primary", prefix: "+" },
  use: { icon: ArrowUpRight, className: "bg-muted text-muted-foreground", prefix: "-" },
  expire: { icon: Minus, className: "bg-destructive/10 text-destructive", prefix: "-" },
};

const MOCK_HISTORY: PointEntry[] = [
  {
    id: "1",
    type: "earn",
    title: "予約利用ポイント",
    description: "パデルコート広島 コートA",
    amount: 3,
    balance: 1250,
    date: "2026/04/12",
    expiresAt: "2027/12/31",
  },
  {
    id: "2",
    type: "use",
    title: "ポイント利用",
    description: "パデルコート広島 コートA 予約",
    amount: 100,
    balance: 1247,
    date: "2026/04/10",
    expiresAt: "",
  },
  {
    id: "3",
    type: "earn",
    title: "新規登録ボーナス",
    description: "キャンペーン特典",
    amount: 500,
    balance: 1347,
    date: "2026/03/20",
    expiresAt: "2027/12/31",
  },
  {
    id: "4",
    type: "earn",
    title: "予約利用ポイント",
    description: "北広島パデルクラブ コートB",
    amount: 5,
    balance: 847,
    date: "2026/03/15",
    expiresAt: "2027/12/31",
  },
  {
    id: "5",
    type: "earn",
    title: "友達紹介ボーナス",
    description: "招待コード経由の登録",
    amount: 500,
    balance: 842,
    date: "2025/03/01",
    expiresAt: "2026/12/31",
  },
  {
    id: "6",
    type: "expire",
    title: "ポイント失効",
    description: "有効期限切れ",
    amount: 50,
    balance: 342,
    date: "2026/02/28",
    expiresAt: "",
  },
];

const POINT_TABS: { key: "all" | "earn" | "use"; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "earn", label: "獲得" },
  { key: "use", label: "利用" },
];

const PointsHistory = () => {
  const [tab, setTab] = useState<"all" | "earn" | "use">("all");
  const currentYear = new Date().getFullYear();
  const expiringThisYear = MOCK_HISTORY
    .filter((e) => e.type === "earn" && e.expiresAt.startsWith(`${currentYear}/`))
    .reduce((sum, e) => sum + e.amount, 0);

  const filtered = tab === "all"
    ? MOCK_HISTORY
    : tab === "earn"
    ? MOCK_HISTORY.filter((e) => e.type === "earn")
    : MOCK_HISTORY.filter((e) => e.type === "use" || e.type === "expire");

  return (
    <InnerPageLayout title="ポイント履歴">
      {/* Current balance */}
      <div className="bg-gray-5 rounded-[8px] px-5 py-4 -mt-2 mb-4">
        <p className="text-xs text-primary-foreground/60 font-medium">現在の保有ポイント</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-primary">1,250</span>
          <span className="text-sm font-medium text-primary-foreground/70">pt</span>
        </div>
        {expiringThisYear > 0 && (
          <p className="text-xs text-primary-foreground/60 font-medium mt-2">
            {currentYear}年末に失効: {expiringThisYear.toLocaleString()}pt
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="-mx-[20px] mb-4">
        <AnimatedTabs
          tabs={POINT_TABS.map((t) => ({ key: t.key, label: t.label }))}
          activeKey={tab}
          onChange={(key) => setTab(key as "all" | "earn" | "use")}
        />
      </div>

      {/* History list */}
      <div className="-mx-[20px]">
        {filtered.map((entry, i) => {
          const config = TYPE_CONFIG[entry.type];
          return (
            <div key={entry.id}>
              <div className="flex items-start gap-3 px-[20px] py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${config.className}`}>
                  <config.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{entry.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-muted-foreground/60">{entry.date}</p>
                    {entry.expiresAt && (
                      <p className={`text-[10px] ${entry.expiresAt.startsWith(`${currentYear}/`) ? "text-destructive/70" : "text-muted-foreground/60"}`}>
                        有効期限: {entry.expiresAt}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${entry.type === "earn" ? "text-primary" : "text-muted-foreground"}`}>
                    {config.prefix}{entry.amount}pt
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">残高 {entry.balance}pt</p>
                </div>
              </div>
              {i < filtered.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </InnerPageLayout>
  );
};

export default PointsHistory;
