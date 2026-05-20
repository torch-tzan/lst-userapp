import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useAdminAuth } from "../lib/adminAuthStore";

interface AdminHeaderProps {
  roleLabel: string;
  profilePath: string;
}

const AdminHeader = ({ roleLabel, profilePath }: AdminHeaderProps) => {
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
        {auth.storeName ? (
          <span className="text-sm font-medium text-slate-700">{auth.storeName}</span>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="通知">
          <Bell className="h-5 w-5 text-slate-600" />
        </Button>
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          aria-label="プロフィール"
          className="transition-transform hover:scale-105"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-slate-200 text-sm text-slate-700">{initials}</AvatarFallback>
          </Avatar>
        </button>
        <span className="text-sm text-slate-600">{roleLabel}</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-medium text-red-500 transition-colors hover:text-red-600"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
