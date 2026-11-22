import { useState } from "react";
import {
  useWallet,
  useWithdraw,
  useWithdrawals,
  useWalletTransactions,
} from "@shared/hooks/useFleetWallet";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { formatCurrency, formatTime } from "@shared/utils/formatters";
import { cn } from "@shared/utils/cn";

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "المحفظة", en: "Wallet" },
  subtitle: {
    ar: "رصيد محفظتك وأرباحك",
    en: "Your wallet balance and earnings",
  },

  // Balance card
  currentBalance: { ar: "الرصيد الحالي", en: "Current Balance" },
  lastUpdated: { ar: "آخر تحديث", en: "Last Updated" },
  refresh: { ar: "تحديث", en: "Refresh" },
  withdraw: { ar: "سحب", en: "Withdraw" },
  withdrawAmount: { ar: "مبلغ السحب", en: "Withdraw Amount" },
  withdrawPlaceholder: { ar: "أدخل المبلغ", en: "Enter amount" },
  withdrawSuccess: {
    ar: "تم تقديم طلب السحب بنجاح",
    en: "Withdrawal request submitted successfully",
  },
  withdrawError: { ar: "فشل طلب السحب", en: "Withdrawal request failed" },
  insufficientBalance: { ar: "رصيد غير كافي", en: "Insufficient balance" },
  belowMinimum: {
    ar: "المبلغ أقل من الحد الأدنى للسحب",
    en: "Amount is below the minimum withdrawal",
  },
  confirm: { ar: "تأكيد", en: "Confirm" },
  cancel: { ar: "إلغاء", en: "Cancel" },

  // Info
  walletInfo: { ar: "معلومات المحفظة", en: "Wallet Information" },
  balanceDescription: {
    ar: "هذا هو رصيدك الحالي من عمولات إشراف الأسطول. يمكنك سحب رصيدك في أي وقت.",
    en: "This is your current balance from fleet supervision commissions. You can withdraw your balance at any time.",
  },

  // Stats
  totalEarnings: { ar: "إجمالي الأرباح", en: "Total Earnings" },
  totalWithdrawn: { ar: "إجمالي المسحوب", en: "Total Withdrawn" },
  availableBalance: { ar: "رصيد متاح", en: "Available Balance" },
  currency: { ar: "العملة", en: "Currency" },
  pendingWithdrawals: { ar: "طلبات سحب معلقة", en: "Pending Withdrawals" },
  minimumWithdrawal: { ar: "الحد الأدنى للسحب", en: "Minimum Withdrawal" },
  withdrawalRequests: { ar: "طلبات السحب", en: "Withdrawal Requests" },
  noWithdrawals: {
    ar: "لا توجد طلبات سحب",
    en: "No withdrawal requests yet",
  },

  // Transactions
  recentTransactions: { ar: "المعاملات الأخيرة", en: "Recent Transactions" },
  noTransactions: {
    ar: "لا توجد معاملات بعد",
    en: "No transactions yet",
  },
  viewAll: { ar: "عرض الكل", en: "View All" },
  netBalance: { ar: "صافي الرصيد", en: "Net Balance" },

  // Withdrawal statuses
  statusPending: { ar: "قيد المعالجة", en: "Pending" },
  statusCompleted: { ar: "مكتمل", en: "Completed" },
  statusFailed: { ar: "فشل", en: "Failed" },
  statusRejected: { ar: "مرفوض", en: "Rejected" },

  // Loading / error
  loading: {
    ar: "جاري تحميل بيانات المحفظة...",
    en: "Loading wallet data...",
  },
  error: { ar: "فشل تحميل بيانات المحفظة", en: "Failed to load wallet data" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },

  // Withdraw disabled reasons
  cannotWithdrawPending: {
    ar: "لديك طلب سحب معلق بالفعل",
    en: "You already have a pending withdrawal",
  },
  cannotWithdrawBelowMin: {
    ar: "الرصيد أقل من الحد الأدنى للسحب",
    en: "Balance is below the minimum withdrawal amount",
  },
} as const;

// ============================================
// Status Badge for Withdrawals
// ============================================

