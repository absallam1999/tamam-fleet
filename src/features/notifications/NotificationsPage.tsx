import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { getRelativeTime } from "@shared/utils/formatters";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  type FleetNotificationDto,
} from "@shared/hooks/useFleetNotifications";

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "الإشعارات", en: "Notifications" },
  subtitle: {
    ar: "جميع الإشعارات والتنبيهات",
    en: "All notifications and alerts",
  },

  // Actions
  markAllRead: { ar: "تحديد الكل كمقروء", en: "Mark All as Read" },
  markRead: { ar: "تحديد كمقروء", en: "Mark as Read" },
  refresh: { ar: "تحديث", en: "Refresh" },
  delete: { ar: "حذف", en: "Delete" },
  deleteAll: { ar: "حذف الكل", en: "Delete All" },

  // Tabs
  all: { ar: "الكل", en: "All" },
  unread: { ar: "غير مقروء", en: "Unread" },

  // Empty
  noNotifications: { ar: "لا توجد إشعارات", en: "No notifications" },
  noNotificationsDesc: {
    ar: "ستظهر إشعاراتك هنا عند ورودها",
    en: "Your notifications will appear here",
  },
  noUnread: { ar: "لا توجد إشعارات غير مقروءة", en: "No unread notifications" },

  // Status
  unreadCount: { ar: "غير مقروء", en: "unread" },
  read: { ar: "مقروء", en: "Read" },

  // Loading
  loading: { ar: "جاري تحميل الإشعارات...", en: "Loading notifications..." },
  error: { ar: "فشل تحميل الإشعارات", en: "Failed to load notifications" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },

  // Confirm
  confirmDeleteAll: {
    ar: "هل أنت متأكد من حذف جميع الإشعارات؟",
    en: "Are you sure you want to delete all notifications?",
  },
  deleted: { ar: "تم حذف الإشعار", en: "Notification deleted" },
  deletedAll: {
    ar: "تم حذف جميع الإشعارات",
    en: "All notifications deleted",
  },
};

// ============================================
// NotificationsPage — Main Component
// ============================================

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
  } = useNotifications(page, pageSize);
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllNotifications = useDeleteAllNotifications();

  const unreadCount = unreadData?.count ?? 0;

  const filteredNotifications = notifications
    ? filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications
    : [];

  const handleMarkAsRead = (notification: FleetNotificationDto) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        toast.success(isAr ? "تم تحديد الكل كمقروء" : "All marked as read");
      },
    });
  };

  const handleDelete = (notificationId: string) => {
    setDeletingId(notificationId);
    deleteNotification.mutate(notificationId, {
      onSuccess: () => {
        toast.success(lang(t.deleted));
        setDeletingId(null);
      },
      onError: () => {
        setDeletingId(null);
        toast.error(lang(t.error));
      },
    });
  };

  const handleDeleteAll = () => {
    if (window.confirm(lang(t.confirmDeleteAll))) {
      deleteAllNotifications.mutate(undefined, {
        onSuccess: () => {
          toast.success(lang(t.deletedAll));
        },
        onError: () => {
          toast.error(lang(t.error));
        },
      });
    }
  };

  // ============================================
  // Loading State
  // ============================================

  if (isLoading && (notifications ?? []).length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="skeleton h-8 w-40 rounded-lg mb-2" />
            <div className="skeleton h-4 w-32 rounded-lg" />
          </div>
        </div>
        <div className="glass overflow-hidden">
          <div className="p-5 space-y-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-start gap-4 p-3">
                <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded-lg" />
                  <div className="skeleton h-3 w-full rounded-lg" />
                  <div className="skeleton h-3 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // Error State
  // ============================================

  if (isError && (!notifications || notifications.length === 0)) {
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
            {lang(t.subtitle)}{" "}
            {unreadCount > 0 && (
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                • {unreadCount} {lang(t.unreadCount)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isPending}
              className="btn btn-ghost btn-sm"
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
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              {lang(t.markAllRead)}
            </button>
          )}
          {notifications && notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deleteAllNotifications.isPending}
              className="btn btn-ghost btn-sm text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
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
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              {lang(t.deleteAll)}
            </button>
          )}
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

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-800">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-all",
            filter === "all"
              ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
              : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
          )}
        >
          {lang(t.all)} ({notifications?.length ?? 0})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-all",
            filter === "unread"
              ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
              : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
          )}
        >
          {lang(t.unread)} ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="glass overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
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
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {filter === "unread" ? lang(t.noUnread) : lang(t.noNotifications)}
            </p>
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1 max-w-xs mx-auto">
              {lang(t.noNotificationsDesc)}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800/30">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 transition-colors group",
                  "hover:bg-surface-50 dark:hover:bg-surface-800/30",
                  !notification.isRead &&
                    "bg-primary-50/40 dark:bg-primary-950/15 border-s-2 border-primary-500 dark:border-primary-400",
                )}
              >
                <button
                  onClick={() => handleMarkAsRead(notification)}
                  className="flex-1 text-start px-5 py-4 flex items-start gap-4 min-w-0"
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      notification.isRead
                        ? "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400"
                        : "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400",
                    )}
                  >
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
                        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                      />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm truncate",
                          notification.isRead
                            ? "font-medium text-surface-700 dark:text-surface-300"
                            : "font-semibold text-surface-900 dark:text-surface-100",
                        )}
                      >
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-[10px] text-surface-400 dark:text-surface-500 font-medium">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                      {notification.isRead ? (
                        <span className="text-[10px] text-surface-400 dark:text-surface-500">
                          {lang(t.read)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-primary-600 dark:text-primary-400 font-medium">
                          {lang(t.unreadCount)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                  disabled={deletingId === notification.id}
                  className={cn(
                    "p-2 mr-2 mt-3 rounded-xl transition-all duration-200 flex-shrink-0",
                    "text-surface-400 dark:text-surface-500",
                    "hover:text-error-600 hover:bg-error-50 dark:hover:text-error-400 dark:hover:bg-error-950/30",
                    "opacity-0 group-hover:opacity-100",
                    "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isAr ? "mr-0 ml-2" : "mr-2 ml-0",
                  )}
                  title={lang(t.delete)}
                >
                  {deletingId === notification.id ? (
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
                  ) : (
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {notifications && notifications.length >= pageSize && (
          <div className="flex items-center justify-center p-4 border-t border-surface-200 dark:border-surface-800 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAr ? "السابق" : "Previous"}
            </button>
            <span className="text-sm text-surface-500 dark:text-surface-400">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={notifications.length < pageSize}
              className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAr ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
