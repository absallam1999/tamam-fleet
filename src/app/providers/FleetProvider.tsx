import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  DashboardAreaDto,
  SupervisorDashboardDto,
  SupervisorWalletDto,
} from "@shared/types";

// ============================================================
// Types
// ============================================================

export interface SupervisorInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  walletBalance?: number;
}

export interface DashboardStats {
  totalDrivers: number;
  onlineDrivers: number;
  pendingOrders: number;
  activeDeliveries: number;
  completedToday: number;
}

interface FleetContextValue {
  supervisor: SupervisorInfo | null;
  stats: DashboardStats | null;
  areas: DashboardAreaDto[] | null;
  isLoading: boolean;
  isActive: boolean;
  refreshDashboard: () => Promise<void>;
  error: string | null;
  getSupervisorName: () => string;
}

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

// ============================================================
// Helper to extract inner `data` from API envelope
// ============================================================
function extractApiData<T>(responseData: unknown): T | null {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return (responseData as Record<string, unknown>).data as T;
  }
  return responseData as T | null;
}

// ============================================================
// Provider
// ============================================================

interface FleetProviderProps {
  children: ReactNode;
}

export const FleetProvider: React.FC<FleetProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [supervisor, setSupervisor] = useState<SupervisorInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [areas, setAreas] = useState<DashboardAreaDto[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isActive = supervisor?.isActive ?? false;

  const getSupervisorName = useCallback((): string => {
    return supervisor?.fullName ?? user?.fullName ?? "";
  }, [supervisor, user]);

  // ============================================================
  // Build supervisor info from auth user
  // ============================================================
  useEffect(() => {
    if (user) {
      setSupervisor((prev) => ({
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        isActive: user.isActive ?? true,
        // Preserve existing wallet balance if already fetched
        walletBalance: prev?.walletBalance,
      }));
    } else {
      setSupervisor(null);
    }
  }, [user]);

  // ============================================================
  // Fetch Dashboard Stats, Areas, and Wallet
  // ============================================================
  const fetchDashboard = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const [dashboardResult, walletResult] = await Promise.allSettled([
        apiClient.get<SupervisorDashboardDto>(ENDPOINTS.SUPERVISOR.DASHBOARD),
        apiClient.get<SupervisorWalletDto>(ENDPOINTS.SUPERVISOR.WALLET),
      ]);

      // Process dashboard stats and areas
      if (dashboardResult.status === "fulfilled") {
        const envelope = dashboardResult.value.data;
        const dashboardData = extractApiData<SupervisorDashboardDto>(envelope);

        // Set stats
        setStats({
          totalDrivers: Number(dashboardData?.totalDrivers) || 0,
          onlineDrivers: Number(dashboardData?.onlineDrivers) || 0,
          pendingOrders: Number(dashboardData?.pendingOrders) || 0,
          activeDeliveries: Number(dashboardData?.activeDeliveries) || 0,
          completedToday: Number(dashboardData?.completedToday) || 0,
        });

        // Set areas
        setAreas(dashboardData?.areas ?? []);
      } else {
        console.error("Dashboard fetch failed:", dashboardResult.reason);
        setStats({
          totalDrivers: 0,
          onlineDrivers: 0,
          pendingOrders: 0,
          activeDeliveries: 0,
          completedToday: 0,
        });
        setAreas(null);
        setError("Failed to load dashboard statistics");
      }

      // Process wallet balance
      if (walletResult.status === "fulfilled") {
        const envelope = walletResult.value.data;
        const walletData = extractApiData<SupervisorWalletDto>(envelope);
        console.log("Wallet API raw data:", walletData);

        if (walletData) {
          setSupervisor((prev) =>
            prev
              ? { ...prev, walletBalance: walletData.walletBalance || 0 }
              : null,
          );
        }
      } else {
        console.error("Wallet fetch failed:", walletResult.reason);
      }

      if (
        dashboardResult.status === "rejected" &&
        walletResult.status === "rejected"
      ) {
        setError("Unable to load dashboard data. Please try again.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard";
      setError(message);
      console.error("Unexpected dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await fetchDashboard();
  }, [fetchDashboard]);

  // ============================================================
  // Load dashboard on auth
  // ============================================================
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    } else {
      setSupervisor(null);
      setStats(null);
      setAreas(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchDashboard]);

  // ============================================================
  // Context Value
  // ============================================================
  const contextValue = useMemo<FleetContextValue>(
    () => ({
      supervisor,
      stats,
      areas,
      isLoading,
      isActive,
      refreshDashboard,
      error,
      getSupervisorName,
    }),
    [
      supervisor,
      stats,
      areas,
      isLoading,
      isActive,
      refreshDashboard,
      error,
      getSupervisorName,
    ],
  );

  return (
    <FleetContext.Provider value={contextValue}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = (): FleetContextValue => {
  const context = useContext(FleetContext);
  if (context === undefined) {
    throw new Error("useFleet must be used within a <FleetProvider>.");
  }
  return context;
};

export default FleetProvider;
