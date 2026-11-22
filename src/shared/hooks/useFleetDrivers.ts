import { useState, useCallback, useMemo, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  SupervisorCreateDriverDto,
  SupervisorUpdateDriverDto,
  SupervisorDriverFilterDto,
  DriverSupervisionDto,
  PagedResult,
  SupervisorProfileDto,
} from "@shared/types";
import { useToast } from "@shared/components/Toaster";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useAuth } from "@app/providers/AuthProvider";

// ============================================
// Keys
// ============================================

export const DRIVERS_KEY = "fleet-supervisor-drivers";
export const DRIVER_DETAIL_KEY = "fleet-supervisor-driver-detail";

// ============================================
// UI-facing types
// ============================================

export type DriverStatus = "available" | "on_trip" | "off_duty";

export interface DriverDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  isOnline: boolean;
  isVerified: boolean;
  status: DriverStatus;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  cityId?: string | null;
  cityAr?: string | null;
  cityEn?: string | null;
  rating: number;
  totalTrips: number;
  completedTrips: number;
  onTimePercentage: number;
  activeOrderId: string | null;
  activeOrderStatus: string | null;
  lastActiveDate?: string;
  lastLocationUpdateAt: string | null;
  currentLatitude: number;
  currentLongitude: number;
}

export interface DriverFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: DriverStatus;
}

// ============================================
// Helpers
// ============================================

function deriveStatus(d: DriverSupervisionDto): DriverStatus {
  if (d.activeOrderId) {
    const s = (d.activeOrderStatus ?? "").toLowerCase();
    if (s !== "delivered" && s !== "cancelled") return "on_trip";
  }
  if (d.isOnline) return "available";
  return "off_duty";
}

/** Map Driver */
function mapDriver(d: DriverSupervisionDto): DriverDto {
  return {
    id: d.driverId,
    fullName: d.fullName,
    phoneNumber: d.phoneNumber,
    isOnline: d.isOnline,
    isVerified: d.isVerified,
    status: deriveStatus(d),
    vehicleType: d.vehicleType ?? undefined,
    vehiclePlateNumber: d.vehiclePlateNumber ?? undefined,
    cityId: d.cityId,
    cityAr: d.cityAr,
    cityEn: d.cityEn,
    rating: d.rating,
    totalTrips: d.totalDeliveries,
    completedTrips: d.todayDeliveries,
    onTimePercentage: 0,
    activeOrderId: d.activeOrderId,
    activeOrderStatus: d.activeOrderStatus,
    lastLocationUpdateAt: d.lastLocationUpdateAt,
    currentLatitude: d.currentLatitude,
    currentLongitude: d.currentLongitude,
  };
}

function extractPage(raw: unknown): {
  items: DriverSupervisionDto[];
  totalCount: number;
  totalPages: number;
} {
  if (Array.isArray(raw)) {
    return {
      items: raw as DriverSupervisionDto[],
      totalCount: raw.length,
      totalPages: 1,
    };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Partial<PagedResult<DriverSupervisionDto>> &
      Record<string, unknown>;
    const items = Array.isArray(obj.items)
      ? (obj.items as DriverSupervisionDto[])
      : [];
    return {
      items,
      totalCount:
        typeof obj.totalCount === "number" ? obj.totalCount : items.length,
      totalPages: typeof obj.totalPages === "number" ? obj.totalPages : 1,
    };
  }
  return { items: [], totalCount: 0, totalPages: 1 };
}

// ============================================
// Mutations
// ============================================

export function useCreateDriver() {
  const toast = useToast();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const isAr = currentLanguage === "ar";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: SupervisorCreateDriverDto) => {
      const payload: SupervisorCreateDriverDto = { ...dto };

      // ═══════════════════════════════════════════════════════════════
      // Resolve cityId
      // ═══════════════════════════════════════════════════════════════
      if (!payload.cityId) {
        let supervisorCityId = user?.cityId ?? null;

        if (!supervisorCityId) {
          try {
            const profileRes = await apiClient.get<SupervisorProfileDto>(
              ENDPOINTS.SUPERVISOR.PROFILE,
            );
            supervisorCityId = profileRes.data?.cityId ?? null;

            // Sync the cache so this doesn't recur on the next call
            if (supervisorCityId) void refreshProfile();
          } catch (err) {
            if (import.meta.env.DEV) {
              console.error(
                "[useCreateDriver] profile fetch failed while resolving cityId:",
                err,
              );
            }
          }
        }

        if (!supervisorCityId) {
          throw new Error(
            isAr
              ? "لا توجد مدينة معيّنة لحساب المشرف. يرجى التواصل مع المسؤول لتعيين مدينتك أولاً."
              : "No city is assigned to your supervisor account. Please contact an administrator to assign your city first.",
          );
        }

        payload.cityId = supervisorCityId;
      }

      const response = await apiClient.post<DriverSupervisionDto>(
        ENDPOINTS.SUPERVISOR.CREATE_DRIVER,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
      toast.success(
        isAr ? "تم إضافة السائق بنجاح" : "Driver created successfully",
      );
      navigate("/dashboard/drivers");
    },
    onError: (err: Error) => {
      toast.error(isAr ? "فشل إضافة السائق" : "Failed to create driver", {
        description: err.message,
      });
    },
  });
}

