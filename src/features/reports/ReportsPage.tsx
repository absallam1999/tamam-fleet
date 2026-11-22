import { useState, useMemo } from "react";
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

  // Stat cards
  totalDrivers: { ar: "إجمالي السائقين", en: "Total Drivers" },
  onlineDrivers: { ar: "السائقين النشطين", en: "Online Drivers" },
  pendingOrders: { ar: "طلبات معلقة", en: "Pending Orders" },
  activeDeliveries: { ar: "طلبات نشطة", en: "Active Deliveries" },
  completedToday: { ar: "مكتملة اليوم", en: "Completed Today" },
  totalOrderValue: { ar: "قيمة الطلبات", en: "Total Order Value" },
  averageOrderValue: { ar: "متوسط قيمة الطلب", en: "Avg Order Value" },
  unassignedOrders: { ar: "طلبات غير مسندة", en: "Unassigned Orders" },
  todayMetrics: { ar: "مؤشرات اليوم", en: "Today's Metrics" },

  // Filters
  filters: { ar: "الفلاتر", en: "Filters" },
  statusFilter: { ar: "الحالة", en: "Status" },
  allStatuses: { ar: "جميع الحالات", en: "All Statuses" },
  fromDate: { ar: "من تاريخ", en: "From Date" },
  toDate: { ar: "إلى تاريخ", en: "To Date" },
  clearFilters: { ar: "مسح الفلاتر", en: "Clear Filters" },
  applyFilters: { ar: "تطبيق", en: "Apply" },

  // Analytics
  orderStatusDistribution: {
    ar: "توزيع حالات الطلبات",
    en: "Order Status Distribution",
  },
  areaBreakdown: { ar: "توزيع المناطق", en: "Area Breakdown" },
  noData: { ar: "لا توجد بيانات", en: "No data" },
  area: { ar: "المنطقة", en: "Area" },
  drivers: { ar: "السائقين", en: "Drivers" },
  pending: { ar: "معلقة", en: "Pending" },
  active: { ar: "نشطة", en: "Active" },

  // Driver Performance
  driverPerformance: { ar: "أداء السائقين", en: "Driver Performance" },
  driver: { ar: "السائق", en: "Driver" },
  driverCount: { ar: "سائق", en: "Driver" },
  driverCountPlural: { ar: "سائقين", en: "Drivers" },
  rating: { ar: "التقييم", en: "Rating" },
  status: { ar: "الحالة", en: "Status" },
  completedTotal: { ar: "إجمالي التوصيلات", en: "Total Deliveries" },
  driversToday: { ar: "توصيلات اليوم", en: "Today's Deliveries" },
  vehicle: { ar: "المركبة", en: "Vehicle" },
  noDrivers: { ar: "لا يوجد سائقين", en: "No drivers available" },

  // Order Summary
  orderSummary: { ar: "ملخص الطلبات", en: "Orders Summary" },
  orderNumber: { ar: "رقم الطلب", en: "Order #" },
  orderCount: { ar: "طلب", en: "Order" },
  orderCountPlural: { ar: "طلبات", en: "Orders" },
  customer: { ar: "العميل", en: "Customer" },
  store: { ar: "المتجر", en: "Store" },
  driverAssigned: { ar: "السائق", en: "Driver" },
  amount: { ar: "المبلغ", en: "Amount" },
  time: { ar: "الوقت", en: "Time" },
  noOrders: { ar: "لا توجد طلبات", en: "No orders" },

  // Actions
  refresh: { ar: "تحديث", en: "Refresh" },
  loading: { ar: "جاري تحميل التقارير...", en: "Loading reports..." },
  error: { ar: "فشل تحميل البيانات", en: "Failed to load data" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
} as const;

const lang = (key: keyof typeof t, isAr: boolean) =>
  isAr ? t[key].ar : t[key].en;

// ============================================
// Status configs — real API statuses
// ============================================

