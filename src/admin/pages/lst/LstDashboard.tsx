import { CalendarDays, DollarSign, Store, Trophy, Users } from "lucide-react";

import AdminLayout from "../../components/AdminLayout";
import AdminPageHeader from "../../components/AdminPageHeader";
import StatCard from "../../components/StatCard";

interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  time: string;
  icon: React.ReactNode;
}

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    label: "新規予約",
    detail: "田中太郎 - 東京銀座店 Court A",
    time: "2分前",
    icon: <CalendarDays className="h-4 w-4 text-blue-500" />,
  },
  {
    id: "act-2",
    label: "リーグ募集開始",
    detail: "上級者リーグ #24 - 大阪梅田店",
    time: "15分前",
    icon: <Trophy className="h-4 w-4 text-amber-500" />,
  },
  {
    id: "act-3",
    label: "新規会員登録",
    detail: "佐藤花子",
    time: "1時間前",
    icon: <Users className="h-4 w-4 text-emerald-500" />,
  },
  {
    id: "act-4",
    label: "加盟店申請",
    detail: "名古屋栄スカッシュクラブ",
    time: "3時間前",
    icon: <Store className="h-4 w-4 text-violet-500" />,
  },
  {
    id: "act-5",
    label: "売上入金",
    detail: "横浜みなとみらい店 - ¥185,400",
    time: "5時間前",
    icon: <DollarSign className="h-4 w-4 text-emerald-500" />,
  },
];

const LstDashboard = () => {
  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="ダッシュボード"
        description="LST 本部の全体パフォーマンス概況"
        breadcrumbs={[{ label: "LST HQ" }, { label: "ダッシュボード" }]}
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="加盟店数"
          value="12"
          deltaLabel="先月比 +2 店"
          deltaDirection="up"
          icon={<Store className="h-4 w-4" />}
        />
        <StatCard
          label="今月売上"
          value="¥3,245,000"
          deltaLabel="先月比 +12%"
          deltaDirection="up"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label="アクティブ会員"
          value="487"
          deltaLabel="先月比 +5.4%"
          deltaDirection="up"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="オープン中リーグ"
          value="24"
          deltaLabel="先週比 +3"
          deltaDirection="up"
          icon={<Trophy className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">売上推移</h2>
              <p className="text-xs text-slate-500">直近 6 ヶ月</p>
            </div>
          </div>
          <div className="flex h-56 items-center justify-center rounded-md bg-slate-50 text-sm text-slate-400">
            📊 売上推移チャート（後で実装）
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">予約数推移</h2>
              <p className="text-xs text-slate-500">直近 30 日</p>
            </div>
          </div>
          <div className="flex h-56 items-center justify-center rounded-md bg-slate-50 text-sm text-slate-400">
            📊 予約数チャート（後で実装）
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">最近のアクティビティ</h2>
          <p className="text-xs text-slate-500">本部全体の最新動向</p>
        </div>
        <ul className="divide-y">
          {RECENT_ACTIVITY.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800">{item.label}</div>
                <div className="truncate text-xs text-slate-500">{item.detail}</div>
              </div>
              <div className="flex-shrink-0 text-xs text-slate-400">{item.time}</div>
            </li>
          ))}
        </ul>
      </div>
    </AdminLayout>
  );
};

export default LstDashboard;
