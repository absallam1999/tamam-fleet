import { useLanguage } from "@/shared/hooks/useLanguage";
import { useFleetOrders } from "@/shared/hooks/useFleetOrders";
import { formatCurrency, getRelativeTime } from "@shared/utils/formatters";
import { cn } from "@shared/utils/cn";
import type { SupervisorOrderDto, DriverDto } from "@shared/types";

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "إدارة الطلبات", en: "Orders Management" },
  subtitle: {
    ar: "تعيين وإدارة طلبات التوصيل",
    en: "Assign and manage delivery orders",
  },

  // Tabs
  tabPending: { ar: "طلبات معلقة", en: "Pending Orders" },
  tabActive: { ar: "طلبات نشطة", en: "Active Orders" },

  // Table
  orderNumber: { ar: "رقم الطلب", en: "Order #" },
  customer: { ar: "العميل", en: "Customer" },
  store: { ar: "المتجر", en: "Store" },
  driver: { ar: "السائق", en: "Driver" },
  amount: { ar: "المبلغ", en: "Amount" },
  status: { ar: "الحالة", en: "Status" },
  time: { ar: "الوقت", en: "Time" },
  actions: { ar: "إجراءات", en: "Actions" },

  // Statuses
  pending: { ar: "قيد الانتظار", en: "Pending" },
  accepted: { ar: "مقبول", en: "Accepted" },
  preparing: { ar: "قيد التحضير", en: "Preparing" },
  ready: { ar: "جاهز", en: "Ready" },
  in_transit: { ar: "في الطريق", en: "In Transit" },
  delivered: { ar: "تم التوصيل", en: "Delivered" },
  cancelled: { ar: "ملغي", en: "Cancelled" },

  // Actions
  assign: { ar: "تعيين", en: "Assign" },
  reassign: { ar: "إعادة تعيين", en: "Reassign" },
  unassign: { ar: "إلغاء التعيين", en: "Unassign" },
  unassignConfirm: {
    ar: "هل أنت متأكد من إلغاء تعيين السائق؟",
    en: "Are you sure you want to unassign this driver?",
  },

  // Assign modal
  assignTitle: { ar: "تعيين طلب لسائق", en: "Assign Order to Driver" },
  selectDriver: { ar: "اختر السائق", en: "Select Driver" },
  notes: { ar: "ملاحظات (اختياري)", en: "Notes (optional)" },
  notesPlaceholder: {
    ar: "أي ملاحظات إضافية...",
    en: "Any additional notes...",
  },
  confirmAssign: { ar: "تأكيد التعيين", en: "Confirm Assign" },
  assigning: { ar: "جاري التعيين...", en: "Assigning..." },
  reassignTitle: { ar: "إعادة تعيين الطلب", en: "Reassign Order" },
  confirmReassign: { ar: "تأكيد إعادة التعيين", en: "Confirm Reassign" },
  reassigning: { ar: "جاري إعادة التعيين...", en: "Reassigning..." },
  cancel: { ar: "إلغاء", en: "Cancel" },
  noDrivers: { ar: "لا يوجد سائقين متاحين", en: "No available drivers" },
  dismiss: { ar: "إغلاق", en: "Dismiss" },

  // Empty
  noPending: { ar: "لا توجد طلبات معلقة", en: "No pending orders" },
  noActive: { ar: "لا توجد طلبات نشطة", en: "No active orders" },
  noPendingDesc: {
    ar: "جميع الطلبات تمت معالجتها",
    en: "All orders have been processed",
  },
  noActiveDesc: {
    ar: "لا توجد طلبات قيد التوصيل حالياً",
    en: "No orders are currently being delivered",
  },

  // Stats
  pendingCount: { ar: "معلق", en: "pending" },
  activeCount: { ar: "نشط", en: "active" },
  refresh: { ar: "تحديث", en: "Refresh" },
  error: { ar: "فشل تحميل البيانات", en: "Failed to load data" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
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

// ============================================
// Assign/Reassign Modal (combined)
// ============================================

interface DriverSelectModalProps {
  order: SupervisorOrderDto;
  drivers: DriverDto[];
  selectedDriverId: string;
  notes: string;
  isSubmitting: boolean;
  isReassign?: boolean;
  onSelectDriver: (id: string) => void;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}

const DriverSelectModal: React.FC<DriverSelectModalProps> = ({
  order,
  drivers,
  selectedDriverId,
  notes,
  isSubmitting,
  isReassign = false,
  onSelectDriver,
  onNotesChange,
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
            {isReassign ? lang(t.reassignTitle) : lang(t.assignTitle)}
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {order.orderNumber}
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
        {/* Order Info */}
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {lang(t.customer)}
            </span>
            <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
              {order.customerName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {lang(t.store)}
            </span>
            <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
              {order.storeName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {lang(t.amount)}
            </span>
            <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
          {isReassign && order.driverName && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.driver)}
              </span>
              <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                {order.driverName}
              </span>
            </div>
          )}
        </div>

        {/* Driver Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
            {lang(t.selectDriver)}
          </label>
          {drivers.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 text-warning-700 dark:text-warning-400 text-sm">
              <svg
                className="w-4 h-4 flex-shrink-0"
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
              {lang(t.noDrivers)}
            </div>
          ) : (
            <select
              value={selectedDriverId}
              onChange={(e) => onSelectDriver(e.target.value)}
              className="w-full rounded-xl py-3 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white border-2 border-transparent focus:outline-none focus:border-primary-500/50 transition-all text-sm cursor-pointer"
            >
              <option value="">{lang(t.selectDriver)}</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} {d.vehicleType ? `(${d.vehicleType})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
            {lang(t.notes)}
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 border-2 border-transparent focus:outline-none focus:border-primary-500/50 transition-all text-sm resize-none"
            placeholder={lang(t.notesPlaceholder)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onConfirm}
            disabled={isSubmitting || !selectedDriverId}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
              "dark:bg-primary-500 dark:hover:bg-primary-600",
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
                {isReassign ? lang(t.reassigning) : lang(t.assigning)}
              </>
            ) : isReassign ? (
              lang(t.confirmReassign)
            ) : (
              lang(t.confirmAssign)
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
// OrdersPage — Main Component
// ============================================

export const OrdersPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const {
    pendingOrders,
    activeOrders,
    availableDrivers,
    pendingLoading,
    activeLoading,
    pendingError,
    activeError,
    pendingErr,
    activeErr,
    refetchPending,
    refetchActive,
    activeTab,
    setActiveTab,
    assignTarget,
    selectedDriverId,
    setSelectedDriverId,
    assignNotes,
    setAssignNotes,
    assignOrder,
    handleOpenAssign,
    handleCloseAssign,
    handleConfirmAssign,
    reassignTarget,
    reassignDriverId,
    setReassignDriverId,
    reassignNotes,
    setReassignNotes,
    reassignOrder,
    handleOpenReassign,
    handleCloseReassign,
    handleConfirmReassign,
    handleUnassign,
  } = useFleetOrders();

  const orderStatusConfig = getOrderStatusConfig(isAr);
  const orders = Array.isArray(
    activeTab === "pending" ? pendingOrders : activeOrders,
  )
    ? activeTab === "pending"
      ? pendingOrders
      : activeOrders
    : [];
  const isLoading = activeTab === "pending" ? pendingLoading : activeLoading;
  const isError = activeTab === "pending" ? pendingError : activeError;
  const error = activeTab === "pending" ? pendingErr : activeErr;
  const refetch = activeTab === "pending" ? refetchPending : refetchActive;

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

      {/* Stats + Tabs Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 border-b border-surface-200 dark:border-surface-800">
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-all",
              activeTab === "pending"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
            )}
          >
            {lang(t.tabPending)} ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-all",
              activeTab === "active"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
            )}
          >
            {lang(t.tabActive)} ({activeOrders.length})
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning-500" />
            {pendingOrders.length} {lang(t.pendingCount)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            {activeOrders.length} {lang(t.activeCount)}
          </span>
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

      {/* Orders List - Card Layout */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="skeleton h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-32 rounded-lg" />
                  <div className="skeleton h-4 w-48 rounded-lg" />
                </div>
                <div className="skeleton h-8 w-20 rounded-full" />
                <div className="flex gap-2">
                  <div className="skeleton h-9 w-20 rounded-xl" />
                  <div className="skeleton h-9 w-20 rounded-xl" />
                </div>
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
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
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
              {activeTab === "pending" ? lang(t.noPending) : lang(t.noActive)}
            </p>
            <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm">
              {activeTab === "pending"
                ? lang(t.noPendingDesc)
                : lang(t.noActiveDesc)}
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const sConfig =
              orderStatusConfig[
                order.status as keyof typeof orderStatusConfig
              ] || orderStatusConfig.pending;
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 transition-all duration-200 hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Left: Order Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
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
                          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-surface-900 dark:text-surface-100">
                          {order.orderNumber}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                            sConfig.className,
                          )}
                        >
                          <span
                            className={cn("w-1 h-1 rounded-full", sConfig.dot)}
                          />
                          {sConfig.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500 dark:text-surface-400">
                        <span>{order.customerName}</span>
                        <span className="text-surface-300 dark:text-surface-600">
                          •
                        </span>
                        <span>{order.storeName}</span>
                        {order.driverName && (
                          <>
                            <span className="text-surface-300 dark:text-surface-600">
                              •
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
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
                              {order.driverName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount + Time + Actions */}
                  <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-surface-900 dark:text-surface-100">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-[10px] text-surface-400 dark:text-surface-500">
                        {getRelativeTime(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeTab === "pending" && (
                        <button
                          onClick={() => handleOpenAssign(order)}
                          disabled={assignOrder.isPending}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                            "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
                            "dark:bg-primary-500 dark:hover:bg-primary-600",
                            "shadow-sm hover:shadow-md",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                          )}
                        >
                          {lang(t.assign)}
                        </button>
                      )}
                      {activeTab === "active" && (
                        <>
                          <button
                            onClick={() => handleOpenReassign(order)}
                            disabled={reassignOrder.isPending}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200"
                          >
                            {lang(t.reassign)}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(lang(t.unassignConfirm))) {
                                handleUnassign(order.id);
                              }
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 active:scale-[0.98] transition-all duration-200"
                          >
                            {lang(t.unassign)}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Modal */}
      {assignTarget && (
        <DriverSelectModal
          order={assignTarget}
          drivers={availableDrivers}
          selectedDriverId={selectedDriverId}
          notes={assignNotes}
          isSubmitting={assignOrder.isPending}
          onSelectDriver={setSelectedDriverId}
          onNotesChange={setAssignNotes}
          onConfirm={handleConfirmAssign}
          onCancel={handleCloseAssign}
          isAr={isAr}
          lang={lang}
        />
      )}

      {/* Reassign Modal */}
      {reassignTarget && (
        <DriverSelectModal
          order={reassignTarget}
          drivers={availableDrivers}
          selectedDriverId={reassignDriverId}
          notes={reassignNotes}
          isSubmitting={reassignOrder.isPending}
          isReassign
          onSelectDriver={setReassignDriverId}
          onNotesChange={setReassignNotes}
          onConfirm={handleConfirmReassign}
          onCancel={handleCloseReassign}
          isAr={isAr}
          lang={lang}
        />
      )}
    </div>
  );
};

export default OrdersPage;
