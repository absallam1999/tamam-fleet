import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  SupervisorOrderDto,
  AssignOrderDto,
  ReassignOrderDto,
  DriverDto,
  PaginatedResponse,
} from "@shared/types";
import { useToast } from "@shared/components/Toaster";
import { useLanguage } from "@/shared/hooks/useLanguage";

export const PENDING_ORDERS_KEY = "fleet-supervisor-pending-orders";
export const ACTIVE_ORDERS_KEY = "fleet-supervisor-active-orders";
export const AVAILABLE_DRIVERS_KEY = "fleet-supervisor-available-drivers";

// ============================================
// Helper: Recursively extract array from various shapes
// ============================================

function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Direct keys
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];

    // Nested: { data: { items: [] } } or { data: { data: [] } }
    if (obj.data && typeof obj.data === "object") {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items as T[];
      if (Array.isArray(inner.data)) return inner.data as T[];
    }

    // Nested: { items: { items: [] } } (unlikely but safe)
    if (obj.items && typeof obj.items === "object") {
      const inner = obj.items as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items as T[];
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }

  // If nothing found, log warning and return empty array
  console.warn("Unexpected order list shape:", data);
  return [];
}

// ============================================
// Hook
// ============================================

export function useFleetOrders() {
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = currentLanguage === "ar";

  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");
  const [assignTarget, setAssignTarget] = useState<SupervisorOrderDto | null>(
    null,
  );
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState("");
  const [reassignTarget, setReassignTarget] =
    useState<SupervisorOrderDto | null>(null);
  const [reassignDriverId, setReassignDriverId] = useState<string>("");
  const [reassignNotes, setReassignNotes] = useState("");

  // GET /api/supervisor/orders/pending
  const {
    data: pendingOrdersData,
    isLoading: pendingLoading,
    isError: pendingError,
    error: pendingErr,
    refetch: refetchPending,
  } = useQuery<SupervisorOrderDto[]>({
    queryKey: [PENDING_ORDERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.ORDERS_PENDING,
      );
      console.log("Pending orders raw response:", response.data); // debug
      return extractArray<SupervisorOrderDto>(response.data);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // GET /api/supervisor/orders/active
  const {
    data: activeOrdersData,
    isLoading: activeLoading,
    isError: activeError,
    error: activeErr,
    refetch: refetchActive,
  } = useQuery<SupervisorOrderDto[]>({
    queryKey: [ACTIVE_ORDERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.ORDERS_ACTIVE,
      );
      console.log("Active orders raw response:", response.data); // debug
      return extractArray<SupervisorOrderDto>(response.data);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // GET /api/supervisor/drivers (paginated)
  const { data: driversData } = useQuery<PaginatedResponse<DriverDto>>({
    queryKey: [AVAILABLE_DRIVERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<DriverDto>>(
        ENDPOINTS.SUPERVISOR.DRIVERS,
      );
      return response.data;
    },
    staleTime: 30_000,
  });

  // Guarantee arrays with fallback
  const pendingOrders = Array.isArray(pendingOrdersData)
    ? pendingOrdersData
    : [];
  const activeOrders = Array.isArray(activeOrdersData) ? activeOrdersData : [];
  const drivers = driversData?.items ?? [];
  const availableDrivers = drivers.filter((d) => d.status === "available");

  // Mutations (unchanged except explicit void returns)
  const assignOrder = useMutation({
    mutationFn: async (dto: AssignOrderDto) => {
      await apiClient.post<void>(ENDPOINTS.SUPERVISOR.ASSIGN_ORDER, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_ORDERS_KEY] });
      toast.success(
        isAr ? "تم تعيين الطلب بنجاح" : "Order assigned successfully",
      );
      setAssignTarget(null);
      setSelectedDriverId("");
      setAssignNotes("");
    },
    onError: (err: Error) => {
      toast.error(isAr ? "فشل تعيين الطلب" : "Failed to assign order", {
        description: err.message,
      });
    },
  });

  const reassignOrder = useMutation({
    mutationFn: async ({
      orderId,
      dto,
    }: {
      orderId: string;
      dto: ReassignOrderDto;
    }) => {
      await apiClient.post<void>(
        ENDPOINTS.SUPERVISOR.REASSIGN_ORDER(orderId),
        dto,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_ORDERS_KEY] });
      toast.success(
        isAr ? "تم إعادة تعيين الطلب بنجاح" : "Order reassigned successfully",
      );
      setReassignTarget(null);
      setReassignDriverId("");
      setReassignNotes("");
    },
    onError: (err: Error) => {
      toast.error(isAr ? "فشل إعادة تعيين الطلب" : "Failed to reassign order", {
        description: err.message,
      });
    },
  });

  const unassignOrder = useMutation({
    mutationFn: async (orderId: string) => {
      await apiClient.post<void>(ENDPOINTS.SUPERVISOR.UNASSIGN_ORDER(orderId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_ORDERS_KEY] });
      toast.success(
        isAr ? "تم إلغاء تعيين الطلب بنجاح" : "Order unassigned successfully",
      );
    },
    onError: (err: Error) => {
      toast.error(isAr ? "فشل إلغاء تعيين الطلب" : "Failed to unassign order", {
        description: err.message,
      });
    },
  });

  // Handlers (unchanged)
  const handleOpenAssign = useCallback((order: SupervisorOrderDto) => {
    setAssignTarget(order);
    setSelectedDriverId("");
    setAssignNotes("");
  }, []);

  const handleCloseAssign = useCallback(() => {
    setAssignTarget(null);
    setSelectedDriverId("");
    setAssignNotes("");
  }, []);

  const handleConfirmAssign = useCallback(() => {
    if (assignTarget && selectedDriverId) {
      assignOrder.mutate({
        orderId: assignTarget.id,
        driverId: selectedDriverId,
        notes: assignNotes || undefined,
      });
    }
  }, [assignTarget, selectedDriverId, assignNotes, assignOrder]);

  const handleOpenReassign = useCallback((order: SupervisorOrderDto) => {
    setReassignTarget(order);
    setReassignDriverId("");
    setReassignNotes("");
  }, []);

  const handleCloseReassign = useCallback(() => {
    setReassignTarget(null);
    setReassignDriverId("");
    setReassignNotes("");
  }, []);

  const handleConfirmReassign = useCallback(() => {
    if (reassignTarget && reassignDriverId) {
      reassignOrder.mutate({
        orderId: reassignTarget.id,
        dto: { driverId: reassignDriverId, notes: reassignNotes || undefined },
      });
    }
  }, [reassignTarget, reassignDriverId, reassignNotes, reassignOrder]);

  const handleUnassign = useCallback(
    (orderId: string) => {
      if (
        confirm(
          isAr
            ? "هل أنت متأكد من إلغاء تعيين هذا الطلب؟"
            : "Are you sure you want to unassign this order?",
        )
      ) {
        unassignOrder.mutate(orderId);
      }
    },
    [unassignOrder, isAr],
  );

  return {
    pendingOrders,
    activeOrders,
    availableDrivers,
    pendingLoading,
    activeLoading,
    pendingError,
    activeError,
    pendingErr,
    activeErr,
    refetchPending,
    refetchActive,
    activeTab,
    setActiveTab,
    assignTarget,
    selectedDriverId,
    setSelectedDriverId,
    assignNotes,
    setAssignNotes,
    assignOrder,
    handleOpenAssign,
    handleCloseAssign,
    handleConfirmAssign,
    reassignTarget,
    reassignDriverId,
    setReassignDriverId,
    reassignNotes,
    setReassignNotes,
    reassignOrder,
    handleOpenReassign,
    handleCloseReassign,
    handleConfirmReassign,
    unassignOrder,
    handleUnassign,
  };
}
