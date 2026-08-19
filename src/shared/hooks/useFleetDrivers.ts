import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  DriverDto,
  SupervisorCreateDriverDto,
  DriverFilterParams,
  DriverStatus,
} from "@shared/types";
import { useToast } from "@shared/components/Toaster";
import { useLanguage } from "@/shared/hooks/useLanguage";

export const DRIVERS_KEY = "fleet-supervisor-drivers";
export const DRIVER_DETAIL_KEY = "fleet-supervisor-driver-detail";

// ============================================
// Helpers
// ============================================

/**
 * Extracts the inner `data` property from the API envelope.
 * Envelope: { success, message, data, errors, timestamp }
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
// Update DTO (new endpoint)
// ============================================

export interface SupervisorUpdateDriverDto {
  phoneNumber: string;
  fullName: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
}

// ============================================
// Mutations (standalone)
// ============================================

export function useCreateDriver() {
  const toast = useToast();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: SupervisorCreateDriverDto) => {
      await apiClient.post(ENDPOINTS.SUPERVISOR.CREATE_DRIVER, dto);
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
    mutationFn: async (dto: SupervisorUpdateDriverDto) => {
      await apiClient.put(ENDPOINTS.SUPERVISOR.UPDATE_DRIVER, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
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

export function useToggleDriverAvailability() {
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (driverId: string) => {
      await apiClient.patch(
        ENDPOINTS.SUPERVISOR.TOGGLE_DRIVER_AVAILABILITY(driverId),
      );
    },
    onSuccess: (_, driverId) => {
      queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [DRIVER_DETAIL_KEY, driverId],
      });
      toast.success(
        isAr ? "تم تحديث حالة السائق بنجاح" : "Driver status updated",
      );
    },
    onError: (err: Error) => {
      toast.error(
        isAr ? "فشل تحديث حالة السائق" : "Failed to update driver status",
        { description: err.message },
      );
    },
  });
}

// ============================================
// Main Page Hook
// ============================================

export function useDriversPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DriverFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: "fullName",
    sortOrder: "asc",
  });
  const [search, setSearch] = useState("");

  // Fetch ALL drivers (API returns array, no server pagination)
  const {
    data: allDrivers,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DriverDto[]>({
    queryKey: [DRIVERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.DRIVERS,
      );
      const envelope = response.data;
      const innerData = extractApiData<unknown[]>(envelope);
      if (!Array.isArray(innerData)) {
        console.warn("Unexpected drivers response shape:", innerData);
        return [];
      }
      return innerData.map(mapDriver);
    },
    staleTime: 30_000,
  });

  // Apply search, status filter, sorting, and pagination client-side
  const filteredDrivers = useMemo(() => {
    if (!allDrivers) return [];
    let result = [...allDrivers];

    // Search
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.fullName.toLowerCase().includes(term) ||
          d.phoneNumber.includes(term) ||
          (d.email && d.email.toLowerCase().includes(term)),
      );
    }

    // Status filter
    if (filters.status) {
      result = result.filter((d) => d.status === filters.status);
    }

    // Sort
    const sortBy = filters.sortBy || "fullName";
    const sortOrder = filters.sortOrder || "asc";
    result.sort((a, b) => {
      const aVal = (a[sortBy as keyof DriverDto] ?? "")
        .toString()
        .toLowerCase();
      const bVal = (b[sortBy as keyof DriverDto] ?? "")
        .toString()
        .toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allDrivers, search, filters.status, filters.sortBy, filters.sortOrder]);

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

  // Mutations
  const createDriver = useCreateDriver();
  const toggleDriverAvailability = useToggleDriverAvailability();

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setFilters((prev) => ({ ...prev, page: 1 }));
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

  const handleToggleAvailability = useCallback(
    (driverId: string) => {
      toggleDriverAvailability.mutate(driverId);
    },
    [toggleDriverAvailability],
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
    toggleDriverAvailability,
    handleSearch,
    handlePageChange,
    handleSort,
    handleStatusFilter,
    handleOpenCreate,
    handleOpenEdit,
    handleToggleAvailability,
  };
}

// ============================================
// Detail Query
// ============================================

export function useDriverDetail(driverId: string | undefined) {
  return useQuery<DriverDto>({
    queryKey: [DRIVER_DETAIL_KEY, driverId],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.DRIVER_BY_ID(driverId!),
      );
      const envelope = response.data;
      const data = extractApiData<any>(envelope);
      return mapDriver(data);
    },
    enabled: !!driverId,
    staleTime: 30_000,
  });
}
