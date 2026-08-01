type RpcArguments = Record<string, string | number | boolean | null>;

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
): Promise<T> {
  const { url, publishableKey, backendSecret } = getSupabaseServerConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...arguments_, p_backend_secret: backendSecret }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Supabase RPC failed", {
      functionName,
      status: response.status,
    });
    throw new Error("The database operation could not be completed.");
  }

  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}
