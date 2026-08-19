import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type { SupervisorWalletDto } from "@shared/types";

export const WALLET_KEY = "fleet-supervisor-wallet";

/**
 * Extracts the inner `data` property from the API envelope.
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

export function useWallet() {
  const {
    data: walletData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SupervisorWalletDto | null>({
    queryKey: [WALLET_KEY],
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        ENDPOINTS.SUPERVISOR.WALLET,
      );
      const envelope = response.data;
      const data = extractApiData<Record<string, unknown>>(envelope);

      // Map API's `walletBalance` to our expected shape
      const wallet: SupervisorWalletDto = {
        walletBalance: Number(data?.walletBalance ?? 0),
        currency: (data?.currency as string) || "EGP",
      };
      return wallet;
    },
    staleTime: 30_000,
  });

  return {
    wallet: walletData ?? null,
    balance: walletData?.walletBalance ?? 0,
    currency: walletData?.currency ?? "EGP",
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiClient.post<unknown>(
        ENDPOINTS.SUPERVISOR.WALLET_WITHDRAW,
        { amount },
      );
      return extractApiData(response.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WALLET_KEY] });
    },
  });
}