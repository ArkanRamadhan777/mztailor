import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { LoadingState } from "./components/ui";

const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const LoginPage = lazy(() =>
  import("./pages/admin/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/admin/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const OrdersPage = lazy(() =>
  import("./pages/admin/OrdersPage").then((m) => ({ default: m.OrdersPage })),
);
const CustomersPage = lazy(() =>
  import("./pages/admin/CustomersPage").then((m) => ({
    default: m.CustomersPage,
  })),
);
const CatalogPage = lazy(() =>
  import("./pages/admin/CatalogPage").then((m) => ({ default: m.CatalogPage })),
);
const ServicesPage = lazy(() =>
  import("./pages/admin/ServicesPage").then((m) => ({
    default: m.ServicesPage,
  })),
);
const LoyaltyPage = lazy(() =>
  import("./pages/admin/LoyaltyPage").then((m) => ({ default: m.LoyaltyPage })),
);
const RewardsPage = lazy(() =>
  import("./pages/admin/RewardsPage").then((m) => ({ default: m.RewardsPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/admin/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

export default function App() {
  return (
    <Suspense fallback={<LoadingState label="Menyiapkan halaman..." />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pesan" element={<Navigate to="/" replace />} />
        <Route path="/mz-admin/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/mz-admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pesanan" element={<OrdersPage />} />
            <Route path="pelanggan" element={<CustomersPage />} />
            <Route path="katalog" element={<CatalogPage />} />
            <Route path="layanan" element={<ServicesPage />} />
            <Route path="loyalitas" element={<LoyaltyPage />} />
            <Route path="reward" element={<RewardsPage />} />
            <Route path="pengaturan" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
