import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";

export const FLEET_NOTIFICATIONS_KEY = "fleet-notifications";
export const FLEET_UNREAD_COUNT_KEY = "fleet-notifications-unread-count";

export interface FleetNotificationDto {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  dataJson: string | null;
  createdAt: string;
  link?: string;
}

// ============================================================
// Helper: Recursively extract array from various shapes
// ============================================================

function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];

    // Nested: { data: { items: [] } } or { data: { data: [] } }
    if (obj.data && typeof obj.data === "object") {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items as T[];
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
    if (obj.items && typeof obj.items === "object") {
      const inner = obj.items as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items as T[];
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }

  console.warn("Unexpected notification list shape:", data);
  return [];
}

// ============================================================
// Helper: Parse dataJson to extract navigation link
// ============================================================

function parseLink(dataJson: string | null): string | undefined {
  if (!dataJson) return undefined;
  try {
    const parsed = JSON.parse(dataJson);
    if (parsed.action === "navigate" && parsed.targetPage) {
      const pageRoutes: Record<string, string> = {
        Dashboard: "/dashboard",
        Drivers: "/dashboard/drivers",
        Orders: "/dashboard/orders",
        Requests: "/dashboard/requests",
        Wallet: "/dashboard/wallet",
        Settings: "/dashboard/settings",
        Notifications: "/dashboard/notifications",
      };
      return (
        pageRoutes[parsed.targetPage] ||
        `/dashboard/${parsed.targetPage.toLowerCase()}`
      );
    }
    if (parsed.driverId) return `/dashboard/drivers/${parsed.driverId}`;
    if (parsed.orderId) return `/dashboard/orders/${parsed.orderId}`;
    if (parsed.url) return parsed.url;
  } catch {
    // Invalid JSON — ignore
  }
  return undefined;
}

// ============================================================
// Queries
// ============================================================

/**
 * Fetch fleet notifications with pagination.
 * Returns an array of notifications for the current page.
 */
export const useNotifications = (page = 1, pageSize = 20) => {
  return useQuery<FleetNotificationDto[]>({
    queryKey: [FLEET_NOTIFICATIONS_KEY, page, pageSize],
    queryFn: async () => {
      const params = {
        page: String(page),
        pageSize: String(pageSize),
      };
      const response = await apiClient.get<unknown>( // use unknown for flexible parsing
        ENDPOINTS.NOTIFICATIONS.BASE,
        params,
      );
      console.log("Notifications raw response:", response.data); // debug

      const list = extractArray<FleetNotificationDto>(response.data);
      // Add derived link to each notification
      return list.map((n) => ({
        ...n,
        link: parseLink(n.dataJson),
      }));
    },
    staleTime: 30_000,
  });
};

/**
 * Fetch unread notification count.
 * Auto-refreshes every 30 seconds.
 */
export const useUnreadCount = () => {
  return useQuery<{ count: number }>({
    queryKey: [FLEET_UNREAD_COUNT_KEY],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
      );
      console.log("Unread count raw response:", response.data); // debug

      // Try to extract count from various shapes
      const data = response.data;
      if (typeof data === "number") return { count: data };
      if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (typeof obj.count === "number") return { count: obj.count };
        if (typeof obj.unreadCount === "number")
          return { count: obj.unreadCount };
        // Maybe the count is inside data
        if (obj.data && typeof obj.data === "object") {
          const inner = obj.data as Record<string, unknown>;
          if (typeof inner.count === "number") return { count: inner.count };
          if (typeof inner.unreadCount === "number")
            return { count: inner.unreadCount };
        }
      }
      console.warn("Unexpected unread count shape:", data);
      return { count: 0 };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
};

// ============================================================
// Mutations (unchanged)
// ============================================================

export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.patch<void>(
        ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FLEET_NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [FLEET_UNREAD_COUNT_KEY] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch<void>(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FLEET_NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [FLEET_UNREAD_COUNT_KEY] });
    },
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete<void>(
        ENDPOINTS.NOTIFICATIONS.DELETE(notificationId),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FLEET_NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [FLEET_UNREAD_COUNT_KEY] });
    },
  });
};

export const useDeleteAllNotifications = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete<void>(ENDPOINTS.NOTIFICATIONS.DELETE_ALL);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FLEET_NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [FLEET_UNREAD_COUNT_KEY] });
    },
  });
};
