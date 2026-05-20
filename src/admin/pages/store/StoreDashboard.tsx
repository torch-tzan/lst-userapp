import AdminLayout from "../../components/AdminLayout";
import AdminPageHeader from "../../components/AdminPageHeader";
import { cn } from "@/lib/utils";

// プレーン StatCard（白カード、ラベル + 大きな数字のみ）
const PlainStatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-white p-6 shadow-sm">
    <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
    <div className="mt-3 text-[36px] font-bold leading-none text-slate-900">{value}</div>
  </div>
);

// アイコン付き StatCard（カラフルな丸 + emoji + delta）
const IconStatCard = ({
  emoji,
  iconBg,
  label,
  value,
  delta,
  deltaColor,
}: {
  emoji: string;
  iconBg: string;
  label: string;
  value: string;
  delta: string;
  deltaColor: string;
}) => (
  <div className="rounded-lg border bg-white p-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-2xl", iconBg)}>
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="mt-0.5 text-3xl font-bold text-slate-900">{value}</div>
      </div>
    </div>
    <div className={cn("mt-3 text-sm font-medium", deltaColor)}>{delta}</div>
  </div>
);

interface RecentBookingRow {
  id: string;
  memberName: string;
  court: string;
  datetime: string;
  status: "確定" | "仮予約" | "キャンセル";
}

const RECENT_BOOKINGS: RecentBookingRow[] = [
  { id: "b1", memberName: "山田 一郎", court: "コートA", datetime: "5/21 14:00", status: "確定" },
  { id: "b2", memberName: "鈴木 次郎", court: "コートB", datetime: "5/21 16:00", status: "確定" },
  { id: "b3", memberName: "佐藤 花子", court: "コートC", datetime: "5/21 18:00", status: "仮予約" },
  { id: "b4", memberName: "高橋 三郎", court: "コートA", datetime: "5/22 09:00", status: "確定" },
  { id: "b5", memberName: "渡辺 美咲", court: "コートD", datetime: "5/22 11:00", status: "キャンセル" },
  { id: "b6", memberName: "中村 健", court: "コートB", datetime: "5/22 14:00", status: "確定" },
  { id: "b7", memberName: "小林 麻衣", court: "コートC", datetime: "5/22 16:00", status: "仮予約" },
  { id: "b8", memberName: "加藤 大輔", court: "コートA", datetime: "5/23 10:00", status: "確定" },
];

interface RecentSaleRow {
  id: string;
  name: string;
  subLabel: string;
  amount: number;
}

const RECENT_SALES: RecentSaleRow[] = [
  { id: "s1", name: "田中太郎", subLabel: "コートA 予約", amount: 4400 },
  { id: "s2", name: "山田花子", subLabel: "コーチング (60分)", amount: 8000 },
  { id: "s3", name: "鈴木一郎", subLabel: "コートB 予約", amount: 4400 },
  { id: "s4", name: "佐藤美咲", subLabel: "大会エントリー", amount: 3000 },
  { id: "s5", name: "高橋健", subLabel: "コートC 予約 (2h)", amount: 8800 },
  { id: "s6", name: "中村涼", subLabel: "コーチング (30分)", amount: 4500 },
  { id: "s7", name: "伊藤葵", subLabel: "コートA 予約", amount: 4400 },
  { id: "s8", name: "渡辺翔", subLabel: "キャンペーン参加", amount: 2500 },
  { id: "s9", name: "小林麻衣", subLabel: "コートD 予約", amount: 5400 },
  { id: "s10", name: "加藤大輔", subLabel: "コーチング (90分)", amount: 12000 },
];

const statusColorCls = (status: RecentBookingRow["status"]) => {
  switch (status) {
    case "確定":
      return "text-emerald-600";
    case "仮予約":
      return "text-orange-600";
    case "キャンセル":
      return "text-slate-400";
  }
};

const StoreDashboard = () => {
  return (
    <AdminLayout role="store">
      <AdminPageHeader title="ダッシュボード" />

      {/* Row 1: プレーン 4 cards */}
      <div className="grid grid-cols-4 gap-4">
        <PlainStatCard label="本日の予約数" value="24" />
        <PlainStatCard label="会員数" value="1,248" />
        <PlainStatCard label="本日の売上" value="¥186,400" />
        <PlainStatCard label="稼働スタッフ" value="8" />
      </div>

      {/* Row 2: カラフル 4 cards */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <IconStatCard
          emoji="🎾"
          iconBg="bg-green-50"
          label="コーチング売上"
          value="¥1,280,000"
          delta="+18.5% 前月比"
          deltaColor="text-emerald-600"
        />
        <IconStatCard
          emoji="👤"
          iconBg="bg-orange-50"
          label="アクティブコーチ"
          value="8名"
          delta="稼働率 85%"
          deltaColor="text-orange-600"
        />
        <IconStatCard
          emoji="🏆"
          iconBg="bg-yellow-50"
          label="今月の大会"
          value="5件"
          delta="参加者合計 156名"
          deltaColor="text-yellow-600"
        />
        <IconStatCard
          emoji="🎮"
          iconBg="bg-purple-50"
          label="ゲーム参加者"
          value="892人"
          delta="+23% 前月比"
          deltaColor="text-purple-600"
        />
      </div>

      {/* Row 3: 直近の予約 + 直近の売上 */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* 直近の予約 */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">直近の予約</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500">
                <th className="px-6 py-2 text-left font-medium">会員名</th>
                <th className="px-6 py-2 text-left font-medium">コート</th>
                <th className="px-6 py-2 text-left font-medium">日時</th>
                <th className="px-6 py-2 text-left font-medium">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_BOOKINGS.map((b) => (
                <tr key={b.id} className="border-b last:border-b-0">
                  <td className="px-6 py-2.5 text-slate-800">{b.memberName}</td>
                  <td className="px-6 py-2.5 text-slate-700">{b.court}</td>
                  <td className="px-6 py-2.5 text-slate-700">{b.datetime}</td>
                  <td className={cn("px-6 py-2.5 font-medium", statusColorCls(b.status))}>
                    {b.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 直近の売上 */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">直近の売上</h2>
          </div>
          <ul className="divide-y">
            {RECENT_SALES.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-6 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.subLabel}</div>
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  ¥{s.amount.toLocaleString("ja-JP")}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StoreDashboard;