const getDriverStatusConfig = (isAr: boolean) => ({
  available: {
    label: isAr ? "متاح" : "Available",
    className: "text-success-600 dark:text-success-400",
    dot: "bg-success-500",
  },
  on_trip: {
    label: isAr ? "في رحلة" : "On Trip",
    className: "text-primary-600 dark:text-primary-400",
    dot: "bg-primary-500",
  },
  off_duty: {
    label: isAr ? "خارج الخدمة" : "Off Duty",
    className: "text-surface-500 dark:text-surface-400",
    dot: "bg-surface-400",
  },
});

/**
 * Real SupervisorOrderStatus values from the API
 * (SUPERVISOR_ORDER_STATUS in @shared/types)
 */
const getOrderStatusConfig = (isAr: boolean) => {
  const map: Record<
    string,
    { label: string; className: string; color: string }
  > = {
    Assigned: {
      label: isAr ? "مسند" : "Assigned",
      className: "badge-info",
      color: "bg-blue-500",
    },
    Accepted: {
      label: isAr ? "مقبول" : "Accepted",
      className: "badge-info",
      color: "bg-blue-500",
    },
    ArrivedAtStore: {
      label: isAr ? "وصل للمتجر" : "Arrived at Store",
      className: "badge-warning",
      color: "bg-amber-500",
    },
    ReadyForPickup: {
      label: isAr ? "جاهز للاستلام" : "Ready for Pickup",
      className: "badge-warning",
      color: "bg-amber-500",
    },
    PickedUp: {
      label: isAr ? "تم الاستلام" : "Picked Up",
      className: "badge-primary",
      color: "bg-primary-500",
    },
    InTransit: {
      label: isAr ? "في الطريق" : "In Transit",
      className: "badge-primary",
      color: "bg-primary-500",
    },
    Delivered: {
      label: isAr ? "تم التوصيل" : "Delivered",
      className: "badge-success",
      color: "bg-success-500",
    },
    Cancelled: {
      label: isAr ? "ملغي" : "Cancelled",
      className: "badge-error",
      color: "bg-error-500",
    },
    Failed: {
      label: isAr ? "فشل" : "Failed",
      className: "badge-error",
      color: "bg-error-500",
    },
  };
  return map;
};

