import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { PageLoader } from "@shared/components/PageLoader";
import { cn } from "@shared/utils/cn";
import { getRelativeTime } from "@shared/utils/formatters";
import {
  useDriverDetail,
  useToggleDriverAvailability,
} from "@shared/hooks/useFleetDrivers";

// ============================================
// Translations
// ============================================
const t = {
  back: { ar: "العودة للسائقين", en: "Back to Drivers" },
  editDriver: { ar: "تعديل السائق", en: "Edit Driver" },

  // Tabs
  tabOverview: { ar: "نظرة عامة", en: "Overview" },
  tabDocuments: { ar: "المستندات", en: "Documents" },

  // Overview
  driverInfo: { ar: "معلومات السائق", en: "Driver Information" },
  vehicleInfo: { ar: "معلومات المركبة", en: "Vehicle Information" },
  contactInfo: { ar: "معلومات الاتصال", en: "Contact Information" },
  stats: { ar: "إحصائيات", en: "Statistics" },

  // Fields
  fullName: { ar: "الاسم الكامل", en: "Full Name" },
  phone: { ar: "رقم الهاتف", en: "Phone Number" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  status: { ar: "الحالة", en: "Status" },
  joinedDate: { ar: "تاريخ الانضمام", en: "Joined Date" },
  lastActive: { ar: "آخر نشاط", en: "Last Active" },
  vehicleType: { ar: "نوع المركبة", en: "Vehicle Type" },
  vehiclePlate: { ar: "رقم اللوحة", en: "Plate Number" },
  rating: { ar: "التقييم", en: "Rating" },
  totalTrips: { ar: "إجمالي الرحلات", en: "Total Trips" },
  completedTrips: { ar: "الرحلات المكتملة", en: "Completed Trips" },
  cancelledTrips: { ar: "الرحلات الملغية", en: "Cancelled Trips" },
  onTimePercentage: { ar: "نسبة الالتزام", en: "On-Time Rate" },

  // Statuses
  available: { ar: "متاح", en: "Available" },
  on_trip: { ar: "في رحلة", en: "On Trip" },
  off_duty: { ar: "خارج الخدمة", en: "Off Duty" },
  on_leave: { ar: "في إجازة", en: "On Leave" },
  suspended: { ar: "موقوف", en: "Suspended" },

  // Documents
  documentsTitle: { ar: "المستندات", en: "Documents" },
  noDocuments: { ar: "لا توجد مستندات", en: "No documents uploaded yet" },
  noDocumentsDesc: {
    ar: "المستندات المرفوعة ستظهر هنا",
    en: "Uploaded documents will appear here",
  },
  uploadDocument: { ar: "رفع مستند", en: "Upload Document" },

  // Actions
  toggleAvailability: { ar: "تبديل الحالة", en: "Toggle Status" },

  // Loading
  loading: { ar: "جاري تحميل بيانات السائق...", en: "Loading driver data..." },
  error: { ar: "فشل تحميل البيانات", en: "Failed to load data" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  driverNotFound: { ar: "السائق غير موجود", en: "Driver not found" },
  viewDetails: { ar: "عرض التفاصيل", en: "View Details" },
  notAvailable: { ar: "غير متوفر", en: "N/A" },
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
// Info Row Component
// ============================================
interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  dir?: "ltr" | "rtl";
  isAr: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, dir, isAr }) => (
  <div
    className={cn(
      "flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors",
      isAr ? "flex-row-reverse" : "flex-row",
    )}
  >
    <span className="text-xs text-surface-500 dark:text-surface-400">
      {label}
    </span>
    <span
      className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate max-w-[60%]"
      dir={dir}
    >
      {value || "-"}
    </span>
  </div>
);

// ============================================
// DriverDetailsPage — Main Component
// ============================================
export const DriverDetailsPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [activeTab, setActiveTab] = useState<"overview" | "documents">(
    "overview",
  );
  const {
    data: driver,
    isLoading,
    isError,
    error,
    refetch,
  } = useDriverDetail(driverId);
  const toggleDriverAvailability = useToggleDriverAvailability();

  const handleToggleAvailability = useCallback(() => {
    if (driverId) {
      toggleDriverAvailability.mutate(driverId, {
        onSuccess: () => refetch(),
      });
    }
  }, [driverId, toggleDriverAvailability, refetch]);

  // Loading State
  if (isLoading) return <PageLoader message={lang(t.loading)} />;

  // Error State
  if (isError || !driver) {
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
          {isError ? lang(t.error) : lang(t.driverNotFound)}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
          {error?.message}
        </p>
        <div className="flex gap-3">
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">
            {lang(t.retry)}
          </button>
          <Link to="/dashboard/drivers" className="btn btn-ghost btn-sm">
            {lang(t.back)}
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(isAr);
  const config =
    statusConfig[driver.status as keyof typeof statusConfig] ||
    statusConfig.off_duty;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Card */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Back + Driver Profile */}
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/dashboard/drivers"
              className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    isAr
                      ? "M8.25 4.5l7.5 7.5-7.5 7.5"
                      : "M15.75 19.5 8.25 12l7.5-7.5"
                  }
                />
              </svg>
            </Link>

            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0",
                driver.status === "available"
                  ? "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400"
                  : driver.status === "on_trip"
                    ? "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : driver.status === "suspended"
                      ? "bg-error-100 dark:bg-error-500/10 text-error-600 dark:text-error-400"
                      : "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400",
              )}
            >
              <span className="text-2xl font-bold">
                {driver.fullName.charAt(0)}
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 truncate">
                {driver.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    config.className,
                  )}
                >
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full", config.dot)}
                  />
                  {config.label}
                </span>
                {driver.rating && (
                  <span className="inline-flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                    <svg
                      className="w-3.5 h-3.5 text-warning-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {driver.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggleAvailability}
              disabled={toggleDriverAvailability.isPending}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700",
                "active:scale-[0.98] disabled:opacity-50",
                "flex items-center gap-1.5",
              )}
            >
              <svg
                className={cn(
                  "w-4 h-4",
                  toggleDriverAvailability.isPending && "animate-spin",
                )}
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
              {lang(t.toggleAvailability)}
            </button>
            <Link
              to={`/dashboard/drivers/${driver.id}/edit`}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
                "dark:bg-primary-500 dark:hover:bg-primary-600",
                "shadow-sm hover:shadow-md",
                "flex items-center gap-1.5",
              )}
            >
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
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
              {lang(t.editDriver)}
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-all",
            activeTab === "overview"
              ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
              : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
          )}
        >
          {lang(t.tabOverview)}
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-all",
            activeTab === "documents"
              ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
              : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
          )}
        >
          {lang(t.tabDocuments)}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-500/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-warning-600 dark:text-warning-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {driver.rating?.toFixed(1) || "-"}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.rating)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm hover:shadow-md transition-shadow">
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
                      d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {driver.totalTrips || 0}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.totalTrips)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-500/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-success-600 dark:text-success-400"
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
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {driver.completedTrips || 0}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.completedTrips)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info-100 dark:bg-info-500/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-info-600 dark:text-info-400"
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
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {driver.onTimePercentage || 0}%
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.onTimePercentage)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Driver Information */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-surface-100 dark:border-surface-800">
                <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
                  <svg
                    className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400"
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
                <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                  {lang(t.driverInfo)}
                </h3>
              </div>
              <div className="space-y-1">
                <InfoRow
                  label={lang(t.fullName)}
                  value={driver.fullName}
                  isAr={isAr}
                />
                <InfoRow
                  label={lang(t.joinedDate)}
                  value={
                    driver.joinedDate
                      ? new Date(driver.joinedDate).toLocaleDateString(
                          isAr ? "ar-EG" : "en-US",
                          { year: "numeric", month: "short", day: "numeric" },
                        )
                      : null
                  }
                  isAr={isAr}
                />
                <InfoRow
                  label={lang(t.lastActive)}
                  value={
                    driver.lastActiveDate
                      ? getRelativeTime(driver.lastActiveDate)
                      : null
                  }
                  isAr={isAr}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-surface-100 dark:border-surface-800">
                <div className="w-9 h-9 rounded-xl bg-success-100 dark:bg-success-500/10 flex items-center justify-center">
                  <svg
                    className="w-4.5 h-4.5 text-success-600 dark:text-success-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                  {lang(t.contactInfo)}
                </h3>
              </div>
              <div className="space-y-1">
                <InfoRow
                  label={lang(t.phone)}
                  value={driver.phoneNumber}
                  dir="ltr"
                  isAr={isAr}
                />
                <InfoRow
                  label={lang(t.email)}
                  value={driver.email}
                  dir="ltr"
                  isAr={isAr}
                />
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-surface-100 dark:border-surface-800">
                <div className="w-9 h-9 rounded-xl bg-warning-100 dark:bg-warning-500/10 flex items-center justify-center">
                  <svg
                    className="w-4.5 h-4.5 text-warning-600 dark:text-warning-400"
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
                </div>
                <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                  {lang(t.vehicleInfo)}
                </h3>
              </div>
              <div className="space-y-1">
                <InfoRow
                  label={lang(t.vehicleType)}
                  value={driver.vehicleType}
                  isAr={isAr}
                />
                <InfoRow
                  label={lang(t.vehiclePlate)}
                  value={driver.vehiclePlateNumber}
                  dir="ltr"
                  isAr={isAr}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 text-center">
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
              {lang(t.noDocuments)}
            </h3>
            <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm">
              {lang(t.noDocumentsDesc)}
            </p>
            <button className="btn btn-primary btn-sm mt-5">
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
              {lang(t.uploadDocument)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDetailsPage;
