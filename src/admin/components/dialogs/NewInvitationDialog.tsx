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
import { Textarea } from "@/components/ui/textarea";

import {
  addInvitation,
  INVITATION_ROLE_JP,
  type InvitationRole,
} from "../../lib/adminInvitationsStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS: InvitationRole[] = ["owner", "manager", "receptionist"];

const defaultExpiry = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

const NewInvitationDialog = ({ open, onOpenChange }: Props) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("manager");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("manager");
      setExpiresAt(defaultExpiry());
      setMessage("");
    }
  }, [open]);

  const canSubmit = email.trim() !== "" && expiresAt !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    addInvitation({
      email: email.trim(),
      role,
      expiresAt,
      message: message.trim() || undefined,
    });
    toast.success("招待メールを送信しました");
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>アカウント招待</AdminDialogTitle>
          <AdminDialogDescription>
            店舗の管理アカウントを発行するための招待メールを送信します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="inv-email">メール</Label>
            <Input
              id="inv-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-role">役割</Label>
            <Select value={role} onValueChange={(v) => setRole(v as InvitationRole)}>
              <SelectTrigger id="inv-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {INVITATION_ROLE_JP[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-expires">有効期限</Label>
            <Input
              id="inv-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-message">メッセージ（任意）</Label>
            <Textarea
              id="inv-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="招待理由などを記入"
              rows={3}
            />
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            招待を送信
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default NewInvitationDialog;
