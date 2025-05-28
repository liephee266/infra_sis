import { QueryClient } from "@tanstack/react-query";
import { getApiUrl } from "./apiServerConfig";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use the configured API server URL if set
  const fullUrl = getApiUrl(url);
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Simple default fetcher function that doesn't depend on complex types
const defaultQueryFn = async ({ queryKey }: any) => {
  const url = queryKey[0];
  if (typeof url !== 'string') {
    throw new Error('Invalid query key: Expected a string URL as the first item');
  }
  
  // Use the configured API server URL if set
  const fullUrl = getApiUrl(url);
  
  const res = await fetch(fullUrl, {
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 401) {
      return null;
    }
    
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }

  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
