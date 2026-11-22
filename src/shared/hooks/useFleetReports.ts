import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  SupervisorDashboardDto,
  SupervisorOrderDto,
  DriverSupervisionDto,
  AreaSummaryDto,
  PagedResult,
} from "@shared/types";

// ============================================
// Query keys
// ============================================

export const REPORTS_KEYS = {
  all: ["fleet-reports"] as const,
  dashboard: () => [...REPORTS_KEYS.all, "dashboard"] as const,
  orders: (filters?: ReportOrderFilters) =>
    filters
      ? ([...REPORTS_KEYS.all, "orders", filters] as const)
      : ([...REPORTS_KEYS.all, "orders"] as const),
  unassignedOrders: () =>
    [...REPORTS_KEYS.all, "orders", "unassigned"] as const,
  drivers: () => [...REPORTS_KEYS.all, "drivers"] as const,
  areas: () => [...REPORTS_KEYS.all, "areas"] as const,
};

// Legacy aliases
export const REPORTS_DASHBOARD_KEY = "fleet-reports-dashboard";
export const REPORTS_ORDERS_KEY = "fleet-reports-orders";
export const REPORTS_DRIVERS_KEY = "fleet-reports-drivers";

// ============================================
// Filters
// ============================================

export interface ReportOrderFilters {
  status?: string;
  from?: string;
  to?: string;
  pageIndex?: number;
  pageSize?: number;
}

// ============================================
// UI-facing derived types
// ============================================

export interface DriverPerformanceSummary {
  id: string;
  fullName: string;
  phoneNumber: string;
  isOnline: boolean;
  isVerified: boolean;
  status: "available" | "on_trip" | "off_duty";
  rating: number;
  totalDeliveries: number;
  todayDeliveries: number;
  activeOrderId: string | null;
  activeOrderStatus: string | null;
  vehicleType: string | null;
  vehiclePlateNumber: string | null;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  storeName: string;
  driverName?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

// ============================================
// Helpers
// ============================================

function deriveDriverStatus(
  d: DriverSupervisionDto,
): "available" | "on_trip" | "off_duty" {
  if (d.activeOrderId) {
    const s = (d.activeOrderStatus ?? "").toLowerCase();
    if (s !== "delivered" && s !== "cancelled" && s !== "failed") {
      return "on_trip";
    }
  }
  if (d.isOnline) return "available";
  return "off_duty";
}

function mapDriver(d: DriverSupervisionDto): DriverPerformanceSummary {
  return {
    id: d.driverId,
    fullName: d.fullName,
    phoneNumber: d.phoneNumber,
    isOnline: d.isOnline,
    isVerified: d.isVerified,
    status: deriveDriverStatus(d),
    rating: d.rating,
    totalDeliveries: d.totalDeliveries,
    todayDeliveries: d.todayDeliveries,
    activeOrderId: d.activeOrderId,
    activeOrderStatus: d.activeOrderStatus,
    vehicleType: d.vehicleType,
    vehiclePlateNumber: d.vehiclePlateNumber,
  };
}

function mapOrder(o: SupervisorOrderDto): OrderSummary {
  return {
    id: o.orderId,
    orderNumber: o.orderNumber ?? `#${o.orderId.slice(0, 8)}`,
    customerName: o.customerName ?? "",
    storeName: o.storeName ?? "",
    driverName: o.driverName ?? undefined,
    status: o.status ?? "",
    totalAmount: o.totalAmount,
    createdAt: o.createdAt,
  };
}

// ============================================
// Hook
// ============================================

export function useReports(filters: ReportOrderFilters = {}) {
  // ── Dashboard ──
  const dashboardQ = useQuery<SupervisorDashboardDto>({
    queryKey: REPORTS_KEYS.dashboard(),
    queryFn: async () => {
      const res = await apiClient.get<SupervisorDashboardDto>(
        ENDPOINTS.SUPERVISOR.DASHBOARD,
      );
      return res.data;
    },
    staleTime: 60_000,
  });

  // ── Orders ──
  const ordersQ = useQuery<SupervisorOrderDto[]>({
    queryKey: REPORTS_KEYS.orders(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        PageIndex: filters.pageIndex ?? 1,
        PageSize: filters.pageSize ?? 200,
      };
      if (filters.status) params.Status = filters.status;
      if (filters.from) params.From = filters.from;
      if (filters.to) params.To = filters.to;

      const res = await apiClient.get<PagedResult<SupervisorOrderDto>>(
        ENDPOINTS.SUPERVISOR.ORDERS,
        params,
      );
      return res.data?.items ?? [];
    },
    staleTime: 30_000,
  });

