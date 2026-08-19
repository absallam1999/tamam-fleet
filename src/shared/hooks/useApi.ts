import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ============================================================
// Generic Query Hook
// ============================================================

export function useGetData<T>(
  key: QueryKey,
  endpoint: string,
  params?: Record<string, string>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get<T>(endpoint, params);
      return response.data;
    },
    ...options,
  });
}

// ============================================================
// Generic Mutation Hooks
// ============================================================

// Helper type to normalise the onSuccess signature to the expected 3-argument form.
type NormalizedOnSuccess<TData, TVariables> = (
  data: TData,
  variables: TVariables,
  context: unknown,
) => unknown;

export function usePostData<TData = unknown, TVariables = unknown>(
  endpoint: string,
  invalidateQueries?: QueryKey[],
  mutationOptions?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  // Cast to the normalised signature to avoid version-specific type mismatches.
  const userOnSuccess = mutationOptions?.onSuccess as
    | NormalizedOnSuccess<TData, TVariables>
    | undefined;

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.post<TData>(endpoint, variables);
      return response.data;
    },
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      invalidateQueries?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      userOnSuccess?.(data, variables, context);
    },
  });
}

export function usePutData<TData = unknown, TVariables = unknown>(
  endpoint: string,
  invalidateQueries?: QueryKey[],
  mutationOptions?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  const userOnSuccess = mutationOptions?.onSuccess as
    | NormalizedOnSuccess<TData, TVariables>
    | undefined;

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.put<TData>(endpoint, variables);
      return response.data;
    },
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      invalidateQueries?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      userOnSuccess?.(data, variables, context);
    },
  });
}

export function usePatchData<TData = unknown, TVariables = unknown>(
  endpoint: string,
  invalidateQueries?: QueryKey[],
  mutationOptions?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  const userOnSuccess = mutationOptions?.onSuccess as
    | NormalizedOnSuccess<TData, TVariables>
    | undefined;

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.patch<TData>(endpoint, variables);
      return response.data;
    },
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      invalidateQueries?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      userOnSuccess?.(data, variables, context);
    },
  });
}

export function useDeleteData<TData = unknown>(
  endpoint: string,
  invalidateQueries?: QueryKey[],
  mutationOptions?: Omit<
    UseMutationOptions<TData, Error, void>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  const userOnSuccess = mutationOptions?.onSuccess as
    | NormalizedOnSuccess<TData, void>
    | undefined;

  return useMutation<TData, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.delete<TData>(endpoint);
      return response.data;
    },
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      invalidateQueries?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      userOnSuccess?.(data, variables, context);
    },
  });
}