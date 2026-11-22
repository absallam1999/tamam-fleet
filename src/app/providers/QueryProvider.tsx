import {
  Suspense,
  lazy,
  useState,
  Component,
  type ReactNode,
  type ErrorInfo,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  type DefaultOptions,
} from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// ============================================
// Devtools
// ============================================

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools")
        .then((m) => ({ default: m.ReactQueryDevtools }))
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.warn(
              "[QueryProvider] Devtools failed to load (ignored):",
              err,
            );
          }
          return { default: () => null };
        }),
    )
  : null;

class SilentBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn(
        "[QueryProvider] Devtools crashed (ignored):",
        error.message,
        info.componentStack,
      );
    }
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

// ============================================
// Defaults
// ============================================

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (i: number) => Math.min(1000 * 2 ** i, 30_000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: false,
  },
  mutations: { retry: 1, retryDelay: 1000 },
};

// ============================================
// Provider
// ============================================

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions,
      queryCache: new QueryCache(),
      mutationCache: new MutationCache(),
    });

    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: "FLEET_QUERY_CACHE",
    });

    persistQueryClient({
      queryClient: client,
      persister,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && ReactQueryDevtools && (
        <SilentBoundary>
          <Suspense fallback={null}>
            <ReactQueryDevtools
              initialIsOpen={false}
              position="bottom"
              buttonPosition="bottom-left"
            />
          </Suspense>
        </SilentBoundary>
      )}
    </QueryClientProvider>
  );
};