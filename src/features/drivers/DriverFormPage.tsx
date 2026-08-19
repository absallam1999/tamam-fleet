import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { PageLoader } from "@shared/components/PageLoader";
import { cn } from "@shared/utils/cn";
import {
  useCreateDriver,
  useUpdateDriver,
  useDriverDetail,
} from "@shared/hooks/useFleetDrivers";
import type { SupervisorCreateDriverDto } from "@shared/types";
import type { SupervisorUpdateDriverDto } from "@shared/hooks/useFleetDrivers";

// ============================================
// Translations
// ============================================
const t = {
  createTitle: { ar: "إضافة سائق جديد", en: "Add New Driver" },
  editTitle: { ar: "تعديل بيانات السائق", en: "Edit Driver" },
  createSubtitle: {
    ar: "أدخل بيانات السائق لإضافته إلى الأسطول",
    en: "Enter driver details to add to the fleet",
  },
  editSubtitle: {
    ar: "تعديل بيانات السائق الحالية",
    en: "Update existing driver information",
  },
  back: { ar: "العودة للسائقين", en: "Back to Drivers" },
  backToDetails: { ar: "العودة لتفاصيل السائق", en: "Back to Driver Details" },

  // Form sections
  personalInfo: { ar: "المعلومات الشخصية", en: "Personal Information" },
  vehicleInfo: { ar: "معلومات المركبة", en: "Vehicle Information" },

  // Fields
  fullName: { ar: "الاسم الكامل", en: "Full Name" },
  phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  vehicleType: { ar: "نوع المركبة", en: "Vehicle Type" },
  vehiclePlateNumber: { ar: "رقم اللوحة", en: "Plate Number" },

  // Placeholders
  fullNamePlaceholder: { ar: "أدخل الاسم الكامل", en: "Enter full name" },
  phonePlaceholder: { ar: "01xxxxxxxxx", en: "01xxxxxxxxx" },
  emailPlaceholder: { ar: "driver@example.com", en: "driver@example.com" },
  passwordPlaceholder: { ar: "••••••••", en: "••••••••" },
  platePlaceholder: { ar: "ABC 1234", en: "ABC 1234" },

  // Vehicle types
  selectVehicleType: { ar: "اختر نوع المركبة", en: "Select vehicle type" },
  motorcycle: { ar: "دراجة نارية", en: "Motorcycle" },
  car: { ar: "سيارة", en: "Car" },
  van: { ar: "فان", en: "Van" },
  toktok: { ar: "توك توك", en: "Toktok" },
  truck: { ar: "شاحنة", en: "Truck" },

  // Optional
  optional: { ar: "اختياري", en: "Optional" },

  // Actions
  save: { ar: "حفظ", en: "Save" },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  cancel: { ar: "إلغاء", en: "Cancel" },
  saveSuccess: {
    ar: "تم حفظ بيانات السائق بنجاح",
    en: "Driver saved successfully",
  },
  saveError: { ar: "فشل حفظ بيانات السائق", en: "Failed to save driver" },

  // Validation
  fullNameRequired: { ar: "الاسم الكامل مطلوب", en: "Full name is required" },
  phoneRequired: { ar: "رقم الهاتف مطلوب", en: "Phone number is required" },
  phoneInvalid: {
    ar: "يرجى إدخال رقم هاتف صحيح",
    en: "Please enter a valid phone number",
  },
  passwordRequired: { ar: "كلمة المرور مطلوبة", en: "Password is required" },
  passwordLength: {
    ar: "كلمة المرور ٦ أحرف على الأقل",
    en: "Password must be at least 6 chars",
  },
  emailInvalid: {
    ar: "يرجى إدخال بريد إلكتروني صحيح",
    en: "Please enter a valid email",
  },

  // Loading
  loading: { ar: "جاري تحميل بيانات السائق...", en: "Loading driver data..." },
  error: { ar: "فشل تحميل البيانات", en: "Failed to load data" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  driverNotFound: { ar: "السائق غير موجود", en: "Driver not found" },
};

// ============================================
// Form Data Type
// ============================================
interface DriverFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  vehicleType: string;
  vehiclePlateNumber: string;
}

