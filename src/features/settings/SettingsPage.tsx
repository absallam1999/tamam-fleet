import { useState, useCallback, useEffect, useMemo } from "react";
import { useFleet } from "@app/providers/FleetProvider";
import { useAuth } from "@app/providers/AuthProvider";
import {
  useTheme,
  type AccentColor,
  type ThemeMode,
} from "@app/providers/ThemeProvider";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/shared/hooks/useFleetNotifications";
import { cn } from "@shared/utils/cn";
import type { NotificationPreferencesDto } from "@shared/types";

/**
 * SettingsPage — Fleet Supervisor Settings Management
 */

// ============================================
// Translations
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
  profileReadOnlyTitle: {
    ar: "الحقول التالية للقراءة فقط",
    en: "These fields are read-only",
  },
  profileReadOnlyDesc: {
    ar: "لا يمكن تعديل بيانات الملف الشخصي من هنا. للقيام بتحديث بياناتك، يرجى التواصل مع المسؤول.",
    en: "Profile information cannot be edited here. To update your details, please contact your administrator.",
  },
  refreshProfile: { ar: "تحديث البيانات", en: "Refresh Data" },

  notificationsTitle: {
    ar: "تفضيلات الإشعارات",
    en: "Notification Preferences",
  },
  notificationsDesc: {
    ar: "تحكم في الإشعارات التي تصلك عن نشاط الأسطول",
    en: "Control notifications about fleet activity",
  },
  notifChannels: { ar: "قنوات الإشعارات", en: "Notification Channels" },
  notifContent: {
    ar: "ماذا تريد أن تصلك إشعاراته؟",
    en: "What to notify you about",
  },
  quietHours: { ar: "ساعات الهدوء", en: "Quiet Hours" },
  quietHoursDesc: {
    ar: "لن تصلك إشعارات خلال هذه الفترة",
    en: "You won't receive notifications during this window",
  },
  quietHoursFrom: { ar: "من", en: "From" },
  quietHoursTo: { ar: "إلى", en: "To" },
  notifLoadError: {
    ar: "فشل تحميل تفضيلات الإشعارات",
    en: "Failed to load notification preferences",
  },
  retry: { ar: "إعادة المحاولة", en: "Retry" },

  pushEnabled: { ar: "إشعارات التطبيق", en: "Push Notifications" },
  pushEnabledDesc: {
    ar: "إشعارات فورية داخل لوحة التحكم",
    en: "Instant in-dashboard notifications",
  },
  emailEnabled: { ar: "البريد الإلكتروني", en: "Email" },
  emailEnabledDesc: {
    ar: "تلقي ملخصات وتقارير عبر البريد الإلكتروني",
    en: "Receive summaries and reports via email",
  },
  smsEnabled: { ar: "رسائل SMS", en: "SMS Messages" },
  smsEnabledDesc: {
    ar: "تلقي إشعارات عبر الرسائل النصية",
    en: "Receive notifications via SMS",
  },
  orderUpdates: { ar: "تحديثات الطلبات", en: "Order Updates" },
  orderUpdatesDesc: {
    ar: "عند تعيين أو استلام أو إكمال أو إلغاء طلب",
    en: "When an order is assigned, picked up, delivered, or cancelled",
  },
  chatMessages: { ar: "رسائل الدردشة", en: "Chat Messages" },
  chatMessagesDesc: {
    ar: "عند استلام رسالة جديدة في الدردشة",
    en: "When you receive a new chat message",
  },
  systemAlerts: { ar: "تنبيهات النظام", en: "System Alerts" },
  systemAlertsDesc: {
    ar: "تنبيهات مهمة عن حالة النظام والحساب",
    en: "Important alerts about system and account status",
  },
  promotions: { ar: "العروض والترقيات", en: "Promotions & Offers" },
  promotionsDesc: {
    ar: "أخبار وعروض من الفريق",
    en: "News and offers from the team",
  },

  appearanceTitle: { ar: "المظهر", en: "Appearance" },
  appearanceDesc: {
    ar: "تخصيص مظهر لوحة التحكم حسب تفضيلاتك",
    en: "Customize your dashboard appearance",
  },
  themeSection: { ar: "المظهر", en: "Theme" },
  themeLight: { ar: "فاتح", en: "Light" },
  themeDark: { ar: "داكن", en: "Dark" },
  themeSystem: { ar: "النظام", en: "System" },
  accentSection: { ar: "لون التمييز", en: "Accent Color" },
  changeAccent: { ar: "تغيير اللون إلى", en: "Change color to" },

  // Profile display labels
  fullName: { ar: "الاسم الكامل", en: "Full Name" },
  phone: { ar: "رقم الهاتف", en: "Phone Number" },
  email: { ar: "البريد الإلكتروني", en: "Email Address" },
  city: { ar: "المدينة", en: "City" },
  verificationStatus: { ar: "حالة التوثيق", en: "Verification Status" },
  accountStatus: { ar: "حالة الحساب", en: "Account Status" },
  memberSince: { ar: "عضو منذ", en: "Member Since" },
  verified: { ar: "موثّق", en: "Verified" },
  notVerified: { ar: "غير موثّق", en: "Not Verified" },
  active: { ar: "نشط", en: "Active" },
  inactive: { ar: "غير نشط", en: "Inactive" },
  notSet: { ar: "غير محدد", en: "Not set" },

  saveChanges: { ar: "حفظ التغييرات", en: "Save Changes" },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  saveSuccess: {
    ar: "تم حفظ الإعدادات بنجاح",
    en: "Settings saved successfully",
  },
  saveError: { ar: "فشل حفظ الإعدادات", en: "Failed to save settings" },
  saveErrorDesc: { ar: "يرجى المحاولة مرة أخرى", en: "Please try again" },
} as const;

