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

import { updateMember, type MemberRecord } from "../../lib/adminMembersOverlay";
import { SKILL_LEVEL_JP } from "../../lib/leagueLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

import type { SkillLevel } from "@/lib/tournamentStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberRecord;
}

const SKILL_OPTIONS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

const MemberEditDialog = ({ open, onOpenChange, member }: Props) => {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(member.skillLevel);
  const [rating, setRating] = useState<string>(String(member.rating));

  useEffect(() => {
    if (open) {
      setName(member.name);
      setEmail(member.email);
      setPhone(member.phone);
      setSkillLevel(member.skillLevel);
      setRating(String(member.rating));
    }
  }, [open, member]);

  const ratingNum = Number.parseInt(rating, 10);
  const canSubmit =
    name.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    !Number.isNaN(ratingNum) &&
    ratingNum >= 1000 &&
    ratingNum <= 3000;

  const handleSubmit = () => {
    if (!canSubmit) return;
    updateMember(member.userId, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      skillLevel,
      rating: ratingNum,
    });
    toast.success("会員情報を更新しました");
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>会員情報を編集</AdminDialogTitle>
          <AdminDialogDescription>{member.displayId}</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-member-name">名前</Label>
            <Input id="edit-member-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-member-email">メール</Label>
            <Input id="edit-member-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-member-phone">電話</Label>
            <Input id="edit-member-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-member-skill">スキルレベル</Label>
              <Select value={skillLevel} onValueChange={(v) => setSkillLevel(v as SkillLevel)}>
                <SelectTrigger id="edit-member-skill">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SKILL_LEVEL_JP[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-member-rating">レーティング</Label>
              <Input
                id="edit-member-rating"
                type="number"
                min={1000}
                max={3000}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            保存
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default MemberEditDialog;
