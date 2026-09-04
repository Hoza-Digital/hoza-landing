type RpcArguments = Record<string, string | number | boolean | null>;

type RpcOptions = {
  query?: Record<string, string>;
  revalidate?: number;
  tags?: string[];
  count?: boolean;
};

export function getSupabaseServerConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  const backendSecret = process.env.SUPABASE_BACKEND_SECRET;

  if (!url || !publishableKey || !backendSecret) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_BACKEND_SECRET.",
    );
  }

  return { url, publishableKey, backendSecret };
}

export async function callSupabaseRpc<T>(
  functionName: string,
  arguments_: RpcArguments = {},
  options: RpcOptions = {},
): Promise<T> {
  return (await callSupabaseRpcResult<T>(functionName, arguments_, options)).data;
}

export async function callSupabaseRpcResult<T>(
  functionName: string,
  arguments_: RpcArguments = {},
  options: RpcOptions = {},
): Promise<{ data: T; count: number | null }> {
  const { url, publishableKey, backendSecret } = getSupabaseServerConfig();
  const query = new URLSearchParams(options.query).toString();
  const response = await fetch(`${url}/rest/v1/rpc/${functionName}${query ? `?${query}` : ""}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.count ? { Prefer: "count=exact" } : {}),
    },
    body: JSON.stringify({ ...arguments_, p_backend_secret: backendSecret }),
    ...(options.revalidate
      ? { cache: "force-cache" as const, next: { revalidate: options.revalidate, tags: options.tags } }
      : { cache: "no-store" as const }),
    signal: AbortSignal.timeout(8000),
  });

  const total = response.headers.get("content-range")?.split("/")[1];
  const count = total && /^\d+$/.test(total) ? Number(total) : null;
  if (response.status === 416 && options.count && count !== null) {
    return { data: [] as T, count };
  }
  if (!response.ok) {
    console.error("Supabase RPC failed", {
      functionName,
      status: response.status,
    });
    throw new Error("The database operation could not be completed.");
  }

  return {
    data: response.status === 204 ? undefined as T : await response.json() as T,
    count,
  };
}
