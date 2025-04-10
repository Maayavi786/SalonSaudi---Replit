import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  // Ensure URL starts with /api
  const apiUrl = url.startsWith("/") ? url : `/${url}`;
  console.log(`API Request: ${method} ${apiUrl}`, data);
  
  try {
    const res = await fetch(apiUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorJson = await res.json();
          console.error(`API JSON Error (${res.status}):`, errorJson);
          throw new Error(errorJson.message || res.statusText);
        } else {
          const errorText = await res.text();
          console.error(`API Text Error (${res.status}):`, errorText);
          throw new Error(errorText || res.statusText);
        }
      } catch (parseError) {
        // If we can't parse the error response, just use the status text
        console.error(`API Error (${res.status}):`, res.statusText);
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
    }
    
    console.log(`API Response: ${res.status} ${res.statusText}`);
    return res;
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
