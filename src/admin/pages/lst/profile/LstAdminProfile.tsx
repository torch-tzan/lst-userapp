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

const LstAdminProfile = () => {
  const navigate = useNavigate();
  const auth = useAdminAuth();

  const [name, setName] = useState("LST 本部管理者");
  const [email, setEmail] = useState(auth.email ?? "admin@lst.jp");

  const [editOpen, setEditOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  const [notifAffiliate, setNotifAffiliate] = useState(true);
  const [notifRevenue, setNotifRevenue] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);

  const handleLogout = () => {
    auth.signOut();
    toast.success("ログアウトしました");
    navigate("/admin/login");
  };

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="管理者プロフィール"
        description="アカウントと通知の設定"
        breadcrumbs={[{ label: "LST HQ" }, { label: "管理者プロフィール" }]}
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
              <InfoRow label="役割">LST 本部管理者</InfoRow>
              <InfoRow label="入社日">2023-01-01</InfoRow>
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
              label="加盟店からの申請"
              description="新規加盟店申請や解約申請の通知"
              checked={notifAffiliate}
              onChange={setNotifAffiliate}
            />
            <NotificationRow
              label="売上レポート"
              description="日次・月次の本部総売上レポート"
              checked={notifRevenue}
              onChange={setNotifRevenue}
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

export default LstAdminProfile;