  // ── Unassigned orders ──
  const unassignedQ = useQuery<SupervisorOrderDto[]>({
    queryKey: REPORTS_KEYS.unassignedOrders(),
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<SupervisorOrderDto>>(
        ENDPOINTS.SUPERVISOR.ORDERS_UNASSIGNED,
        { PageIndex: 1, PageSize: 100 },
      );
      return res.data?.items ?? [];
    },
    staleTime: 30_000,
  });

  // ── Drivers ──
  const driversQ = useQuery<DriverSupervisionDto[]>({
    queryKey: REPORTS_KEYS.drivers(),
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<DriverSupervisionDto>>(
        ENDPOINTS.SUPERVISOR.DRIVERS,
        { PageIndex: 1, PageSize: 1000 },
      );
      return res.data?.items ?? [];
    },
    staleTime: 60_000,
  });

  // ── Areas ──
  const areasQ = useQuery<AreaSummaryDto[]>({
    queryKey: REPORTS_KEYS.areas(),
    queryFn: async () => {
      const res = await apiClient.get<AreaSummaryDto[]>(
        ENDPOINTS.SUPERVISOR.AREAS,
      );
      return res.data ?? [];
    },
    staleTime: 60_000,
  });

  // ── Derived values ──

  const orderSummaries = useMemo<OrderSummary[]>(
    () => (ordersQ.data ?? []).map(mapOrder),
    [ordersQ.data],
  );

  const driverPerformance = useMemo<DriverPerformanceSummary[]>(
    () => (driversQ.data ?? []).map(mapDriver),
    [driversQ.data],
  );

  const orderStatusBreakdown = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const o of ordersQ.data ?? []) {
      const key = o.status ?? "Unknown";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [ordersQ.data]);

  const totalOrderValue = useMemo(
    () =>
      (ordersQ.data ?? []).reduce(
        (sum, o) => sum + (Number.isFinite(o.totalAmount) ? o.totalAmount : 0),
        0,
      ),
    [ordersQ.data],
  );

  const averageOrderValue = useMemo(() => {
    const list = ordersQ.data ?? [];
    return list.length === 0 ? 0 : totalOrderValue / list.length;
  }, [ordersQ.data, totalOrderValue]);

  const areas: AreaSummaryDto[] = useMemo(
    () => dashboardQ.data?.areas ?? areasQ.data ?? [],
    [dashboardQ.data, areasQ.data],
  );

  const unassignedOrderCount = unassignedQ.data?.length ?? 0;

  const isLoading =
    dashboardQ.isLoading ||
    ordersQ.isLoading ||
    driversQ.isLoading;

  const isError = dashboardQ.isError;
  const error = dashboardQ.error as Error | null;

  const refetch = () => {
    dashboardQ.refetch();
    ordersQ.refetch();
    unassignedQ.refetch();
    driversQ.refetch();
    if (!dashboardQ.data?.areas) areasQ.refetch();
  };

  return {
    // Raw
    dashboard: dashboardQ.data ?? null,
    areas,
    driverPerformance,
    orderSummaries,
    unassignedOrderCount,

    // Analytics
    orderStatusBreakdown,
    totalOrderValue,
    averageOrderValue,

    // Status
    isLoading,
    isError,
    error,
    refetch,

    // Granular states
    isDashboardLoading: dashboardQ.isLoading,
    isOrdersLoading: ordersQ.isLoading,
    isDriversLoading: driversQ.isLoading,
  };
}