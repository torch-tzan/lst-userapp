// === Audit follow-up notes (Figma round 3) ===
// 1. アクティブユーザー: prototype uses deterministic mock; real metric needs lastLoginAt tracking (audit §4 gap).
// 2. アクティブコーチ「承認待ち」: prototype mocked count; real flow needs coach onboarding approval queue (not in scope).
// 3. 精算ワークフロー: Task 5 introduces adminSettlementsStore (settled/pending/unsettled + settledAt).
// 4. 店舗別売上ランキング: computed from adminAffiliatesStore + revenue mock.

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import AdminLayout from "../../components/AdminLayout";
import AdminPageHeader from "../../components/AdminPageHeader";
import { cn } from "@/lib/utils";

import { useAffiliates } from "../../lib/adminAffiliatesStore";

// ── プレーン Stat カード（label + 数字 + サブテキスト） ──────────────
const PlainStatCard = ({
  label,
  value,
  subText,
  subColor,
}: {
  label: string;
  value: string;
  subText: string;
  subColor: string;
}) => (
  <div className="rounded-lg border bg-white p-6 shadow-sm">
    <div className="text-xs font-medium text-slate-500">{label}</div>
    <div className="mt-2 text-3xl font-bold leading-none text-slate-900">{value}</div>
    <div className={cn("mt-2 text-sm font-medium", subColor)}>{subText}</div>
  </div>
);

// ── ドット付き Stat カード ─────────────────────────────────────────
const DotStatCard = ({
  dotColor,
  label,
  value,
  subText,
}: {
  dotColor: string;
  label: string;
  value: string;
  subText: string;
}) => (
  <div className="rounded-lg border bg-white p-6 shadow-sm">
    <div className="flex items-center gap-2">
      <span className={cn("inline-block h-2 w-2 rounded-full", dotColor)} aria-hidden />
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
    <div className="mt-2 text-3xl font-bold leading-none text-slate-900">{value}</div>
    <div className="mt-2 text-sm text-slate-500">{subText}</div>
  </div>
);

// ── 月間売上推移用 mock データ（過去 12 ヶ月） ─────────────────────
const MONTHLY_REVENUE = [
  { month: "4月", value: 9_200_000 },
  { month: "5月", value: 9_550_000 },
  { month: "6月", value: 9_900_000 },
  { month: "7月", value: 10_350_000 },
  { month: "8月", value: 10_780_000 },
  { month: "9月", value: 11_200_000 },
  { month: "10月", value: 11_450_000 },
  { month: "11月", value: 11_650_000 },
  { month: "12月", value: 11_950_000 },
  { month: "1月", value: 12_100_000 },
  { month: "2月", value: 12_480_000 },
  { month: "3月", value: 12_850_000 },
];

// ── 最近のアクティビティ mock ─────────────────────────────────────
interface ActivityRow {
  id: string;
  datetime: string;
  store: string;
  content: string;
  status: "確定" | "完了" | "更新済" | "処理中" | "精算済" | "アクティブ";
  amount: string;
}

const ACTIVITIES: ActivityRow[] = [
  {
    id: "a1",
    datetime: "2026/05/21 14:30",
    store: "東京湾パデルセンター",
    content: "新規予約 - コートA 2時間",
    status: "確定",
    amount: "¥8,400",
  },
  {
    id: "a2",
    datetime: "2026/05/21 13:15",
    store: "渋谷インドアコート",
    content: "コーチングセッション終了",
    status: "完了",
    amount: "¥12,000",
  },
  {
    id: "a3",
    datetime: "2026/05/21 11:45",
    store: "大阪南港パデル",
    content: "会員プラン更新",
    status: "更新済",
    amount: "¥4,800",
  },
  {
    id: "a4",
    datetime: "2026/05/21 10:20",
    store: "横浜ベイサイドパデル",
    content: "返金リクエスト",
    status: "処理中",
    amount: "¥6,200",
  },
  {
    id: "a5",
    datetime: "2026/05/21 09:05",
    store: "広島中央スポーツ",
    content: "今月分の精算完了",
    status: "精算済",
    amount: "¥182,000",
  },
  {
    id: "a6",
    datetime: "2026/05/20 18:40",
    store: "博多ステーションパデル",
    content: "新規キャンペーン開始",
    status: "アクティブ",
    amount: "—",
  },
];

