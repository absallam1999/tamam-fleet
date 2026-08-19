/**
 * API Configuration — Tamam Fleet Dashboard
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
  // ============================================
  // Authentication (public)
  // ============================================
  AUTH: {
    LOGIN: "/api/auth/login",
    SEND_OTP: "/api/auth/send-otp",
    VERIFY_OTP: "/api/auth/verify-otp",
    REFRESH_TOKEN: "/api/auth/refresh",
    CHANGE_PASSWORD: "/api/auth/change-password",
    LOGOUT: "/api/auth/logout",
  },

  // ============================================
  // Supervisor — Dashboard & Stats
  // ============================================
  SUPERVISOR: {
    DASHBOARD: "/api/supervisor/dashboard",

    // ==========================================
    // Driver Management
    // ==========================================
    DRIVERS: "/api/supervisor/drivers",
    DRIVER_BY_ID: (driverId: string) => `/api/supervisor/drivers/${driverId}`,
    TOGGLE_DRIVER_AVAILABILITY: (driverId: string) =>
      `/api/supervisor/drivers/${driverId}/toggle-availability`,
    CREATE_DRIVER: "/api/supervisor/create-driver",
    UPDATE_DRIVER: "/api/supervisor/update-driver",

    // ==========================================
    // Order Management
    // ==========================================
    ORDERS_PENDING: "/api/supervisor/orders/pending",
    ORDERS_ACTIVE: "/api/supervisor/orders/active",
    ASSIGN_ORDER: "/api/supervisor/assign-order",
    REASSIGN_ORDER: (orderId: string) =>
      `/api/supervisor/orders/${orderId}/reassign`,
    UNASSIGN_ORDER: (orderId: string) =>
      `/api/supervisor/orders/${orderId}/unassign`,
    SELF_ASSIGN_ORDER: (orderId: string) =>
      `/api/supervisor/orders/${orderId}/self-assign`,

    // ==========================================
    // Driver Registration Requests
    // ==========================================
    DRIVER_REQUESTS: "/api/supervisor/driver-requests",
    APPROVE_DRIVER_REQUEST: (id: string) =>
      `/api/supervisor/driver-requests/${id}/approve`,
    REJECT_DRIVER_REQUEST: (id: string) =>
      `/api/supervisor/driver-requests/${id}/reject`,

    // ==========================================
    // Supervisor Wallet
    // ==========================================
    WALLET: "/api/supervisor/wallet",
    WALLET_BALANCE: "/api/supervisor/wallet/balance",
    WALLET_WITHDRAW: "/api/supervisor/wallet/withdraw",
  },

  // ============================================
  // Driver Delivery Operations
  // ============================================
  DRIVER: {
    DASHBOARD: "/api/driver/dashboard",
    EARNINGS: "/api/driver/earnings",
    AVAILABLE_ORDERS: "/api/driver/available-orders",
    ORDER_BY_ID: (orderId: string) => `/api/driver/orders/${orderId}`,
    ACCEPT_ORDER: "/api/driver/accept-order",
    UPDATE_DELIVERY_STATUS: "/api/driver/update-delivery-status",
    ORDER_HISTORY: "/api/driver/order-history",
    GO_ONLINE: "/api/driver/go-online",
    GO_OFFLINE: "/api/driver/go-offline",
    UPDATE_LOCATION: "/api/driver/location",
    ORDER_NOT_ACCEPTED: (orderId: string) =>
      `/api/driver/orders/${orderId}/not-accepted`,
    ORDER_RETURNED: (orderId: string) =>
      `/api/driver/orders/${orderId}/returned`,
    SHIFTS: "/api/driver/shifts",
    SHIFT_BY_ID: (shiftId: string) => `/api/driver/shifts/${shiftId}`,
    BULK_SHIFTS: "/api/driver/shifts/bulk",
    IN_SHIFT: "/api/driver/shifts/in-shift",
    DOCUMENTS: "/api/driver/documents",
    DOCUMENT_BY_ID: (documentId: string) =>
      `/api/driver/documents/${documentId}`,
  },

  // ============================================
  // Notifications (shared)
  // ============================================
  NOTIFICATIONS: {
    BASE: "/api/notifications",
    UNREAD_COUNT: "/api/notifications/unread-count",
    MARK_READ: (notificationId: string) =>
      `/api/notifications/${notificationId}/read`,
    MARK_ALL_READ: "/api/notifications/read-all",
    DELETE: (notificationId: string) => `/api/notifications/${notificationId}`,
    DELETE_ALL: "/api/notifications/clear-all",
  },

  // ============================================
  // Upload (authenticated)
  // ============================================
  UPLOAD: {
    IMAGE: "/api/upload/image",
    IMAGE_URL: "/api/upload/image/url",
    DOCUMENT: "/api/upload/document",
    MULTIPLE: "/api/upload/multiple",
  },
} as const;

// ============================================
// Helpers
// ============================================

/** Resolves a relative endpoint path against the configured base URL in production. */
export const getApiUrl = (endpoint: string): string => {
  if (import.meta.env.DEV) {
    return endpoint;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;