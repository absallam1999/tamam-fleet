import { useState, useCallback } from "react";
import { useFleet } from "@app/providers/FleetProvider";
import { useAuth } from "@app/providers/AuthProvider";
import {
  useTheme,
  type AccentColor,
  type ThemeMode,
} from "@app/providers/ThemeProvider";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";

/**
 * SettingsPage — Fleet Supervisor Settings Management
 *
 * Profile information is displayed from authentication/fleet data.
 * Notification and appearance preferences are local-only.
 */

// ============================================
// Types
// ============================================

interface SupervisorProfile {
  name: string;
  nameAr: string;
  phone: string;
  email: string;
  employeeId: string;
  department: string;
  region: string;
}

interface NotificationPreferences {
  tripAssigned: boolean;
  tripCompleted: boolean;
  tripCancelled: boolean;
  driverStatusChange: boolean;
  vehicleMaintenance: boolean;
  emergencyAlerts: boolean;
  dailySummary: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

// ============================================
// Translations (unchanged)
// ============================================

const t = {
  title: { ar: "الإعدادات", en: "Settings" },
  subtitle: {
    ar: "إدارة إعدادات حساب المشرف وتفضيلاته",
    en: "Manage your supervisor account settings and preferences",
  },

  tabProfile: { ar: "الملف التعريفي", en: "Profile" },
  tabNotifications: { ar: "الإشعارات", en: "Notifications" },
  tabAppearance: { ar: "المظهر", en: "Appearance" },

  profileTitle: { ar: "الملف التعريفي للمشرف", en: "Supervisor Profile" },
  profileDesc: {
    ar: "بيانات حسابك الشخصي وبيانات الاتصال",
    en: "Your personal account information and contact details",
  },
  notificationsTitle: {
    ar: "تفضيلات الإشعارات",
    en: "Notification Preferences",
  },
  notificationsDesc: {
    ar: "تحكم في الإشعارات التي تصلك عن نشاط الأسطول",
    en: "Control notifications about fleet activity",
  },
  appearanceTitle: { ar: "المظهر", en: "Appearance" },
  appearanceDesc: {
    ar: "تخصيص مظهر لوحة التحكم حسب تفضيلاتك",
    en: "Customize your dashboard appearance",
  },

  fullName: { ar: "الاسم الكامل (إنجليزي)", en: "Full Name (English)" },
  fullNameAr: { ar: "الاسم الكامل (عربي)", en: "Full Name (Arabic)" },
  phone: { ar: "رقم الهاتف", en: "Phone Number" },
  email: { ar: "البريد الإلكتروني", en: "Email Address" },
  employeeId: { ar: "الرقم الوظيفي", en: "Employee ID" },
  department: { ar: "القسم", en: "Department" },
  region: { ar: "المنطقة", en: "Region" },

  tripAssigned: { ar: "تعيين رحلة", en: "Trip Assigned" },
  tripAssignedDesc: {
    ar: "عند تعيين رحلة جديدة لسائق",
    en: "When a new trip is assigned to a driver",
  },
  tripCompleted: { ar: "اكتمال رحلة", en: "Trip Completed" },
  tripCompletedDesc: {
    ar: "عند اكتمال رحلة بنجاح",
    en: "When a trip is completed successfully",
  },
  tripCancelled: { ar: "إلغاء رحلة", en: "Trip Cancelled" },
  tripCancelledDesc: {
    ar: "عند إلغاء رحلة من قبل السائق أو النظام",
    en: "When a trip is cancelled by driver or system",
  },
  driverStatusChange: { ar: "تغيير حالة سائق", en: "Driver Status Change" },
  driverStatusChangeDesc: {
    ar: "عند تغيير حالة سائق (متاح، في رحلة، خارج الخدمة)",
    en: "When a driver status changes",
  },
  vehicleMaintenance: { ar: "صيانة المركبات", en: "Vehicle Maintenance" },
  vehicleMaintenanceDesc: {
    ar: "تنبيهات الصيانة الدورية والطارئة للمركبات",
    en: "Scheduled and emergency maintenance alerts",
  },
  emergencyAlerts: { ar: "تنبيهات الطوارئ", en: "Emergency Alerts" },
  emergencyAlertsDesc: {
    ar: "تنبيهات فورية للحالات الطارئة والأعطال",
    en: "Instant alerts for emergencies and breakdowns",
  },
  dailySummary: { ar: "ملخص يومي", en: "Daily Summary" },
  dailySummaryDesc: {
    ar: "ملخص يومي بأداء الأسطول والسائقين",
    en: "Daily fleet and driver performance summary",
  },
  notificationChannels: { ar: "قنوات الإشعارات", en: "Notification Channels" },
  pushNotifications: { ar: "إشعارات التطبيق", en: "Push Notifications" },
  pushNotificationsDesc: {
    ar: "إشعارات فورية داخل لوحة التحكم",
    en: "Instant in-dashboard notifications",
  },
  smsNotifications: { ar: "رسائل SMS", en: "SMS Messages" },
  smsNotificationsDesc: {
    ar: "تلقي إشعارات عبر الرسائل النصية",
    en: "Receive notifications via SMS",
  },
  emailNotifications: { ar: "البريد الإلكتروني", en: "Email" },
  emailNotificationsDesc: {
    ar: "تلقي ملخصات وتقارير عبر البريد الإلكتروني",
    en: "Receive summaries and reports via email",
  },

  themeSection: { ar: "المظهر", en: "Theme" },
  themeLight: { ar: "فاتح", en: "Light" },
  themeDark: { ar: "داكن", en: "Dark" },
  themeSystem: { ar: "النظام", en: "System" },
  accentSection: { ar: "لون التمييز", en: "Accent Color" },
  changeAccent: { ar: "تغيير اللون إلى", en: "Change color to" },

  saveChanges: { ar: "حفظ التغييرات", en: "Save Changes" },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  saveSuccess: {
    ar: "تم حفظ الإعدادات بنجاح",
    en: "Settings saved successfully",
  },
  saveError: { ar: "فشل حفظ الإعدادات", en: "Failed to save settings" },
  saveErrorDesc: { ar: "يرجى المحاولة مرة أخرى", en: "Please try again" },
};

// ============================================
// Section Header Component (unchanged)
// ============================================

interface SectionHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
}) => (
  <div className="flex items-start gap-4 mb-6">
    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
        {title}
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400">
        {description}
      </p>
    </div>
  </div>
);

