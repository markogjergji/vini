import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SearchPage from "./pages/SearchPage";
import ResultsPage from "./pages/ResultsPage";
import PartDetailPage from "./pages/PartDetailPage";
import UploadPage from "./pages/UploadPage";
import ProfilePage from "./pages/ProfilePage";
import MyPartsPage from "./pages/MyPartsPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSellersPage from "./pages/admin/AdminSellersPage";
import AdminPartsPage from "./pages/admin/AdminPartsPage";
import ShopPage from "./pages/ShopPage";

export default function App() {
  return (
    <Routes>
      {/* Admin (protected, admin-only, own layout) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="sellers" element={<AdminSellersPage />} />
        <Route path="parts" element={<AdminPartsPage />} />
      </Route>

      {/* Main site */}
      <Route element={<Layout />}>
        <Route path="/" element={<SearchPage />} />
        <Route path="/search" element={<ResultsPage />} />
        <Route path="/parts/:id" element={<PartDetailPage />} />
        <Route path="/shop/:id" element={<ShopPage />} />
        <Route
          path="/upload"
          element={
            <ProtectedRoute requiredRole="seller">
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-parts"
          element={
            <ProtectedRoute requiredRole="seller">
              <MyPartsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
