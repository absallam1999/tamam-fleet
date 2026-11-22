import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  SupervisorOrderDto,
  AssignOrderDto,
  ReassignOrderDto,
  DriverSupervisionDto,
  PagedResult,
} from "@shared/types";
import { useToast } from "@shared/components/Toaster";
import { useLanguage } from "@/shared/hooks/useLanguage";

// ============================================
// Keys
// ============================================

export const PENDING_ORDERS_KEY = "fleet-supervisor-pending-orders";
export const ACTIVE_ORDERS_KEY = "fleet-supervisor-active-orders";
export const AVAILABLE_DRIVERS_KEY = "fleet-supervisor-available-drivers";

// ============================================
// Status helpers 
// ============================================

const TERMINAL_STATUSES = new Set<string>([
  "Delivered",
  "Cancelled",
  "Failed",
]);

const isTerminalStatus = (status: string | null | undefined): boolean =>
  !!status && TERMINAL_STATUSES.has(status);

// ============================================
// Hook
// ============================================

export function useFleetOrders() {
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = currentLanguage === "ar";

  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");

  // Assign modal
  const [assignTarget, setAssignTarget] = useState<SupervisorOrderDto | null>(
    null,
  );
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState("");

  // Reassign modal
  const [reassignTarget, setReassignTarget] =
    useState<SupervisorOrderDto | null>(null);
  const [reassignDriverId, setReassignDriverId] = useState<string>("");
  const [reassignNotes, setReassignNotes] = useState("");

  // ── PENDING ──
  const {
    data: pendingOrdersData,
    isLoading: pendingLoading,
    isError: pendingError,
    error: pendingErr,
    refetch: refetchPending,
  } = useQuery<SupervisorOrderDto[]>({
    queryKey: [PENDING_ORDERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<PagedResult<SupervisorOrderDto>>(
        ENDPOINTS.SUPERVISOR.ORDERS_UNASSIGNED,
        { PageIndex: 1, PageSize: 100 },
      );
      return response.data?.items ?? [];
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // ── ALL ORDERS ──
  const {
    data: allOrdersData,
    isLoading: allOrdersLoading,
    isError: allOrdersError,
    error: allOrdersErr,
    refetch: refetchAllOrders,
  } = useQuery<SupervisorOrderDto[]>({
    queryKey: [ACTIVE_ORDERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<PagedResult<SupervisorOrderDto>>(
        ENDPOINTS.SUPERVISOR.ORDERS,
        { PageIndex: 1, PageSize: 200 },
      );
      return response.data?.items ?? [];
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // ── ACTIVE ──
  const activeOrders: SupervisorOrderDto[] = useMemo(
    () =>
      (allOrdersData ?? []).filter(
        (o) => o.driverId != null && !isTerminalStatus(o.status),
      ),
    [allOrdersData],
  );

  // ── AVAILABLE DRIVERS ──
  const {
    data: availableDriversData,
    isLoading: driversLoading,
  } = useQuery<DriverSupervisionDto[]>({
    queryKey: [AVAILABLE_DRIVERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<DriverSupervisionDto[]>(
        ENDPOINTS.SUPERVISOR.DRIVERS_AVAILABLE,
      );
      return response.data ?? [];
    },
    staleTime: 30_000,
  });

  const pendingOrders = pendingOrdersData ?? [];
  const availableDrivers = availableDriversData ?? [];

  // ============================================
  // Mutations
  // ============================================

  const assignOrder = useMutation<void, Error, AssignOrderDto>({
    mutationFn: async (dto) => {
      await apiClient.post<void>(ENDPOINTS.SUPERVISOR.ASSIGN_ORDER, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [AVAILABLE_DRIVERS_KEY] });
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

  const reassignOrder = useMutation<
    void,
    Error,
    { orderId: string; dto: ReassignOrderDto }
  >({
    mutationFn: async ({ orderId, dto }) => {
      await apiClient.post<void>(
        ENDPOINTS.SUPERVISOR.REASSIGN_ORDER(orderId),
        dto,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [AVAILABLE_DRIVERS_KEY] });
      toast.success(
        isAr
          ? "تم إعادة تعيين الطلب بنجاح"
          : "Order reassigned successfully",
      );
      setReassignTarget(null);
      setReassignDriverId("");
      setReassignNotes("");
    },
    onError: (err: Error) => {
      toast.error(
        isAr ? "فشل إعادة تعيين الطلب" : "Failed to reassign order",
        { description: err.message },
      );
    },
  });

  const unassignOrder = useMutation<void, Error, string>({
    mutationFn: async (orderId) => {
      await apiClient.delete<void>(
        ENDPOINTS.SUPERVISOR.UNASSIGN_ORDER(orderId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [AVAILABLE_DRIVERS_KEY] });
      toast.success(
        isAr
          ? "تم إلغاء تعيين الطلب بنجاح"
          : "Order unassigned successfully",
      );
    },
    onError: (err: Error) => {
      toast.error(
        isAr ? "فشل إلغاء تعيين الطلب" : "Failed to unassign order",
        { description: err.message },
      );
    },
  });

  // ============================================
  // Handlers
  // ============================================

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
    if (!assignTarget || !selectedDriverId) return;
    assignOrder.mutate({
      orderId: assignTarget.orderId,
      driverId: selectedDriverId,
      notes: assignNotes.trim() || null,
    });
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
    if (!reassignTarget || !reassignDriverId) return;
    reassignOrder.mutate({
      orderId: reassignTarget.orderId,
      dto: {
        driverId: reassignDriverId,
        notes: reassignNotes.trim() || null,
      },
    });
  }, [reassignTarget, reassignDriverId, reassignNotes, reassignOrder]);

  const handleUnassign = useCallback(
    (orderId: string) => {
      if (
        window.confirm(
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
    // Lists
    pendingOrders,
    activeOrders,
    availableDrivers,

    // Loading / error
    pendingLoading,
    activeLoading: allOrdersLoading,
    pendingError,
    activeError: allOrdersError,
    pendingErr,
    activeErr: allOrdersErr,

    // Refetch
    refetchPending,
    refetchActive: refetchAllOrders,
    refetchAvailableDrivers: () =>
      queryClient.invalidateQueries({ queryKey: [AVAILABLE_DRIVERS_KEY] }),

    // Tab
    activeTab,
    setActiveTab,

    // Assign
    assignTarget,
    selectedDriverId,
    setSelectedDriverId,
    assignNotes,
    setAssignNotes,
    assignOrder,
    handleOpenAssign,
    handleCloseAssign,
    handleConfirmAssign,

    // Reassign
    reassignTarget,
    reassignDriverId,
    setReassignDriverId,
    reassignNotes,
    setReassignNotes,
    reassignOrder,
    handleOpenReassign,
    handleCloseReassign,
    handleConfirmReassign,

    // Unassign
    unassignOrder,
    handleUnassign,

    // Meta
    driversLoading,
  };
}