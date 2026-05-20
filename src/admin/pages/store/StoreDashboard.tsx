import { CalendarDays, Clock, DollarSign, MapPin, Users } from "lucide-react";

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
    detail: "山田一郎 - Court A 14:00-15:00",
    time: "3分前",
    icon: <CalendarDays className="h-4 w-4 text-blue-500" />,
  },
  {
    id: "act-2",
    label: "予約キャンセル",
    detail: "鈴木次郎 - Court B 16:00-17:00",
    time: "12分前",
    icon: <CalendarDays className="h-4 w-4 text-rose-500" />,
  },
  {
    id: "act-3",
    label: "スタッフ出勤",
    detail: "高橋三郎",
    time: "1時間前",
    icon: <Clock className="h-4 w-4 text-emerald-500" />,
  },
  {
    id: "act-4",
    label: "売上入金",
    detail: "クレジット決済 - ¥4,800",
    time: "2時間前",
    icon: <DollarSign className="h-4 w-4 text-emerald-500" />,
  },
  {
    id: "act-5",
    label: "新規会員紹介",
    detail: "渡辺四郎 さんが体験予約",
    time: "4時間前",
    icon: <Users className="h-4 w-4 text-violet-500" />,
  },
];

const StoreDashboard = () => {
  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="ダッシュボード"
        description="店舗の運営状況を確認"
        breadcrumbs={[{ label: "店舗" }, { label: "ダッシュボード" }]}
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="今日予約"
          value="18"
          deltaLabel="昨日比 +4"
          deltaDirection="up"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label="今月売上"
          value="¥542,000"
          deltaLabel="先月比 -3%"
          deltaDirection="down"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label="アクティブスタッフ"
          value="7"
          deltaLabel="今週のシフト稼働"
          deltaDirection="flat"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="公開中コート"
          value="4"
          deltaLabel="全 4 コート稼働"
          deltaDirection="flat"
          icon={<MapPin className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">売上推移</h2>
              <p className="text-xs text-slate-500">直近 30 日</p>
            </div>
          </div>
          <div className="flex h-56 items-center justify-center rounded-md bg-slate-50 text-sm text-slate-400">
            📊 売上推移チャート（後で実装）
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">コート稼働率</h2>
              <p className="text-xs text-slate-500">今週</p>
            </div>
          </div>
          <div className="flex h-56 items-center justify-center rounded-md bg-slate-50 text-sm text-slate-400">
            📊 稼働率チャート（後で実装）
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">最近のアクティビティ</h2>
          <p className="text-xs text-slate-500">店舗内の最新動向</p>
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

export default StoreDashboard;
