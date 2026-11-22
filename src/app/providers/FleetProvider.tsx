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
import { apiClient, ApiError } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  AreaSummaryDto,
  SupervisorDashboardDto,
  SupervisorProfileDto,
  WalletSummaryDto,
} from "@shared/types";

// ============================================================
// Types
// ============================================================

export interface SupervisorInfo {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  cityId: string | null;
  cityAr: string | null;
  cityEn: string | null;
  cityName: string | null;
  createdAt: string | null;
  walletBalance: number;
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
  areas: AreaSummaryDto[];

  isLoading: boolean;

  isActive: boolean;
  isVerified: boolean;
  walletBalance: number;

  refreshDashboard: () => Promise<void>;
  error: string | null;
  getSupervisorName: () => string;
}

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

// ============================================================
// Helpers
// ============================================================

const EMPTY_STATS: DashboardStats = {
  totalDrivers: 0,
  onlineDrivers: 0,
  pendingOrders: 0,
  activeDeliveries: 0,
  completedToday: 0,
};

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v.length > 0 ? v : fallback;

const nullableStr = (v: unknown, fallback: string | null = null): string | null =>
  typeof v === "string" && v.length > 0 ? v : fallback;

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

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
  const [areas, setAreas] = useState<AreaSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isActive = supervisor?.isActive ?? false;
  const isVerified = supervisor?.isVerified ?? false;
  const walletBalance = supervisor?.walletBalance ?? 0;

  const getSupervisorName = useCallback((): string => {
    return supervisor?.fullName ?? user?.fullName ?? "";
  }, [supervisor, user]);

  // ============================================================
  // Fetch in parallel
  // ============================================================
  const fetchDashboard = useCallback(async (): Promise<void> => {
    setError(null);

    const [profileResult, dashboardResult, walletResult] =
      await Promise.allSettled([
        apiClient.get<SupervisorProfileDto>(ENDPOINTS.SUPERVISOR.PROFILE),
        apiClient.get<SupervisorDashboardDto>(ENDPOINTS.SUPERVISOR.DASHBOARD),
        apiClient.get<WalletSummaryDto>(ENDPOINTS.WALLET.SUMMARY),
      ]);

    // ── Profile ──
    const profile =
      profileResult.status === "fulfilled" ? profileResult.value.data : null;

    if (profile || user) {
      setSupervisor((prev) => {
        const cityAr = nullableStr(profile?.cityAr, prev?.cityAr ?? null);
        const cityEn = nullableStr(profile?.cityEn, prev?.cityEn ?? null);
        const cityName = cityEn ?? cityAr ?? prev?.cityName ?? null;

        return {
          id: profile?.id ?? prev?.id ?? "",
          fullName: str(
            profile?.fullName,
            prev?.fullName ?? user?.fullName ?? "",
          ),
          email: str(profile?.email, prev?.email ?? user?.email ?? ""),
          phoneNumber: str(
            profile?.phoneNumber,
            prev?.phoneNumber ?? user?.phoneNumber ?? "",
          ),
          profilePictureUrl:
            profile?.profilePictureUrl ?? prev?.profilePictureUrl ?? null,
          isActive: user?.isActive ?? prev?.isActive ?? true,
          isVerified: profile?.isVerified ?? prev?.isVerified ?? false,
          verifiedAt: profile?.verifiedAt ?? prev?.verifiedAt ?? null,
          cityId: profile?.cityId ?? prev?.cityId ?? null,
          cityAr,
          cityEn,
          cityName,
          createdAt: profile?.createdAt ?? prev?.createdAt ?? null,
          walletBalance: prev?.walletBalance ?? 0,
        };
      });
    }

    // ── Dashboard ──
    if (dashboardResult.status === "fulfilled") {
      const d = dashboardResult.value.data;
      if (d) {
        setStats({
          totalDrivers: num(d.totalDrivers),
          onlineDrivers: num(d.onlineDrivers),
          pendingOrders: num(d.pendingOrders),
          activeDeliveries: num(d.activeDeliveries),
          completedToday: num(d.completedToday),
        });
        setAreas(d.areas ?? []);
      } else {
        setStats(EMPTY_STATS);
        setAreas([]);
      }
    } else {
      setStats(EMPTY_STATS);
      setAreas([]);
    }

    // ── Wallet ──
    if (walletResult.status === "fulfilled") {
      const w = walletResult.value.data;
      if (w) {
        setSupervisor((prev) =>
          prev ? { ...prev, walletBalance: num(w.balance) } : prev,
        );
      }
    }

    // ── Error aggregation ──
    const allFailed =
      profileResult.status === "rejected" &&
      dashboardResult.status === "rejected" &&
      walletResult.status === "rejected";

    if (allFailed) {
      const firstError = profileResult.reason;
      const message =
        firstError instanceof ApiError
          ? firstError.message
          : firstError instanceof Error
            ? firstError.message
            : "Unable to load dashboard data. Please try again.";
      setError(message);
    }

    setIsLoading(false);
  }, [user]);

  const refreshDashboard = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await fetchDashboard();
  }, [fetchDashboard]);

  // ============================================================
  // Load on auth / clear on logout
  // ============================================================
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      fetchDashboard();
    } else {
      setSupervisor(null);
      setStats(null);
      setAreas([]);
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchDashboard]);

  // ============================================================
  // Context value
  // ============================================================
  const contextValue = useMemo<FleetContextValue>(
    () => ({
      supervisor,
      stats,
      areas,
      isLoading,
      isActive,
      isVerified,
      walletBalance,
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
      isVerified,
      walletBalance,
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