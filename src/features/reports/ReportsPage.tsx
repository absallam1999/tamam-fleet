import { useReports } from "@shared/hooks/useFleetReports";
import { formatCurrency, getRelativeTime } from "@shared/utils/formatters";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { cn } from "@shared/utils/cn";

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "التقارير", en: "Reports" },
  subtitle: {
    ar: "ملخص أداء الأسطول والسائقين",
    en: "Fleet and driver performance summary",
  },

  // Stats cards
  totalDrivers: { ar: "إجمالي السائقين", en: "Total Drivers" },
  onlineDrivers: { ar: "السائقين النشطين", en: "Online Drivers" },
  pendingOrders: { ar: "طلبات معلقة", en: "Pending Orders" },
  activeDeliveries: { ar: "طلبات نشطة", en: "Active Deliveries" },
  completedToday: { ar: "مكتملة اليوم", en: "Completed Today" },

  // Driver Performance
  driverPerformance: { ar: "أداء السائقين", en: "Driver Performance" },
  driver: { ar: "السائق", en: "Driver" },
  driverCount: { ar: "سائق", en: "Driver" },
  driverCountPlural: { ar: "سائقين", en: "Drivers" },
  rating: { ar: "التقييم", en: "Rating" },
  status: { ar: "الحالة", en: "Status" },
  completed: { ar: "مكتملة", en: "Completed" },
  cancelled: { ar: "ملغية", en: "Cancelled" },
  onTime: { ar: "نسبة الالتزام", en: "On-Time %" },
  noDrivers: { ar: "لا يوجد سائقين", en: "No drivers available" },

  // Order Summary
  orderSummary: { ar: "ملخص الطلبات النشطة", en: "Active Orders Summary" },
  orderNumber: { ar: "رقم الطلب", en: "Order #" },
  orderCount: { ar: "طلب", en: "Order" },
  orderCountPlural: { ar: "طلبات", en: "Orders" },
  customer: { ar: "العميل", en: "Customer" },
  store: { ar: "المتجر", en: "Store" },
  driverAssigned: { ar: "السائق", en: "Driver" },
  amount: { ar: "المبلغ", en: "Amount" },
  time: { ar: "الوقت", en: "Time" },
  noOrders: { ar: "لا توجد طلبات نشطة", en: "No active orders" },

  // Statuses
  available: { ar: "متاح", en: "Available" },
  on_trip: { ar: "في رحلة", en: "On Trip" },
  off_duty: { ar: "خارج الخدمة", en: "Off Duty" },
  on_leave: { ar: "في إجازة", en: "On Leave" },
  suspended: { ar: "موقوف", en: "Suspended" },

  // Order statuses
  pending: { ar: "قيد الانتظار", en: "Pending" },
  accepted: { ar: "مقبول", en: "Accepted" },
  preparing: { ar: "قيد التحضير", en: "Preparing" },
  ready: { ar: "جاهز", en: "Ready" },
  in_transit: { ar: "في الطريق", en: "In Transit" },
  delivered: { ar: "تم التوصيل", en: "Delivered" },
  cancelled_status: { ar: "ملغي", en: "Cancelled" },

  // Actions
  refresh: { ar: "تحديث", en: "Refresh" },
  loading: { ar: "جاري تحميل التقارير...", en: "Loading reports..." },
  error: { ar: "فشل تحميل البيانات", en: "Failed to load data" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
};

// ============================================
// Status Config
// ============================================

const getDriverStatusConfig = (isAr: boolean) => ({
  available: {
    label: isAr ? t.available.ar : t.available.en,
    className: "text-success-600 dark:text-success-400",
    dot: "bg-success-500",
  },
  on_trip: {
    label: isAr ? t.on_trip.ar : t.on_trip.en,
    className: "text-primary-600 dark:text-primary-400",
    dot: "bg-primary-500",
  },
  off_duty: {
    label: isAr ? t.off_duty.ar : t.off_duty.en,
    className: "text-surface-500 dark:text-surface-400",
    dot: "bg-surface-400",
  },
  on_leave: {
    label: isAr ? t.on_leave.ar : t.on_leave.en,
    className: "text-warning-600 dark:text-warning-400",
    dot: "bg-warning-500",
  },
  suspended: {
    label: isAr ? t.suspended.ar : t.suspended.en,
    className: "text-error-600 dark:text-error-400",
    dot: "bg-error-500",
  },
});

const getOrderStatusConfig = (isAr: boolean) => ({
  pending: {
    label: isAr ? t.pending.ar : t.pending.en,
    className: "badge-warning",
  },
  accepted: {
    label: isAr ? t.accepted.ar : t.accepted.en,
    className: "badge-info",
  },
  preparing: {
    label: isAr ? t.preparing.ar : t.preparing.en,
    className: "badge-warning",
  },
  ready: { label: isAr ? t.ready.ar : t.ready.en, className: "badge-success" },
  in_transit: {
    label: isAr ? t.in_transit.ar : t.in_transit.en,
    className: "badge-primary",
  },
  delivered: {
    label: isAr ? t.delivered.ar : t.delivered.en,
    className: "badge-success",
  },
  cancelled: {
    label: isAr ? t.cancelled_status.ar : t.cancelled_status.en,
    className: "badge-error",
  },
});

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="glass p-5 space-y-3">
        <div className="flex justify-between">
          <div className="skeleton h-4 w-24 rounded-lg" />
          <div className="skeleton h-8 w-8 rounded-lg" />
        </div>
        <div className="skeleton h-8 w-32 rounded-lg" />
      </div>
    );
  }
  return (
    <div className="glass p-5">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
          {title}
        </p>
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            color,
          )}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 mt-3">
        {value}
      </p>
    </div>
  );
};

