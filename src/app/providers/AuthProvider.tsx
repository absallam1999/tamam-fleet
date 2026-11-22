import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { ENDPOINTS, getApiUrl } from "@/config/api";

// ============================================
// Types
// ============================================

export type UserRole =
  | "Customer"
  | "Driver"
  | "StoreOwner"
  | "Admin"
  | "Supervisor";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AreaSummary {
  areaId: string;
  areaName: string;
  driverCount: number;
  pendingOrders: number;
  activeOrders: number;
}

export interface FleetSupervisor {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  isVerified: boolean;
  profilePictureUrl: string | null;
  verifiedAt: string | null;
  cityId: string | null;
  cityAr: string | null;
  cityEn: string | null;
  areas: AreaSummary[];
  role: UserRole;
  lastLogin: string;
  createdAt?: string;
}

export interface LoginCredentials {
  phoneNumber: string;
  password: string;
  role?: UserRole;
  remember?: boolean;
}

export interface SendOtpCredentials {
  phoneNumber: string;
  /** Defaults to "Supervisor". */
  role?: UserRole;
}

export interface VerifyOtpCredentials {
  phoneNumber: string;
  code: string;
  /** Defaults to "Supervisor". */
  role?: UserRole;
}

export interface RegisterSupervisorCredentials {
  fullName: string;
  phoneNumber: string;
  email: string;
  areaIds?: string[];
  notes?: string;
}

export interface OnboardingSubmissionResult {
  requestId: string;
  status: string;
  message: string;
}

interface AuthContextValue {
  user: FleetSupervisor | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  sendOtp: (credentials: SendOtpCredentials) => Promise<void>;
  verifyOtp: (credentials: VerifyOtpCredentials) => Promise<boolean>;
  register: (
    credentials: RegisterSupervisorCredentials,
  ) => Promise<OnboardingSubmissionResult>;
  refreshProfile: () => Promise<void>;
  getAccessToken: () => string | null;
  refreshToken: () => Promise<string | null>;
  changePassword: (newPassword: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================
// Constants
// ============================================

const ACCESS_TOKEN_KEY = "fleet-supervisor-access-token";
const REFRESH_TOKEN_KEY = "fleet-supervisor-refresh-token";
const USER_DATA_KEY = "fleet-supervisor-user-data";
const DEFAULT_ROLE: UserRole = "Supervisor";

// ============================================
// Error extraction
// ============================================

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") return data || fallback;
  if (typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string" && d.message) return d.message;
  if (typeof d.Message === "string" && d.Message) return d.Message;
  if (typeof d.detail === "string" && d.detail) return d.detail;
  if (typeof d.title === "string" && d.title) return d.title;
  if (
    Array.isArray(d.errors) &&
    d.errors.length > 0 &&
    typeof d.errors[0] === "string"
  ) {
    return d.errors[0];
  }
  return fallback;
}

// ============================================
// Token & user storage
// ============================================

function getStoredTokens(): AuthTokens | null {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (accessToken && refreshToken) return { accessToken, refreshToken };
    return null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {}
}

function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  } catch {}
}

