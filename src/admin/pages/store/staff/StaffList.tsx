import { Plus, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import CommissionEditDialog from "../../../components/dialogs/CommissionEditDialog";
import InviteStaffDialog from "../../../components/dialogs/InviteStaffDialog";
import NewStaffDialog from "../../../components/dialogs/NewStaffDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useAdminStaff, type StaffRecord } from "../../../lib/adminStaffStore";
import {
  STAFF_EMPLOYMENT_JP,
  STAFF_ROLE_JP,
  STAFF_STATUS_BADGE_CLS,
  STAFF_STATUS_JP,
} from "../../../lib/storeLabels";

const StaffList = () => {
  const navigate = useNavigate();
  const staff = useAdminStaff();

  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [period, setPeriod] = useState<"this_week" | "this_month" | "last_month">("this_month");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) => s.name.toLowerCase().includes(q));
  }, [staff, search]);

  // 勤務・成果報酬 tab 用 rows（period による mock 倍率）
  const performanceRows = useMemo(() => {
    const factor = period === "this_week" ? 0.25 : period === "last_month" ? 0.9 : 1;
    return staff
      .filter((s) => s.status === "active")
      .map((s) => {
        const hours = Math.round((s.hoursWorked ?? 0) * factor);
        const base = hours * s.hourlyWage;
        const commission = Math.round((s.commission ?? 0) * factor);
        return { staff: s, hours, base, commission, total: base + commission };
      });
  }, [staff, period]);

  const columns: DataTableColumn<StaffRecord>[] = [
    {
      key: "id",
      header: "スタッフID",
      width: "12%",
      render: (s) => <span className="font-mono text-xs text-slate-600">{s.id}</span>,
    },
    {
      key: "name",
      header: "名前",
      width: "20%",
      render: (s) => <span className="text-sm font-medium text-slate-800">{s.name}</span>,
    },
    {
      key: "role",
      header: "役割",
      width: "14%",
      render: (s) => <span className="text-sm text-slate-700">{STAFF_ROLE_JP[s.role]}</span>,
    },
    {
      key: "emp",
      header: "雇用形態",
      width: "14%",
      render: (s) => (
        <span className="text-sm text-slate-700">{STAFF_EMPLOYMENT_JP[s.employment]}</span>
      ),
    },
    {
      key: "join",
      header: "入社日",
      width: "14%",
      render: (s) => <span className="text-sm text-slate-700">{s.joinDate}</span>,
    },
    {
      key: "status",
      header: "ステータス",
      width: "12%",
      render: (s) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            STAFF_STATUS_BADGE_CLS[s.status],
          )}
        >
          {STAFF_STATUS_JP[s.status]}
        </span>
      ),
    },
  ];

  const perfColumns: DataTableColumn<(typeof performanceRows)[number]>[] = [
    {
      key: "name",
      header: "名前",
      width: "22%",
      render: (r) => <span className="text-sm font-medium text-slate-800">{r.staff.name}</span>,
    },
    {
      key: "hours",
      header: "勤務時間",
      width: "14%",
      className: "text-right",
      render: (r) => <span className="text-sm text-slate-700">{r.hours} h</span>,
    },
    {
      key: "wage",
      header: "時給",
      width: "14%",
      className: "text-right",
      render: (r) => (
        <span className="text-sm text-slate-700">
          ¥{r.staff.hourlyWage.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "base",
      header: "基本給",
      width: "16%",
      className: "text-right",
      render: (r) => (
        <span className="text-sm text-slate-700">¥{r.base.toLocaleString("ja-JP")}</span>
      ),
    },
    {
      key: "commission",
      header: "成果報酬",
      width: "16%",
      className: "text-right",
      render: (r) => (
        <span className="text-sm text-slate-700">¥{r.commission.toLocaleString("ja-JP")}</span>
      ),
    },
    {
      key: "total",
      header: "合計",
      width: "18%",
      className: "text-right",
      render: (r) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{r.total.toLocaleString("ja-JP")}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="スタッフ管理"
        description="店舗スタッフと勤怠・成果報酬の管理"
        breadcrumbs={[{ label: "店舗管理" }, { label: "スタッフ管理" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" />
              アカウント招待
            </Button>
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              スタッフ追加
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">一覧</TabsTrigger>
          <TabsTrigger value="performance">勤務・成果報酬</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <DataTable<StaffRecord>
            columns={columns}
            data={rows}
            rowKey={(s) => s.id}
            searchPlaceholder="名前で検索"
            onSearch={setSearch}
            searchValue={search}
            onRowClick={(s) => navigate(`/admin/store/staff/${s.id}`)}
            emptyTitle="該当するスタッフはいません"
            emptyDescription="検索条件を変更するか、新規追加してください。"
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-slate-600">期間：</span>
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_week">今週</SelectItem>
                <SelectItem value="this_month">今月</SelectItem>
                <SelectItem value="last_month">先月</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Button onClick={() => setCommissionOpen(true)}>成果報酬編集</Button>
            </div>
          </div>
          <DataTable
            columns={perfColumns}
            data={performanceRows}
            rowKey={(r) => r.staff.id}
            emptyTitle="勤務データはありません"
          />
        </TabsContent>
      </Tabs>

      <NewStaffDialog open={newOpen} onOpenChange={setNewOpen} />
      <InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <CommissionEditDialog open={commissionOpen} onOpenChange={setCommissionOpen} />
    </AdminLayout>
  );
};

export default StaffList;
