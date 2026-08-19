import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  SupervisorDashboardDto,
  SupervisorWalletDto,
  DriverDto,
  SupervisorCreateDriverDto,
  SupervisorOrderDto,
  AssignOrderDto,
  ReassignOrderDto,
  DriverRequestDto,
  DriverFilterParams,
  OrderFilterParams,
  DriverRequestFilterParams,
  PaginatedResponse,
  CreateWithdrawalDto,
} from "@shared/types";

/**
 * Converts a params object to a Record<string, string> for query strings.
 * Values that are undefined or null are omitted.
 */
function toQueryParams<T extends object>(params?: T): Record<string, string> {
  if (!params) return {};

  return Object.entries(params).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    },
    {},
  );
}

/**
 * Helper to unwrap ApiResponse<T> and gracefully handle null data (204 No Content).
 */
async function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
  const response = await promise;
  return response.data;
}

export const fleetApi = {
  // ============================================================
  // Supervisor Dashboard
  // ============================================================
  getDashboard: () =>
    unwrap<SupervisorDashboardDto>(
      apiClient.get<SupervisorDashboardDto>(ENDPOINTS.SUPERVISOR.DASHBOARD),
    ),

  // ============================================================
  // Supervisor Wallet
  // ============================================================
  getWallet: () =>
    unwrap<SupervisorWalletDto>(
      apiClient.get<SupervisorWalletDto>(ENDPOINTS.SUPERVISOR.WALLET),
    ),

  getWalletBalance: () =>
    unwrap<{ balance: number; currency?: string }>(
      apiClient.get<{ balance: number; currency?: string }>(
        ENDPOINTS.SUPERVISOR.WALLET_BALANCE,
      ),
    ),

  withdraw: (dto: CreateWithdrawalDto) =>
    unwrap<{ success: boolean }>(
      apiClient.post<{ success: boolean }>(
        ENDPOINTS.SUPERVISOR.WALLET_WITHDRAW,
        dto,
      ),
    ),

  // ============================================================
  // Drivers (Supervisor-managed)
  // ============================================================
  getDrivers: (params?: DriverFilterParams) =>
    unwrap<PaginatedResponse<DriverDto>>(
      apiClient.get<PaginatedResponse<DriverDto>>(
        ENDPOINTS.SUPERVISOR.DRIVERS,
        toQueryParams(params),
      ),
    ),

  getDriver: (driverId: string) =>
    unwrap<DriverDto>(
      apiClient.get<DriverDto>(ENDPOINTS.SUPERVISOR.DRIVER_BY_ID(driverId)),
    ),

  createDriver: (dto: SupervisorCreateDriverDto) =>
    unwrap<DriverDto>(
      apiClient.post<DriverDto>(ENDPOINTS.SUPERVISOR.CREATE_DRIVER, dto),
    ),

  toggleDriverAvailability: (driverId: string) =>
    unwrap<DriverDto | null>(
      apiClient.patch<DriverDto | null>(
        ENDPOINTS.SUPERVISOR.TOGGLE_DRIVER_AVAILABILITY(driverId),
      ),
    ),

  // ============================================================
  // Orders (Supervisor-managed)
  // ============================================================
  getPendingOrders: (params?: OrderFilterParams) =>
    unwrap<PaginatedResponse<SupervisorOrderDto>>(
      apiClient.get<PaginatedResponse<SupervisorOrderDto>>(
        ENDPOINTS.SUPERVISOR.ORDERS_PENDING,
        toQueryParams(params),
      ),
    ),

  getActiveOrders: (params?: OrderFilterParams) =>
    unwrap<PaginatedResponse<SupervisorOrderDto>>(
      apiClient.get<PaginatedResponse<SupervisorOrderDto>>(
        ENDPOINTS.SUPERVISOR.ORDERS_ACTIVE,
        toQueryParams(params),
      ),
    ),

  assignOrder: (dto: AssignOrderDto) =>
    unwrap<SupervisorOrderDto>(
      apiClient.post<SupervisorOrderDto>(
        ENDPOINTS.SUPERVISOR.ASSIGN_ORDER,
        dto,
      ),
    ),

  reassignOrder: (orderId: string, dto: ReassignOrderDto) =>
    unwrap<SupervisorOrderDto>(
      apiClient.post<SupervisorOrderDto>(
        ENDPOINTS.SUPERVISOR.REASSIGN_ORDER(orderId),
        dto,
      ),
    ),

  unassignOrder: (orderId: string) =>
    unwrap<SupervisorOrderDto | null>(
      apiClient.post<SupervisorOrderDto | null>(
        ENDPOINTS.SUPERVISOR.UNASSIGN_ORDER(orderId),
      ),
    ),

  selfAssignOrder: (orderId: string) =>
    unwrap<SupervisorOrderDto | null>(
      apiClient.post<SupervisorOrderDto | null>(
        ENDPOINTS.SUPERVISOR.SELF_ASSIGN_ORDER(orderId),
      ),
    ),

  // ============================================================
  // Driver Registration Requests
  // ============================================================
  getDriverRequests: (params?: DriverRequestFilterParams) =>
    unwrap<PaginatedResponse<DriverRequestDto>>(
      apiClient.get<PaginatedResponse<DriverRequestDto>>(
        ENDPOINTS.SUPERVISOR.DRIVER_REQUESTS,
        toQueryParams(params),
      ),
    ),

  approveDriverRequest: (id: string) =>
    unwrap<DriverRequestDto | null>(
      apiClient.post<DriverRequestDto | null>(
        ENDPOINTS.SUPERVISOR.APPROVE_DRIVER_REQUEST(id),
      ),
    ),

  /**
   * Reject a driver registration request.
   * NOTE: The API spec currently expects a raw string body. This sends an
   * object `{ reason }`. If the backend hasn't been updated, change the
   * payload to `reason ?? ""` (raw string).
   */
  rejectDriverRequest: (id: string, reason?: string) =>
    unwrap<DriverRequestDto | null>(
      apiClient.post<DriverRequestDto | null>(
        ENDPOINTS.SUPERVISOR.REJECT_DRIVER_REQUEST(id),
        { reason },
      ),
    ),
};