// ============================================
// Toggle Switch Component (unchanged)
// ============================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0",
      checked
        ? "bg-primary-600 dark:bg-primary-500"
        : "bg-surface-300 dark:bg-surface-600",
      disabled && "opacity-50 cursor-not-allowed",
    )}
  >
    <span
      className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
        checked
          ? "ltr:translate-x-6 rtl:-translate-x-6"
          : "ltr:translate-x-1 rtl:-translate-x-1",
      )}
    />
  </button>
);

// ============================================
// SettingsPage — Main Component
// ============================================

export const SettingsPage: React.FC = () => {
  const { supervisor } = useFleet();
  const { user } = useAuth();
  const {
    resolvedTheme,
    theme: themeMode,
    setTheme,
    accent,
    setAccent,
    availableAccents,
  } = useTheme();
  const { currentLanguage } = useLanguage();
  const toast = useToast();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  type TabKey = "profile" | "notifications" | "appearance";
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize profile from available data (user/supervisor)
  const [profile, setProfile] = useState<SupervisorProfile>({
    name: user?.fullName || supervisor?.fullName || "",
    nameAr: "", // API does not provide Arabic name
    phone: user?.phoneNumber || supervisor?.phoneNumber || "",
    email: user?.email || supervisor?.email || "",
    employeeId: "", // not available
    department: "", // not available
    region: "", // not available
  });

  // Local notification preferences (not persisted to API)
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    tripAssigned: true,
    tripCompleted: true,
    tripCancelled: true,
    driverStatusChange: true,
    vehicleMaintenance: true,
    emergencyAlerts: true,
    dailySummary: true,
    smsNotifications: false,
    emailNotifications: true,
    pushNotifications: true,
  });

  // Simulate saving (no API endpoint currently)
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success(lang(t.saveSuccess));
    setIsSaving(false);
  }, [toast, isAr]);

  // Tabs configuration (unchanged)
  const tabs: {
    key: TabKey;
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "profile",
      labelAr: t.tabProfile.ar,
      labelEn: t.tabProfile.en,
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
      key: "notifications",
      labelAr: t.tabNotifications.ar,
      labelEn: t.tabNotifications.en,
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
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
      ),
    },
    {
      key: "appearance",
      labelAr: t.tabAppearance.ar,
      labelEn: t.tabAppearance.en,
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
            d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
          />
        </svg>
      ),
    },
  ];

  const themeOptions: {
    key: ThemeMode;
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "light",
      labelAr: t.themeLight.ar,
      labelEn: t.themeLight.en,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
        </svg>
      ),
    },
    {
      key: "dark",
      labelAr: t.themeDark.ar,
      labelEn: t.themeDark.en,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
      ),
    },
    {
      key: "system",
      labelAr: t.themeSystem.ar,
      labelEn: t.themeSystem.en,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
          />
        </svg>
      ),
    },
  ];

  const notificationItems = [
    {
      key: "tripAssigned" as const,
      labelAr: t.tripAssigned.ar,
      labelEn: t.tripAssigned.en,
      descAr: t.tripAssignedDesc.ar,
      descEn: t.tripAssignedDesc.en,
    },
    {
      key: "tripCompleted" as const,
      labelAr: t.tripCompleted.ar,
      labelEn: t.tripCompleted.en,
      descAr: t.tripCompletedDesc.ar,
      descEn: t.tripCompletedDesc.en,
    },
    {
      key: "tripCancelled" as const,
      labelAr: t.tripCancelled.ar,
      labelEn: t.tripCancelled.en,
      descAr: t.tripCancelledDesc.ar,
      descEn: t.tripCancelledDesc.en,
    },
    {
      key: "driverStatusChange" as const,
      labelAr: t.driverStatusChange.ar,
      labelEn: t.driverStatusChange.en,
      descAr: t.driverStatusChangeDesc.ar,
      descEn: t.driverStatusChangeDesc.en,
    },
    {
      key: "vehicleMaintenance" as const,
      labelAr: t.vehicleMaintenance.ar,
      labelEn: t.vehicleMaintenance.en,
      descAr: t.vehicleMaintenanceDesc.ar,
      descEn: t.vehicleMaintenanceDesc.en,
    },
    {
      key: "emergencyAlerts" as const,
      labelAr: t.emergencyAlerts.ar,
      labelEn: t.emergencyAlerts.en,
      descAr: t.emergencyAlertsDesc.ar,
      descEn: t.emergencyAlertsDesc.en,
    },
    {
      key: "dailySummary" as const,
      labelAr: t.dailySummary.ar,
      labelEn: t.dailySummary.en,
      descAr: t.dailySummaryDesc.ar,
      descEn: t.dailySummaryDesc.en,
    },
  ];

  const channelItems = [
    {
      key: "pushNotifications" as const,
      labelAr: t.pushNotifications.ar,
      labelEn: t.pushNotifications.en,
      descAr: t.pushNotificationsDesc.ar,
      descEn: t.pushNotificationsDesc.en,
    },
    {
      key: "smsNotifications" as const,
      labelAr: t.smsNotifications.ar,
      labelEn: t.smsNotifications.en,
      descAr: t.smsNotificationsDesc.ar,
      descEn: t.smsNotificationsDesc.en,
    },
    {
      key: "emailNotifications" as const,
      labelAr: t.emailNotifications.ar,
      labelEn: t.emailNotifications.en,
      descAr: t.emailNotificationsDesc.ar,
      descEn: t.emailNotificationsDesc.en,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={cn(isAr ? "text-right" : "text-left")}>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          {lang(t.title)}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {lang(t.subtitle)}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-surface-200 dark:border-surface-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
              activeTab === tab.key
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">
              {isAr ? tab.labelAr : tab.labelEn}
            </span>
          </button>
        ))}
      </div>

      {/* Profile Settings */}
      {activeTab === "profile" && (
        <div className="glass p-6 md:p-8">
          <SectionHeader
            title={lang(t.profileTitle)}
            description={lang(t.profileDesc)}
            icon={
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
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.fullName)}
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                placeholder={
                  isAr ? "مثال: Ahmed Mohamed" : "e.g. Ahmed Mohamed"
                }
                dir="ltr"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.fullNameAr)}
              </label>
              <input
                type="text"
                value={profile.nameAr}
                onChange={(e) =>
                  setProfile({ ...profile, nameAr: e.target.value })
                }
                className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                placeholder="أحمد محمد"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.phone)}
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                placeholder="05xxxxxxxx"
                dir="ltr"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.email)}
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                placeholder="supervisor@tamamfleet.com"
                dir="ltr"
                disabled
              />
            </div>
            {/* Additional fields disabled and empty */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.employeeId)}
              </label>
              <input
                type="text"
                value={profile.employeeId}
                onChange={(e) =>
                  setProfile({ ...profile, employeeId: e.target.value })
                }
                className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                placeholder="EMP-001"
                dir="ltr"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.department)}
              </label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) =>
                  setProfile({ ...profile, department: e.target.value })
                }
                className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                placeholder={isAr ? "عمليات الأسطول" : "Fleet Operations"}
                disabled
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.region)}
              </label>
              <input
                type="text"
                value={profile.region}
                onChange={(e) =>
                  setProfile({ ...profile, region: e.target.value })
                }
                className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-transparent focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                placeholder={isAr ? "القاهرة" : "Cairo"}
                disabled
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
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
                  {lang(t.saving)}
                </>
              ) : (
                lang(t.saveChanges)
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="glass p-6 md:p-8">
          <SectionHeader
            title={lang(t.notificationsTitle)}
            description={lang(t.notificationsDesc)}
            icon={
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
            }
          />

          <div className="space-y-4">
            {notificationItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-100 dark:bg-surface-800"
              >
                <div
                  className={cn("min-w-0", isAr ? "text-right" : "text-left")}
                >
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {isAr ? item.labelAr : item.labelEn}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
                <ToggleSwitch
                  checked={notifications[item.key]}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, [item.key]: checked })
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <h4
              className={cn(
                "text-sm font-semibold text-surface-700 dark:text-surface-300",
                isAr ? "text-right" : "text-left",
              )}
            >
              {lang(t.notificationChannels)}
            </h4>
            {channelItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-100 dark:bg-surface-800"
              >
                <div
                  className={cn("min-w-0", isAr ? "text-right" : "text-left")}
                >
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {isAr ? item.labelAr : item.labelEn}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
                <ToggleSwitch
                  checked={notifications[item.key]}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, [item.key]: checked })
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
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
                  </svg>{" "}
                  {lang(t.saving)}
                </>
              ) : (
                lang(t.saveChanges)
              )}
            </button>
          </div>
        </div>
      )}

      {/* Appearance */}
      {activeTab === "appearance" && (
        <div className="glass p-6 md:p-8">
          <SectionHeader
            title={lang(t.appearanceTitle)}
            description={lang(t.appearanceDesc)}
            icon={
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
                  d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                />
              </svg>
            }
          />

          {/* Theme Mode */}
          <div className="mb-6">
            <h4
              className={cn(
                "text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3",
                isAr ? "text-right" : "text-left",
              )}
            >
              {lang(t.themeSection)}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setTheme(mode.key)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    themeMode === mode.key
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                      : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600",
                  )}
                >
                  {mode.icon}
                  <span className="text-sm font-medium">
                    {isAr ? mode.labelAr : mode.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Colors */}
          <div>
            <h4
              className={cn(
                "text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3",
                isAr ? "text-right" : "text-left",
              )}
            >
              {lang(t.accentSection)}
            </h4>
            <div
              className={cn(
                "flex gap-3",
                isAr ? "justify-end" : "justify-start",
              )}
            >
              {availableAccents.map((config) => (
                <button
                  key={config.name}
                  onClick={() => setAccent(config.name as AccentColor)}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all duration-200",
                    "hover:scale-110",
                    accent === config.name &&
                      "ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-surface-950 scale-110",
                  )}
                  style={{ backgroundColor: config.primary }}
                  title={isAr ? config.nameAr : config.name}
                  aria-label={`${lang(t.changeAccent)} ${isAr ? config.nameAr : config.name}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
