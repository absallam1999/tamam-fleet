/**
 * API Configuration — Tamam Fleet Dashboard
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as
  | string
  | undefined;

export const ENDPOINTS = {
  // ============================================
  // Authentication
  // ============================================
  AUTH: {
    LOGIN: "/api/auth/login",
    SEND_OTP: "/api/auth/otp/send",
    VERIFY_OTP: "/api/auth/otp/verify",
    REGISTER: "/api/onboarding/supervisor",
    REFRESH_TOKEN: "/api/auth/refresh",
    CHANGE_PASSWORD: "/api/auth/change-password",
    LOGOUT: "/api/auth/logout",
  },

  // ============================================
  // Supervisor
  // ============================================
  SUPERVISOR: {
    PROFILE: "/api/supervisor/profile",
    DASHBOARD: "/api/supervisor/dashboard",

    AREAS: "/api/supervisor/areas",
    AREA_BY_ID: (areaId: string) => `/api/supervisor/areas/${areaId}`,

    DRIVERS: "/api/supervisor/drivers",
    DRIVERS_AVAILABLE: "/api/supervisor/drivers/available",
    DRIVER_BY_ID: (driverId: string) => `/api/supervisor/drivers/${driverId}`,
    CREATE_DRIVER: "/api/supervisor/drivers",
    UPDATE_DRIVER: (driverId: string) => `/api/supervisor/drivers/${driverId}`,

    REQUESTS: "/api/supervisor/driver-requests",
    REQUEST_BY_ID: (id: string) => `/api/supervisor/driver-requests/${id}`,
    APPROVE_REQUEST: (id: string) =>
      `/api/supervisor/driver-requests/${id}/approve`,
    REJECT_REQUEST: (id: string) =>
      `/api/supervisor/driver-requests/${id}/reject`,

    ORDERS: "/api/supervisor/orders",
    ORDERS_UNASSIGNED: "/api/supervisor/orders/unassigned",
    ASSIGN_ORDER: "/api/supervisor/orders/assign",
    REASSIGN_ORDER: (orderId: string) =>
      `/api/supervisor/orders/${orderId}/reassign`,
    UNASSIGN_ORDER: (orderId: string) =>
      `/api/supervisor/orders/${orderId}/assign`,
  },

  // ============================================
  // Wallet
  // ============================================
  WALLET: {
    SUMMARY: "/api/wallet",
    TRANSACTIONS: "/api/wallet/transactions",
    TRANSACTION_BY_ID: (id: string) => `/api/wallet/transactions/${id}`,
    WITHDRAWALS: "/api/wallet/withdrawals",
    WITHDRAWAL_BY_ID: (id: string) => `/api/wallet/withdrawals/${id}`,
    PAYMENT_NUMBERS: "/api/wallet/payment-numbers",
    TOPUP: "/api/wallet/topup",
    TOPUP_BY_ID: (id: string) => `/api/wallet/topup/${id}`,
    TRANSFER_LOOKUP: "/api/wallet/transfer/lookup",
    TRANSFERS: "/api/wallet/transfers",
    TRANSFER_BY_ID: (id: string) => `/api/wallet/transfers/${id}`,
    PIN_STATUS: "/api/wallet/pin/status",
    PIN_SET: "/api/wallet/pin/set",
    PIN_CHANGE: "/api/wallet/pin/change",
    PIN_RESET: "/api/wallet/pin/reset",
  },

  // ============================================
  // Notifications
  // ============================================
  NOTIFICATIONS: {
    BASE: "/api/notifications",
    UNREAD_COUNT: "/api/notifications/unread-count",
    BY_ID: (id: string) => `/api/notifications/${id}`,
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: "/api/notifications/read-all",
    PREFERENCES: "/api/notifications/preferences",
  },

  // ============================================
  // Files
  // ============================================
  FILES: {
    UPLOAD: "/api/files/upload",
    UPLOAD_MULTIPLE: "/api/files/upload-multiple",
    DELETE: (path: string) => `/api/files/${path}`,
    INFO: "/api/files/info",
  },

  // ============================================
  // Chat
  // ============================================
  CHAT: {
    BASE: "/api/chat",
    BY_ID: (id: string) => `/api/chat/${id}`,
    MESSAGES: (id: string) => `/api/chat/${id}/messages`,
    MESSAGES_ATTACHMENT: (id: string) => `/api/chat/${id}/messages/attachment`,
    ATTACHMENTS: (id: string) => `/api/chat/${id}/attachments`,
    READ: (id: string) => `/api/chat/${id}/read`,
    CLOSE: (id: string) => `/api/chat/${id}/close`,
    UNREAD_COUNT: "/api/chat/unread-count",
  },

  // ============================================
  // Cities
  // ============================================
  CITIES: {
    LOOKUP: "/api/cities/lookup",
    BY_ID: (id: string) => `/api/cities/${id}`,
    BROWSE: "/api/cities/browse",
    AREAS: (id: string) => `/api/cities/${id}/areas`,
  },
} as const;

// ============================================
// Helpers
// ============================================

export const getApiUrl = (endpoint: string): string => {
  if (import.meta.env.DEV) {
    return endpoint;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  return `${baseUrl ?? ""}${endpoint}`;
};

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;
