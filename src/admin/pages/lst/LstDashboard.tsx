import AdminLayout from "../../components/AdminLayout";
import AdminPageHeader from "../../components/AdminPageHeader";
import { cn } from "@/lib/utils";

const PlainStatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-white p-6 shadow-sm">
    <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
    <div className="mt-3 text-[36px] font-bold leading-none text-slate-900">{value}</div>
  </div>
);

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
  affiliate: string;
  court: string;
  datetime: string;
  status: "確定" | "仮予約" | "キャンセル";
}

const RECENT_BOOKINGS: RecentBookingRow[] = [
  { id: "b1", memberName: "田中太郎", affiliate: "東京湾パデルセンター", court: "コートA", datetime: "5/21 14:00", status: "確定" },
  { id: "b2", memberName: "佐藤花子", affiliate: "渋谷インドアコート", court: "コートB", datetime: "5/21 16:00", status: "確定" },
  { id: "b3", memberName: "鈴木一郎", affiliate: "横浜ベイサイドパデル", court: "コートA", datetime: "5/21 18:00", status: "仮予約" },
  { id: "b4", memberName: "山田美咲", affiliate: "大阪南港パデル", court: "コートC", datetime: "5/22 09:00", status: "確定" },
  { id: "b5", memberName: "高橋健", affiliate: "博多ステーションパデル", court: "コートB", datetime: "5/22 11:00", status: "キャンセル" },
  { id: "b6", memberName: "中村涼", affiliate: "パデルコート広島", court: "コートA", datetime: "5/22 14:00", status: "確定" },
  { id: "b7", memberName: "小林麻衣", affiliate: "札幌雪上パデル", court: "コートD", datetime: "5/22 16:00", status: "仮予約" },
  { id: "b8", memberName: "加藤大輔", affiliate: "天神スポーツプラザ", court: "コートB", datetime: "5/23 10:00", status: "確定" },
];

interface RecentSaleRow {
  id: string;
  name: string;
  subLabel: string;
  amount: number;
}

const RECENT_SALES: RecentSaleRow[] = [
  { id: "s1", name: "東京湾パデルセンター", subLabel: "5月 手数料収入", amount: 245000 },
  { id: "s2", name: "渋谷インドアコート", subLabel: "5月 手数料収入", amount: 198000 },
  { id: "s3", name: "横浜ベイサイドパデル", subLabel: "5月 手数料収入", amount: 175000 },
  { id: "s4", name: "大阪南港パデル", subLabel: "5月 手数料収入", amount: 165000 },
  { id: "s5", name: "広島中央スポーツ", subLabel: "5月 手数料収入", amount: 182000 },
  { id: "s6", name: "博多ステーションパデル", subLabel: "5月 手数料収入", amount: 142000 },
  { id: "s7", name: "パデルコート広島", subLabel: "5月 手数料収入", amount: 128000 },
  { id: "s8", name: "川崎リバーサイドコート", subLabel: "5月 手数料収入", amount: 112000 },
  { id: "s9", name: "北広島パデルクラブ", subLabel: "5月 手数料収入", amount: 98000 },
  { id: "s10", name: "札幌雪上パデル", subLabel: "5月 手数料収入", amount: 92000 },
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

const LstDashboard = () => {
  return (
    <AdminLayout role="lst">
      <AdminPageHeader title="ダッシュボード" />

      {/* Row 1: プレーン 4 cards */}
      <div className="grid grid-cols-4 gap-4">
        <PlainStatCard label="加盟店数" value="12" />
        <PlainStatCard label="総会員数" value="1,248" />
        <PlainStatCard label="今月総売上" value="¥3,245,000" />
        <PlainStatCard label="アクティブコーチ" value="32" />
      </div>

      {/* Row 2: カラフル 4 cards */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <IconStatCard
          emoji="🎾"
          iconBg="bg-green-50"
          label="コーチング売上"
          value="¥6,820,000"
          delta="+12.4% 前月比"
          deltaColor="text-emerald-600"
        />
        <IconStatCard
          emoji="🏪"
          iconBg="bg-orange-50"
          label="アクティブ加盟店"
          value="11/12"
          delta="稼働率 92%"
          deltaColor="text-orange-600"
        />
        <IconStatCard
          emoji="🏆"
          iconBg="bg-yellow-50"
          label="進行中リーグ"
          value="24件"
          delta="応募者合計 487名"
          deltaColor="text-yellow-600"
        />
        <IconStatCard
          emoji="💎"
          iconBg="bg-purple-50"
          label="プレミアム会員"
          value="184名"
          delta="+8% 前月比"
          deltaColor="text-purple-600"
        />
      </div>

      {/* Row 3: 直近の予約 + 直近の売上 */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">直近の予約</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500">
                <th className="px-4 py-2 text-left font-medium">会員名</th>
                <th className="px-4 py-2 text-left font-medium">加盟店</th>
                <th className="px-4 py-2 text-left font-medium">コート</th>
                <th className="px-4 py-2 text-left font-medium">日時</th>
                <th className="px-4 py-2 text-left font-medium">状態</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_BOOKINGS.map((b) => (
                <tr key={b.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2.5 text-slate-800">{b.memberName}</td>
                  <td className="px-4 py-2.5 text-slate-700">{b.affiliate}</td>
                  <td className="px-4 py-2.5 text-slate-700">{b.court}</td>
                  <td className="px-4 py-2.5 text-slate-700">{b.datetime}</td>
                  <td className={cn("px-4 py-2.5 font-medium", statusColorCls(b.status))}>
                    {b.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

export default LstDashboard;
