import { getApiUrl, ENDPOINTS } from "@/config/api";

interface ServerEnvelope<T> {
  success: boolean;
  message?: string | null;
  data: T;
  errors?: string[];
}

// ═════════════════════════════════════════════════════════════════════
// What this client returns
// ═════════════════════════════════════════════════════════════════════
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string | null;
}

// ═════════════════════════════════════════════════════════════════════
// Typed error
// ═════════════════════════════════════════════════════════════════════
export class ApiError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

// ═════════════════════════════════════════════════════════════════════
// Query params
// ═════════════════════════════════════════════════════════════════════
export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

interface RequestOptions extends RequestInit {
  params?: QueryParams;
  skipAuth?: boolean;
}

// ═════════════════════════════════════════════════════════════════════
// Token storage
// ═════════════════════════════════════════════════════════════════════
const ACCESS_TOKEN_KEY = "fleet-supervisor-access-token";
const REFRESH_TOKEN_KEY = "fleet-supervisor-refresh-token";
const USER_DATA_KEY = "fleet-supervisor-user-data";
const LANGUAGE_KEY = "fleet-supervisor-language";

const LEGACY_ACCESS_KEYS = ["fleet-access-token", "token"] as const;
const LEGACY_REFRESH_KEYS = ["fleet-refresh-token"] as const;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token!);
  });
  failedQueue = [];
}

function getStoredAccessToken(): string | null {
  try {
    const primary = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (primary) return primary;

    for (const key of LEGACY_ACCESS_KEYS) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }
    return null;
  } catch {
    return null;
  }
}

function getStoredRefreshToken(): string | null {
  try {
    const primary = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (primary) return primary;

    for (const key of LEGACY_REFRESH_KEYS) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Exported so auth screens can persist tokens after login/OTP/refresh.
 * Writes to the primary (non-legacy) keys.
 */
export function setTokens(access: string, refresh?: string | null): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } catch {
    // Storage full / disabled — auth will fail on next request
  }
}

function clearAllAuth() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(LANGUAGE_KEY);
    for (const key of LEGACY_ACCESS_KEYS) localStorage.removeItem(key);
    for (const key of LEGACY_REFRESH_KEYS) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ═════════════════════════════════════════════════════════════════════
// Refresh
// ═════════════════════════════════════════════════════════════════════
async function refreshAccessToken(): Promise<string> {
  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new ApiError("No refresh token available", 401);
  }

  const response = await fetch(getApiUrl(ENDPOINTS.AUTH.REFRESH_TOKEN), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ token: accessToken, refreshToken }),
  });

  if (!response.ok) {
    throw new ApiError("Token refresh failed", response.status);
  }

  const body = await response.json();

  const payload = body?.data ?? body;
  const newToken: string | undefined = payload?.token;
  const newRefreshToken: string | undefined = payload?.refreshToken;

  if (!newToken) {
    throw new ApiError("No token in refresh response", 500);
  }

  setTokens(newToken, newRefreshToken ?? null);
  return newToken;
}

// ═════════════════════════════════════════════════════════════════════
// Client
// ═════════════════════════════════════════════════════════════════════
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { params, skipAuth, ...fetchOptions } = options;

    // ── Build URL with query string ─────────────────────────────
    let url = getApiUrl(endpoint);

    if (params) {
      const usp = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) continue;
        usp.append(key, String(value));
      }
      const qs = usp.toString();
      if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    }

    // ── Headers ────────────
    const isFormData = fetchOptions.body instanceof FormData;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Language": "ar-EG",
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const token = getStoredAccessToken();

    if (token && !skipAuth) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
      credentials: "include",
    };

    // ── Execute ────────────────────────────────────────────────
    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new ApiError("Network error: unable to reach the server", 0);
      }
      throw error;
    }

    if (response.status === 401 && !skipAuth) {
      if (endpoint === ENDPOINTS.AUTH.REFRESH_TOKEN) {
        clearAllAuth();
        this.redirectToLogin();
        throw new ApiError("Session expired. Please log in again.", 401);
      }

      if (isRefreshing) {
        try {
          const newToken = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });

          headers["Authorization"] = `Bearer ${newToken}`;
          const retry = await fetch(url, { ...config, headers });
          return this.handleResponse<T>(retry);
        } catch {
          clearAllAuth();
          this.redirectToLogin();
          throw new ApiError("Session expired. Please log in again.", 401);
        }
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);

        headers["Authorization"] = `Bearer ${newToken}`;
        const retry = await fetch(url, { ...config, headers });
        return this.handleResponse<T>(retry);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAllAuth();
        this.redirectToLogin();
        throw new ApiError("Session expired. Please log in again.", 401);
      } finally {
        isRefreshing = false;
      }
    }

    return this.handleResponse<T>(response);
  }

  // ═════════════════════════════════════════════════════════════════
  // Response handling
  // ═════════════════════════════════════════════════════════════════
  private async handleResponse<T>(
    response: Response,
  ): Promise<ApiResponse<T>> {
    if (response.status === 204) {
      return { data: null as T, status: 204 };
    }

    const text = await response.text();
    let parsed: unknown = null;

    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    // ── Error path ────────────────────────────────────────────────
    if (!response.ok) {
      const envelope =
        parsed && typeof parsed === "object"
          ? (parsed as Partial<ServerEnvelope<unknown>>)
          : null;

      const message =
        envelope?.message ||
        (typeof parsed === "string" ? parsed : null) ||
        `HTTP ${response.status}`;

      const errors: string[] = Array.isArray(envelope?.errors)
        ? (envelope!.errors as string[])
        : [];

      throw new ApiError(message, response.status, errors);
    }

    // ── Success path ─────────────────
    if (
      parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      "data" in parsed
    ) {
      const envelope = parsed as ServerEnvelope<T>;
      return {
        data: envelope.data,
        status: response.status,
        message: envelope.message,
      };
    }

    return { data: parsed as T, status: response.status };
  }

  private redirectToLogin() {
    const path = window.location.pathname;
    if (!path.includes("/auth/login") && !path.includes("/login")) {
      window.location.href = "/auth/login";
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // Body serialization — FormData/Blob/string pass through untouched
  // ═════════════════════════════════════════════════════════════════
  private buildBody(body: unknown): BodyInit | undefined {
    if (body === undefined) return undefined;
    if (body instanceof FormData) return body;
    if (body instanceof Blob) return body;
    if (body instanceof URLSearchParams) return body;
    if (body instanceof ArrayBuffer) return body;
    if (typeof body === "string") return body;
    return JSON.stringify(body);
  }

  // ═════════════════════════════════════════════════════════════════
  // Public verbs
  // ═════════════════════════════════════════════════════════════════
  async get<T>(
    endpoint: string,
    params?: QueryParams,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", params, skipAuth });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: this.buildBody(body),
      skipAuth,
    });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: this.buildBody(body),
      skipAuth,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: this.buildBody(body),
      skipAuth,
    });
  }

  async delete<T>(
    endpoint: string,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE", skipAuth });
  }
}

export const apiClient = new ApiClient();