const statusBadgeCls = (status: ActivityRow["status"]): string => {
  switch (status) {
    case "確定":
    case "完了":
    case "精算済":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "更新済":
    case "アクティブ":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "処理中":
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

// ── ランキング用 mock 売上シェア（決定論的） ─────────────────────
const RANKING_STORES = [
  { name: "東京湾パデルセンター", sales: 2_450_000 },
  { name: "渋谷インドアコート", sales: 1_980_000 },
  { name: "広島中央スポーツ", sales: 1_820_000 },
  { name: "横浜ベイサイドパデル", sales: 1_750_000 },
  { name: "大阪南港パデル", sales: 1_650_000 },
  { name: "博多ステーションパデル", sales: 1_420_000 },
];

const rankBadgeCls = (rank: number): string => {
  if (rank === 1) return "bg-blue-600 text-white";
  if (rank === 2) return "bg-blue-500 text-white";
  if (rank === 3) return "bg-blue-400 text-white";
  return "bg-slate-200 text-slate-700";
};

const LstDashboard = () => {
  // 加盟店データはランキング表示の fallback 用
  const affiliates = useAffiliates();
  const rankingTotal = RANKING_STORES.reduce((s, r) => s + r.sales, 0);
  const rankingRows = RANKING_STORES.map((r, idx) => ({
    rank: idx + 1,
    name: r.name,
    sales: r.sales,
    pct: rankingTotal === 0 ? 0 : Math.round((r.sales / rankingTotal) * 1000) / 10,
  }));

  // 加盟店一覧は将来「全店舗 24 件」の breakdown 表示用（現状未使用だが import 残す）
  void affiliates;

  return (
    <AdminLayout role="lst">
      <AdminPageHeader title="ダッシュボード" />

      {/* Row 1: プレーン 4 cards */}
      <div className="grid grid-cols-4 gap-4">
        <PlainStatCard
          label="全店舗 月間売上"
          value="¥12,850,000"
          subText="前月比 +8.3%"
          subColor="text-emerald-600"
        />
        <PlainStatCard
          label="手数料収入（LST）"
          value="¥1,285,000"
          subText="手数料率 10%"
          subColor="text-blue-500"
        />
        <PlainStatCard
          label="加盟店数"
          value="24店舗"
          subText="今月 +2店舗"
          subColor="text-emerald-600"
        />
        <PlainStatCard
          label="アクティブユーザー"
          value="3,842人"
          subText="前月比 +12.1%"
          subColor="text-emerald-600"
        />
      </div>

      {/* Row 2: ドット付き 4 cards */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <DotStatCard
          dotColor="bg-emerald-500"
          label="コーチング売上"
          value="¥570,000"
          subText="手数料率 20%"
        />
        <DotStatCard
          dotColor="bg-emerald-500"
          label="アクティブコーチ"
          value="24名"
          subText="承認待ち 3名"
        />
        <DotStatCard
          dotColor="bg-purple-500"
          label="今月の大会"
          value="3件"
          subText="参加チーム 28"
        />
        <DotStatCard
          dotColor="bg-purple-500"
          label="ゲーム参加者"
          value="456人"
          subText="前月比 +23.5%"
        />
      </div>

      {/* Row 3: 月間売上推移 + 店舗別売上ランキング */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {/* 月間売上推移 */}
        <div className="col-span-2 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-1">
            <h2 className="text-base font-bold text-slate-900">月間売上推移（全店舗）</h2>
            <div className="text-xs text-slate-500">過去12ヶ月</div>
          </div>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_REVENUE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  formatter={(v: number) => [`¥${v.toLocaleString("ja-JP")}`, "売上"]}
                  labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 店舗別売上ランキング */}
        <div className="col-span-1 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">店舗別売上ランキング</h2>
          <div className="text-xs text-slate-500">今月</div>
          <ul className="mt-4 space-y-3">
            {rankingRows.map((row) => (
              <li key={row.rank} className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    rankBadgeCls(row.rank),
                  )}
                >
                  {row.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{row.name}</div>
                  <div className="text-xs text-slate-500">
                    ¥{row.sales.toLocaleString("ja-JP")}
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-600 tabular-nums">{row.pct}%</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Row 4: 最近のアクティビティ */}
      <div className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">最近のアクティビティ</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs text-slate-500">
              <th className="px-6 py-2.5 text-left font-medium">日時</th>
              <th className="px-6 py-2.5 text-left font-medium">店舗</th>
              <th className="px-6 py-2.5 text-left font-medium">内容</th>
              <th className="px-6 py-2.5 text-left font-medium">ステータス</th>
              <th className="px-6 py-2.5 text-right font-medium">金額</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVITIES.map((a) => (
              <tr key={a.id} className="border-b last:border-b-0">
                <td className="px-6 py-3 text-slate-600 tabular-nums">{a.datetime}</td>
                <td className="px-6 py-3 text-slate-800">{a.store}</td>
                <td className="px-6 py-3 text-slate-700">{a.content}</td>
                <td className="px-6 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      statusBadgeCls(a.status),
                    )}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-medium text-slate-900 tabular-nums">
                  {a.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default LstDashboard;
