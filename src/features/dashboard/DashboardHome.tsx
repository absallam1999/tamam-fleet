import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useFleet } from "@app/providers/FleetProvider";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useDriversPage } from "@shared/hooks/useFleetDrivers";
import { useFleetOrders } from "@shared/hooks/useFleetOrders";
import { cn } from "@shared/utils/cn";
import { getRelativeTime } from "@shared/utils/formatters";

// ============================================
// Translations
// ============================================

const t = {
  morning: { ar: "صباح الخير", en: "Good Morning" },
  afternoon: { ar: "مساء الخير", en: "Good Afternoon" },
  evening: { ar: "مساء الخير", en: "Good Evening" },
  fleetSupervisor: { ar: "مشرف الأسطول", en: "Fleet Supervisor" },
  online: { ar: "متصل", en: "Online" },

  // Stats
  activeDrivers: { ar: "السائقين النشطين", en: "Active Drivers" },
  pendingOrders: { ar: "طلبات معلقة", en: "Pending Orders" },
  activeOrders: { ar: "طلبات نشطة", en: "Active Orders" },
  revenueToday: { ar: "إيرادات اليوم", en: "Today's Revenue" },
  driverRequests: { ar: "طلبات سائقين", en: "Driver Requests" },
  totalDrivers: { ar: "إجمالي السائقين", en: "Total Drivers" },
  completedToday: { ar: "اكتملت اليوم", en: "Completed Today" },
  needReview: { ar: "تحتاج مراجعة", en: "Need Review" },

  // Areas
  areasOverview: { ar: "المناطق", en: "Areas" },
  drivers: { ar: "السائقين", en: "Drivers" },
  pendingInArea: { ar: "معلق", en: "Pending" },
  activeInArea: { ar: "نشط", en: "Active" },
  noAreas: { ar: "لا توجد مناطق", en: "No areas" },

  // Recent orders
  recentOrders: { ar: "آخر الطلبات", en: "Recent Orders" },
  viewAll: { ar: "عرض الكل", en: "View All" },
  noRecentOrders: { ar: "لا توجد طلبات حديثة", en: "No recent orders" },

  // Driver list
  driverOverview: { ar: "نظرة على السائقين", en: "Driver Overview" },
  noDrivers: { ar: "لا يوجد سائقين", en: "No drivers available" },
  tripsCount: { ar: "رحلة", en: "trips" },

  // Statuses
  pending: { ar: "قيد الانتظار", en: "Pending" },
  accepted: { ar: "مقبول", en: "Accepted" },
  preparing: { ar: "قيد التحضير", en: "Preparing" },
  ready: { ar: "جاهز", en: "Ready" },
  in_transit: { ar: "في الطريق", en: "In Transit" },
  delivered: { ar: "تم التوصيل", en: "Delivered" },
  cancelled: { ar: "ملغي", en: "Cancelled" },

  // Driver status
  driverAvailable: { ar: "متاح", en: "Available" },
  driverOnTrip: { ar: "في رحلة", en: "On Trip" },
  driverOffDuty: { ar: "خارج الخدمة", en: "Off Duty" },
  driverOnLeave: { ar: "في إجازة", en: "On Leave" },
  driverSuspended: { ar: "موقوف", en: "Suspended" },

  refresh: { ar: "تحديث", en: "Refresh" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  loading: { ar: "جاري تحميل البيانات...", en: "Loading data..." },
};

// ============================================
// Status Config
// ============================================

const getOrderStatusConfig = (isAr: boolean) => ({
  pending: {
    label: isAr ? t.pending.ar : t.pending.en,
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
  },
  accepted: {
    label: isAr ? t.accepted.ar : t.accepted.en,
    className:
      "bg-info-50 text-info-700 border-info-200 dark:bg-info-500/10 dark:text-info-400 dark:border-info-500/20",
    dot: "bg-info-500",
  },
  preparing: {
    label: isAr ? t.preparing.ar : t.preparing.en,
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
  },
  ready: {
    label: isAr ? t.ready.ar : t.ready.en,
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
  },
  in_transit: {
    label: isAr ? t.in_transit.ar : t.in_transit.en,
    className:
      "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
    dot: "bg-primary-500",
  },
  delivered: {
    label: isAr ? t.delivered.ar : t.delivered.en,
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
  },
  cancelled: {
    label: isAr ? t.cancelled.ar : t.cancelled.en,
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
  },
});

const getDriverStatusConfig = (isAr: boolean) => ({
  available: {
    label: isAr ? t.driverAvailable.ar : t.driverAvailable.en,
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
  },
  on_trip: {
    label: isAr ? t.driverOnTrip.ar : t.driverOnTrip.en,
    className:
      "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
    dot: "bg-primary-500",
  },
  off_duty: {
    label: isAr ? t.driverOffDuty.ar : t.driverOffDuty.en,
    className:
      "bg-surface-100 text-surface-600 border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700",
    dot: "bg-surface-400",
  },
  on_leave: {
    label: isAr ? t.driverOnLeave.ar : t.driverOnLeave.en,
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
  },
  suspended: {
    label: isAr ? t.driverSuspended.ar : t.driverSuspended.en,
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
  },
});

// ============================================
// DashboardHome — Main Component
// ============================================

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats: fleetStats, areas } = useFleet();
  const { currentLanguage } = useLanguage();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  // Use existing hooks for data
  const {
    drivers,
    isLoading: driversLoading,
    refetch: refetchDrivers,
  } = useDriversPage();
  const {
    pendingOrders,
    activeOrders,
    pendingLoading,
    activeLoading,
    refetchPending,
    refetchActive,
  } = useFleetOrders();

  const isLoading = driversLoading || pendingLoading || activeLoading;

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchDrivers();
      refetchPending();
      refetchActive();
    }, 60_000);
    return () => clearInterval(interval);
  }, [refetchDrivers, refetchPending, refetchActive]);

  // Derived stats from FleetProvider
  const stats = fleetStats;

  // Get recent orders (pending + active, limited to 5)
  const recentOrders = useMemo(() => {
    const all = [...(pendingOrders || []), ...(activeOrders || [])].slice(0, 5);
    return all;
  }, [pendingOrders, activeOrders]);

  // Get top 4 drivers (from current page)
  const topDrivers = useMemo(() => drivers?.slice(0, 4) ?? [], [drivers]);

  const handleRefresh = () => {
    refetchDrivers();
    refetchPending();
    refetchActive();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return lang(t.morning);
    if (hour < 17) return lang(t.afternoon);
    return lang(t.evening);
  };

  const getUserName = () =>
    user?.fullName?.split(" ")[0] || lang(t.fleetSupervisor);
  const orderStatusConfig = getOrderStatusConfig(isAr);
  const driverStatusConfig = getDriverStatusConfig(isAr);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={cn(isAr ? "text-right" : "text-left")}>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {getGreeting()}, {getUserName()}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.fleetSupervisor)}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              {lang(t.online)}
            </span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="btn btn-ghost btn-sm"
        >
          <svg
            className={cn("w-4 h-4", isLoading && "animate-spin")}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          <span className="hidden sm:inline">{lang(t.refresh)}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            title: lang(t.activeDrivers),
            value: stats ? stats.onlineDrivers : "-",
            subtitle: `${lang(t.totalDrivers)}: ${stats ? stats.totalDrivers : "-"}`,
            to: "/dashboard/drivers",
            color:
              "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            ),
          },
          {
            title: lang(t.pendingOrders),
            value: stats ? stats.pendingOrders : "-",
            subtitle: lang(t.needReview),
            to: "/dashboard/orders",
            color:
              "bg-warning-100 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ),
          },
          {
            title: lang(t.activeOrders),
            value: stats ? stats.activeDeliveries : "-",
            subtitle: `${lang(t.completedToday)}: ${stats ? stats.completedToday : "-"}`,
            to: "/dashboard/orders",
            color:
              "bg-info-100 dark:bg-info-500/10 text-info-600 dark:text-info-400",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                />
              </svg>
            ),
          },
          {
            title: lang(t.completedToday),
            value: stats ? stats.completedToday : "-",
            subtitle: lang(t.needReview),
            to: "/dashboard/orders",
            color:
              "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ),
          },
        ].map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.to)}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm hover:shadow-md hover:border-surface-300 dark:hover:border-surface-700 transition-all duration-200 cursor-pointer"
          >
            {isLoading && !stats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="skeleton h-4 w-24 rounded-lg" />
                  <div className="skeleton h-10 w-10 rounded-xl" />
                </div>
                <div className="skeleton h-8 w-16 rounded-lg" />
                <div className="skeleton h-3 w-20 rounded-lg" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
                    {card.title}
                  </p>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      card.color,
                    )}
                  >
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {card.value}
                </p>
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                  {card.subtitle}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Areas Overview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            {lang(t.areasOverview)}
          </h3>
          <span className="text-sm text-surface-500 dark:text-surface-400">
            ({areas?.length ?? 0})
          </span>
        </div>

        {areas && areas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <div
                key={area.areaId}
                className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                    {area.areaName}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {area.driverCount} {lang(t.drivers)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-warning-600 dark:text-warning-400">
                    <span className="w-2 h-2 rounded-full bg-warning-500" />
                    {area.pendingOrders ?? 0} {lang(t.pendingInArea)}
                  </span>
                  <span className="flex items-center gap-1.5 text-info-600 dark:text-info-400">
                    <span className="w-2 h-2 rounded-full bg-info-500" />
                    {area.activeOrders ?? 0} {lang(t.activeInArea)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-5 text-center text-sm text-surface-500">
            {lang(t.noAreas)}
          </div>
        )}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Overview */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.driverOverview)}
            </h3>
            <button
              onClick={() => navigate("/dashboard/drivers")}
              className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {lang(t.viewAll)}
            </button>
          </div>
          {driversLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="skeleton h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-4 w-28 rounded-lg" />
                    <div className="skeleton h-3 w-16 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : topDrivers.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {lang(t.noDrivers)}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {topDrivers.map((driver) => {
                const config =
                  driverStatusConfig[
                    driver.status as keyof typeof driverStatusConfig
                  ] || driverStatusConfig.off_duty;
                return (
                  <div
                    key={driver.id}
                    onClick={() => navigate(`/dashboard/drivers/${driver.id}`)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer group"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        driver.status === "available"
                          ? "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400"
                          : driver.status === "on_trip"
                            ? "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"
                            : "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400",
                      )}
                    >
                      <span className="text-sm font-bold">
                        {driver.fullName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                        {driver.fullName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={cn("w-1.5 h-1.5 rounded-full", config.dot)}
                        />
                        <span className="text-xs text-surface-500 dark:text-surface-400">
                          {config.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                        {driver.totalTrips || 0}
                      </span>
                      <p className="text-[10px] text-surface-400 dark:text-surface-500">
                        {lang(t.tripsCount)}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rtl:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.recentOrders)}
            </h3>
            <button
              onClick={() => navigate("/dashboard/orders")}
              className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {lang(t.viewAll)}
            </button>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <div className="skeleton h-4 w-20 rounded-lg" />
                  <div className="skeleton h-4 w-28 rounded-lg flex-1" />
                  <div className="skeleton h-6 w-20 rounded-full" />
                  <div className="skeleton h-4 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-surface-300 dark:text-surface-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                {lang(t.noRecentOrders)}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {recentOrders.map((order) => {
                const sConfig =
                  orderStatusConfig[
                    order.status as keyof typeof orderStatusConfig
                  ] || orderStatusConfig.pending;
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate("/dashboard/orders")}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer group"
                  >
                    <span className="font-mono text-xs font-semibold text-surface-900 dark:text-surface-100 w-20 flex-shrink-0">
                      {order.orderNumber || `#${order.id?.slice(0, 8) ?? ""}`}
                    </span>
                    <span className="text-sm text-surface-700 dark:text-surface-300 flex-1 min-w-0 truncate">
                      {order.customerName}
                    </span>
                    <span className="text-sm text-surface-500 dark:text-surface-400 hidden sm:block flex-1 min-w-0 truncate">
                      {order.storeName}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0",
                        sConfig.className,
                      )}
                    >
                      <span
                        className={cn("w-1 h-1 rounded-full", sConfig.dot)}
                      />
                      {sConfig.label}
                    </span>
                    <span className="text-xs text-surface-400 dark:text-surface-500 w-16 text-right flex-shrink-0">
                      {getRelativeTime(order.createdAt)}
                    </span>
                    <svg
                      className="w-4 h-4 text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
