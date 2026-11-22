import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@app/providers/AuthProvider";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import { cn } from "@shared/utils/cn";
import type {
  RegisterSupervisorCredentials,
  OnboardingSubmissionResult,
} from "@app/providers/AuthProvider";
import type { CityListDto } from "@shared/types";

// ============================================
// Types
// ============================================

interface RegisterFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  notes: string;
}

interface ValidationErrors {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  city?: string;
  areas?: string;
  notes?: string;
}

/** Normalized city-area row (the exact shape isn't in swagger yet — be defensive). */
interface CityAreaOption {
  id: string;
  name: string;
}

// ============================================
// Constants
// ============================================

const NOTES_MAX = 500;
const NAME_MIN = 2;
const NAME_MAX = 100;
const EMAIL_MAX = 200;
const PHONE_MAX = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Egyptian mobile numbers:
 *   010xxxxxxxx, 011xxxxxxxx, 012xxxxxxxx, 015xxxxxxxx
 * Accepts optional +20 or 0020 prefix, or bare 0 / no prefix.
 */
const EGYPTIAN_PHONE_RE = /^(?:\+20|0020|0)?1[0125]\d{8}$/;

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "التسجيل كمشرف", en: "Register as Supervisor" },
  subtitle: {
    ar: "قدم طلبك للانضمام إلى فريق مشرفي الأسطول",
    en: "Apply to join our fleet supervisor team",
  },
  fullName: { ar: "الاسم الكامل", en: "Full Name" },
  fullNamePlaceholder: { ar: "أحمد محمد", en: "Ahmed Mohamed" },
  phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
  phoneNumberPlaceholder: { ar: "01012345678", en: "01012345678" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  emailPlaceholder: { ar: "you@example.com", en: "you@example.com" },
  city: { ar: "المدينة", en: "City" },
  cityPlaceholder: { ar: "اختر المدينة", en: "Select a city" },
  areas: { ar: "المناطق", en: "Areas" },
  areasHint: {
    ar: "اختر منطقة واحدة على الأقل",
    en: "Select at least one area",
  },
  areasSelected: { ar: "منطقة مختارة", en: "selected" },
  selectCityFirst: {
    ar: "اختر المدينة أولاً لعرض المناطق المتاحة",
    en: "Select a city first to view available areas",
  },
  loadingCities: { ar: "جاري تحميل المدن...", en: "Loading cities..." },
  loadingAreas: { ar: "جاري تحميل المناطق...", en: "Loading areas..." },
  noCities: {
    ar: "لا توجد مدن متاحة حالياً",
    en: "No cities available right now",
  },
  noAreas: {
    ar: "لا توجد مناطق متاحة لهذه المدينة",
    en: "No areas available for this city",
  },
  areasLoadError: {
    ar: "فشل تحميل المناطق. حاول مرة أخرى",
    en: "Failed to load areas. Please try again",
  },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  notes: { ar: "ملاحظات (اختياري)", en: "Notes (optional)" },
  notesPlaceholder: {
    ar: "أي معلومات إضافية تود إخبارنا بها...",
    en: "Anything else you'd like to share...",
  },
  optional: { ar: "اختياري", en: "Optional" },
  submit: { ar: "إرسال الطلب", en: "Submit Application" },
  submitting: { ar: "جاري إرسال الطلب...", en: "Submitting..." },

  // Success view
  successTitle: { ar: "تم استلام طلبك!", en: "Application Received!" },
  successSubtitle: {
    ar: "سنراجع طلبك ونعلمك بالقرار",
    en: "We'll review your application and notify you of the decision",
  },
  applicationId: { ar: "رقم الطلب", en: "Application ID" },
  reviewTime: {
    ar: "وقت المراجعة المتوقع: 24-48 ساعة",
    en: "Expected review time: 24–48 hours",
  },
  notificationInfo: {
    ar: "ستتلقى رسالة نصية على رقم هاتفك فور الموافقة على طلبك",
    en: "You'll receive an SMS at your phone number once approved",
  },
  backToLogin: { ar: "العودة لتسجيل الدخول", en: "Back to Sign In" },

  // Navigation
  orDivider: { ar: "أو", en: "or" },
  haveAccount: { ar: "لديك حساب بالفعل؟", en: "Already have an account?" },
  signIn: { ar: "تسجيل الدخول", en: "Sign In" },

  // Errors
  errorMessage: { ar: "فشل إرسال الطلب", en: "Failed to submit application" },
  rateLimitTitle: { ar: "طلبات كثيرة جداً", en: "Too many requests" },
  rateLimitMessage: {
    ar: "لقد تجاوزت عدد المحاولات المسموح بها. يرجى المحاولة بعد بضع دقائق.",
    en: "You've exceeded the allowed number of attempts. Please try again in a few minutes.",
  },
  closeAlert: { ar: "إغلاق", en: "Close" },

  // Validation
  validation: {
    fullNameRequired: {
      ar: "الاسم الكامل مطلوب",
      en: "Full name is required",
    },
    fullNameLength: {
      ar: "الاسم يجب أن يكون بين حرفين و100 حرف",
      en: "Name must be between 2 and 100 characters",
    },
    phoneNumberRequired: {
      ar: "رقم الهاتف مطلوب",
      en: "Phone number is required",
    },
    phoneNumberInvalid: {
      ar: "يرجى إدخال رقم هاتف مصري صحيح (مثل 01012345678)",
      en: "Please enter a valid Egyptian phone number (e.g., 01012345678)",
    },
    emailInvalid: {
      ar: "يرجى إدخال بريد إلكتروني صحيح",
      en: "Please enter a valid email address",
    },
    cityRequired: { ar: "المدينة مطلوبة", en: "City is required" },
    areasRequired: {
      ar: "يجب اختيار منطقة واحدة على الأقل",
      en: "Please select at least one area",
    },
    notesTooLong: {
      ar: "الملاحظات يجب ألا تتجاوز 500 حرف",
      en: "Notes must not exceed 500 characters",
    },
  },
};

