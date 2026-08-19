import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type { DriverRequestDto, DriverRequestStatus } from "@shared/types";
import { useToast } from "@shared/components/Toaster";
import { useLanguage } from "@/shared/hooks/useLanguage";

export const DRIVER_REQUESTS_KEY = "fleet-supervisor-driver-requests";

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
 * Recursively extracts an array from common API response shapes.
 */
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
  }

  console.warn("Unexpected request list shape:", data);
  return [];
}

/**
 * Maps API request object to frontend DriverRequestDto.
 * API returns:
 * - `name` instead of `fullName`
 * - `status` values are capitalized ("Pending", "Approved", "Rejected")
 * - `city` is a GUID string (not a name)
 */
function mapRequest(req: any): DriverRequestDto {
  return {
    id: req.id || req.requestId || "",
    fullName: req.name || req.fullName || "",
    phoneNumber: req.phoneNumber || "",
    email: req.email || "",
    vehicleType: req.vehicleType || req.vehicle_type || undefined,
    vehiclePlateNumber:
      req.vehiclePlateNumber || req.vehicle_plate_number || undefined,
    status: (
      (req.status || "pending") as string
    ).toLowerCase() as DriverRequestStatus,
    createdAt: req.createdAt || req.created_at || new Date().toISOString(),
    city: req.city || req.cityName || undefined,
    address: req.address || undefined,
  };
}

// ============================================
// Hook
// ============================================

export function useDriverRequests() {
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = currentLanguage === "ar";

  const [rejectTarget, setRejectTarget] = useState<DriverRequestDto | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  // GET /api/supervisor/driver-requests
  const {
    data: requestsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DriverRequestDto[]>({
    queryKey: [DRIVER_REQUESTS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.DRIVER_REQUESTS,
      );
      const envelope = response.data;
      const innerData = extractApiData<unknown>(envelope);
      const list = extractArray<DriverRequestDto>(innerData);
      return list.map(mapRequest);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const requests = requestsData ?? [];
  const pendingRequests = requests.filter((r) => r.status === "pending");

  // POST /api/supervisor/driver-requests/{id}/approve
  const approveRequest = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post<void>(
        ENDPOINTS.SUPERVISOR.APPROVE_DRIVER_REQUEST(id),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRIVER_REQUESTS_KEY] });
      toast.success(
        isAr ? "تمت الموافقة على الطلب بنجاح" : "Request approved successfully",
      );
    },
    onError: (err: Error) => {
      toast.error(
        isAr ? "فشلت الموافقة على الطلب" : "Failed to approve request",
        { description: err.message },
      );
    },
  });

  // POST /api/supervisor/driver-requests/{id}/reject
  const rejectRequest = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await apiClient.post<void>(
        ENDPOINTS.SUPERVISOR.REJECT_DRIVER_REQUEST(id),
        reason ?? "",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRIVER_REQUESTS_KEY] });
      toast.success(
        isAr ? "تم رفض الطلب بنجاح" : "Request rejected successfully",
      );
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: (err: Error) => {
      toast.error(isAr ? "فشل رفض الطلب" : "Failed to reject request", {
        description: err.message,
      });
    },
  });

  // ============================================
  // Handlers
  // ============================================

  const handleApprove = useCallback(
    (id: string) => {
      if (
        window.confirm(
          isAr
            ? "هل أنت متأكد من الموافقة على هذا الطلب؟"
            : "Are you sure you want to approve this request?",
        )
      ) {
        approveRequest.mutate(id);
      }
    },
    [approveRequest, isAr],
  );

  const handleOpenReject = useCallback((request: DriverRequestDto) => {
    setRejectTarget(request);
    setRejectReason("");
  }, []);

  const handleCloseReject = useCallback(() => {
    setRejectTarget(null);
    setRejectReason("");
  }, []);

  const handleConfirmReject = useCallback(() => {
    if (rejectTarget) {
      rejectRequest.mutate({
        id: rejectTarget.id,
        reason: rejectReason || undefined,
      });
    }
  }, [rejectTarget, rejectReason, rejectRequest]);

  return {
    requests,
    pendingRequests,
    isLoading,
    isError,
    error,
    refetch,
    approveRequest,
    rejectRequest,
    rejectTarget,
    rejectReason,
    setRejectReason,
    handleApprove,
    handleOpenReject,
    handleCloseReject,
    handleConfirmReject,
  };
}
