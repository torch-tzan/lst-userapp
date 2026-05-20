import { Route, Routes } from "react-router-dom";

import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import AdminPlaceholder from "./pages/AdminPlaceholder";
import LstDashboard from "./pages/lst/LstDashboard";
import StoreDashboard from "./pages/store/StoreDashboard";

// Admin の sub-app entry。App.tsx の <Route path="/admin/*"> から呼ばれる想定。
const AdminApp = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />

      <Route path="lst/dashboard" element={<LstDashboard />} />
      <Route
        path="lst/*"
        element={
          <AdminLayout role="lst">
            <AdminPlaceholder />
          </AdminLayout>
        }
      />

      <Route path="store/dashboard" element={<StoreDashboard />} />
      <Route
        path="store/*"
        element={
          <AdminLayout role="store">
            <AdminPlaceholder />
          </AdminLayout>
        }
      />
    </Routes>
  );
};

export default AdminApp;
