import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useAdminAuth } from "../lib/adminAuthStore";

interface AdminHeaderProps {
  rolePillLabel: string;
}

const AdminHeader = ({ rolePillLabel }: AdminHeaderProps) => {
  const auth = useAdminAuth();
  const navigate = useNavigate();

  const initials = (auth.email?.[0] ?? "A").toUpperCase();

  const handleSignOut = () => {
    auth.signOut();
    navigate("/admin/login");
  };

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          {rolePillLabel}
        </span>
        {auth.storeName ? (
          <span className="text-sm text-slate-600">{auth.storeName}</span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="通知">
          <Bell className="h-5 w-5 text-slate-600" />
        </Button>
        <div className="flex items-center gap-2 pl-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-slate-200 text-sm text-slate-700">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <div className="font-medium text-slate-800">{auth.email ?? "admin"}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="ログアウト" onClick={handleSignOut}>
          <LogOut className="h-5 w-5 text-slate-600" />
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
