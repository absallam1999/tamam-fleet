import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { cn } from "@shared/utils/cn";
import { useDriversPage } from "@shared/hooks/useFleetDrivers";

// ============================================
// Translations
// ============================================
const t = {
  title: { ar: "السائقين", en: "Drivers" },
  subtitle: {
    ar: "إدارة جميع السائقين في الأسطول",
    en: "Manage all fleet drivers",
  },
  addDriver: { ar: "إضافة سائق", en: "Add Driver" },
  searchPlaceholder: { ar: "بحث عن سائق...", en: "Search drivers..." },
  allStatuses: { ar: "جميع الحالات", en: "All Statuses" },

  // Table
  driver: { ar: "السائق", en: "Driver" },
  phone: { ar: "الهاتف", en: "Phone" },
  vehicleType: { ar: "نوع المركبة", en: "Vehicle Type" },
  vehiclePlate: { ar: "لوحة المركبة", en: "Plate" },
  status: { ar: "الحالة", en: "Status" },
  rating: { ar: "التقييم", en: "Rating" },
  trips: { ar: "الرحلات", en: "Trips" },
  actions: { ar: "إجراءات", en: "Actions" },

  // Statuses
  available: { ar: "متاح", en: "Available" },
  on_trip: { ar: "في رحلة", en: "On Trip" },
  off_duty: { ar: "خارج الخدمة", en: "Off Duty" },
  on_leave: { ar: "في إجازة", en: "On Leave" },
  suspended: { ar: "موقوف", en: "Suspended" },

  // Toggle
  toggleAvailability: { ar: "تبديل الحالة", en: "Toggle Status" },

  // Actions
  edit: { ar: "تعديل", en: "Edit" },
  viewDetails: { ar: "عرض التفاصيل", en: "View Details" },

  // Empty
  noDrivers: { ar: "لا يوجد سائقين", en: "No drivers found" },
  noDriversDesc: {
    ar: "ابدأ بإضافة أول سائق إلى الأسطول",
    en: "Start by adding your first driver",
  },

  // Pagination
  showing: { ar: "عرض", en: "Showing" },
  of: { ar: "من", en: "of" },
  results: { ar: "نتيجة", en: "results" },
  previous: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },

  // Loading
  loading: { ar: "جاري تحميل السائقين...", en: "Loading drivers..." },
  error: { ar: "فشل تحميل البيانات", en: "Failed to load data" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  refresh: { ar: "تحديث", en: "Refresh" },

  // Stats
  availableCount: { ar: "متاح", en: "Available" },
  onTripCount: { ar: "في رحلة", en: "On Trip" },
  offDutyCount: { ar: "خارج الخدمة", en: "Off Duty" },
  totalDrivers: { ar: "إجمالي السائقين", en: "Total Drivers" },
};

// ============================================
// Status Config
// ============================================
const getStatusConfig = (isAr: boolean) => ({
  available: {
    label: isAr ? t.available.ar : t.available.en,
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
  },
  on_trip: {
    label: isAr ? t.on_trip.ar : t.on_trip.en,
    className:
      "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
    dot: "bg-primary-500",
  },
  off_duty: {
    label: isAr ? t.off_duty.ar : t.off_duty.en,
    className:
      "bg-surface-100 text-surface-600 border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700",
    dot: "bg-surface-400",
  },
  on_leave: {
    label: isAr ? t.on_leave.ar : t.on_leave.en,
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
  },
  suspended: {
    label: isAr ? t.suspended.ar : t.suspended.en,
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
  },
});

