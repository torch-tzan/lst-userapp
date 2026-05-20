import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialEmail: string;
  onSave: (name: string, email: string) => void;
}

const ProfileEditDialog = ({
  open,
  onOpenChange,
  initialName,
  initialEmail,
  onSave,
}: ProfileEditDialogProps) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setEmail(initialEmail);
      setSubmitting(false);
    }
  }, [open, initialName, initialEmail]);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onSave(name.trim(), email.trim());
    toast.success("プロフィールを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>プロフィール編集</AdminDialogTitle>
          <AdminDialogDescription>
            管理者の基本情報を更新します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">名前</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">メール</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

export default ProfileEditDialog;
