import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { useToast } from "@shared/components/Toaster";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { ENDPOINTS } from "@/config/api";

// ============================================
// Local types
// ============================================

export type DriverRequestStatus = "pending" | "approved" | "rejected";

export interface DriverRequestDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  status: DriverRequestStatus;
  createdAt: string;
  city?: string;
  area?: string;
  address?: string;
  rejectionReason?: string;
  processedAt?: string;
  notes?: string;
}

export const DRIVER_REQUESTS_KEY = "fleet-supervisor-driver-requests";

// ============================================
// Mapping
// ============================================

function mapRequest(raw: unknown): DriverRequestDto {
  const r =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = r[k];
      if (typeof v === "string" && v.length > 0) return v;
    }
    return undefined;
  };

  const rawStatus = String(r.status ?? "pending").toLowerCase();
  const status: DriverRequestStatus =
    rawStatus === "approved" || rawStatus === "rejected"
      ? (rawStatus as DriverRequestStatus)
      : "pending";

  return {
    id: String(r.id ?? r.requestId ?? ""),
    fullName: pick("name", "fullName") ?? "",
    phoneNumber: pick("phoneNumber") ?? "",
    email: pick("email") ?? "",
    vehicleType: pick("vehicleType", "types", "vehicle_type"),
    vehiclePlateNumber: pick(
      "vehiclePlateNumber",
      "vehiclePlate",
      "vehicle_plate_number",
    ),
    status,
    createdAt: pick("createdAt", "created_at") ?? new Date().toISOString(),
    city: pick("city", "cityName"),
    area: pick("area"),
    address: pick("address"),
    rejectionReason: pick("rejectionReason", "rejection_reason"),
    processedAt: pick("processedAt", "processed_at"),
    notes: pick("note", "notes"),
  };
}

function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.data)) return o.data;
    if (o.data && typeof o.data === "object") {
      const inner = o.data as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items;
      if (Array.isArray(inner.data)) return inner.data;
    }
  }
  return [];
}

function isEndpointMissing(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 404 || err.status === 405 || err.status === 0;
  }
  if (err instanceof Error) {
    return /failed to fetch|network/i.test(err.message);
  }
  return false;
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

  // ── LIST ────────────────────────────────────────────────
  const {
    data: requestsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DriverRequestDto[], Error, DriverRequestDto[], [string]>({
    queryKey: [DRIVER_REQUESTS_KEY],
    queryFn: async () => {
      try {
        const response = await apiClient.get<unknown>(
          ENDPOINTS.SUPERVISOR.REQUESTS,
        );
        return extractList(response.data).map(mapRequest);
      } catch (err) {
        if (isEndpointMissing(err)) {
          if (import.meta.env.DEV) {
            console.warn(
              "[useDriverRequests] GET " +
                ENDPOINTS.SUPERVISOR.REQUESTS +
                " is not available in the current API. " +
                "Supervisors create drivers via POST /api/supervisor/drivers " +
                "(no approval flow). " +
                "This hook will return an empty list until the backend " +
                "exposes supervisor-scoped driver-request endpoints.",
            );
          }
          return [];
        }
        throw err;
      }
    },
    staleTime: 30_000,
    refetchInterval: (query) => {
      const err = query.state.error;
      if (err && isEndpointMissing(err)) return false;
      return 60_000;
    },
    retry: (failureCount, err) => {
      if (isEndpointMissing(err)) return false;
      return failureCount < 2;
    },
  });

  const requests = requestsData ?? [];
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const isAvailable = !isError || !isEndpointMissing(error);

  // ── APPROVE ─────────────────────────────────────────────
  const approveRequest = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      try {
        await apiClient.post<void>(ENDPOINTS.SUPERVISOR.APPROVE_REQUEST(id));
      } catch (err) {
        if (isEndpointMissing(err)) {
          throw new Error(
            isAr
              ? "ميزة الموافقة على طلبات السائقين غير متاحة في الإصدار الحالي من الـ API."
              : "Driver-request approval is not available in the current API.",
          );
        }
        throw err;
      }
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

  // ── REJECT ──────────────────────────────────────────────
  const rejectRequest = useMutation<
    void,
    Error,
    { id: string; reason?: string }
  >({
    mutationFn: async ({ id, reason }) => {
      try {
        await apiClient.post<void>(ENDPOINTS.SUPERVISOR.REJECT_REQUEST(id), {
          reason: reason?.trim() ? reason.trim() : null,
        });
      } catch (err) {
        if (isEndpointMissing(err)) {
          throw new Error(
            isAr
              ? "ميزة رفض طلبات السائقين غير متاحة في الإصدار الحالي من الـ API."
              : "Driver-request rejection is not available in the current API.",
          );
        }
        throw err;
      }
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
        reason: rejectReason.trim() || undefined,
      });
    }
  }, [rejectTarget, rejectReason, rejectRequest]);

  return {
    // Data
    requests,
    pendingRequests,

    // Status
    isLoading,
    isError,
    error,
    refetch,
    isAvailable,

    // Mutations
    approveRequest,
    rejectRequest,

    // Reject modal state
    rejectTarget,
    rejectReason,
    setRejectReason,

    // Handlers
    handleApprove,
    handleOpenReject,
    handleCloseReject,
    handleConfirmReject,
  };
}
