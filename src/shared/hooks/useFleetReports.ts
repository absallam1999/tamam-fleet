import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  SupervisorDashboardDto,
  SupervisorOrderDto,
  DriverDto,
} from "@shared/types";

export const REPORTS_DASHBOARD_KEY = "fleet-reports-dashboard";
export const REPORTS_ORDERS_KEY = "fleet-reports-orders";
export const REPORTS_DRIVERS_KEY = "fleet-reports-drivers";

// ============================================
// Helpers
// ============================================

/**
 * Extracts the inner `data` property from the API envelope.
 */
function extractApiData<T>(responseData: unknown): T {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return (responseData as Record<string, unknown>).data as T;
  }
  return responseData as T;
}

/**
 * Recursively extracts an array from common API response shapes.
 */
function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];

    if (obj.data && typeof obj.data === "object") {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items as T[];
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }

  console.warn("Unexpected report list shape:", data);
  return [];
}

/**
 * Maps API driver object to frontend DriverDto.
 * API returns `driverId` instead of `id`.
 */
function mapDriver(driver: any): DriverDto {
  return {
    ...driver,
    id: driver.driverId,
  };
}

// ============================================
// Types
// ============================================

export interface DriverPerformanceSummary {
  id: string;
  fullName: string;
  status: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  onTimePercentage: number;
  rating: number;
  vehicleType?: string;
  vehiclePlateNumber?: string;
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
// Hook
// ============================================

export function useReports() {
  // GET /api/supervisor/dashboard
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    error: dashboardErr,
    refetch: refetchDashboard,
  } = useQuery<SupervisorDashboardDto>({
    queryKey: [REPORTS_DASHBOARD_KEY],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.DASHBOARD,
      );
      const envelope = response.data;
      const data = extractApiData<SupervisorDashboardDto>(envelope);
      return data;
    },
    staleTime: 60_000,
  });

  // GET /api/supervisor/orders/active
  const {
    data: activeOrders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery<SupervisorOrderDto[]>({
    queryKey: [REPORTS_ORDERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.ORDERS_ACTIVE,
      );
      const envelope = response.data;
      const data = extractApiData<unknown>(envelope);
      return extractArray<SupervisorOrderDto>(data);
    },
    staleTime: 30_000,
  });

  // GET /api/supervisor/drivers
  const {
    data: drivers,
    isLoading: driversLoading,
    refetch: refetchDrivers,
  } = useQuery<DriverDto[]>({
    queryKey: [REPORTS_DRIVERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.DRIVERS,
      );
      const envelope = response.data;
      const data = extractApiData<unknown>(envelope);
      const list = extractArray<any>(data);
      return list.map(mapDriver);
    },
    staleTime: 60_000,
  });

  // Derived data
  const driverPerformance: DriverPerformanceSummary[] = (drivers ?? []).map(
    (d) => ({
      id: d.id,
      fullName: d.fullName,
      status: d.status,
      totalTrips: d.totalTrips || 0,
      completedTrips: d.completedTrips || 0,
      cancelledTrips: d.cancelledTrips || 0,
      onTimePercentage: d.onTimePercentage || 0,
      rating: d.rating || 0,
      vehicleType: d.vehicleType,
      vehiclePlateNumber: d.vehiclePlateNumber,
    }),
  );

  const orderSummaries: OrderSummary[] = (activeOrders ?? [])
    .slice(0, 10)
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber || `#${o.id.slice(0, 8)}`,
      customerName: o.customerName,
      storeName: o.storeName,
      driverName: o.driverName,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
    }));

  const isLoading = dashboardLoading || ordersLoading || driversLoading;

  const refetchAll = () => {
    refetchDashboard();
    refetchOrders();
    refetchDrivers();
  };

  return {
    dashboard: dashboard ?? null,
    driverPerformance,
    orderSummaries,
    isLoading,
    isError: dashboardError,
    error: dashboardErr,
    refetch: refetchAll,
  };
}