// ============================================
// Stat Card
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
  const tr = (key: keyof typeof t) => lang(key, isAr);

  // ── Filters state ──
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [appliedFilters, setAppliedFilters] = useState<{
    status?: string;
    from?: string;
    to?: string;
  }>({});

  const {
    dashboard,
    areas,
    driverPerformance,
    orderSummaries,
    unassignedOrderCount,
    orderStatusBreakdown,
    totalOrderValue,
    averageOrderValue,
    isLoading,
    isError,
    error,
    refetch,
  } = useReports(appliedFilters);

  const driverStatusConfig = getDriverStatusConfig(isAr);
  const orderStatusConfig = getOrderStatusConfig(isAr);

  // Order status filter options — real API values
  const statusOptions = [
    { value: "", label: tr("allStatuses") },
    { value: "Assigned", label: orderStatusConfig.Assigned.label },
    { value: "Accepted", label: orderStatusConfig.Accepted.label },
    {
      value: "ArrivedAtStore",
      label: orderStatusConfig.ArrivedAtStore.label,
    },
    {
      value: "ReadyForPickup",
      label: orderStatusConfig.ReadyForPickup.label,
    },
    { value: "PickedUp", label: orderStatusConfig.PickedUp.label },
    { value: "InTransit", label: orderStatusConfig.InTransit.label },
    { value: "Delivered", label: orderStatusConfig.Delivered.label },
    { value: "Cancelled", label: orderStatusConfig.Cancelled.label },
    { value: "Failed", label: orderStatusConfig.Failed.label },
  ];

  // Apply current filter inputs → triggers query re-fetch
  const applyFilters = () => {
    setAppliedFilters({
      status: statusFilter || undefined,
      from: fromDate ? `${fromDate}T00:00:00Z` : undefined,
      to: toDate ? `${toDate}T23:59:59Z` : undefined,
    });
  };

  const clearFilters = () => {
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    setAppliedFilters({});
  };

  const hasActiveFilters =
    !!appliedFilters.status || !!appliedFilters.from || !!appliedFilters.to;

  // Total order count in the breakdown (for bar widths)
  const totalForBars = useMemo(
    () =>
      Object.values(orderStatusBreakdown).reduce((sum, n) => sum + n, 0) || 1,
    [orderStatusBreakdown],
  );

  // ============================================
  // Loading state
  // ============================================

  if (isLoading && !dashboard) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-32 rounded-lg mb-2" />
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

  // ============================================
  // Error state
  // ============================================

  if (isError && !dashboard) {
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
          {tr("error")}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
          {error?.message}
        </p>
        <button onClick={() => refetch()} className="btn btn-primary btn-sm">
          {tr("retry")}
        </button>
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={cn(isAr ? "text-right" : "text-left")}>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {tr("title")}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {tr("subtitle")}
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
          {tr("refresh")}
        </button>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={tr("totalDrivers")}
          value={String(dashboard?.totalDrivers ?? 0)}
          color="bg-primary-500"
          isLoading={isLoading}
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
        />
        <StatCard
          title={tr("onlineDrivers")}
          value={String(dashboard?.onlineDrivers ?? 0)}
          color="bg-success-500"
          isLoading={isLoading}
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
        />
        <StatCard
          title={tr("pendingOrders")}
          value={String(dashboard?.pendingOrders ?? 0)}
          color="bg-warning-500"
          isLoading={isLoading}
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
        />
        <StatCard
          title={tr("activeDeliveries")}
          value={String(dashboard?.activeDeliveries ?? 0)}
          color="bg-blue-500"
          isLoading={isLoading}
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
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={tr("completedToday")}
          value={String(dashboard?.completedToday ?? 0)}
          color="bg-emerald-500"
          isLoading={isLoading}
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
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          }
        />
        <StatCard
          title={tr("unassignedOrders")}
          value={String(unassignedOrderCount)}
          color="bg-orange-500"
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
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          }
        />
        <StatCard
          title={tr("totalOrderValue")}
          value={formatCurrency(totalOrderValue)}
          color="bg-indigo-500"
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
                d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          }
        />
        <StatCard
          title={tr("averageOrderValue")}
          value={formatCurrency(averageOrderValue)}
          color="bg-purple-500"
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
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
          }
        />
      </div>

      {/* Filters bar */}
      <div className="glass p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Status */}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400">
              {tr("statusFilter")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg py-2 px-3 bg-surface-100 dark:bg-surface-800 text-sm text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* From date */}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400">
              {tr("fromDate")}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg py-2 px-3 bg-surface-100 dark:bg-surface-800 text-sm text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* To date */}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400">
              {tr("toDate")}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg py-2 px-3 bg-surface-100 dark:bg-surface-800 text-sm text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="btn btn-primary btn-sm whitespace-nowrap"
            >
              {tr("applyFilters")}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-sm whitespace-nowrap"
              >
                {tr("clearFilters")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics: Order Status Distribution + Area Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="glass overflow-hidden">
          <div className="p-5 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/50 to-transparent dark:from-surface-800/30">
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
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
              {tr("orderStatusDistribution")}
            </h3>
          </div>

          {Object.keys(orderStatusBreakdown).length === 0 ? (
            <div className="py-12 text-center text-sm text-surface-500 dark:text-surface-400">
              {tr("noData")}
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {Object.entries(orderStatusBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => {
                  const cfg = orderStatusConfig[status] ?? {
                    label: status,
                    color: "bg-surface-500",
                  };
                  const pct = Math.round((count / totalForBars) * 100);
                  return (
                    <div key={status}>
                      <div className="flex justify-between items-center mb-1.5 text-sm">
                        <span className="font-medium text-surface-700 dark:text-surface-300">
                          {cfg.label}
                        </span>
                        <span className="text-xs text-surface-500 dark:text-surface-400 tabular-nums">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            cfg.color,
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Area Breakdown */}
        <div className="glass overflow-hidden">
          <div className="p-5 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/50 to-transparent dark:from-surface-800/30">
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
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              {tr("areaBreakdown")}
            </h3>
          </div>

          {areas.length === 0 ? (
            <div className="py-12 text-center text-sm text-surface-500 dark:text-surface-400">
              {tr("noData")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50/80 dark:bg-surface-800/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      {tr("area")}
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      {tr("drivers")}
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      {tr("pending")}
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      {tr("active")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                  {areas.map((area) => (
                    <tr
                      key={area.areaId}
                      className="hover:bg-surface-50/50 dark:hover:bg-surface-800/20"
                    >
                      <td className="py-3 px-4 font-medium text-surface-900 dark:text-surface-100">
                        {area.areaName ?? "—"}
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        {area.driverCount}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-warning-600 dark:text-warning-400 font-semibold">
                        {area.pendingOrders}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-primary-600 dark:text-primary-400 font-semibold">
                        {area.activeOrders}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Driver Performance + Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Performance */}
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
                {tr("driverPerformance")}
              </h3>
              <span className="text-xs text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
                {driverPerformance.length}{" "}
                {isAr
                  ? driverPerformance.length === 1
                    ? t.driverCount.ar
                    : t.driverCountPlural.ar
                  : driverPerformance.length === 1
                    ? t.driverCount.en
                    : t.driverCountPlural.en}
              </span>
            </div>
          </div>
          {driverPerformance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
                {tr("noDrivers")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50/80 dark:bg-surface-800/30">
                    {[
                      tr("driver"),
                      tr("status"),
                      tr("completedTotal"),
                      tr("driversToday"),
                      tr("rating"),
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="py-3.5 px-4 text-start text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                  {driverPerformance.slice(0, 10).map((d) => {
                    const cfg =
                      driverStatusConfig[
                        d.status as keyof typeof driverStatusConfig
                      ] ?? driverStatusConfig.off_duty;
                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-surface-50/50 dark:hover:bg-surface-800/20"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300 flex-shrink-0">
                              {d.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                                {d.fullName}
                              </p>
                              <p className="text-xs text-surface-500 dark:text-surface-400" dir="ltr">
                                {d.phoneNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full">
                            <span
                              className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)}
                            />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 tabular-nums font-semibold text-surface-900 dark:text-surface-100">
                          {d.totalDeliveries}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums text-success-600 dark:text-success-400 font-semibold">
                          {d.todayDeliveries}
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
                              {d.rating > 0 ? d.rating.toFixed(1) : "—"}
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

        {/* Order Summary */}
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
                {tr("orderSummary")}
              </h3>
              <span className="text-xs text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
                {orderSummaries.length}{" "}
                {isAr
                  ? orderSummaries.length === 1
                    ? t.orderCount.ar
                    : t.orderCountPlural.ar
                  : orderSummaries.length === 1
                    ? t.orderCount.en
                    : t.orderCountPlural.en}
              </span>
            </div>
          </div>
          {orderSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
                {tr("noOrders")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50/80 dark:bg-surface-800/30">
                    {[
                      tr("orderNumber"),
                      tr("customer"),
                      tr("driverAssigned"),
                      tr("status"),
                      tr("amount"),
                      tr("time"),
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="py-3.5 px-4 text-start text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                  {orderSummaries.slice(0, 15).map((o) => {
                    const cfg =
                      orderStatusConfig[o.status] ??
                      orderStatusConfig.Assigned;
                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-surface-50/50 dark:hover:bg-surface-800/20"
                      >
                        <td className="py-3.5 px-4 font-mono text-xs text-surface-700 dark:text-surface-300">
                          {o.orderNumber.startsWith("#")
                            ? o.orderNumber
                            : `#${o.orderNumber}`}
                        </td>
                        <td className="py-3.5 px-4 text-surface-900 dark:text-surface-100 truncate max-w-[120px]">
                          {o.customerName || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-surface-600 dark:text-surface-400 truncate max-w-[120px]">
                          {o.driverName || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={cn("badge", cfg.className)}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold tabular-nums">
                          {formatCurrency(o.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-surface-400 whitespace-nowrap">
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