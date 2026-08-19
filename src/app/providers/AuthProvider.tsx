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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface FleetSupervisor {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  lastLogin: string;
}

export interface LoginCredentials {
  phoneNumber: string;
  password: string;
  role: number;
  remember: boolean;
}

export interface SendOtpCredentials {
  phoneNumber: string;
  role: number;
}

export interface VerifyOtpCredentials {
  phoneNumber: string;
  code: string;
  role: number;
}

interface AuthContextValue {
  user: FleetSupervisor | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  sendOtp: (credentials: SendOtpCredentials) => Promise<void>;
  verifyOtp: (credentials: VerifyOtpCredentials) => Promise<boolean>;
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

// ============================================
// Token Utilities
// ============================================

function getStoredTokens(): AuthTokens | null {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
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
    const parsed = JSON.parse(raw) as FleetSupervisor;
    if (!parsed.id || !parsed.phoneNumber) return null;
    return parsed;
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
// Token Extraction
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

// ============================================
// Build FleetSupervisor
// ============================================

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
    lastLogin: new Date().toISOString(),
  };
}

// ============================================
// Session Validation
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

  // Track if a token refresh is in progress (prevents multiple refresh calls)
  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<string | null> | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ============================================
  // Get current access token
  // ============================================
  const getAccessToken = useCallback((): string | null => {
    const tokens = getStoredTokens();
    return tokens?.accessToken || null;
  }, []);

  // ============================================
  // Refresh Token — callable from api-client interceptor
  // ============================================
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

        if (!response.ok) throw new Error("Token refresh failed");

        const data = await response.json();
        const newTokens = extractTokens(data);

        if (newTokens) {
          storeTokens(newTokens);
          return newTokens.accessToken;
        }
        return null;
      } catch {
        console.error("Token refresh failed");
        return null;
      } finally {
        isRefreshing.current = false;
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, []);

  // ============================================
  // Session Initialization
  // ============================================
  useEffect(() => {
    const initSession = async (): Promise<void> => {
      const storedUser = getStoredUser();
      const storedTokens = getStoredTokens();

      // If one exists without the other, clean up
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

      // Try to refresh the token on init
      try {
        const newToken = await refreshToken();
        if (!newToken) {
          // Refresh failed, try to validate existing token
          const isValid = await validateSession(storedTokens.accessToken);
          if (isValid) {
            setUser(storedUser);
          } else {
            clearTokens();
            setUser(null);
          }
        } else {
          // Token refreshed, keep user
          setUser(storedUser);
        }
      } catch {
        // Keep stored user even if refresh fails
        setUser(storedUser);
      }

      setIsLoading(false);
    };

    initSession();
  }, [refreshToken]);

  // ============================================
  // Periodic token refresh (every 10 minutes)
  // ============================================
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(
      async () => {
        const newToken = await refreshToken();
        if (!newToken) {
          console.warn("Periodic token refresh failed");
        }
      },
      10 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  // ============================================
  // LOGIN
  // ============================================
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setError(null);

      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.LOGIN), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber.trim(),
          password: credentials.password,
          role: credentials.role,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          responseData?.Message ||
          responseData?.message ||
          responseData?.title ||
          "فشل تسجيل الدخول";
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
    },
    [],
  );

  // ============================================
  // LOGOUT
  // ============================================
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

  // ============================================
  // SEND OTP
  // ============================================
  const sendOtp = useCallback(
    async (credentials: SendOtpCredentials): Promise<void> => {
      setError(null);
      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.SEND_OTP), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber.trim(),
          role: credentials.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.Message ||
          errorData?.message ||
          errorData?.title ||
          "فشل إرسال رمز التحقق";
        setError(message);
        throw new Error(message);
      }
    },
    [],
  );

  // ============================================
  // VERIFY OTP
  // ============================================
  const verifyOtp = useCallback(
    async (credentials: VerifyOtpCredentials): Promise<boolean> => {
      setError(null);

      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.VERIFY_OTP), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber.trim(),
          code: credentials.code,
          role: credentials.role,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          responseData?.Message ||
          responseData?.message ||
          responseData?.title ||
          "فشل التحقق من الرمز";
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
          return true;
        }
      }

      return true;
    },
    [],
  );

  // ============================================
  // Change Password
  // ============================================

  const changePassword = useCallback(
    async (newPassword: string): Promise<void> => {
      setError(null);

      const token = getStoredTokens()?.accessToken;
      if (!token) {
        throw new Error("Unauthorized");
      }

      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.CHANGE_PASSWORD), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.Message ||
          errorData?.message ||
          errorData?.title ||
          "فشل تغيير كلمة المرور";
        setError(message);
        throw new Error(message);
      }

      // Optionally update user session; no additional data required
    },
    [],
  );

  // ============================================
  // Derived State
  // ============================================
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
      getAccessToken,
      refreshToken,
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