interface FormErrors {
  fullName?: string;
  phoneNumber?: string;
  password?: string;
  email?: string;
}

// ============================================
// DriverFormPage — Main Component
// ============================================
export const DriverFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { driverId } = useParams<{ driverId: string }>();
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const isEditMode = !!driverId;

  const [form, setForm] = useState<DriverFormData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    vehicleType: "",
    vehiclePlateNumber: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);

  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const {
    data: driver,
    isLoading: isLoadingDriver,
    isError: isDriverError,
    error: driverError,
    refetch: refetchDriver,
  } = useDriverDetail(isEditMode ? driverId : undefined);

  useEffect(() => {
    if (driver && isEditMode) {
      setForm({
        fullName: driver.fullName || "",
        phoneNumber: driver.phoneNumber || "",
        email: driver.email || "",
        password: "",
        vehicleType: driver.vehicleType || "",
        vehiclePlateNumber: driver.vehiclePlateNumber || "",
      });
    }
  }, [driver, isEditMode]);

  const isSubmitting = createDriver.isPending || updateDriver.isPending;

  // Validation
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = lang(t.fullNameRequired);
    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = lang(t.phoneRequired);
    } else if (!/^\d{7,15}$/.test(form.phoneNumber.trim())) {
      newErrors.phoneNumber = lang(t.phoneInvalid);
    }
    if (!isEditMode) {
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = lang(t.emailInvalid);
      }
      if (!form.password) {
        newErrors.password = lang(t.passwordRequired);
      } else if (form.password.length < 6) {
        newErrors.password = lang(t.passwordLength);
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleChange = (field: keyof DriverFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field as keyof FormErrors];
        return updated;
      });
    }
  };

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      phoneNumber: true,
      ...(isEditMode ? {} : { password: true }),
    });
    if (!validate()) return;

    if (isEditMode && driverId) {
      const dto: SupervisorUpdateDriverDto = {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        vehicleType: form.vehicleType || undefined,
        vehiclePlateNumber: form.vehiclePlateNumber.trim() || undefined,
      };
      updateDriver.mutate(dto, {
        onSuccess: () => {
          toast.success(lang(t.saveSuccess));
          navigate(`/dashboard/drivers/${driverId}`);
        },
        onError: (err: Error) => {
          toast.error(lang(t.saveError), { description: err.message });
        },
      });
    } else {
      const dto: SupervisorCreateDriverDto = {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        vehicleType: form.vehicleType || undefined,
        vehiclePlateNumber: form.vehiclePlateNumber.trim() || undefined,
      };
      createDriver.mutate(dto, {
        onSuccess: () => {
          toast.success(lang(t.saveSuccess));
          navigate("/dashboard/drivers");
        },
        onError: (err: Error) => {
          toast.error(lang(t.saveError), { description: err.message });
        },
      });
    }
  };

  const inputClasses = (field: keyof FormErrors, isErrorField?: boolean) =>
    cn(
      "w-full rounded-xl py-3 px-4 text-sm transition-all duration-200",
      "bg-surface-100 dark:bg-surface-800",
      "text-surface-900 dark:text-white",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "border-2",
      isErrorField && errors[field] && touched[field]
        ? "border-error-400 dark:border-error-500 focus:border-error-500 focus:bg-surface-50 dark:focus:bg-surface-800/50"
        : "border-transparent focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50",
      "focus:outline-none",
      isAr ? "text-right" : "text-left",
    );

  const selectClasses = cn(
    "w-full rounded-xl py-3 px-4 text-sm transition-all duration-200",
    "bg-surface-100 dark:bg-surface-800",
    "text-surface-900 dark:text-white",
    "border-2 border-transparent",
    "focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50",
    "cursor-pointer appearance-none",
    isAr ? "text-right" : "text-left",
  );

  if (isEditMode && isLoadingDriver)
    return <PageLoader message={lang(t.loading)} />;

  if (isEditMode && (isDriverError || !driver)) {
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
          {isDriverError ? lang(t.error) : lang(t.driverNotFound)}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
          {driverError?.message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => refetchDriver()}
            className="btn btn-primary btn-sm"
          >
            {lang(t.retry)}
          </button>
          <Link to="/dashboard/drivers" className="btn btn-ghost btn-sm">
            {lang(t.back)}
          </Link>
        </div>
      </div>
    );
  }

  const backUrl = isEditMode
    ? `/dashboard/drivers/${driverId}`
    : "/dashboard/drivers";
  const backLabel = isEditMode ? lang(t.backToDetails) : lang(t.back);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={backUrl}
          className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title={backLabel}
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
        <div className={cn(isAr ? "text-right" : "text-left")}>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {isEditMode ? lang(t.editTitle) : lang(t.createTitle)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {isEditMode ? lang(t.editSubtitle) : lang(t.createSubtitle)}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Card */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
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
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.personalInfo)}
            </h3>
          </div>

          <div className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.fullName)} <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                onBlur={() => handleBlur("fullName")}
                className={inputClasses("fullName", true)}
                placeholder={lang(t.fullNamePlaceholder)}
              />
              {errors.fullName && touched.fullName && (
                <p className="text-xs text-error-500 flex items-center gap-1">
                  <svg
                    className="w-3 h-3 flex-shrink-0"
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
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Phone + Email (Email hidden in edit mode) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.phoneNumber)}{" "}
                  <span className="text-error-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  onBlur={() => handleBlur("phoneNumber")}
                  className={inputClasses("phoneNumber", true)}
                  dir="ltr"
                  placeholder={lang(t.phonePlaceholder)}
                />
                {errors.phoneNumber && touched.phoneNumber && (
                  <p className="text-xs text-error-500 flex items-center gap-1">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
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
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
              {!isEditMode && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-semibold text-surface-600 dark:text-surface-400">
                    {lang(t.email)}{" "}
                    <span className="font-normal text-surface-400 text-[10px]">
                      ({lang(t.optional)})
                    </span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={inputClasses("email", true)}
                    dir="ltr"
                    placeholder={lang(t.emailPlaceholder)}
                  />
                  {errors.email && touched.email && (
                    <p className="text-xs text-error-500 flex items-center gap-1">
                      <svg
                        className="w-3 h-3 flex-shrink-0"
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
                      {errors.email}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Password (create only) */}
            {!isEditMode && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.password)} <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={cn(inputClasses("password", true), "pr-12")}
                    dir="ltr"
                    placeholder={lang(t.passwordPlaceholder)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-3 p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
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
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
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
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="text-xs text-error-500 flex items-center gap-1">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
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
                    {errors.password}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Information Card */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
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
                  d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.vehicleInfo)}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vehicle Type */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.vehicleType)}{" "}
                <span className="font-normal text-surface-400 text-[10px]">
                  ({lang(t.optional)})
                </span>
              </label>
              <div className="relative">
                <select
                  value={form.vehicleType}
                  onChange={(e) => handleChange("vehicleType", e.target.value)}
                  className={selectClasses}
                >
                  <option value="">{lang(t.selectVehicleType)}</option>
                  <option value="motorcycle">{lang(t.motorcycle)}</option>
                  <option value="car">{lang(t.car)}</option>
                  <option value="van">{lang(t.van)}</option>
                  <option value="truck">{lang(t.truck)}</option>
                  <option value="toktok">{lang(t.toktok)}</option>
                </select>
                <div className="absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none text-surface-400">
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
            </div>

            {/* Vehicle Plate */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.vehiclePlateNumber)}{" "}
                <span className="font-normal text-surface-400 text-[10px]">
                  ({lang(t.optional)})
                </span>
              </label>
              <input
                type="text"
                value={form.vehiclePlateNumber}
                onChange={(e) =>
                  handleChange("vehiclePlateNumber", e.target.value)
                }
                className={inputClasses("email")}
                dir="ltr"
                placeholder={lang(t.platePlaceholder)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
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
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                {lang(t.save)}
              </>
            )}
          </button>
          <Link
            to={backUrl}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200 text-center"
          >
            {lang(t.cancel)}
          </Link>
        </div>
      </form>
    </div>
  );
};

export default DriverFormPage;
