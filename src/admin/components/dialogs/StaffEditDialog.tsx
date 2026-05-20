import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { updateStaff, type StaffRecord } from "../../lib/adminStaffStore";
import {
  STAFF_EMPLOYMENT_JP,
  STAFF_ROLE_JP,
  type StaffEmployment,
  type StaffRole,
} from "../../lib/storeLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface StaffEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffRecord;
}

const StaffEditDialog = ({ open, onOpenChange, staff }: StaffEditDialogProps) => {
  const [name, setName] = useState(staff.name);
  const [email, setEmail] = useState(staff.email);
  const [role, setRole] = useState<StaffRole>(staff.role);
  const [employment, setEmployment] = useState<StaffEmployment>(staff.employment);
  const [wage, setWage] = useState(String(staff.hourlyWage));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(staff.name);
      setEmail(staff.email);
      setRole(staff.role);
      setEmployment(staff.employment);
      setWage(String(staff.hourlyWage));
      setSubmitting(false);
    }
  }, [open, staff]);

  const wageNum = Number.parseInt(wage, 10);
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    !Number.isNaN(wageNum) &&
    wageNum >= 0 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    updateStaff(staff.id, {
      name: name.trim(),
      email: email.trim(),
      role,
      employment,
      hourlyWage: wageNum,
    });
    toast.success("スタッフを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>スタッフを編集</AdminDialogTitle>
          <AdminDialogDescription>{staff.name} の情報を更新します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="staff-edit-name">名前</Label>
            <Input id="staff-edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-edit-email">メール</Label>
            <Input id="staff-edit-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-edit-role">役割</Label>
              <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                <SelectTrigger id="staff-edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STAFF_ROLE_JP) as StaffRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {STAFF_ROLE_JP[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-edit-emp">雇用形態</Label>
              <Select value={employment} onValueChange={(v) => setEmployment(v as StaffEmployment)}>
                <SelectTrigger id="staff-edit-emp">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STAFF_EMPLOYMENT_JP) as StaffEmployment[]).map((e) => (
                    <SelectItem key={e} value={e}>
                      {STAFF_EMPLOYMENT_JP[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-edit-wage">時給（円）</Label>
            <Input
              id="staff-edit-wage"
              type="number"
              min={0}
              value={wage}
              onChange={(e) => setWage(e.target.value)}
            />
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            更新する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default StaffEditDialog;
