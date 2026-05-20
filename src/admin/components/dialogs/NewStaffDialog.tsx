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

import { addStaff } from "../../lib/adminStaffStore";
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

interface NewStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewStaffDialog = ({ open, onOpenChange }: NewStaffDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("staff");
  const [employment, setEmployment] = useState<StaffEmployment>("fulltime");
  const [joinDate, setJoinDate] = useState("");
  const [wage, setWage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setRole("staff");
      setEmployment("fulltime");
      setJoinDate("");
      setWage("");
      setSubmitting(false);
    }
  }, [open]);

  const wageNum = Number.parseInt(wage, 10);
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    joinDate.length > 0 &&
    !Number.isNaN(wageNum) &&
    wageNum >= 0 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    addStaff({
      name: name.trim(),
      email: email.trim(),
      role,
      employment,
      joinDate,
      hourlyWage: wageNum,
    });
    toast.success("スタッフを追加しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>新規スタッフ</AdminDialogTitle>
          <AdminDialogDescription>店舗のスタッフを追加します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="staff-name">名前</Label>
            <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-email">メール</Label>
            <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-role">役割</Label>
              <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                <SelectTrigger id="staff-role">
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
              <Label htmlFor="staff-emp">雇用形態</Label>
              <Select value={employment} onValueChange={(v) => setEmployment(v as StaffEmployment)}>
                <SelectTrigger id="staff-emp">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-join">入社日</Label>
              <Input
                id="staff-join"
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-wage">時給（円）</Label>
              <Input
                id="staff-wage"
                type="number"
                min={0}
                value={wage}
                onChange={(e) => setWage(e.target.value)}
                placeholder="1500"
              />
            </div>
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            追加する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default NewStaffDialog;
