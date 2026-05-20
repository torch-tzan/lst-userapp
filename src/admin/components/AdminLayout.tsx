import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAdminAuth } from "../lib/adminAuthStore";
import { LST_NAV_ITEMS, STORE_NAV_ITEMS } from "../lib/navigation";
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
  const items = isLst ? LST_NAV_ITEMS : STORE_NAV_ITEMS;
  const title = isLst ? "LST 本部" : "店舗管理";
  const subtitle = isLst ? "Headquarters" : auth.storeName ?? "Store Admin";
  const rolePillLabel = isLst ? "LST HQ" : "店舗";

  return (
    <div className="flex min-h-screen min-w-[1440px] bg-gray-50 text-slate-900">
      <AdminSidebar items={items} title={title} subtitle={subtitle} />
      <div className="flex min-h-screen flex-1 flex-col">
        <AdminHeader rolePillLabel={rolePillLabel} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
