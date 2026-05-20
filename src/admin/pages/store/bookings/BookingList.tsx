import { format, isSameDay, isSameMonth, isSameWeek } from "date-fns";
import { CalendarCheck, CheckCircle2, Clock, Plus, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import EmptyState from "../../../components/EmptyState";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import NewBookingDialog from "../../../components/dialogs/NewBookingDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  adminAddBooking,
  type BookingStatus,
  type BookingType,
  type StoredBooking,
} from "@/lib/bookingStore";

import {
  BOOKING_STATUS_BADGE_CLS,
  BOOKING_STATUS_JP,
  BOOKING_TYPE_BADGE_CLS,
  BOOKING_TYPE_JP,
} from "../../../lib/bookingLabels";
import { refreshAdminBookings, useAdminBookings } from "../../../lib/useAdminBookings";

type TypeFilter = BookingType | undefined;
type StatusFilter = BookingStatus | undefined;
type PeriodFilter = "today" | "this-week" | "this-month" | undefined;

const TYPE_OPTIONS: { value: BookingType; label: string }[] = [
  { value: "court", label: "コート" },
  { value: "coach", label: "コーチング" },
];

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = (
  Object.keys(BOOKING_STATUS_JP) as BookingStatus[]
).map((s) => ({ value: s, label: BOOKING_STATUS_JP[s] }));

const PERIOD_OPTIONS: { value: "today" | "this-week" | "this-month"; label: string }[] = [
  { value: "today", label: "今日" },
  { value: "this-week", label: "今週" },
  { value: "this-month", label: "今月" },
];

const SEED_FLAG_KEY = "admin-demo-seeded";

/** Demo 用 5 件サンプル予約 */
const buildDemoBookings = (): StoredBooking[] => {
  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };
  return [
    {
      id: "bk_demo_001",
      type: "court",
      courtName: "パデルコート広島",
      courtSubName: "コートA",
      location: "パデルコート広島",
      date: fmt(today),
      startTime: "10:00",
      endTime: "11:00",
      status: "upcoming",
      pricePerHour: 2000,
      totalPrice: 2300,
      courtFee: 2000,
      equipmentTotal: 300,
      mode: "standard",
      createdAt: new Date().toISOString(),
    },
    {
      id: "bk_demo_002",
      type: "court",
      courtName: "北広島パデルクラブ",
      courtSubName: "コートB",
      location: "北広島パデルクラブ",
      date: fmt(today),
      startTime: "14:00",
      endTime: "15:00",
      status: "in_progress",
      pricePerHour: 3500,
      totalPrice: 3500,
      courtFee: 3500,
      mode: "solo",
      createdAt: new Date(today.getTime() - 3600_000).toISOString(),
    },
    {
      id: "bk_demo_003",
      type: "coach",
      coachName: "佐藤翔太",
      coachLevel: "A級",
      coachSpecialty: "初心者指導 / フォーム改善",
      date: fmt(addDays(-3)),
      startTime: "11:00",
      endTime: "12:00",
      status: "completed",
      lessonType: "onsite",
      venueName: "パデルコート広島",
      venueAddress: "広島県広島市中区大手町1-2-3",
      pricePerHour: 4000,
      totalPrice: 4000,
      duration: 50,
      createdAt: new Date(addDays(-5).getTime()).toISOString(),
    },
    {
      id: "bk_demo_004",
      type: "court",
      courtName: "広島中央スポーツ",
      courtSubName: "コートC",
      location: "広島中央スポーツ",
      date: fmt(addDays(2)),
      startTime: "16:00",
      endTime: "17:00",
      status: "pending_confirmation",
      pricePerHour: 2800,
      totalPrice: 2800,
      courtFee: 2800,
      mode: "standard",
      createdAt: new Date().toISOString(),
    },
    {
      id: "bk_demo_005",
      type: "coach",
      coachName: "田中美咲",
      coachLevel: "S級",
      coachSpecialty: "競技向け / メンタル強化",
      date: fmt(addDays(-1)),
      startTime: "09:00",
      endTime: "10:00",
      status: "cancelled",
      lessonType: "online",
      pricePerHour: 6000,
      totalPrice: 6000,
      duration: 50,
      cancelReason: "会員都合によりキャンセル",
      cancelledAt: new Date(addDays(-1).getTime()).toISOString(),
      createdAt: new Date(addDays(-2).getTime()).toISOString(),
    },
  ];
};

const isInPeriod = (dateStr: string, period: PeriodFilter): boolean => {
  if (!period) return true;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  if (period === "today") return isSameDay(d, now);
  if (period === "this-week") return isSameWeek(d, now, { weekStartsOn: 1 });
  return isSameMonth(d, now);
};

