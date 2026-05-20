import { LogOut, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import PasswordChangeDialog from "../../../components/dialogs/PasswordChangeDialog";
import ProfileEditDialog from "../../../components/dialogs/ProfileEditDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { useAdminAuth } from "../../../lib/adminAuthStore";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const SectionHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="mb-4 flex items-start justify-between">
    <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
    </div>
    {action}
  </div>
);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm text-slate-800">{children}</span>
  </>
);

const NotificationRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <div className="text-sm font-medium text-slate-800">{label}</div>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const AdminProfile = () => {
  const navigate = useNavigate();
  const auth = useAdminAuth();

  // プロフィール（localStorage には書かないが、画面表示で持つ）
  const [name, setName] = useState("店舗管理者");
  const [email, setEmail] = useState(auth.email ?? "admin@example.com");

  const [editOpen, setEditOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  const [notifBooking, setNotifBooking] = useState(true);
  const [notifCancel, setNotifCancel] = useState(true);
  const [notifSales, setNotifSales] = useState(false);
  const [notifSystem, setNotifSystem] = useState(true);

  const handleLogout = () => {
    auth.signOut();
    toast.success("ログアウトしました");
    navigate("/admin/login");
  };

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="管理者プロフィール"
        description="アカウントと通知の設定"
        breadcrumbs={[{ label: "店舗管理" }, { label: "管理者プロフィール" }]}
      />

      <div className="mx-auto max-w-[800px] space-y-6">
        <div className={cardCls}>
          <SectionHeader
            title="基本情報"
            action={
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-4 w-4" />
                編集
              </Button>
            }
          />
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-semibold text-blue-700">
              {name.slice(0, 1)}
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-y-2 gap-x-4">
              <InfoRow label="名前">{name}</InfoRow>
              <InfoRow label="メール">{email}</InfoRow>
              <InfoRow label="役割">店舗管理者</InfoRow>
              <InfoRow label="入社日">2024-04-01</InfoRow>
            </div>
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="パスワード変更" description="セキュリティのため定期的な変更を推奨します。" />
          <Button variant="outline" onClick={() => setPwdOpen(true)}>
            パスワード変更
          </Button>
        </div>

        <div className={cardCls}>
          <SectionHeader title="通知設定" />
          <div className="divide-y">
            <NotificationRow
              label="新規予約"
              description="新しい予約があったとき通知を受け取る"
              checked={notifBooking}
              onChange={setNotifBooking}
            />
            <NotificationRow
              label="キャンセル"
              description="予約キャンセルがあったとき通知を受け取る"
              checked={notifCancel}
              onChange={setNotifCancel}
            />
            <NotificationRow
              label="売上レポート"
              description="日次・月次の売上レポートを受け取る"
              checked={notifSales}
              onChange={setNotifSales}
            />
            <NotificationRow
              label="システム通知"
              description="メンテナンスや障害情報"
              checked={notifSystem}
              onChange={setNotifSystem}
            />
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader title="危険な操作" description="この操作はアカウントセッションを終了します。" />
          <Button
            variant="outline"
            className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            onClick={handleLogout}
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>

      <ProfileEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialName={name}
        initialEmail={email}
        onSave={(n, e) => {
          setName(n);
          setEmail(e);
        }}
      />
      <PasswordChangeDialog open={pwdOpen} onOpenChange={setPwdOpen} />
    </AdminLayout>
  );
};

export default AdminProfile;