function getStoredUser(): FleetSupervisor | null {
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FleetSupervisor>;
    if (!parsed.id || !parsed.phoneNumber) return null;
    return {
      id: parsed.id,
      fullName: parsed.fullName ?? "",
      email: parsed.email ?? "",
      phoneNumber: parsed.phoneNumber,
      isActive: parsed.isActive ?? true,
      isVerified: parsed.isVerified ?? false,
      profilePictureUrl: parsed.profilePictureUrl ?? null,
      verifiedAt: parsed.verifiedAt ?? null,
      cityId: parsed.cityId ?? null,
      cityAr: parsed.cityAr ?? null,
      cityEn: parsed.cityEn ?? null,
      areas: parsed.areas ?? [],
      role: (parsed.role as UserRole) ?? DEFAULT_ROLE,
      lastLogin: parsed.lastLogin ?? new Date().toISOString(),
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

function storeUser(user: FleetSupervisor): void {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch {}
}

// ============================================
// Token / user builders
// ============================================

function extractTokens(
  responseData: Record<string, unknown>,
): AuthTokens | null {
  const inner = (responseData.data as Record<string, unknown>) ?? responseData;
  const token =
    (inner.token as string) ?? (responseData.token as string) ?? undefined;
  if (!token) return null;
  const refreshToken =
    (inner.refreshToken as string) ??
    (responseData.refreshToken as string) ??
    token;
  return { accessToken: token, refreshToken };
}

function buildFleetSupervisor(
  responseData: Record<string, unknown>,
  phoneFallback?: string,
  existingUser?: FleetSupervisor | null,
): FleetSupervisor {
  const inner = (responseData.data as Record<string, unknown>) ?? responseData;
  return {
    id:
      (inner.userId as string) ??
      (inner.id as string) ??
      existingUser?.id ??
      "",
    fullName:
      (inner.fullName as string) ??
      (inner.name as string) ??
      existingUser?.fullName ??
      "",
    email: (inner.email as string) ?? existingUser?.email ?? "",
    phoneNumber:
      (inner.phoneNumber as string) ??
      phoneFallback ??
      existingUser?.phoneNumber ??
      "",
    isActive: (inner.isActive as boolean) ?? existingUser?.isActive ?? true,
    isVerified:
      (inner.isVerified as boolean) ?? existingUser?.isVerified ?? false,
    profilePictureUrl:
      (inner.profilePictureUrl as string) ??
      existingUser?.profilePictureUrl ??
      null,
    verifiedAt:
      (inner.verifiedAt as string) ?? existingUser?.verifiedAt ?? null,
    cityId: (inner.cityId as string) ?? existingUser?.cityId ?? null,
    cityAr: (inner.cityAr as string) ?? existingUser?.cityAr ?? null,
    cityEn: (inner.cityEn as string) ?? existingUser?.cityEn ?? null,
    areas: (inner.areas as AreaSummary[]) ?? existingUser?.areas ?? [],
    role: (inner.role as UserRole) ?? existingUser?.role ?? DEFAULT_ROLE,
    lastLogin: new Date().toISOString(),
    createdAt: (inner.createdAt as string) ?? existingUser?.createdAt,
  };
}

// ============================================
// Session check
// ============================================

async function validateSession(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl(ENDPOINTS.SUPERVISOR.DASHBOARD), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FleetSupervisor | null>(() =>
    getStoredUser(),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<string | null> | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const getAccessToken = useCallback((): string | null => {
    const tokens = getStoredTokens();
    return tokens?.accessToken || null;
  }, []);

  // ---------- refresh token ----------
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshing.current && refreshPromise.current) {
      return refreshPromise.current;
    }
    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) return null;

    isRefreshing.current = true;
    refreshPromise.current = (async () => {
      try {
        const response = await fetch(getApiUrl(ENDPOINTS.AUTH.REFRESH_TOKEN), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }),
        });
        if (!response.ok) throw new Error("refresh failed");
        const data = await response.json();
        const newTokens = extractTokens(data);
        if (newTokens) {
          storeTokens(newTokens);
          return newTokens.accessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        isRefreshing.current = false;
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, []);

  // ---------- refresh profile (GET /api/supervisor/profile) ----------
  const refreshProfile = useCallback(async (): Promise<void> => {
    const token = getStoredTokens()?.accessToken;
    if (!token) return;
    try {
      const response = await fetch(getApiUrl(ENDPOINTS.SUPERVISOR.PROFILE), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) return;
      const json = await response.json().catch(() => null);
      const profile = (json?.data as Record<string, unknown>) ?? null;
      if (!profile) return;
      setUser((prev) => {
        if (!prev) return prev;
        const updated: FleetSupervisor = {
          ...prev,
          id: (profile.id as string) ?? prev.id,
          fullName: (profile.fullName as string) ?? prev.fullName,
          email: (profile.email as string) ?? prev.email,
          phoneNumber: (profile.phoneNumber as string) ?? prev.phoneNumber,
          isVerified: (profile.isVerified as boolean) ?? prev.isVerified,
          profilePictureUrl:
            (profile.profilePictureUrl as string) ?? prev.profilePictureUrl,
          verifiedAt: (profile.verifiedAt as string) ?? prev.verifiedAt,
          cityId: (profile.cityId as string) ?? prev.cityId,
          cityAr: (profile.cityAr as string) ?? prev.cityAr,
          cityEn: (profile.cityEn as string) ?? prev.cityEn,
          areas: (profile.areas as AreaSummary[]) ?? prev.areas,
          createdAt: (profile.createdAt as string) ?? prev.createdAt,
        };
        storeUser(updated);
        return updated;
      });
    } catch {
      /* silent */
    }
  }, []);

  // ---------- session init ----------
  useEffect(() => {
    const initSession = async (): Promise<void> => {
      const storedUser = getStoredUser();
      const storedTokens = getStoredTokens();

      if ((storedUser && !storedTokens) || (!storedUser && storedTokens)) {
        clearTokens();
        setUser(null);
        setIsLoading(false);
        return;
      }
      if (!storedTokens) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const newToken = await refreshToken();
        if (!newToken) {
          const isValid = await validateSession(storedTokens.accessToken);
          if (isValid) setUser(storedUser);
          else {
            clearTokens();
            setUser(null);
          }
        } else {
          setUser(storedUser);
          void refreshProfile();
        }
      } catch {
        setUser(storedUser);
      }
      setIsLoading(false);
    };
    initSession();
  }, [refreshToken]);

  // ---------- periodic refresh ----------
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(
      async () => {
        const newToken = await refreshToken();
        if (!newToken) console.warn("Periodic token refresh failed");
      },
      10 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [user, refreshToken]);

  // ---------- login ----------
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setError(null);

      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.LOGIN), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber.trim(),
          password: credentials.password,
          role: credentials.role ?? DEFAULT_ROLE,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok || (responseData && responseData.success === false)) {
        const message = extractErrorMessage(responseData, "فشل تسجيل الدخول");
        setError(message);
        throw new Error(message);
      }

      const tokens = extractTokens(responseData ?? {});
      if (!tokens) {
        const message = "لم يتم استلام رمز الوصول من الخادم";
        setError(message);
        throw new Error(message);
      }

      storeTokens(tokens);
      const newUser = buildFleetSupervisor(
        responseData ?? {},
        credentials.phoneNumber,
      );
      storeUser(newUser);
      setUser(newUser);

      void refreshProfile();
    },
    [refreshProfile],
  );

  // ---------- logout ----------
  const logout = useCallback(async (): Promise<void> => {
    try {
      const tokens = getStoredTokens();
      if (tokens) {
        await fetch(getApiUrl(ENDPOINTS.AUTH.LOGOUT), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
      }
    } catch {
    } finally {
      clearTokens();
      setUser(null);
      setError(null);
    }
  }, []);

  // ---------- send OTP ----------
  const sendOtp = useCallback(
    async (credentials: SendOtpCredentials): Promise<void> => {
      setError(null);
      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.SEND_OTP), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber.trim(),
          role: credentials.role ?? DEFAULT_ROLE,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = extractErrorMessage(errorData, "فشل إرسال رمز التحقق");
        setError(message);
        throw new Error(message);
      }
    },
    [],
  );

  // ---------- verify OTP ----------
  const verifyOtp = useCallback(
    async (credentials: VerifyOtpCredentials): Promise<boolean> => {
      setError(null);
      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.VERIFY_OTP), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber.trim(),
          code: credentials.code,
          role: credentials.role ?? DEFAULT_ROLE,
        }),
      });
      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        const message = extractErrorMessage(
          responseData,
          "فشل التحقق من الرمز",
        );
        setError(message);
        throw new Error(message);
      }
      if (responseData) {
        const tokens = extractTokens(responseData);
        if (tokens) {
          storeTokens(tokens);
          const newUser = buildFleetSupervisor(
            responseData,
            credentials.phoneNumber,
          );
          storeUser(newUser);
          setUser(newUser);
          void refreshProfile();
          return true;
        }
      }
      return true;
    },
    [refreshProfile],
  );

  // ---------- registerSupervisor ----------
  const register = useCallback(
    async (
      credentials: RegisterSupervisorCredentials,
    ): Promise<OnboardingSubmissionResult> => {
      setError(null);

      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.REGISTER), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: credentials.fullName.trim(),
          phoneNumber: credentials.phoneNumber.trim(),
          email: credentials.email.trim(),
          areaIds: credentials.areaIds,
          notes: credentials.notes?.trim() || undefined,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const message = extractErrorMessage(
          responseData,
          "فشل إرسال طلب التسجيل",
        );
        setError(message);
        throw new Error(message);
      }

      const result =
        (responseData?.data as OnboardingSubmissionResult | undefined) ??
        (responseData as OnboardingSubmissionResult | null);

      if (!result) {
        const message = "لم يتم استلام استجابة صحيحة من الخادم";
        setError(message);
        throw new Error(message);
      }
      return result;
    },
    [],
  );

  // ---------- changePassword ----------
  const changePassword = useCallback(
    async (newPassword: string): Promise<void> => {
      setError(null);
      const token = getStoredTokens()?.accessToken;
      if (!token) throw new Error("Unauthorized");
      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.CHANGE_PASSWORD), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }), // AuthDtos.ChangePasswordDto
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = extractErrorMessage(errorData, "فشل تغيير كلمة المرور");
        setError(message);
        throw new Error(message);
      }
    },
    [],
  );

  const isAuthenticated = user !== null;

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      sendOtp,
      verifyOtp,
      register,
      refreshProfile,
      getAccessToken,
      refreshToken,
      changePassword,
      error,
      clearError,
    }),
    [
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      sendOtp,
      verifyOtp,
      register,
      refreshProfile,
      getAccessToken,
      refreshToken,
      changePassword,
      error,
      clearError,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return context;
};

export default AuthProvider;