// ============================================
// Component
// ============================================

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { currentLanguage } = useLanguage();
  const toast = useToast();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    notes: "",
  });
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );
  const [result, setResult] = useState<OnboardingSubmissionResult | null>(null);

  // ---------- Cities query ----------
  const {
    data: cities = [],
    isLoading: isLoadingCities,
    isError: isCitiesError,
  } = useQuery<CityListDto[]>({
    queryKey: ["onboarding-cities"],
    queryFn: async () => {
      const response = await apiClient.get<CityListDto[]>(
        ENDPOINTS.CITIES.LOOKUP,
        undefined,
        true, // public
      );
      const list = Array.isArray(response.data) ? response.data : [];
      return list.filter((c) => c.isActive);
    },
    staleTime: 5 * 60 * 1000,
  });

  // ---------- Areas for selected city ----------
  const {
    data: areas = [],
    isLoading: isLoadingAreas,
    isError: isAreasError,
    refetch: refetchAreas,
  } = useQuery<CityAreaOption[]>({
    queryKey: ["onboarding-city-areas", selectedCityId],
    queryFn: async () => {
      if (!selectedCityId) return [];
      const response = await apiClient.get<unknown>(
        ENDPOINTS.CITIES.AREAS(selectedCityId),
        undefined,
        true,
      );
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : [];
      // Normalize across possible backend shapes
      return list
        .map((a: any) => ({
          id: String(a.id ?? a.areaId ?? ""),
          name: String(
            a.name ?? a.areaName ?? a.nameEn ?? a.nameAr ?? "",
          ).trim(),
        }))
        .filter((a) => a.id && a.name);
    },
    enabled: !!selectedCityId,
    staleTime: 5 * 60 * 1000,
  });

  // ---------- Handlers ----------

  const handleChange = (field: keyof RegisterFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const u = { ...prev };
        delete u[field];
        return u;
      });
    }
    if (serverError) setServerError(null);
  };

  const handleBlur = (field: string): void => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleCityChange = (cityId: string): void => {
    setSelectedCityId(cityId);
    setSelectedAreaIds([]); // Areas belong to a specific city — reset
    if (validationErrors.city) {
      setValidationErrors((prev) => {
        const u = { ...prev };
        delete u.city;
        return u;
      });
    }
  };

  const toggleArea = (areaId: string): void => {
    setSelectedAreaIds((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId],
    );
    if (validationErrors.areas) {
      setValidationErrors((prev) => {
        const u = { ...prev };
        delete u.areas;
        return u;
      });
    }
  };

  // ---------- Validation ----------
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    const name = formData.fullName.trim();
    if (!name) errors.fullName = lang(t.validation.fullNameRequired);
    else if (name.length < NAME_MIN || name.length > NAME_MAX)
      errors.fullName = lang(t.validation.fullNameLength);

    const phone = formData.phoneNumber.trim().replace(/[\s\-()]/g, "");
    if (!phone) errors.phoneNumber = lang(t.validation.phoneNumberRequired);
    else if (phone.length > PHONE_MAX || !EGYPTIAN_PHONE_RE.test(phone))
      errors.phoneNumber = lang(t.validation.phoneNumberInvalid);

    const email = formData.email.trim();
    if (email && (email.length > EMAIL_MAX || !EMAIL_RE.test(email)))
      errors.email = lang(t.validation.emailInvalid);

    if (!selectedCityId) errors.city = lang(t.validation.cityRequired);
    if (selectedAreaIds.length === 0)
      errors.areas = lang(t.validation.areasRequired);

    if (formData.notes.length > NOTES_MAX)
      errors.notes = lang(t.validation.notesTooLong);

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------- Submit ----------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setTouchedFields({
      fullName: true,
      phoneNumber: true,
      email: true,
      city: true,
      areas: true,
      notes: true,
    });
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload: RegisterSupervisorCredentials = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim().replace(/[\s\-()]/g, ""),
        email: formData.email.trim(), // "" if empty — matches API minLength:0
        areaIds: selectedAreaIds,
        notes: formData.notes.trim() || undefined,
      };

      const submission = await register(payload);

      setResult(submission);
      toast.success(submission.message || lang(t.successTitle));
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : lang(t.errorMessage);

      const isRateLimit = /too many|rate.?limit|429|كثير/i.test(rawMessage);
      const message = isRateLimit ? lang(t.rateLimitMessage) : rawMessage;

      setServerError(message);
      toast.error(isRateLimit ? lang(t.rateLimitTitle) : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClasses = (hasError: boolean) =>
    cn(
      "w-full py-3 rounded-xl",
      "bg-surface-100 dark:bg-surface-800",
      "text-surface-900 dark:text-surface-100",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "border-2 transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "text-sm",
      hasError
        ? "border-error-400 dark:border-error-500 focus:border-error-500 focus:ring-4 focus:ring-error-500/15"
        : "border-transparent focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15 dark:focus:ring-primary-400/15",
    );

  // ============================================
  // Success State
  // ============================================
  if (result) {
    return (
      <div className="w-full animate-fade-in-up">
        <div className="text-center mb-6">
          <div
            className={cn(
              "mx-auto w-20 h-20 rounded-full",
              "bg-success-100 dark:bg-success-950/40",
              "flex items-center justify-center",
              "mb-6",
            )}
          >
            <svg
              className="w-10 h-10 text-success-600 dark:text-success-400"
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
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.successTitle)}
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 max-w-sm mx-auto">
            {result.message || lang(t.successSubtitle)}
          </p>
        </div>

        <div
          className={cn(
            "rounded-2xl p-5 mb-5",
            "bg-surface-100 dark:bg-surface-800/60",
            "border border-surface-200 dark:border-surface-700",
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
              {lang(t.applicationId)}
            </span>
            <span
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold",
                "bg-warning-100 dark:bg-warning-950/40",
                "text-warning-700 dark:text-warning-400",
                "capitalize",
              )}
            >
              {result.status}
            </span>
          </div>
          <p
            className="text-sm font-mono text-surface-700 dark:text-surface-300 break-all"
            dir="ltr"
          >
            {result.requestId}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div
            className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl",
              "bg-info-50 dark:bg-info-950/30",
              "border border-info-200 dark:border-info-800/50",
            )}
          >
            <svg
              className="w-5 h-5 text-info-500 flex-shrink-0 mt-0.5"
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
            <p className="text-sm text-info-800 dark:text-info-300 leading-relaxed">
              {lang(t.reviewTime)}
            </p>
          </div>

          <div
            className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl",
              "bg-surface-100 dark:bg-surface-800/60",
              "border border-surface-200 dark:border-surface-700",
            )}
          >
            <svg
              className="w-5 h-5 text-surface-500 dark:text-surface-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
              {lang(t.notificationInfo)}
            </p>
          </div>
        </div>

        <Link
          to="/auth/login"
          className={cn(
            "w-full py-3 px-6 rounded-xl text-white font-semibold text-sm",
            "bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
            "shadow-lg shadow-primary-600/25",
            "transition-all duration-200 active:scale-[0.98]",
            "flex items-center justify-center gap-2.5",
          )}
        >
          <svg
            className={cn("w-5 h-5", isAr && "scale-x-[-1]")}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          <span>{lang(t.backToLogin)}</span>
        </Link>
      </div>
    );
  }

  // ============================================
  // Form State
  // ============================================
  return (
    <div className="w-full animate-fade-in-up">
      <div
        className={cn(
          "mb-8 text-center",
          isAr ? "lg:text-right" : "lg:text-left",
        )}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
          {lang(t.title)}
        </h1>
        <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
          {lang(t.subtitle)}
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className={cn(
            "mb-6 p-4 rounded-xl animate-fade-in",
            "bg-error-50 dark:bg-error-950/30",
            "border border-error-200 dark:border-error-800/50",
            "flex items-start gap-3",
          )}
        >
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
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-error-700 dark:text-error-400">
              {serverError}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="text-error-400 hover:text-error-500 dark:hover:text-error-300 transition-colors flex-shrink-0"
            aria-label={lang(t.closeAlert)}
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-name"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.fullName)}
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                validationErrors.fullName && touchedFields.fullName
                  ? "text-error-400"
                  : "text-surface-400 dark:text-surface-500",
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
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
            <input
              id="register-name"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              onBlur={() => handleBlur("fullName")}
              placeholder={lang(t.fullNamePlaceholder)}
              autoComplete="name"
              maxLength={NAME_MAX}
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(
                  !!validationErrors.fullName && !!touchedFields.fullName,
                ),
                isAr ? "pr-11 pl-4" : "pl-11 pr-4",
              )}
            />
          </div>
          {validationErrors.fullName && touchedFields.fullName && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.fullName}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-phone"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.phoneNumber)}
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                validationErrors.phoneNumber && touchedFields.phoneNumber
                  ? "text-error-400"
                  : "text-surface-400 dark:text-surface-500",
              )}
            >
              <svg
                className={cn("w-5 h-5", isAr && "scale-x-[-1]")}
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
            <input
              id="register-phone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              onBlur={() => handleBlur("phoneNumber")}
              placeholder={lang(t.phoneNumberPlaceholder)}
              autoComplete="tel"
              dir="ltr"
              maxLength={PHONE_MAX}
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(
                  !!validationErrors.phoneNumber && !!touchedFields.phoneNumber,
                ),
                isAr ? "pr-11 pl-4" : "pl-11 pr-4",
              )}
            />
          </div>
          {validationErrors.phoneNumber && touchedFields.phoneNumber && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.phoneNumber}
            </p>
          )}
        </div>

        {/* Email (optional) */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-email"
            className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.email)}
            <span className="text-[10px] font-normal text-surface-400 dark:text-surface-500">
              ({lang(t.optional)})
            </span>
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                validationErrors.email && touchedFields.email
                  ? "text-error-400"
                  : "text-surface-400 dark:text-surface-500",
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
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <input
              id="register-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder={lang(t.emailPlaceholder)}
              autoComplete="email"
              dir="ltr"
              maxLength={EMAIL_MAX}
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(
                  !!validationErrors.email && !!touchedFields.email,
                ),
                isAr ? "pr-11 pl-4" : "pl-11 pr-4",
              )}
            />
          </div>
          {validationErrors.email && touchedFields.email && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-city"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.city)}
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                validationErrors.city && touchedFields.city
                  ? "text-error-400"
                  : "text-surface-400 dark:text-surface-500",
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
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
            </div>
            <select
              id="register-city"
              value={selectedCityId}
              onChange={(e) => handleCityChange(e.target.value)}
              onBlur={() => handleBlur("city")}
              disabled={isSubmitting || isLoadingCities || isCitiesError}
              className={cn(
                inputBaseClasses(
                  !!validationErrors.city && !!touchedFields.city,
                ),
                isAr ? "pr-11 pl-10" : "pl-11 pr-10",
                "appearance-none cursor-pointer",
                (!selectedCityId || selectedCityId === "") &&
                  "text-surface-400 dark:text-surface-500",
              )}
            >
              <option value="">
                {isLoadingCities
                  ? lang(t.loadingCities)
                  : isCitiesError
                    ? lang(t.noCities)
                    : lang(t.cityPlaceholder)}
              </option>
              {cities.map((c) => {
                const displayName = isAr
                  ? (c.nameAr ?? c.nameEn ?? c.id)
                  : (c.nameEn ?? c.nameAr ?? c.id);
                return (
                  <option key={c.id} value={c.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none text-surface-400",
                isAr ? "left-3" : "right-3",
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
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>
          {validationErrors.city && touchedFields.city && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.city}
            </p>
          )}
        </div>

        {/* Areas — revealed after city selected */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              {lang(t.areas)}
            </label>
            {selectedAreaIds.length > 0 && (
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                {selectedAreaIds.length} {lang(t.areasSelected)}
              </span>
            )}
          </div>

          {!selectedCityId ? (
            <div
              className={cn(
                "w-full py-4 px-4 rounded-xl text-sm text-center",
                "bg-surface-100 dark:bg-surface-800/60",
                "border-2 border-dashed border-surface-200 dark:border-surface-700",
                "text-surface-400 dark:text-surface-500",
              )}
            >
              {lang(t.selectCityFirst)}
            </div>
          ) : isLoadingAreas ? (
            <div
              className={cn(
                "w-full py-4 px-4 rounded-xl text-sm text-center",
                "bg-surface-100 dark:bg-surface-800",
                "text-surface-500 dark:text-surface-400",
                "flex items-center justify-center gap-2",
              )}
            >
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
              {lang(t.loadingAreas)}
            </div>
          ) : isAreasError ? (
            <div
              className={cn(
                "w-full py-4 px-4 rounded-xl text-sm",
                "bg-error-50 dark:bg-error-950/30",
                "border-2 border-error-200 dark:border-error-800/50",
                "text-error-700 dark:text-error-400",
                "flex items-center justify-between gap-2",
              )}
            >
              <span>{lang(t.areasLoadError)}</span>
              <button
                type="button"
                onClick={() => refetchAreas()}
                className="text-xs font-semibold underline hover:no-underline"
              >
                {lang(t.retry)}
              </button>
            </div>
          ) : areas.length === 0 ? (
            <div
              className={cn(
                "w-full py-4 px-4 rounded-xl text-sm text-center",
                "bg-surface-100 dark:bg-surface-800/60",
                "border-2 border-dashed border-surface-200 dark:border-surface-700",
                "text-surface-400 dark:text-surface-500",
              )}
            >
              {lang(t.noAreas)}
            </div>
          ) : (
            <div
              className={cn(
                "w-full rounded-xl",
                "bg-surface-100 dark:bg-surface-800",
                "border-2 transition-all duration-200",
                validationErrors.areas && touchedFields.areas
                  ? "border-error-400 dark:border-error-500"
                  : "border-transparent",
                "max-h-64 overflow-y-auto",
                "divide-y divide-surface-200/60 dark:divide-surface-700/60",
              )}
            >
              {areas.map((area) => {
                const checked = selectedAreaIds.includes(area.id);
                return (
                  <label
                    key={area.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none",
                      "hover:bg-surface-50 dark:hover:bg-surface-700/40",
                      "transition-colors",
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleArea(area.id)}
                        disabled={isSubmitting}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                          checked
                            ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500"
                            : "border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900",
                        )}
                      >
                        {checked && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 12.75 6 6 9-13.5"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {area.name}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {validationErrors.areas && touchedFields.areas && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.areas}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="register-notes"
              className="block text-sm font-medium text-surface-700 dark:text-surface-300"
            >
              {lang(t.notes)}
            </label>
            <span
              className={cn(
                "text-xs tabular-nums",
                formData.notes.length > NOTES_MAX
                  ? "text-error-500 dark:text-error-400 font-medium"
                  : "text-surface-400 dark:text-surface-500",
              )}
            >
              {formData.notes.length} / {NOTES_MAX}
            </span>
          </div>
          <textarea
            id="register-notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            onBlur={() => handleBlur("notes")}
            placeholder={lang(t.notesPlaceholder)}
            rows={3}
            maxLength={NOTES_MAX + 50}
            disabled={isSubmitting}
            className={cn(
              inputBaseClasses(
                (!!validationErrors.notes && !!touchedFields.notes) ||
                  formData.notes.length > NOTES_MAX,
              ),
              "px-4 resize-none",
            )}
          />
          {validationErrors.notes && touchedFields.notes && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.notes}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full py-3 px-6 rounded-xl text-white font-semibold text-sm",
            "bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
            "shadow-lg shadow-primary-600/25",
            "transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]",
            "flex items-center justify-center gap-2.5",
          )}
        >
          {isSubmitting ? (
            <>
              <span>{lang(t.submitting)}</span>
              <svg
                className="w-5 h-5 animate-spin"
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
            </>
          ) : (
            <>
              <span>{lang(t.submit)}</span>
              <svg
                className={cn("w-5 h-5", isAr && "scale-x-[-1]")}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative pt-2">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-surface-200 dark:border-surface-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface-50 dark:bg-surface-950 px-3 text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
              {lang(t.orDivider)}
            </span>
          </div>
        </div>

        {/* Back to login */}
        <div className="text-center">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {lang(t.haveAccount)}{" "}
            <Link
              to="/auth/login"
              className={cn(
                "font-semibold",
                "text-primary-600 dark:text-primary-400",
                "hover:text-primary-700 dark:hover:text-primary-300",
                "hover:underline underline-offset-2",
                "transition-colors",
              )}
            >
              {lang(t.signIn)}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