export function useUpdateDriver() {
  const toast = useToast();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      driverId,
      dto,
    }: {
      driverId: string;
      dto: SupervisorUpdateDriverDto;
    }) => {
      const response = await apiClient.put<DriverSupervisionDto>(
        ENDPOINTS.SUPERVISOR.UPDATE_DRIVER(driverId),
        dto,
      );
      return response.data;
    },
    onSuccess: (_, { driverId }) => {
      queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [DRIVER_DETAIL_KEY, driverId],
      });
      toast.success(
        isAr ? "تم حفظ بيانات السائق بنجاح" : "Driver updated successfully",
      );
      navigate("/dashboard/drivers");
    },
    onError: (err: Error) => {
      toast.error(isAr ? "فشل حفظ بيانات السائق" : "Failed to update driver", {
        description: err.message,
      });
    },
  });
}

// ============================================
// Page hook
// ============================================

const MAX_PAGE_SIZE = 1000;

export function useDriversPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DriverFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: "fullName",
    sortOrder: "asc",
  });
  const [search, setSearch] = useState("");

  const {
    data: allDrivers,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DriverDto[]>({
    queryKey: [DRIVERS_KEY],
    queryFn: async () => {
      const params: SupervisorDriverFilterDto = {
        PageIndex: 1,
        PageSize: MAX_PAGE_SIZE,
      };
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.DRIVERS,
        params as unknown as Record<string, string | number | boolean>,
      );
      const page = extractPage(response.data);
      return page.items.map(mapDriver);
    },
    staleTime: 30_000,
  });

  const deferredSearch = useDeferredValue(search);

  // ── Client-side filter + sort ──
  const filteredDrivers = useMemo(() => {
    if (!allDrivers) return [];
    let result = [...allDrivers];

    if (deferredSearch.trim()) {
      const term = deferredSearch.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.fullName.toLowerCase().includes(term) ||
          d.phoneNumber.includes(term) ||
          (d.email && d.email.toLowerCase().includes(term)),
      );
    }

    if (filters.status) {
      result = result.filter((d) => d.status === filters.status);
    }

    const sortBy = filters.sortBy || "fullName";
    const sortOrder = filters.sortOrder || "asc";
    result.sort((a, b) => {
      const aVal = String(a[sortBy as keyof DriverDto] ?? "").toLowerCase();
      const bVal = String(b[sortBy as keyof DriverDto] ?? "").toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    allDrivers,
    deferredSearch,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
  ]);

  const totalCount = filteredDrivers.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / (filters.pageSize || 10)),
  );
  const startIndex = ((filters.page || 1) - 1) * (filters.pageSize || 10);
  const drivers = filteredDrivers.slice(
    startIndex,
    startIndex + (filters.pageSize || 10),
  );

  const createDriver = useCreateDriver();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setFilters((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleSort = useCallback((column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder:
        prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleStatusFilter = useCallback((status: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      status: (status || undefined) as DriverStatus | undefined,
      page: 1,
    }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    navigate("/dashboard/drivers/new");
  }, [navigate]);

  const handleOpenEdit = useCallback(
    (driver: DriverDto) => {
      navigate(`/dashboard/drivers/${driver.id}/edit`);
    },
    [navigate],
  );

  return {
    drivers,
    allFilteredDrivers: filteredDrivers,
    totalCount,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,
    filters,
    search,
    createDriver,
    handleSearch,
    handlePageChange,
    handleSort,
    handleStatusFilter,
    handleOpenCreate,
    handleOpenEdit,
  };
}

// ============================================
// Detail
// ============================================

export function useDriverDetail(driverId: string | undefined) {
  return useQuery<DriverDto>({
    queryKey: [DRIVER_DETAIL_KEY, driverId],
    queryFn: async () => {
      const response = await apiClient.get<DriverSupervisionDto>(
        ENDPOINTS.SUPERVISOR.DRIVER_BY_ID(driverId!),
      );
      return mapDriver(response.data);
    },
    enabled: !!driverId,
    staleTime: 30_000,
  });
}