const WithdrawalStatusBadge: React.FC<{
  status: string | null;
  isAr: boolean;
}> = ({ status, isAr }) => {
  const key = (status ?? "").toLowerCase();

  const config: Record<
    string,
    { bg: string; dot: string; label: { ar: string; en: string } }
  > = {
    pending: {
      bg: "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-500/20",
      dot: "bg-warning-500",
      label: t.statusPending,
    },
    completed: {
      bg: "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 border-success-200 dark:border-success-500/20",
      dot: "bg-success-500",
      label: t.statusCompleted,
    },
    approved: {
      bg: "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 border-success-200 dark:border-success-500/20",
      dot: "bg-success-500",
      label: t.statusCompleted,
    },
    failed: {
      bg: "bg-error-50 dark:bg-error-500/10 text-error-700 dark:text-error-400 border-error-200 dark:border-error-500/20",
      dot: "bg-error-500",
      label: t.statusFailed,
    },
    rejected: {
      bg: "bg-error-50 dark:bg-error-500/10 text-error-700 dark:text-error-400 border-error-200 dark:border-error-500/20",
      dot: "bg-error-500",
      label: t.statusRejected,
    },
  };

  const c =
    config[key] ??
    ({
      bg: "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700",
      dot: "bg-surface-400",
      label: { ar: status ?? "-", en: status ?? "-" },
    } as const);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
        c.bg,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {isAr ? c.label.ar : c.label.en}
    </span>
  );
};

