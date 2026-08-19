import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ---- Layouts ----
import { AuthLayout } from "@app/layouts/AuthLayout";
import { FleetLayout } from "@/app/layouts/FleetLayout";
import { ProtectedRoute } from "@shared/components/ProtectedRoute";

// ---- Shared Components ----
import { PageLoader } from "@shared/components/PageLoader";

// ---- Lazy-Loaded Auth Pages ----
const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);

const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);

const ResetPasswordPage = lazy(() =>
  import("@/features/auth/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);

// ---- Lazy-Loaded Dashboard Pages ----
const DashboardHome = lazy(() =>
  import("@/features/dashboard/DashboardHome").then((m) => ({
    default: m.DashboardHome,
  })),
);

const DriversPage = lazy(() =>
  import("@/features/drivers/DriversPage").then((m) => ({
    default: m.DriversPage,
  })),
);

const DriverDetailsPage = lazy(() =>
  import("@/features/drivers/DriverDetailsPage").then((m) => ({
    default: m.DriverDetailsPage,
  })),
);

const DriverFormPage = lazy(() =>
  import("@/features/drivers/DriverFormPage").then((m) => ({
    default: m.DriverFormPage,
  })),
);

const OrdersPage = lazy(() =>
  import("@/features/orders/OrdersPage").then((m) => ({
    default: m.OrdersPage,
  })),
);

const RequestsPage = lazy(() =>
  import("@/features/requests/RequestsPage").then((m) => ({
    default: m.RequestsPage,
  })),
);

const SupportPage = lazy(() =>
  import("@/features/support/SupportPage").then((m) => ({
    default: m.SupportPage,
  })),
);

const WalletPage = lazy(() =>
  import("@/features/wallet/WalletPage").then((m) => ({
    default: m.WalletPage,
  })),
);

const ReportsPage = lazy(() =>
  import("@/features/reports/ReportsPage").then((m) => ({
    default: m.ReportsPage,
  })),
);

const NotificationsPage = lazy(() =>
  import("@/features/notifications/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);

const SettingsPage = lazy(() =>
  import("@/features/settings/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);

// ---- Lazy-Loaded Shared Pages ----
const NotFoundPage = lazy(() =>
  import("@shared/components/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  })),
);

/**
 * AppRouter — Fleet Route Configuration
 */
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Root Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth Routes — Public */}
      <Route element={<AuthLayout />}>
        <Route
          path="/auth/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ForgotPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ResetPasswordPage />
            </Suspense>
          }
        />
      </Route>

      {/* Protected Routes — Auth Required */}
      <Route element={<ProtectedRoute />}>
        <Route element={<FleetLayout />}>
          {/* Dashboard Home */}
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardHome />
              </Suspense>
            }
          />

          {/* Drivers Management */}
          <Route
            path="/dashboard/drivers"
            element={
              <Suspense fallback={<PageLoader />}>
                <DriversPage />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/drivers/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <DriverFormPage />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/drivers/:driverId"
            element={
              <Suspense fallback={<PageLoader />}>
                <DriverDetailsPage />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/drivers/:driverId/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <DriverFormPage />
              </Suspense>
            }
          />

          {/* Orders Management */}
          <Route
            path="/dashboard/orders"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrdersPage />
              </Suspense>
            }
          />

          {/* Driver Requests */}
          <Route
            path="/dashboard/requests"
            element={
              <Suspense fallback={<PageLoader />}>
                <RequestsPage />
              </Suspense>
            }
          />

          {/* Wallet */}
          <Route
            path="/dashboard/wallet"
            element={
              <Suspense fallback={<PageLoader />}>
                <WalletPage />
              </Suspense>
            }
          />

          {/* Support */}
          <Route
            path="/dashboard/support"
            element={
              <Suspense fallback={<PageLoader />}>
                <SupportPage />
              </Suspense>
            }
          />

          {/* Reports */}
          <Route
            path="/dashboard/reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            }
          />

          {/* Notifications */}
          <Route
            path="/dashboard/notifications"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotificationsPage />
              </Suspense>
            }
          />

          {/* Settings */}
          <Route
            path="/dashboard/settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* Catch-All — 404 */}
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default AppRouter;
