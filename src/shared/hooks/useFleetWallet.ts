import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  WalletSummaryDto,
  WalletTransactionDto,
  WithdrawalDto,
  RequestWithdrawalDto,
  PagedResult,
} from "@shared/types";

// ============================================================
// Query Keys
// ============================================================

export const WALLET_KEY = "fleet-supervisor-wallet";

export const WALLET_KEYS = {
  all: [WALLET_KEY] as const,
  summary: () => [WALLET_KEY, "summary"] as const,
  transactions: (filters?: WalletTransactionFilters) =>
    filters
      ? ([WALLET_KEY, "transactions", filters] as const)
      : ([WALLET_KEY, "transactions"] as const),
  withdrawals: (filters?: WithdrawalListFilters) =>
    filters
      ? ([WALLET_KEY, "withdrawals", filters] as const)
      : ([WALLET_KEY, "withdrawals"] as const),
};

// ============================================================
// Input / filter types
// ============================================================

export interface WalletTransactionFilters {
  type?: string;
  orderId?: string;
  from?: string;
  to?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface WithdrawalListFilters {
  status?: string;
  from?: string;
  to?: string;
  pageIndex?: number;
  pageSize?: number;
}

// ============================================================
// useWallet — GET /api/wallet
// ============================================================

export function useWallet() {
  const { data, isLoading, isError, error, refetch } =
    useQuery<WalletSummaryDto>({
      queryKey: WALLET_KEYS.summary(),
      queryFn: async () => {
        // apiClient already unwraps `{ success, data, errors }`
        const response = await apiClient.get<WalletSummaryDto>(
          ENDPOINTS.WALLET.SUMMARY,
        );
        return response.data;
      },
      staleTime: 30_000,
    });

  return {
    // ── Full DTO ──
    wallet: data
      ? {
          ...data,
          walletBalance: data.balance,
        }
      : null,

    // ── Convenience accessors ──
    balance: data?.balance ?? 0,
    walletBalance: data?.balance ?? 0,
    currency: data?.currency ?? "EGP",
    totalIn: data?.totalIn ?? 0,
    totalOut: data?.totalOut ?? 0,
    minimumWithdrawalAmount: data?.minimumWithdrawalAmount ?? 0,
    canRequestWithdrawal: data?.canRequestWithdrawal ?? false,
    pendingWithdrawalCount: data?.pendingWithdrawalCount ?? 0,
    pendingWithdrawalAmount: data?.pendingWithdrawalAmount ?? 0,
    recentTransactions: data?.recentTransactions ?? [],

    // ── Status ──
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ============================================================
// useWalletTransactions — GET /api/wallet/transactions
// ============================================================

export function useWalletTransactions(filters: WalletTransactionFilters = {}) {
  return useQuery<WalletTransactionDto[]>({
    queryKey: WALLET_KEYS.transactions(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        PageIndex: filters.pageIndex ?? 1,
        PageSize: filters.pageSize ?? 50,
      };
      if (filters.type) params.Type = filters.type;
      if (filters.orderId) params.OrderId = filters.orderId;
      if (filters.from) params.From = filters.from;
      if (filters.to) params.To = filters.to;

      const response = await apiClient.get<
        PagedResult<WalletTransactionDto>
      >(ENDPOINTS.WALLET.TRANSACTIONS, params);

      return response.data?.items ?? [];
    },
    staleTime: 30_000,
  });
}

// ============================================================
// useWithdrawals — GET /api/wallet/withdrawals
// ============================================================

export function useWithdrawals(filters: WithdrawalListFilters = {}) {
  return useQuery<WithdrawalDto[]>({
    queryKey: WALLET_KEYS.withdrawals(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        PageIndex: filters.pageIndex ?? 1,
        PageSize: filters.pageSize ?? 50,
      };
      if (filters.status) params.Status = filters.status;
      if (filters.from) params.From = filters.from;
      if (filters.to) params.To = filters.to;

      const response = await apiClient.get<PagedResult<WithdrawalDto>>(
        ENDPOINTS.WALLET.WITHDRAWALS,
        params,
      );
      return response.data?.items ?? [];
    },
    staleTime: 30_000,
  });
}

// ============================================================
// useWithdraw — POST /api/wallet/withdrawals
// ============================================================

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation<WithdrawalDto, Error, number>({
    mutationFn: async (amount: number) => {
      const payload: RequestWithdrawalDto = { amount };
      const response = await apiClient.post<WithdrawalDto>(
        ENDPOINTS.WALLET.WITHDRAWALS,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WALLET_KEY] });
    },
  });
}