// ============================================
// ReportsPage — Main Component
// ============================================

export const ReportsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const {
    dashboard,
    driverPerformance,
    orderSummaries,
    isLoading,
    isError,
    error,
    refetch,
  } = useReports();

  const driverStatusConfig = getDriverStatusConfig(isAr);
  const orderStatusConfig = getOrderStatusConfig(isAr);

  if (isLoading && !dashboard) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="skeleton h-8 w-32 rounded-lg mb-2" />
            <div className="skeleton h-4 w-48 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass p-5 space-y-3">
              <div className="flex justify-between">
                <div className="skeleton h-4 w-20 rounded-lg" />
                <div className="skeleton h-8 w-8 rounded-lg" />
              </div>
              <div className="skeleton h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-error-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
          {lang(t.error)}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
          {error?.message}
        </p>
        <button onClick={() => refetch()} className="btn btn-primary btn-sm">
          {lang(t.retry)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={cn(isAr ? "text-right" : "text-left")}>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
        <button onClick={() => refetch()} className="btn btn-ghost btn-sm">
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
          {lang(t.refresh)}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={lang(t.totalDrivers)}
          value={String(dashboard?.totalDrivers ?? 0)}
          icon={
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          }
          color="bg-primary-500"
          isLoading={isLoading}
        />
        <StatCard
          title={lang(t.onlineDrivers)}
          value={String(dashboard?.onlineDrivers ?? 0)}
          icon={
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          }
          color="bg-success-500"
          isLoading={isLoading}
        />
        <StatCard
          title={lang(t.pendingOrders)}
          value={String(dashboard?.pendingOrders ?? 0)}
          icon={
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          }
          color="bg-warning-500"
          isLoading={isLoading}
        />
        <StatCard
          title={lang(t.activeDeliveries)}
          value={String(dashboard?.activeDeliveries ?? 0)}
          icon={
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
              />
            </svg>
          }
          color="bg-blue-500"
          isLoading={isLoading}
        />
      </div>

      {/* Completed Today secondary card */}
      <div className="glass p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
            {lang(t.completedToday)}
          </p>
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 mt-3">
          {dashboard?.completedToday ?? 0}
        </p>
      </div>

      {/* Driver Performance + Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Performance Card */}
        <div className="glass overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/50 to-transparent dark:from-surface-800/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>
                {lang(t.driverPerformance)}
              </h3>
              <span className="text-xs text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
                {driverPerformance.length}{" "}
                {lang(
                  driverPerformance.length === 1
                    ? t.driverCount
                    : t.driverCountPlural,
                )}
              </span>
            </div>
          </div>
          {driverPerformance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
                {lang(t.noDrivers)}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50/80 dark:bg-surface-800/30">
                    {[
                      lang(t.driver),
                      lang(t.status),
                      lang(t.completed),
                      lang(t.cancelled),
                      lang(t.onTime),
                      lang(t.rating),
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                  {driverPerformance.slice(0, 10).map((d, _index) => {
                    const dsConfig =
                      driverStatusConfig[
                        d.status as keyof typeof driverStatusConfig
                      ] || driverStatusConfig.off_duty;
                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-surface-50/50 dark:hover:bg-surface-800/20"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300">
                              {d.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-surface-900 dark:text-surface-100">
                              {d.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full">
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                dsConfig.dot,
                              )}
                            />
                            {dsConfig.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-success-600 dark:text-success-400 font-semibold">
                          {d.completedTrips}
                        </td>
                        <td className="py-3.5 px-4 text-error-600 dark:text-error-400 font-semibold">
                          {d.cancelledTrips}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-[60px] h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  d.onTimePercentage >= 80
                                    ? "bg-success-500"
                                    : d.onTimePercentage >= 60
                                      ? "bg-warning-500"
                                      : "bg-error-500",
                                )}
                                style={{ width: `${d.onTimePercentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium min-w-[40px]">
                              {d.onTimePercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="w-4 h-4 text-warning-400 fill-warning-400"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <span className="text-xs font-medium">
                              {d.rating?.toFixed(1) || "-"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Summary Card */}
        <div className="glass overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/50 to-transparent dark:from-surface-800/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
                {lang(t.orderSummary)}
              </h3>
              <span className="text-xs text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
                {orderSummaries.length}{" "}
                {lang(
                  orderSummaries.length === 1
                    ? t.orderCount
                    : t.orderCountPlural,
                )}
              </span>
            </div>
          </div>
          {orderSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
                {lang(t.noOrders)}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50/80 dark:bg-surface-800/30">
                    {[
                      lang(t.orderNumber),
                      lang(t.customer),
                      lang(t.store),
                      lang(t.driverAssigned),
                      lang(t.status),
                      lang(t.amount),
                      lang(t.time),
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                  {orderSummaries.map((o, _index) => {
                    const osConfig =
                      orderStatusConfig[
                        o.status as keyof typeof orderStatusConfig
                      ] || orderStatusConfig.pending;
                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-surface-50/50 dark:hover:bg-surface-800/20"
                      >
                        <td className="py-3.5 px-4">
                          #{o.orderNumber.slice(-4)}
                        </td>
                        <td className="py-3.5 px-4">{o.customerName}</td>
                        <td className="py-3.5 px-4">{o.storeName}</td>
                        <td className="py-3.5 px-4">{o.driverName || "—"}</td>
                        <td className="py-3.5 px-4">
                          <span className={cn("badge", osConfig.className)}>
                            {osConfig.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          {formatCurrency(o.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-surface-400">
                          {getRelativeTime(o.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
