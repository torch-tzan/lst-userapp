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

import { useAffiliates } from "../../lib/adminAffiliatesStore";
import { addMember } from "../../lib/adminMembersOverlay";
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
}

const SKILL_OPTIONS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

const NewMemberDialog = ({ open, onOpenChange }: Props) => {
  const affiliates = useAffiliates();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("intermediate");
  const [rating, setRating] = useState<string>("1600");
  const [registeredAffiliateId, setRegisteredAffiliateId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPhone("");
      setSkillLevel("intermediate");
      setRating("1600");
      setRegisteredAffiliateId("");
    }
  }, [open]);

  const ratingNum = Number.parseInt(rating, 10);
  const canSubmit =
    name.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    !Number.isNaN(ratingNum) &&
    ratingNum >= 1000 &&
    ratingNum <= 3000 &&
    registeredAffiliateId !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    addMember({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      skillLevel,
      rating: ratingNum,
      registeredAffiliateId,
    });
    toast.success("会員を追加しました");
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>新規会員追加</AdminDialogTitle>
          <AdminDialogDescription>LST 会員として登録します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="member-name">名前</Label>
            <Input id="member-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="山田 太郎" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-email">メール</Label>
            <Input id="member-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-phone">電話</Label>
            <Input id="member-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090-0000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-affiliate">登録店</Label>
            <Select value={registeredAffiliateId} onValueChange={setRegisteredAffiliateId}>
              <SelectTrigger id="member-affiliate">
                <SelectValue placeholder="登録店を選択" />
              </SelectTrigger>
              <SelectContent>
                {affiliates.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.storeName} ({a.prefecture})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="member-skill">スキルレベル</Label>
              <Select value={skillLevel} onValueChange={(v) => setSkillLevel(v as SkillLevel)}>
                <SelectTrigger id="member-skill">
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
              <Label htmlFor="member-rating">初期レーティング</Label>
              <Input
                id="member-rating"
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
            追加
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default NewMemberDialog;
