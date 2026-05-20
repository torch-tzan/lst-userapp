import { useLocation } from "react-router-dom";

import { LST_NAV_ITEMS, STORE_NAV_ITEMS } from "../lib/navigation";
import AdminPageHeader from "../components/AdminPageHeader";

const AdminPlaceholder = () => {
  const location = useLocation();
  const allItems = [...LST_NAV_ITEMS, ...STORE_NAV_ITEMS];
  const matched = allItems.find((item) => location.pathname === item.path);
  const title = matched?.label ?? "管理画面";

  return (
    <div>
      <AdminPageHeader title={title} description="このセクションは現在準備中です。" />
      <div className="rounded-lg border bg-white p-16 text-center shadow-sm">
        <div className="text-5xl">🚧</div>
        <div className="mt-4 text-base font-medium text-slate-800">このページは準備中</div>
        <div className="mt-1 text-sm text-slate-500">後続のタスクで実装予定です。</div>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
