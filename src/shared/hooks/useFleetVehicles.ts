import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  DriverDto,
  SupervisorCreateDriverDto,
  UpdateDriverDto,
  DriverFilterParams,
  DriverStatus,
  PaginatedResponse,
} from "@shared/types";
import { useToast } from "@shared/components/Toaster";
import { useLanguage } from "@/shared/hooks/useLanguage";

// ============================================
// Query Keys
// ============================================

export const DRIVERS_KEY = "fleet-supervisor-drivers";

// ============================================
// Helpers
// ============================================

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as Record<string, unknown>).data as T;
  }
  return response as T;
}

// ============================================
// Hook
// ============================================

export function useDriversPage() {
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = currentLanguage === "ar";

  // ---- Filters State ----
  const [filters, setFilters] = useState<DriverFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: "fullName",
    sortOrder: "asc",
  });

  // ---- Search State ----
  const [search, setSearch] = useState("");

  // ---- Selected Drivers (for bulk actions) ----
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ---- Delete Confirmation ----
  const [deleteTarget, setDeleteTarget] = useState<DriverDto | null>(null);

  // ---- Form Modal ----
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [formDriver, setFormDriver] = useState<DriverDto | null>(null);

  // ============================================
  // Queries — GET /api/supervisor/drivers
  // ============================================

  const {
    data: driversData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PaginatedResponse<DriverDto>>({
    queryKey: [DRIVERS_KEY, filters, search],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(filters.page || 1),
        pageSize: String(filters.pageSize || 10),
        sortBy: filters.sortBy || "fullName",
        sortOrder: filters.sortOrder || "asc",
      };

      if (search) params.search = search;
      if (filters.status) params.status = filters.status;

      const response = await apiClient.get<PaginatedResponse<DriverDto>>(
        ENDPOINTS.SUPERVISOR.DRIVERS,
        params,
      );
      return unwrap<PaginatedResponse<DriverDto>>(response.data);
    },
    staleTime: 30_000,
  });

  const drivers = driversData?.items ?? [];
  const totalCount = driversData?.totalCount ?? 0;
  const totalPages = driversData?.totalPages ?? 1;

  // ============================================
  // Mutations
  // ============================================

  // POST /api/supervisor/create-driver
  const createDriver = useMutation({
    mutationFn: async (dto: SupervisorCreateDriverDto) => {
      const response = await apiClient.post<DriverDto>(
        ENDPOINTS.SUPERVISOR.CREATE_DRIVER,
        dto,
      );
      return unwrap<DriverDto>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
      toast.success(isAr ? "تم إضافة السائق بنجاح" : "Driver created successfully");
      setFormMode(null);
      setFormDriver(null);
    },
    onError: (err: Error) => {
      toast.error(isAr ? "فشل إضافة السائق" : "Failed to create driver", {
        description: err.message,
      });
    },
  });

  // PUT /api/Drivers/{id} (update driver)
  const updateDriver = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateDriverDto }) => {
      const response = await apiClient.put<DriverDto>(
        ENDPOINTS.DRIVERS.BY_ID(id),
        dto,
      );
      return unwrap<DriverDto>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
      toast.success(isAr ? "تم تحديث السائق بنجاح" : "Driver updated successfully");
      setFormMode(null);
      setFormDriver(null);
    },
    onError: (err: Error) => {
      toast.error(isAr ? "فشل تحديث السائق" : "Failed to update driver", {
        description: err.message,
      });
    },
  });

  // PATCH /api/supervisor/drivers/{driverId}/toggle-availability
  const toggleDriverAvailability = useMutation({
    mutationFn: async (driverId: string) => {
      await apiClient.patch(
        ENDPOINTS.SUPERVISOR.TOGGLE_DRIVER_AVAILABILITY(driverId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
      toast.success(isAr ? "تم تحديث حالة السائق بنجاح" : "Driver status updated");
    },
    onError: (err: Error) => {
      toast.error(isAr ? "فشل تحديث حالة السائق" : "Failed to update driver status", {
        description: err.message,
      });
    },
  });

  // ============================================
  // Handlers
  // ============================================

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    setSelectedIds([]);
  }, []);

  const handleSort = useCallback((column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleStatusFilter = useCallback((status: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      status: status as DriverStatus | undefined,
      page: 1,
    }));
    setSelectedIds([]);
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(drivers.map((d) => d.id));
      } else {
        setSelectedIds([]);
      }
    },
    [drivers],
  );

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id),
    );
  }, []);

  const handleOpenCreate = useCallback(() => {
    setFormMode("create");
    setFormDriver(null);
  }, []);

  const handleOpenEdit = useCallback((driver: DriverDto) => {
    setFormMode("edit");
    setFormDriver(driver);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormMode(null);
    setFormDriver(null);
  }, []);

  const handleSubmitForm = useCallback(
    (dto: SupervisorCreateDriverDto | UpdateDriverDto) => {
      if (formMode === "create") {
        createDriver.mutate(dto as SupervisorCreateDriverDto);
      } else if (formMode === "edit" && formDriver) {
        updateDriver.mutate({ id: formDriver.id, dto: dto as UpdateDriverDto });
      }
    },
    [formMode, formDriver, createDriver, updateDriver],
  );

  const handleToggleAvailability = useCallback(
    (driverId: string) => {
      toggleDriverAvailability.mutate(driverId);
    },
    [toggleDriverAvailability],
  );

  // ============================================
  // Memoized Values
  // ============================================

  const allSelected = useMemo(
    () => drivers.length > 0 && selectedIds.length === drivers.length,
    [drivers.length, selectedIds.length],
  );

  const someSelected = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < drivers.length,
    [selectedIds.length, drivers.length],
  );

  return {
    // Data
    drivers,
    totalCount,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,

    // Filters
    filters,
    search,
    selectedIds,
    allSelected,
    someSelected,

    // Mutations
    createDriver,
    updateDriver,
    toggleDriverAvailability,

    // Form
    formMode,
    formDriver,
    deleteTarget,

    // Handlers
    handleSearch,
    handlePageChange,
    handleSort,
    handleStatusFilter,
    handleSelectAll,
    handleSelectOne,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseForm,
    handleSubmitForm,
    handleToggleAvailability,
  };
}