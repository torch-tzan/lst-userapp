import { CalendarDays, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import NewShiftDialog from "../../../components/dialogs/NewShiftDialog";
import ShiftDetailDialog from "../../../components/dialogs/ShiftDetailDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useAdminShifts, type ShiftRecord } from "../../../lib/adminShiftsStore";
import { useAdminStaff } from "../../../lib/adminStaffStore";
import {
  SHIFT_KIND_JP,
  SHIFT_STATUS_BADGE_CLS,
  SHIFT_STATUS_JP,
  type ShiftKind,
} from "../../../lib/storeLabels";

const KIND_OPTIONS = (Object.keys(SHIFT_KIND_JP) as ShiftKind[]).map((k) => ({
  value: k,
  label: SHIFT_KIND_JP[k],
}));

const ShiftList = () => {
  const shifts = useAdminShifts();
  const staff = useAdminStaff();

  const [staffFilter, setStaffFilter] = useState<string | undefined>(undefined);
  const [kindFilter, setKindFilter] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftRecord | null>(null);

  const staffOptions = useMemo(
    () => staff.map((s) => ({ value: s.id, label: s.name })),
    [staff],
  );

  const rows = useMemo(() => {
    return shifts.filter((s) => {
      if (staffFilter && s.staffId !== staffFilter) return false;
      if (kindFilter && s.kind !== kindFilter) return false;
      return true;
    });
  }, [shifts, staffFilter, kindFilter]);

  const columns: DataTableColumn<ShiftRecord>[] = [
    {
      key: "id",
      header: "シフトID",
      width: "12%",
      render: (s) => <span className="font-mono text-xs text-slate-600">{s.id}</span>,
    },
    {
      key: "staff",
      header: "スタッフ",
      width: "18%",
      render: (s) => <span className="text-sm font-medium text-slate-800">{s.staffName}</span>,
    },
    {
      key: "date",
      header: "日付",
      width: "14%",
      render: (s) => <span className="text-sm text-slate-700">{s.date}</span>,
    },
    {
      key: "start",
      header: "開始",
      width: "10%",
      render: (s) => <span className="text-sm text-slate-700">{s.startTime}</span>,
    },
    {
      key: "end",
      header: "終了",
      width: "10%",
      render: (s) => <span className="text-sm text-slate-700">{s.endTime}</span>,
    },
    {
      key: "kind",
      header: "種別",
      width: "12%",
      render: (s) => <span className="text-sm text-slate-700">{SHIFT_KIND_JP[s.kind]}</span>,
    },
    {
      key: "status",
      header: "状態",
      width: "14%",
      render: (s) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            SHIFT_STATUS_BADGE_CLS[s.status],
          )}
        >
          {SHIFT_STATUS_JP[s.status]}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="シフト管理"
        description="スタッフの勤務シフトを管理"
        breadcrumbs={[{ label: "店舗管理" }, { label: "シフト管理" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            新規シフト
          </Button>
        }
      />

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">一覧</TabsTrigger>
          <TabsTrigger value="calendar">カレンダー</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <DataTable<ShiftRecord>
            columns={columns}
            data={rows}
            rowKey={(s) => s.id}
            filters={
              <>
                <FilterChip
                  label="スタッフ"
                  value={staffFilter}
                  options={staffOptions}
                  onChange={setStaffFilter}
                />
                <FilterChip
                  label="種別"
                  value={kindFilter}
                  options={KIND_OPTIONS}
                  onChange={setKindFilter}
                />
              </>
            }
            onRowClick={(s) => setSelectedShift(s)}
            emptyTitle="該当するシフトはありません"
            emptyDescription="フィルタ条件を変更してください。"
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">📅 カレンダー表示は今後実装</p>
          </div>
        </TabsContent>
      </Tabs>

      <NewShiftDialog open={newOpen} onOpenChange={setNewOpen} />
      {selectedShift ? (
        <ShiftDetailDialog
          open={!!selectedShift}
          onOpenChange={(o) => {
            if (!o) setSelectedShift(null);
          }}
          shift={selectedShift}
        />
      ) : null}
    </AdminLayout>
  );
};

export default ShiftList;