// ============================================
// DriversPage — Main Component
// ============================================
export const DriversPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const {
    drivers,
    allFilteredDrivers,
    totalCount,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,
    filters,
    search,
    handleSearch,
    handlePageChange,
    handleStatusFilter,
    handleOpenCreate,
    handleOpenEdit,
    handleToggleAvailability,
  } = useDriversPage();

  const statusConfig = getStatusConfig(isAr);
  const statusOptions = [
    { value: "", label: lang(t.allStatuses) },
    { value: "available", label: isAr ? t.available.ar : t.available.en },
    { value: "on_trip", label: isAr ? t.on_trip.ar : t.on_trip.en },
    { value: "off_duty", label: isAr ? t.off_duty.ar : t.off_duty.en },
    { value: "on_leave", label: isAr ? t.on_leave.ar : t.on_leave.en },
    { value: "suspended", label: isAr ? t.suspended.ar : t.suspended.en },
  ];

  // Stats computed from the full filtered list
  const availableCount = allFilteredDrivers.filter(
    (d) => d.status === "available",
  ).length;
  const onTripCount = allFilteredDrivers.filter(
    (d) => d.status === "on_trip",
  ).length;
  const offDutyCount = totalCount - availableCount - onTripCount;

  if (isLoading && drivers.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="skeleton h-8 w-40 mb-2 rounded-lg" />
            <div className="skeleton h-4 w-64 rounded-lg" />
          </div>
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="skeleton h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-32 rounded-lg" />
                  <div className="skeleton h-4 w-48 rounded-lg" />
                </div>
                <div className="skeleton h-8 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError && drivers.length === 0) {
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
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {lang(t.addDriver)}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600 dark:text-primary-400"
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
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {totalCount}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.totalDrivers)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-500/10 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {availableCount}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.availableCount)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {onTripCount}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.onTripCount)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-surface-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {offDutyCount}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.offDutyCount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400",
              isAr ? "right-3" : "left-3",
            )}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={lang(t.searchPlaceholder)}
            className={cn(
              "w-full rounded-xl py-2.5 bg-surface-100 dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 border-2 border-transparent focus:outline-none focus:border-primary-500/50 transition-all",
              isAr ? "pr-10 pl-4" : "pl-10 pr-4",
            )}
          />
        </div>
        <select
          value={filters.status || ""}
          onChange={(e) => handleStatusFilter(e.target.value || undefined)}
          className="rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-sm text-surface-700 dark:text-surface-300 border-2 border-transparent focus:outline-none focus:border-primary-500/50 cursor-pointer"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="btn btn-ghost btn-sm"
          title={lang(t.refresh)}
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
        </button>
      </div>

      {/* Drivers List - Card Layout */}
      <div className="space-y-3">
        {drivers.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
            <div className="w-20 h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
              <svg
                className="w-10 h-10 text-surface-300 dark:text-surface-600"
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
            </div>
            <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
              {lang(t.noDrivers)}
            </p>
            <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm">
              {lang(t.noDriversDesc)}
            </p>
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary btn-sm mt-4"
            >
              {lang(t.addDriver)}
            </button>
          </div>
        ) : (
          drivers.map((driver) => {
            const config =
              statusConfig[driver.status as keyof typeof statusConfig] ||
              statusConfig.off_duty;
            return (
              <div
                key={driver.id}
                onClick={() => navigate(`/dashboard/drivers/${driver.id}`)}
                className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 transition-all duration-200 hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        driver.status === "available"
                          ? "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400"
                          : driver.status === "on_trip"
                            ? "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"
                            : "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400",
                      )}
                    >
                      <span className="text-lg font-bold">
                        {driver.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 truncate">
                        {driver.fullName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span
                          className="text-xs text-surface-500 dark:text-surface-400"
                          dir="ltr"
                        >
                          {driver.phoneNumber}
                        </span>
                        {driver.email && (
                          <>
                            <span className="text-surface-300 dark:text-surface-600">
                              •
                            </span>
                            <span className="text-xs text-surface-500 dark:text-surface-400 truncate">
                              {driver.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {driver.vehicleType && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs text-surface-600 dark:text-surface-400">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                          />
                        </svg>
                        {driver.vehicleType}
                      </span>
                    )}
                    {driver.vehiclePlateNumber && (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs text-surface-600 dark:text-surface-400 font-mono"
                        dir="ltr"
                      >
                        {driver.vehiclePlateNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
                        config.className,
                      )}
                    >
                      <span
                        className={cn("w-1.5 h-1.5 rounded-full", config.dot)}
                      />
                      {config.label}
                    </span>
                    <div className="flex items-center gap-1 text-sm">
                      <svg
                        className="w-4 h-4 text-warning-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="font-medium text-surface-700 dark:text-surface-300">
                        {driver.rating?.toFixed(1) || "-"}
                      </span>
                    </div>
                    <span className="text-sm text-surface-500 dark:text-surface-400">
                      {driver.totalTrips || 0} {lang(t.trips)}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleToggleAvailability(driver.id)}
                      className="p-2 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-500/10 transition-colors"
                      title={lang(t.toggleAvailability)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(driver)}
                      className="p-2 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-500/10 transition-colors"
                      title={lang(t.edit)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.showing)}{" "}
            {((filters.page || 1) - 1) * (filters.pageSize || 10) + 1}-
            {Math.min(
              (filters.page || 1) * (filters.pageSize || 10),
              totalCount,
            )}{" "}
            {lang(t.of)} {totalCount} {lang(t.results)}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange((filters.page || 1) - 1)}
              disabled={(filters.page || 1) <= 1}
              className="px-3 py-2 rounded-xl text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {lang(t.previous)}
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const startPage = Math.max(
                1,
                Math.min((filters.page || 1) - 2, totalPages - 4),
              );
              const page = startPage + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-xs font-medium transition-colors",
                    page === filters.page
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800",
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange((filters.page || 1) + 1)}
              disabled={(filters.page || 1) >= totalPages}
              className="px-3 py-2 rounded-xl text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {lang(t.next)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