// ============================================
// Withdraw Modal
// ============================================

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  isSubmitting: boolean;
  balance: number;
  currency: string;
  minimumWithdrawalAmount: number;
  pendingWithdrawalCount: number;
  canRequestWithdrawal: boolean;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  balance,
  currency,
  minimumWithdrawalAmount,
  pendingWithdrawalCount,
  canRequestWithdrawal,
  isAr,
  lang,
}) => {
  const [amount, setAmount] = useState("");

  if (!isOpen) return null;

  const amountValue = parseFloat(amount);
  const aboveMin =
    !isNaN(amountValue) && amountValue >= minimumWithdrawalAmount;
  const withinBalance = !isNaN(amountValue) && amountValue <= balance;
  const isValidAmount = aboveMin && withinBalance;

  // Reasons the form is blocked (shown as a banner)
  const blockReason = !canRequestWithdrawal
    ? pendingWithdrawalCount > 0
      ? lang(t.cannotWithdrawPending)
      : lang(t.cannotWithdrawBelowMin)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidAmount && canRequestWithdrawal) {
      onConfirm(amountValue);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden animate-fade-in-scale bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">
              {lang(t.withdraw)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 hover:rotate-90"
            aria-label={isAr ? "إغلاق" : "Close"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Block reason banner */}
          {blockReason && (
            <div className="rounded-xl p-3 flex items-start gap-2 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20">
              <svg
                className="w-4 h-4 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              <p className="text-xs text-warning-700 dark:text-warning-300 leading-relaxed">
                {blockReason}
              </p>
            </div>
          )}

          {/* Available Balance Card */}
          <div className="rounded-2xl bg-surface-50 dark:bg-surface-800/50 p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
                {isAr ? "الرصيد المتاح" : "Available Balance"}
              </span>
              <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {formatCurrency(balance)}{" "}
                <span className="text-xs font-normal text-surface-500">
                  {currency}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
                {lang(t.minimumWithdrawal)}
              </span>
              <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
                {formatCurrency(minimumWithdrawalAmount)}{" "}
                <span className="text-[10px]">{currency}</span>
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
              {lang(t.withdrawAmount)} ({currency})
            </label>
            <div className="relative group">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={lang(t.withdrawPlaceholder)}
                type="number"
                min={minimumWithdrawalAmount || 1}
                max={balance}
                step="0.01"
                required
                disabled={!canRequestWithdrawal}
                className={cn(
                  "w-full px-4 py-3.5 rounded-2xl text-base font-medium",
                  "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white",
                  "placeholder:text-surface-400 dark:placeholder:text-surface-500",
                  "border-2 border-transparent",
                  "focus:outline-none focus:border-primary-500/60 focus:bg-surface-50 dark:focus:bg-surface-800/60",
                  "transition-all duration-200",
                  isAr ? "text-right" : "text-left",
                  amount !== "" &&
                    !isValidAmount &&
                    "border-error-400 dark:border-error-500",
                  !canRequestWithdrawal && "opacity-60 cursor-not-allowed",
                )}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setAmount(balance.toString())}
                disabled={!canRequestWithdrawal}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold rounded-lg",
                  "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400",
                  "hover:bg-primary-200 dark:hover:bg-primary-500/20 transition-colors",
                  isAr ? "left-2" : "right-2",
                  !canRequestWithdrawal && "opacity-50 cursor-not-allowed",
                )}
              >
                {isAr ? "الكل" : "Max"}
              </button>
            </div>
            {amount !== "" && !isValidAmount && (
              <p className="text-xs text-error-500 flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                {!aboveMin
                  ? lang(t.belowMinimum)
                  : !withinBalance
                    ? lang(t.insufficientBalance)
                    : lang(t.belowMinimum)}
              </p>
            )}
          </div>

          {/* Quick Amount Chips */}
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => {
              const chipAmount = (balance * percent) / 100;
              const disabled = !canRequestWithdrawal;
              return (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setAmount(chipAmount.toFixed(2))}
                  disabled={disabled}
                  className={cn(
                    "flex-1 px-2 py-2 rounded-xl text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {percent}%
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !isValidAmount || !canRequestWithdrawal}
              className={cn(
                "flex-1 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200",
                "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
                "dark:bg-primary-500 dark:hover:bg-primary-600",
                "shadow-lg shadow-primary-500/20",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
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
                  {isAr ? "جاري المعالجة..." : "Processing..."}
                </>
              ) : (
                <>
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
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  {lang(t.confirm)}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3.5 rounded-2xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {lang(t.cancel)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// WalletPage — Main Component
// ============================================

export const WalletPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const {
    balance,
    currency,
    totalIn,
    totalOut,
    pendingWithdrawalCount,
    pendingWithdrawalAmount,
    minimumWithdrawalAmount,
    canRequestWithdrawal,
    recentTransactions,
    isLoading,
    isError,
    error,
    refetch,
  } = useWallet();

  // Transaction history (full list, not just the 3 from wallet.recentTransactions)
  const { data: allTransactions = [] } = useWalletTransactions({
    pageIndex: 1,
    pageSize: 10,
  });

  // Withdrawal requests history
  const { data: withdrawals = [] } = useWithdrawals({
    pageIndex: 1,
    pageSize: 10,
  });

  const withdrawMutation = useWithdraw();
  const [showWithdraw, setShowWithdraw] = useState(false);

  const handleWithdraw = async (amount: number) => {
    try {
      await withdrawMutation.mutateAsync(amount);
      toast.success(lang(t.withdrawSuccess));
      setShowWithdraw(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : lang(t.withdrawError);
      toast.error(message);
    }
  };

  // Prefer the richer history from `useWalletTransactions`, fall back to
  // the "recent" list embedded in the summary DTO if needed.
  const transactions =
    allTransactions.length > 0 ? allTransactions : recentTransactions;

  // ============================================
  // Loading State
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="skeleton h-8 w-32 rounded-lg mb-2" />
            <div className="skeleton h-4 w-48 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass p-8 space-y-4 rounded-3xl">
              <div className="skeleton h-4 w-32 rounded-lg" />
              <div className="skeleton h-12 w-48 rounded-lg" />
              <div className="skeleton h-3 w-24 rounded-lg" />
            </div>
          </div>
          <div className="glass p-8 space-y-4 rounded-3xl">
            <div className="skeleton h-4 w-28 rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // Error State
  // ============================================

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

  // Disable withdraw button if backend says we can't
  const withdrawDisabled =
    !canRequestWithdrawal ||
    balance < minimumWithdrawalAmount ||
    withdrawMutation.isPending;

  // ============================================
  // Render
  // ============================================

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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Balance Card */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-surface-950 p-8 shadow-xl shadow-primary-500/20 dark:shadow-primary-900/30">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative z-10">
              {/* Top Row */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      {lang(t.currentBalance)}
                    </p>
                    <p className="text-xs text-white/50">
                      {lang(t.lastUpdated)}:{" "}
                      {new Date().toLocaleTimeString(isAr ? "ar-EG" : "en-US")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWithdraw(true)}
                  disabled={withdrawDisabled}
                  title={
                    !canRequestWithdrawal
                      ? pendingWithdrawalCount > 0
                        ? lang(t.cannotWithdrawPending)
                        : lang(t.cannotWithdrawBelowMin)
                      : undefined
                  }
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                    "bg-white text-primary-700 hover:bg-white/90 active:scale-[0.98]",
                    "shadow-lg shadow-black/10",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <span className="flex items-center gap-2">
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
                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    {lang(t.withdraw)}
                  </span>
                </button>
              </div>

              {/* Balance */}
              <div className="mb-6">
                <p className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
                  {formatCurrency(balance)}
                </p>
                <p className="text-lg font-medium text-white/60 mt-1">
                  {currency}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-white/60 leading-relaxed max-w-lg">
                {lang(t.balanceDescription)}
              </p>

              {/* Pending withdrawal inline pill */}
              {pendingWithdrawalCount > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning-400 animate-pulse" />
                  <span className="text-xs font-medium text-white/90">
                    {pendingWithdrawalCount} {lang(t.pendingWithdrawals)} —{" "}
                    {formatCurrency(pendingWithdrawalAmount)} {currency}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats Card */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm h-fit">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            {lang(t.walletInfo)}
          </h3>

          <div className="space-y-3">
            {/* Total Earnings (totalIn) */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
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
                      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.totalEarnings)}
                  </p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                    {formatCurrency(totalIn)}{" "}
                    <span className="text-xs font-normal text-surface-500">
                      {currency}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Total Withdrawn (totalOut) */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
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
                      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.totalWithdrawn)}
                  </p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                    {formatCurrency(totalOut)}{" "}
                    <span className="text-xs font-normal text-surface-500">
                      {currency}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Withdrawals */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
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
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.pendingWithdrawals)}
                  </p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                    {pendingWithdrawalCount > 0
                      ? `${formatCurrency(pendingWithdrawalAmount)} ${currency} (${pendingWithdrawalCount})`
                      : isAr
                        ? "لا يوجد"
                        : "None"}
                  </p>
                </div>
              </div>
            </div>

            {/* Minimum Withdrawal */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info-100 dark:bg-info-900/30 flex items-center justify-center">
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
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.minimumWithdrawal)}
                  </p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                    {formatCurrency(minimumWithdrawalAmount)}{" "}
                    <span className="text-xs font-normal text-surface-500">
                      {currency}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {lang(t.recentTransactions)}
          </h3>
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
            {transactions.length}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-surface-300 dark:text-surface-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {lang(t.noTransactions)}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800/30">
            {transactions.map((tx) => {
              const isCredit = tx.amount >= 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isCredit
                        ? "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400"
                        : "bg-warning-100 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400",
                    )}
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
                          isCredit
                            ? "M12 4.5v15m0-15 4.5 4.5M12 4.5 7.5 9"
                            : "M12 19.5v-15m0 15 4.5-4.5M12 19.5 7.5 15"
                        }
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                      {tx.description ??
                        tx.type ??
                        (isAr ? "معاملة" : "Transaction")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                      <span>{formatTime(tx.createdAt)}</span>
                      {tx.orderNumber && (
                        <>
                          <span className="text-surface-300 dark:text-surface-600">
                            •
                          </span>
                          <span dir="ltr">#{tx.orderNumber}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-end flex-shrink-0">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isCredit
                          ? "text-success-600 dark:text-success-400"
                          : "text-warning-600 dark:text-warning-400",
                      )}
                    >
                      {isCredit ? "+" : ""}
                      {formatCurrency(tx.amount)}{" "}
                      <span className="text-xs font-normal">{currency}</span>
                    </p>
                    <p className="text-[10px] text-surface-400 dark:text-surface-500 tabular-nums">
                      {isAr ? "الرصيد" : "Balance"}:{" "}
                      {formatCurrency(tx.balanceAfter)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal Requests */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {lang(t.withdrawalRequests)}
          </h3>
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
            {withdrawals.length}
          </span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-surface-300 dark:text-surface-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {lang(t.noWithdrawals)}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800/30">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
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
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {formatCurrency(w.amount)}{" "}
                    <span className="text-xs font-normal text-surface-500">
                      {currency}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                    <span>{formatTime(w.createdAt)}</span>
                    {w.rejectionReason && (
                      <>
                        <span className="text-surface-300 dark:text-surface-600">
                          •
                        </span>
                        <span
                          className="text-error-500 dark:text-error-400 truncate"
                          title={w.rejectionReason}
                        >
                          {w.rejectionReason}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <WithdrawalStatusBadge status={w.status} isAr={isAr} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        onConfirm={handleWithdraw}
        isSubmitting={withdrawMutation.isPending}
        balance={balance}
        currency={currency}
        minimumWithdrawalAmount={minimumWithdrawalAmount}
        pendingWithdrawalCount={pendingWithdrawalCount}
        canRequestWithdrawal={canRequestWithdrawal}
        isAr={isAr}
        lang={lang}
      />
    </div>
  );
};

export default WalletPage;