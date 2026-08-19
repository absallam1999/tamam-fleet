import { useState } from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useDriverRequests } from "@shared/hooks/useFleetRequests";
import { getRelativeTime } from "@shared/utils/formatters";
import { cn } from "@shared/utils/cn";

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "طلبات السائقين", en: "Driver Requests" },
  subtitle: {
    ar: "مراجعة وقبول طلبات انضمام السائقين الجدد",
    en: "Review and approve new driver registration requests",
  },

  // Table
  driver: { ar: "السائق", en: "Driver" },
  phone: { ar: "الهاتف", en: "Phone" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  vehicleType: { ar: "نوع المركبة", en: "Vehicle Type" },
  vehiclePlate: { ar: "رقم اللوحة", en: "Plate" },
  status: { ar: "الحالة", en: "Status" },
  date: { ar: "تاريخ الطلب", en: "Request Date" },
  actions: { ar: "إجراءات", en: "Actions" },
  viewDetails: { ar: "عرض التفاصيل", en: "View Details" },

  // Statuses
  pending: { ar: "قيد الانتظار", en: "Pending" },
  approved: { ar: "مقبول", en: "Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },

  // Actions
  approve: { ar: "قبول", en: "Approve" },
  reject: { ar: "رفض", en: "Reject" },

  // Reject modal
  rejectTitle: { ar: "رفض طلب السائق", en: "Reject Driver Request" },
  rejectReason: {
    ar: "سبب الرفض (اختياري)",
    en: "Rejection Reason (optional)",
  },
  reasonPlaceholder: {
    ar: "أدخل سبب الرفض...",
    en: "Enter rejection reason...",
  },
  confirmReject: { ar: "تأكيد الرفض", en: "Confirm Reject" },
  rejecting: { ar: "جاري الرفض...", en: "Rejecting..." },
  cancel: { ar: "إلغاء", en: "Cancel" },
  dismiss: { ar: "إغلاق", en: "Dismiss" },
  approveConfirm: {
    ar: "هل أنت متأكد من قبول هذا السائق؟",
    en: "Are you sure you want to approve this driver?",
  },

  // Empty
  noRequests: { ar: "لا توجد طلبات", en: "No requests" },
  noPendingDesc: {
    ar: "جميع طلبات السائقين تمت معالجتها",
    en: "All driver requests have been processed",
  },
  noRequestsDesc: {
    ar: "لا توجد طلبات انضمام حالياً",
    en: "No registration requests at the moment",
  },
  allRequests: { ar: "جميع الطلبات", en: "All Requests" },
  pendingTab: { ar: "المعلقة", en: "Pending" },

  // Stats
  pendingCount: { ar: "معلق", en: "pending" },
  totalCount: { ar: "الإجمالي", en: "total" },
  refresh: { ar: "تحديث", en: "Refresh" },
  error: { ar: "فشل تحميل البيانات", en: "Failed to load data" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  approvedCount: { ar: "مقبول", en: "approved" },
  rejectedCount: { ar: "مرفوض", en: "rejected" },
};

// ============================================
// Status Config
// ============================================

const getRequestStatusConfig = (isAr: boolean) => ({
  pending: {
    label: isAr ? t.pending.ar : t.pending.en,
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
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
  approved: {
    label: isAr ? t.approved.ar : t.approved.en,
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
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
          d="m4.5 12.75 6 6 9-13.5"
        />
      </svg>
    ),
  },
  rejected: {
    label: isAr ? t.rejected.ar : t.rejected.en,
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
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
          d="M6 18 18 6M6 6l12 12"
        />
      </svg>
    ),
  },
});

// ============================================
// Reject Modal
// ============================================

interface RejectModalProps {
  request: { id: string; fullName: string };
  reason: string;
  isSubmitting: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}

const RejectModal: React.FC<RejectModalProps> = ({
  request,
  reason,
  isSubmitting,
  onReasonChange,
  onConfirm,
  onCancel,
  isAr,
  lang,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
    <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-scale bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl">
      <div className="px-6 py-5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-white">
            {lang(t.rejectTitle)}
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {request.fullName}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          aria-label={lang(t.dismiss)}
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
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="p-4 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p className="text-sm text-error-700 dark:text-error-400">
            {isAr
              ? "سيتم رفض هذا الطلب ولن يتمكن السائق من الانضمام."
              : "This request will be rejected and the driver won't be able to join."}
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
            {lang(t.rejectReason)}
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 border-2 border-transparent focus:outline-none focus:border-error-500/50 transition-all text-sm resize-none"
            placeholder={lang(t.reasonPlaceholder)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              "bg-error-600 text-white hover:bg-error-700 active:scale-[0.98]",
              "shadow-sm hover:shadow-md",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
            )}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {lang(t.rejecting)}
              </>
            ) : (
              lang(t.confirmReject)
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200"
          >
            {lang(t.cancel)}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// RequestsPage — Main Component
// ============================================

export const RequestsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const {
    requests,
    pendingRequests,
    isLoading,
    isError,
    error,
    refetch,
    approveRequest,
    rejectRequest,
    rejectTarget,
    rejectReason,
    setRejectReason,
    handleApprove,
    handleOpenReject,
    handleCloseReject,
    handleConfirmReject,
  } = useDriverRequests();

  const [showAll, setShowAll] = useState(false);
  const statusConfig = getRequestStatusConfig(isAr);
  const displayedRequests = showAll ? requests : pendingRequests;

  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="btn btn-ghost btn-sm"
          >
            {showAll ? lang(t.pendingTab) : lang(t.allRequests)}
          </button>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-warning-600 dark:text-warning-400"
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
                {pendingRequests.length}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.pendingTab)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
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
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {approvedCount}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.approvedCount)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-100 dark:bg-error-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-error-600 dark:text-error-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {rejectedCount}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.rejectedCount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800/50 flex items-center gap-3"
        >
          <svg
            className="w-5 h-5 text-error-500 flex-shrink-0"
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
          <p className="text-sm text-error-700 dark:text-error-400 flex-1">
            {error?.message}
          </p>
          <button
            onClick={() => refetch()}
            className="text-sm font-medium text-error-600 dark:text-error-400 hover:underline"
          >
            {lang(t.retry)}
          </button>
        </div>
      )}

      {/* Requests List - Card Layout */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="skeleton h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-5 w-40 rounded-lg" />
                  <div className="skeleton h-4 w-60 rounded-lg" />
                </div>
                <div className="skeleton h-9 w-20 rounded-xl" />
              </div>
            </div>
          ))
        ) : displayedRequests.length === 0 ? (
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
              {lang(t.noRequests)}
            </p>
            <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm">
              {showAll ? lang(t.noRequestsDesc) : lang(t.noPendingDesc)}
            </p>
          </div>
        ) : (
          displayedRequests.map((req) => {
            const sConfig =
              statusConfig[req.status as keyof typeof statusConfig] ||
              statusConfig.pending;
            return (
              <div
                key={req.id}
                className={cn(
                  "bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 sm:p-6 transition-all duration-200",
                  "hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md",
                  req.status !== "pending" && "opacity-75",
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Driver Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        req.status === "pending"
                          ? "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"
                          : req.status === "approved"
                            ? "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400"
                            : "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400",
                      )}
                    >
                      <span className="text-lg font-bold">
                        {req.fullName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 truncate">
                        {req.fullName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span
                          className="text-xs text-surface-500 dark:text-surface-400"
                          dir="ltr"
                        >
                          {req.phoneNumber}
                        </span>
                        {req.email && (
                          <>
                            <span className="hidden sm:inline text-surface-300 dark:text-surface-600">
                              •
                            </span>
                            <span className="text-xs text-surface-500 dark:text-surface-400 truncate">
                              {req.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400 flex-shrink-0">
                    {req.vehicleType && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800">
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
                        {req.vehicleType}
                      </span>
                    )}
                    {req.vehiclePlateNumber && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 font-mono"
                        dir="ltr"
                      >
                        {req.vehiclePlateNumber}
                      </span>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
                        sConfig.className,
                      )}
                    >
                      <span
                        className={cn("w-1.5 h-1.5 rounded-full", sConfig.dot)}
                      />
                      {sConfig.label}
                    </span>
                    <span className="text-xs text-surface-400 dark:text-surface-500">
                      {getRelativeTime(req.createdAt)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={approveRequest.isPending}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                          "bg-success-600 text-white hover:bg-success-700 active:scale-[0.98]",
                          "shadow-sm hover:shadow-md",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "flex items-center gap-1.5",
                        )}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                        {lang(t.approve)}
                      </button>
                      <button
                        onClick={() => handleOpenReject(req)}
                        disabled={rejectRequest.isPending}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                          "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700",
                          "active:scale-[0.98]",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "flex items-center gap-1.5",
                        )}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                        {lang(t.reject)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          reason={rejectReason}
          isSubmitting={rejectRequest.isPending}
          onReasonChange={setRejectReason}
          onConfirm={handleConfirmReject}
          onCancel={handleCloseReject}
          isAr={isAr}
          lang={lang}
        />
      )}
    </div>
  );
};

export default RequestsPage;
