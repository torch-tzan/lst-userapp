import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

import { useAdminAuth } from "../lib/adminAuthStore";
import { LST_NAV_GROUPS, STORE_NAV_GROUPS } from "../lib/navigation";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  role: "lst" | "store";
  children: React.ReactNode;
}

const AdminLayout = ({ role, children }: AdminLayoutProps) => {
  const auth = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.role !== role) {
      navigate("/admin/login", { replace: true });
    }
  }, [auth.role, role, navigate]);

  if (auth.role !== role) {
    return <Navigate to="/admin/login" replace />;
  }

  const isLst = role === "lst";
  const groups = isLst ? LST_NAV_GROUPS : STORE_NAV_GROUPS;
  const dashboardPath = isLst ? "/admin/lst/dashboard" : "/admin/store/dashboard";
  const profilePath = isLst ? "/admin/lst/profile" : "/admin/store/profile";
  const roleLabel = isLst ? "LST 管理者" : "企業管理者";
  const logoText = isLst ? "LST 運営管理" : "ADMIN";

  return (
    <div className="flex h-screen min-w-[1440px] overflow-hidden bg-gray-50 text-slate-900">
      <AdminSidebar groups={groups} dashboardPath={dashboardPath} logoText={logoText} />
      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <AdminHeader roleLabel={roleLabel} profilePath={profilePath} />
        <main className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
      <SonnerToaster position="top-right" richColors />
    </div>
  );
};

export default AdminLayout;
