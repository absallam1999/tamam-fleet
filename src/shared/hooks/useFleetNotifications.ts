import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  NotificationSummaryDto,
  NotificationDto,
  NotificationPayloadDto,
  NotificationListQuery,
  NotificationPreferencesDto,
  UnreadCountDto,
  MarkAllAsReadResultDto,
  PagedResult,
} from "@shared/types";

// ============================================================
// Query keys
// ============================================================

export const FLEET_NOTIFICATIONS_KEY = "fleet-notifications";
export const FLEET_UNREAD_COUNT_KEY = "fleet-notifications-unread-count";
export const FLEET_NOTIFICATION_PREFERENCES_KEY =
  "fleet-notification-preferences";

// ============================================================
// UI-facing shape
// ============================================================

export interface FleetNotificationDto {
  id: string;

  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;

  title: string;
  body: string;

  type: string;
  isRead: boolean;
  createdAt: string;
  payload: NotificationPayloadDto | null;
  link?: string;
}

export type NotificationLocale = "ar" | "en";

export function localizeNotification(
  n: Pick<FleetNotificationDto, "titleAr" | "titleEn" | "bodyAr" | "bodyEn">,
  locale: NotificationLocale,
): { title: string; body: string } {
  return locale === "ar"
    ? {
        title: n.titleAr.trim() || n.titleEn,
        body: n.bodyAr.trim() || n.bodyEn,
      }
    : {
        title: n.titleEn.trim() || n.titleAr,
        body: n.bodyEn.trim() || n.bodyAr,
      };
}

// ============================================================
// Helpers
// ============================================================

function extractItems<T>(data: PagedResult<T> | null | undefined): T[] {
  if (!data) return [];
  return data.items ?? [];
}

function pickLocalized(
  ar: string | null | undefined,
  en: string | null | undefined,
): string {
  if (ar && ar.trim()) return ar;
  if (en && en.trim()) return en;
  return "";
}

function deriveLink(
  payload: NotificationPayloadDto | null | undefined,
): string | undefined {
  if (!payload) return undefined;

  const action = payload.action?.toLowerCase();
  const targetPage = payload.targetPage?.toLowerCase();

  const pageRoutes: Record<string, string> = {
    home: "/dashboard",
    dashboard: "/dashboard",
    drivers: "/dashboard/drivers",
    orders: "/dashboard/orders",
    ordertracking: "/dashboard/orders",
    requests: "/dashboard/requests",
    wallet: "/dashboard/wallet",
    settings: "/dashboard/settings",
    notifications: "/dashboard/notifications",
  };

  if (action === "navigate" && targetPage) {
    return pageRoutes[targetPage] ?? `/dashboard/${targetPage}`;
  }

  if (payload.targetId) {
    if (targetPage === "drivers")
      return `/dashboard/drivers/${payload.targetId}`;
    if (targetPage === "orders" || targetPage === "ordertracking")
      return `/dashboard/orders/${payload.targetId}`;
  }

  if (payload.extra) {
    if (payload.extra.driverId)
      return `/dashboard/drivers/${payload.extra.driverId}`;
    if (payload.extra.orderId)
      return `/dashboard/orders/${payload.extra.orderId}`;
    if (payload.extra.conversationId)
      return `/dashboard/chat/${payload.extra.conversationId}`;
    if (payload.extra.url) return payload.extra.url;
  }

  return undefined;
}

function toFleetNotification(dto: NotificationSummaryDto): FleetNotificationDto {
  const titleAr = dto.titleAr ?? "";
  const titleEn = dto.titleEn ?? "";
  const bodyAr = dto.bodyAr ?? "";
  const bodyEn = dto.bodyEn ?? "";

  return {
    id: dto.id,

    titleAr,
    titleEn,
    bodyAr,
    bodyEn,

    title: pickLocalized(titleAr, titleEn),
    body: pickLocalized(bodyAr, bodyEn),

    type: dto.type ?? "",
    isRead: dto.isRead,
    createdAt: dto.createdAt,
    payload: dto.payload ?? null,
    link: deriveLink(dto.payload ?? null),
  };
}

// ============================================================
// Queries
// ============================================================

/**
 * Fetch notifications
 */
export const useNotifications = (
  pageIndex = 1,
  pageSize = 20,
  filters: Omit<NotificationListQuery, "pageIndex" | "pageSize"> = {},
) => {
  return useQuery<FleetNotificationDto[]>({
    queryKey: [FLEET_NOTIFICATIONS_KEY, pageIndex, pageSize, filters],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        pageIndex,
        pageSize,
      };
      if (filters.Type) params.Type = filters.Type;
      if (typeof filters.IsRead === "boolean") params.IsRead = filters.IsRead;
      if (filters.From) params.From = filters.From;
      if (filters.To) params.To = filters.To;

      const response = await apiClient.get<unknown>(
        ENDPOINTS.NOTIFICATIONS.BASE,
        params,
      );

      const page = response.data as PagedResult<NotificationSummaryDto> | null;
      const items = extractItems<NotificationSummaryDto>(page);
      return items.map(toFleetNotification);
    },
    staleTime: 30_000,
  });
};

/**
 * Fetch a single notification.
 */
export const useNotification = (id: string | null | undefined) => {
  return useQuery<NotificationDto>({
    queryKey: [FLEET_NOTIFICATIONS_KEY, "detail", id],
    queryFn: async () => {
      const response = await apiClient.get<NotificationDto>(
        ENDPOINTS.NOTIFICATIONS.BY_ID(id!),
      );
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Fetch unread count.
 */
export const useUnreadCount = () => {
  return useQuery<{ count: number; byType: Record<string, number> | null }>({
    queryKey: [FLEET_UNREAD_COUNT_KEY],
    queryFn: async () => {
      const response = await apiClient.get<UnreadCountDto>(
        ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
      );
      return {
        count: response.data?.total ?? 0,
        byType: response.data?.byType ?? null,
      };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
};

/**
 * Fetch notification preferences.
 */
export const useNotificationPreferences = () => {
  return useQuery<NotificationPreferencesDto>({
    queryKey: [FLEET_NOTIFICATION_PREFERENCES_KEY],
    queryFn: async () => {
      const response = await apiClient.get<NotificationPreferencesDto>(
        ENDPOINTS.NOTIFICATIONS.PREFERENCES,
      );
      return response.data;
    },
    staleTime: 60_000,
  });
};

// ============================================================
// Mutations
// ============================================================

export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.post<void>(
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
  return useMutation<MarkAllAsReadResultDto>({
    mutationFn: async () => {
      const response = await apiClient.post<MarkAllAsReadResultDto>(
        ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
      );
      return response.data;
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
        ENDPOINTS.NOTIFICATIONS.BY_ID(notificationId),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FLEET_NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [FLEET_UNREAD_COUNT_KEY] });
    },
  });
};

export const useDeleteNotifications = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      await Promise.all(
        notificationIds.map((id) =>
          apiClient.delete<void>(ENDPOINTS.NOTIFICATIONS.BY_ID(id)),
        ),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FLEET_NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [FLEET_UNREAD_COUNT_KEY] });
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const qc = useQueryClient();
  return useMutation<
    NotificationPreferencesDto,
    Error,
    Partial<NotificationPreferencesDto>
  >({
    mutationFn: async (prefs) => {
      const response = await apiClient.put<NotificationPreferencesDto>(
        ENDPOINTS.NOTIFICATIONS.PREFERENCES,
        prefs,
      );
      return response.data;
    },
    onSuccess: (data) => {
      qc.setQueryData([FLEET_NOTIFICATION_PREFERENCES_KEY], data);
    },
  });
};