const BookingList = () => {
  const navigate = useNavigate();
  const bookings = useAdminBookings();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(undefined);
  const [newOpen, setNewOpen] = useState(false);

  // Reflect any external changes once at mount
  useEffect(() => {
    refreshAdminBookings();
  }, []);

  const handleSeed = useCallback(() => {
    const demo = buildDemoBookings();
    demo.forEach((b) => adminAddBooking(b));
    localStorage.setItem(SEED_FLAG_KEY, "1");
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    let todayCount = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;
    for (const b of bookings) {
      if (b.status === "in_progress") inProgress += 1;
      if (b.status === "completed") completed += 1;
      if (b.status === "cancelled") cancelled += 1;
      const d = new Date(b.date);
      if (!Number.isNaN(d.getTime()) && isSameDay(d, today) && b.status === "upcoming") {
        todayCount += 1;
      }
    }
    return { todayCount, inProgress, completed, cancelled };
  }, [bookings]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => (typeFilter ? b.type === typeFilter : true))
      .filter((b) => (statusFilter ? b.status === statusFilter : true))
      .filter((b) => isInPeriod(b.date, periodFilter))
      .filter((b) => {
        if (!q) return true;
        const target =
          b.type === "court"
            ? `${b.courtName ?? ""} ${b.courtSubName ?? ""}`
            : b.coachName ?? "";
        return b.id.toLowerCase().includes(q) || target.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // 新しい予約日時を上に
        const da = `${a.date} ${a.startTime}`;
        const db = `${b.date} ${b.startTime}`;
        return db.localeCompare(da);
      });
  }, [bookings, search, typeFilter, statusFilter, periodFilter]);

  const columns: DataTableColumn<StoredBooking>[] = [
    {
      key: "id",
      header: "予約 ID",
      width: "13%",
      render: (b) => (
        <span className="font-mono text-xs text-slate-600">{b.id.slice(0, 12)}</span>
      ),
    },
    {
      key: "type",
      header: "種別",
      width: "8%",
      render: (b) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            BOOKING_TYPE_BADGE_CLS[b.type],
          )}
        >
          {BOOKING_TYPE_JP[b.type]}
        </span>
      ),
    },
    {
      key: "target",
      header: "対象",
      width: "22%",
      render: (b) => (
        <span className="text-sm text-slate-800">
          {b.type === "court"
            ? `${b.courtName ?? "—"}${b.courtSubName ? " / " + b.courtSubName : ""}`
            : b.coachName ?? "—"}
        </span>
      ),
    },
    {
      key: "date",
      header: "日付",
      width: "10%",
      render: (b) => {
        const d = new Date(b.date);
        return (
          <span className="text-sm text-slate-700">
            {Number.isNaN(d.getTime()) ? b.date : format(d, "yyyy/M/d")}
          </span>
        );
      },
    },
    {
      key: "time",
      header: "時間",
      width: "11%",
      render: (b) => (
        <span className="text-sm text-slate-700">
          {b.startTime}〜{b.endTime}
        </span>
      ),
    },
    {
      key: "price",
      header: "料金",
      width: "10%",
      className: "text-right",
      render: (b) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{(b.totalPrice ?? 0).toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "mode",
      header: "モード",
      width: "8%",
      render: (b) => (
        <span className="text-xs text-slate-500">
          {b.type === "court" ? (b.mode === "solo" ? "ソロ" : "標準") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "ステータス",
      width: "13%",
      render: (b) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            BOOKING_STATUS_BADGE_CLS[b.status],
          )}
        >
          {BOOKING_STATUS_JP[b.status]}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="予約管理"
        description="コート＆コーチング予約一覧"
        breadcrumbs={[{ label: "店舗管理" }, { label: "予約管理" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            新規予約
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="今日の予約"
          value={stats.todayCount.toLocaleString("ja-JP")}
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <StatCard
          label="進行中"
          value={stats.inProgress.toLocaleString("ja-JP")}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="完了"
          value={stats.completed.toLocaleString("ja-JP")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="キャンセル"
          value={stats.cancelled.toLocaleString("ja-JP")}
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        {bookings.length === 0 ? (
          <div className="rounded-lg border bg-white shadow-sm">
            <EmptyState
              title="予約データがありません"
              description="デモ用のサンプル予約をロードして、画面動作を確認できます。"
              action={
                <Button onClick={handleSeed}>📦 デモデータをロード</Button>
              }
            />
          </div>
        ) : (
          <DataTable<StoredBooking>
            columns={columns}
            data={rows}
            rowKey={(b) => b.id}
            searchPlaceholder="予約 ID / 対象で検索"
            onSearch={setSearch}
            searchValue={search}
            filters={
              <>
                <FilterChip
                  label="種別"
                  value={typeFilter}
                  options={TYPE_OPTIONS}
                  onChange={(v) => setTypeFilter(v as TypeFilter)}
                />
                <FilterChip
                  label="ステータス"
                  value={statusFilter}
                  options={STATUS_OPTIONS}
                  onChange={(v) => setStatusFilter(v as StatusFilter)}
                />
                <FilterChip
                  label="期間"
                  value={periodFilter}
                  options={PERIOD_OPTIONS}
                  onChange={(v) => setPeriodFilter(v as PeriodFilter)}
                />
              </>
            }
            onRowClick={(b) => navigate(`/admin/store/bookings/${b.id}`)}
            emptyTitle="該当する予約はありません"
            emptyDescription="フィルタ条件を変更してください。"
          />
        )}
      </div>

      <NewBookingDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => navigate(`/admin/store/bookings/${id}`)}
      />
    </AdminLayout>
  );
};

export default BookingList;
