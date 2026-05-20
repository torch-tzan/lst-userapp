import { Ban, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import StaffDisableDialog from "../../../components/dialogs/StaffDisableDialog";
import StaffEditDialog from "../../../components/dialogs/StaffEditDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAdminStaffMember } from "../../../lib/adminStaffStore";
import {
  STAFF_EMPLOYMENT_JP,
  STAFF_ROLE_JP,
  STAFF_STATUS_BADGE_CLS,
  STAFF_STATUS_JP,
} from "../../../lib/storeLabels";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm text-slate-800">{children}</span>
  </>
);

const StaffDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const staff = useAdminStaffMember(id);
  const [editOpen, setEditOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);

  if (!staff) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="スタッフが見つかりません"
          breadcrumbs={[
            { label: "店舗管理" },
            { label: "スタッフ管理", to: "/admin/store/staff" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定されたスタッフ ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/store/staff")}>
            一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const isActive = staff.status === "active";

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title={staff.name}
        breadcrumbs={[
          { label: "店舗管理" },
          { label: "スタッフ管理", to: "/admin/store/staff" },
          { label: staff.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              編集
            </Button>
            {isActive ? (
              <Button
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() => setDisableOpen(true)}
              >
                <Ban className="mr-1.5 h-4 w-4" />
                無効化
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mx-auto max-w-[1000px] space-y-6">
        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="スタッフ ID">
              <span className="font-mono text-xs">{staff.id}</span>
            </InfoRow>
            <InfoRow label="名前">{staff.name}</InfoRow>
            <InfoRow label="メール">{staff.email}</InfoRow>
            <InfoRow label="役割">{STAFF_ROLE_JP[staff.role]}</InfoRow>
            <InfoRow label="雇用形態">{STAFF_EMPLOYMENT_JP[staff.employment]}</InfoRow>
            <InfoRow label="入社日">{staff.joinDate}</InfoRow>
            <InfoRow label="時給">¥{staff.hourlyWage.toLocaleString("ja-JP")}</InfoRow>
            <InfoRow label="ステータス">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  STAFF_STATUS_BADGE_CLS[staff.status],
                )}
              >
                {STAFF_STATUS_JP[staff.status]}
              </span>
            </InfoRow>
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="勤務・成果報酬（今月）" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500">勤務時間</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {staff.hoursWorked ?? 0} h
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">基本給</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                ¥{((staff.hoursWorked ?? 0) * staff.hourlyWage).toLocaleString("ja-JP")}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">成果報酬</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                ¥{(staff.commission ?? 0).toLocaleString("ja-JP")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StaffEditDialog open={editOpen} onOpenChange={setEditOpen} staff={staff} />
      <StaffDisableDialog open={disableOpen} onOpenChange={setDisableOpen} staff={staff} />
    </AdminLayout>
  );
};

export default StaffDetail;
