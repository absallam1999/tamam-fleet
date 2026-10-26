import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { cn } from "@shared/utils/cn";

// ============================================
// Translations
// ============================================

const t = {
  errorCode: { ar: "خطأ ٤٠٤", en: "Error 404" },
  title: { ar: "الصفحة غير موجودة", en: "Page Not Found" },
  description: {
    ar: "عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها.",
    en: "Sorry, we couldn't find the page you're looking for. It might have been moved or removed.",
  },
  attemptedUrl: { ar: "المسار المطلوب:", en: "Requested path:" },
  goBack: { ar: "الرجوع للخلف", en: "Go Back" },
  home: { ar: "الرئيسية", en: "Dashboard Home" },
  suggestions: { ar: "روابط سريعة مقترحة", en: "Suggested Quick Links" },
  drivers: { ar: "السائقين", en: "Drivers" },
  orders: { ar: "الطلبات", en: "Orders" },
  requests: { ar: "طلبات الانضمام", en: "Requests" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  helpTitle: { ar: "هل ما زلت بحاجة للمساعدة؟", en: "Still need help?" },
  contactSupport: { ar: "فريق الدعم الفني", en: "Support Team" },
};

// ============================================
// Quick Links
// ============================================

const quickLinks = [
  {
    to: "/dashboard/drivers",
    labelAr: t.drivers.ar,
    labelEn: t.drivers.en,
    icon: (
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
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      </svg>
    ),
  },
  {
    to: "/dashboard/orders",
    labelAr: t.orders.ar,
    labelEn: t.orders.en,
    icon: (
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
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
        />
      </svg>
    ),
  },
  {
    to: "/dashboard/requests",
    labelAr: t.requests.ar,
    labelEn: t.requests.en,
    icon: (
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
          d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
        />
      </svg>
    ),
  },
  {
    to: "/dashboard/notifications",
    labelAr: t.notifications.ar,
    labelEn: t.notifications.en,
    icon: (
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
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>
    ),
  },
];

// ============================================
// Main Component
// ============================================

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const attemptedPath = location.pathname;

  return (
    <main
      className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 -start-24 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-primary-500/10 dark:bg-primary-500/15 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -end-24 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-amber-500/10 dark:bg-amber-500/10 blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
        {/* ============================================ */}
        {/* Interactive Visual Illustration */}
        {/* ============================================ */}
        <div
          className="relative mb-4 sm:mb-6 select-none flex justify-center items-center w-full h-44 sm:h-52"
          aria-hidden="true"
        >
          {/* Subtle Route Network Background Pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-25 dark:opacity-20 pointer-events-none"
            viewBox="0 0 500 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 40,150 C 110,150 140,50 250,50 C 360,50 390,130 460,130"
              stroke="currentColor"
              className="text-primary-500 dark:text-primary-400"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            <circle
              cx="40"
              cy="150"
              r="5"
              fill="currentColor"
              className="text-surface-400 dark:text-surface-500"
            />
            <circle
              cx="150"
              cy="85"
              r="4"
              fill="currentColor"
              className="text-primary-500/50"
            />
            <circle
              cx="350"
              cy="80"
              r="4"
              fill="currentColor"
              className="text-primary-500/50"
            />
            <circle
              cx="460"
              cy="130"
              r="5"
              fill="currentColor"
              className="text-surface-400 dark:text-surface-500"
            />
            <line
              x1="0"
              y1="100"
              x2="500"
              y2="100"
              stroke="currentColor"
              className="text-surface-200 dark:text-surface-800"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </svg>

          {/* Pin - Typography Graphic */}
          <div className="flex items-center justify-center gap-1 sm:gap-3 relative">
            <span className="text-[96px] sm:text-[132px] md:text-[150px] font-black leading-none tracking-tighter bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 bg-clip-text text-transparent dark:from-primary-300 dark:via-primary-400 dark:to-primary-600 drop-shadow-sm">
              4
            </span>

            {/* Map Pin as the central 0 */}
            <div className="relative flex flex-col items-center justify-end h-[100px] sm:h-[130px] w-[70px] sm:w-[90px]">
              <div
                className="absolute top-0 w-16 h-16 sm:w-20 sm:h-20 text-primary-500 dark:text-primary-400 animate-bounce"
                style={{ animationDuration: "2.4s" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-full h-full drop-shadow-md"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div
                className="absolute bottom-1 w-10 sm:w-14 h-2 bg-surface-900/15 dark:bg-surface-950/60 rounded-full blur-[2px] animate-pulse"
                style={{ animationDuration: "2.4s" }}
              />
            </div>

            <span className="text-[96px] sm:text-[132px] md:text-[150px] font-black leading-none tracking-tighter bg-gradient-to-bl from-primary-400 via-primary-500 to-primary-700 bg-clip-text text-transparent dark:from-primary-300 dark:via-primary-400 dark:to-primary-600 drop-shadow-sm">
              4
            </span>
          </div>
        </div>

        {/* ============================================ */}
        {/* Main Glassmorphism Container */}
        {/* ============================================ */}
        <div className="w-full glass glass-elevated p-6 sm:p-9 rounded-3xl animate-fade-in-up">
          {/* Status Badge */}
          <div className="flex justify-center mb-3">
            <span className="badge badge-warning text-xs font-semibold px-3 py-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-warning-500 animate-ping inline-block mr-1" />
              {lang(t.errorCode)}
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-surface-100 mb-2">
              {lang(t.title)}
            </h1>
            <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400 max-w-md mx-auto leading-relaxed">
              {lang(t.description)}
            </p>
          </div>

          {/* Requested URL Chip */}
          {attemptedPath && attemptedPath !== "/" && (
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-subtle text-xs sm:text-sm font-mono text-surface-600 dark:text-surface-300 max-w-full">
                <span className="text-surface-400 font-sans text-xs">
                  {lang(t.attemptedUrl)}
                </span>
                <span className="font-semibold text-primary-600 dark:text-primary-400 truncate max-w-[240px] sm:max-w-xs">
                  {attemptedPath}
                </span>
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={cn(
                "btn btn-secondary w-full sm:w-auto min-w-[140px]",
                "shadow-sm hover:shadow-glass-hover",
                "bg-surface-100 dark:bg-surface-800",
                "text-surface-700 dark:text-surface-200",
                "border border-surface-200/80 dark:border-surface-700",
                "hover:bg-surface-200/80 dark:hover:bg-surface-700",
                "hover:border-surface-300 dark:hover:border-surface-600",
                "transition-all duration-fast",
              )}
            >
              <svg
                className="w-4 h-4 icon-rtl text-surface-500 dark:text-surface-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
              <span>{lang(t.goBack)}</span>
            </button>

            <Link
              to="/dashboard"
              className={cn(
                "btn btn-primary w-full sm:w-auto min-w-[140px]",
                "shadow-sm hover:shadow-glass-hover",
                "transition-all duration-fast",
              )}
            >
              <svg
                className="w-4 h-4 icon-rtl"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              <span>{lang(t.home)}</span>
            </Link>
          </div>

          {/* Quick Links Section */}
          <div className="pt-6 border-t border-surface-200/80 dark:border-surface-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3 text-start">
              {lang(t.suggestions)}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "glass-subtle glass-interactive flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl",
                    "text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300",
                    "hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-fast group",
                  )}
                >
                  <span className="text-primary-500 dark:text-primary-400 transition-transform duration-fast group-hover:scale-110 flex-shrink-0">
                    {link.icon}
                  </span>
                  <span className="truncate">
                    {isAr ? link.labelAr : link.labelEn}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Support Footer */}
          <div className="mt-8 pt-4 flex items-center justify-center">
            <a
              href="https://tamamapp.net/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm text-xs text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all inline-flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4 text-surface-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
              <span>{lang(t.helpTitle)}</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400 underline underline-offset-4">
                {lang(t.contactSupport)}
              </span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
