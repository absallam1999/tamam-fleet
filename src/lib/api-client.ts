import { getApiUrl } from "@/config/api";

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean; 
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { params, skipAuth, ...fetchOptions } = options;

    let url = getApiUrl(endpoint);

    if (params) {
      const urlObj = new URL(url, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, value);
      });
      url = urlObj.toString();
    }

    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Fleet Supervisor specific token keys
    const token = 
      localStorage.getItem("fleet-supervisor-access-token") || 
      localStorage.getItem("fleet-access-token") ||
      localStorage.getItem("token");
    
    if (token && !skipAuth) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...fetchOptions.headers,
      },
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Clear all fleet supervisor related auth data
        localStorage.removeItem("fleet-supervisor-access-token");
        localStorage.removeItem("fleet-supervisor-refresh-token");
        localStorage.removeItem("fleet-access-token");
        localStorage.removeItem("fleet-refresh-token");
        localStorage.removeItem("token");
        localStorage.removeItem("fleet-supervisor-user-data");
        localStorage.removeItem("fleet-supervisor-language");
        
        // Redirect to fleet supervisor login
        if (!window.location.pathname.includes("/auth/login")) {
          window.location.href = "/auth/login";
        }
        
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || errorData?.Message || `HTTP error! status: ${response.status}`,
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { data: null as T, status: 204 };
      }

      // Check if response has a body before trying to parse JSON
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      const hasBody = contentLength !== '0' && contentType?.includes('application/json');

      if (!hasBody) {
        // 200 OK with no body (toggle, delete endpoints)
        return { data: null as T, status: response.status };
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Network error: Unable to connect to the server");
      }
      throw error;
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string>,
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
      body: JSON.stringify(body),
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
      body: JSON.stringify(body),
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
      body: JSON.stringify(body),
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