// ============================================
// TimeSpan helpers
// ============================================

const timeSpanToHHMM = (ts: string | null | undefined): string => {
  if (!ts || typeof ts !== "string") return "00:00";
  return ts.slice(0, 5);
};

const hhmmToTimeSpan = (hhmm: string): string => {
  if (!hhmm) return "00:00:00";
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
};

// ============================================
// Section Header Component
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
// Toggle Switch Component
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
// Info Banner
// ============================================

const InfoBanner: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <div className="rounded-xl p-4 flex items-start gap-3 bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20">
    <div className="w-8 h-8 rounded-lg bg-info-100 dark:bg-info-500/20 flex items-center justify-center flex-shrink-0 text-info-600 dark:text-info-400">
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
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
    </div>
    <div>
      <p className="text-sm font-semibold text-info-800 dark:text-info-300">
        {title}
      </p>
      <p className="text-xs text-info-700 dark:text-info-400 mt-1 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

// ============================================
// SettingsPage — Main Component
// ============================================

export const SettingsPage: React.FC = () => {
  const { supervisor, refreshDashboard } = useFleet();
  const { user } = useAuth();
  const {
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

  // ── Profile (read-only) ──
  const profile = useMemo(
    () => ({
      name: supervisor?.fullName ?? user?.fullName ?? "",
      phone: supervisor?.phoneNumber ?? user?.phoneNumber ?? "",
      email: supervisor?.email ?? user?.email ?? "",
      city:
        supervisor?.cityName ?? supervisor?.cityEn ?? supervisor?.cityAr ?? "",
      isVerified: supervisor?.isVerified ?? false,
      isActive: supervisor?.isActive ?? true,
      createdAt: supervisor?.createdAt ?? null,
    }),
    [supervisor, user],
  );

  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);

  const handleRefreshProfile = useCallback(async () => {
    setIsRefreshingProfile(true);
    try {
      await refreshDashboard();
      toast.success(isAr ? "تم تحديث البيانات" : "Data refreshed successfully");
    } catch {
      toast.error(lang(t.saveError));
    } finally {
      setIsRefreshingProfile(false);
    }
  }, [refreshDashboard, toast, isAr]);

  // ── Notifications ──
  const {
    data: prefsFromApi,
    isLoading: prefsLoading,
    isError: prefsError,
    refetch: refetchPrefs,
  } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const [notifForm, setNotifForm] = useState<NotificationPreferencesDto | null>(
    null,
  );

  // Sync form state from API
  useEffect(() => {
    if (prefsFromApi) setNotifForm(prefsFromApi);
  }, [prefsFromApi]);

  const handleSaveNotifications = useCallback(async () => {
    if (!notifForm) return;
    try {
      await updatePrefs.mutateAsync(notifForm);
      toast.success(lang(t.saveSuccess));
    } catch (err) {
      toast.error(lang(t.saveError), {
        description: err instanceof Error ? err.message : lang(t.saveErrorDesc),
      });
    }
  }, [notifForm, updatePrefs, toast, isAr]);

  const patchNotif = <K extends keyof NotificationPreferencesDto>(
    key: K,
    value: NotificationPreferencesDto[K],
  ) => {
    setNotifForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  // ── Tabs configuration ──
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

  // Channels
  const channelItems = [
    {
      key: "pushEnabled" as const,
      labelAr: t.pushEnabled.ar,
      labelEn: t.pushEnabled.en,
      descAr: t.pushEnabledDesc.ar,
      descEn: t.pushEnabledDesc.en,
    },
    {
      key: "emailEnabled" as const,
      labelAr: t.emailEnabled.ar,
      labelEn: t.emailEnabled.en,
      descAr: t.emailEnabledDesc.ar,
      descEn: t.emailEnabledDesc.en,
    },
    {
      key: "smsEnabled" as const,
      labelAr: t.smsEnabled.ar,
      labelEn: t.smsEnabled.en,
      descAr: t.smsEnabledDesc.ar,
      descEn: t.smsEnabledDesc.en,
    },
  ];

  // Content
  const contentItems = [
    {
      key: "orderUpdates" as const,
      labelAr: t.orderUpdates.ar,
      labelEn: t.orderUpdates.en,
      descAr: t.orderUpdatesDesc.ar,
      descEn: t.orderUpdatesDesc.en,
    },
    {
      key: "chatMessages" as const,
      labelAr: t.chatMessages.ar,
      labelEn: t.chatMessages.en,
      descAr: t.chatMessagesDesc.ar,
      descEn: t.chatMessagesDesc.en,
    },
    {
      key: "systemAlerts" as const,
      labelAr: t.systemAlerts.ar,
      labelEn: t.systemAlerts.en,
      descAr: t.systemAlertsDesc.ar,
      descEn: t.systemAlertsDesc.en,
    },
    {
      key: "promotions" as const,
      labelAr: t.promotions.ar,
      labelEn: t.promotions.en,
      descAr: t.promotionsDesc.ar,
      descEn: t.promotionsDesc.en,
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

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PROFILE TAB — READ-ONLY, real data from GET /api/supervisor/profile */}
      {/* ═══════════════════════════════════════════════════════════ */}
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

          {/* Read-only info banner */}
          <div className="mb-6">
            <InfoBanner
              title={lang(t.profileReadOnlyTitle)}
              description={lang(t.profileReadOnlyDesc)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <ReadOnlyField
              label={lang(t.fullName)}
              value={profile.name}
              dir="auto"
            />

            {/* Phone */}
            <ReadOnlyField
              label={lang(t.phone)}
              value={profile.phone}
              dir="ltr"
            />

            {/* Email */}
            <ReadOnlyField
              label={lang(t.email)}
              value={profile.email}
              dir="ltr"
            />

            {/* City */}
            <ReadOnlyField
              label={lang(t.city)}
              value={profile.city || lang(t.notSet)}
            />

            {/* Verification Status */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.verificationStatus)}
              </label>
              <div className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 flex items-center justify-between">
                <span className="text-sm text-surface-900 dark:text-surface-100">
                  {profile.isVerified ? lang(t.verified) : lang(t.notVerified)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
                    profile.isVerified
                      ? "bg-success-100 dark:bg-success-500/10 text-success-700 dark:text-success-400"
                      : "bg-warning-100 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      profile.isVerified ? "bg-success-500" : "bg-warning-500",
                    )}
                  />
                  {profile.isVerified ? lang(t.verified) : lang(t.notVerified)}
                </span>
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.accountStatus)}
              </label>
              <div className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 flex items-center justify-between">
                <span className="text-sm text-surface-900 dark:text-surface-100">
                  {profile.isActive ? lang(t.active) : lang(t.inactive)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
                    profile.isActive
                      ? "bg-success-100 dark:bg-success-500/10 text-success-700 dark:text-success-400"
                      : "bg-error-100 dark:bg-error-500/10 text-error-700 dark:text-error-400",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      profile.isActive ? "bg-success-500" : "bg-error-500",
                    )}
                  />
                  {profile.isActive ? lang(t.active) : lang(t.inactive)}
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.memberSince)}
              </label>
              <div className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-sm text-surface-900 dark:text-surface-100">
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString(
                      isAr ? "ar-EG" : "en-US",
                      { year: "numeric", month: "long", day: "numeric" },
                    )
                  : lang(t.notSet)}
              </div>
            </div>
          </div>

          {/* Refresh action (no Save — nothing to save) */}
          <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
            <button
              onClick={handleRefreshProfile}
              disabled={isRefreshingProfile}
              className="btn btn-primary"
            >
              {isRefreshingProfile ? (
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
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                    />
                  </svg>
                  {lang(t.refreshProfile)}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* NOTIFICATIONS TAB — REAL API (GET/PUT /api/notifications/preferences) */}
      {/* ═══════════════════════════════════════════════════════════ */}
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

          {prefsLoading || !notifForm ? (
            <NotificationSkeleton />
          ) : prefsError ? (
            <div className="rounded-xl p-6 bg-error-50 dark:bg-error-950/20 border border-error-200 dark:border-error-800/40 text-center">
              <p className="text-sm text-error-700 dark:text-error-400 mb-3">
                {lang(t.notifLoadError)}
              </p>
              <button
                onClick={() => refetchPrefs()}
                className="btn btn-sm btn-primary"
              >
                {lang(t.retry)}
              </button>
            </div>
          ) : (
            <>
              {/* Channels */}
              <div className="space-y-3">
                <h4
                  className={cn(
                    "text-sm font-semibold text-surface-700 dark:text-surface-300",
                    isAr ? "text-right" : "text-left",
                  )}
                >
                  {lang(t.notifChannels)}
                </h4>
                {channelItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-100 dark:bg-surface-800"
                  >
                    <div
                      className={cn(
                        "min-w-0",
                        isAr ? "text-right" : "text-left",
                      )}
                    >
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {isAr ? item.labelAr : item.labelEn}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {isAr ? item.descAr : item.descEn}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={Boolean(notifForm[item.key])}
                      onChange={(checked) => patchNotif(item.key, checked)}
                      disabled={updatePrefs.isPending}
                    />
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="mt-6 space-y-3">
                <h4
                  className={cn(
                    "text-sm font-semibold text-surface-700 dark:text-surface-300",
                    isAr ? "text-right" : "text-left",
                  )}
                >
                  {lang(t.notifContent)}
                </h4>
                {contentItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-100 dark:bg-surface-800"
                  >
                    <div
                      className={cn(
                        "min-w-0",
                        isAr ? "text-right" : "text-left",
                      )}
                    >
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {isAr ? item.labelAr : item.labelEn}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {isAr ? item.descAr : item.descEn}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={Boolean(notifForm[item.key])}
                      onChange={(checked) => patchNotif(item.key, checked)}
                      disabled={updatePrefs.isPending}
                    />
                  </div>
                ))}
              </div>

              {/* Quiet Hours */}
              <div className="mt-6 space-y-3">
                <h4
                  className={cn(
                    "text-sm font-semibold text-surface-700 dark:text-surface-300",
                    isAr ? "text-right" : "text-left",
                  )}
                >
                  {lang(t.quietHours)}
                </h4>
                <div className="p-4 rounded-xl bg-surface-100 dark:bg-surface-800">
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className={cn(
                        "min-w-0",
                        isAr ? "text-right" : "text-left",
                      )}
                    >
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {lang(t.quietHours)}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {lang(t.quietHoursDesc)}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={Boolean(notifForm.quietHoursEnabled)}
                      onChange={(checked) =>
                        patchNotif("quietHoursEnabled", checked)
                      }
                      disabled={updatePrefs.isPending}
                    />
                  </div>

                  {notifForm.quietHoursEnabled && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-surface-600 dark:text-surface-400">
                          {lang(t.quietHoursFrom)}
                        </label>
                        <input
                          type="time"
                          value={timeSpanToHHMM(notifForm.quietHoursFrom)}
                          onChange={(e) =>
                            patchNotif(
                              "quietHoursFrom",
                              hhmmToTimeSpan(e.target.value),
                            )
                          }
                          disabled={updatePrefs.isPending}
                          className="w-full rounded-lg py-2 px-3 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-surface-600 dark:text-surface-400">
                          {lang(t.quietHoursTo)}
                        </label>
                        <input
                          type="time"
                          value={timeSpanToHHMM(notifForm.quietHoursTo)}
                          onChange={(e) =>
                            patchNotif(
                              "quietHoursTo",
                              hhmmToTimeSpan(e.target.value),
                            )
                          }
                          disabled={updatePrefs.isPending}
                          className="w-full rounded-lg py-2 px-3 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Save */}
              <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
                <button
                  onClick={handleSaveNotifications}
                  disabled={updatePrefs.isPending}
                  className="btn btn-primary"
                >
                  {updatePrefs.isPending ? (
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
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* APPEARANCE TAB — already persists via ThemeProvider (localStorage) */}
      {/* ═══════════════════════════════════════════════════════════ */}
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

// ============================================
// Small helper components
// ============================================

const ReadOnlyField: React.FC<{
  label: string;
  value: string;
  dir?: "ltr" | "rtl" | "auto";
}> = ({ label, value, dir }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
      {label}
    </label>
    <input
      type="text"
      value={value}
      readOnly
      dir={dir}
      className="w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-transparent text-sm cursor-not-allowed"
    />
  </div>
);

const NotificationSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <div
        key={i}
        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-100 dark:bg-surface-800"
      >
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-64 rounded" />
        </div>
        <div className="skeleton h-6 w-11 rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
);

export default SettingsPage;
