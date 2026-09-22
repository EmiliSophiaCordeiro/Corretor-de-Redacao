import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.9.6/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
const getJwks = () => {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
  }
  return jwks;
};

/**
 * Resolves the authenticated user id from the request Authorization header.
 * Supports both asymmetric (signing keys / JWKS) and legacy HS256 tokens.
 * Returns null when the caller is not an authenticated end user.
 */
export const getAuthenticatedUserId = async (req: Request): Promise<string | null> => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  // Publishable / anon API keys are not user sessions.
  if (!token || token.startsWith("sb_") || token.split(".").length !== 3) return null;

  // 1) Asymmetric verification through the project JWKS.
  try {
    const { payload } = await jwtVerify(token, getJwks(), { issuer: `${SUPABASE_URL}/auth/v1` });
    if (payload.sub && payload.role !== "anon") return payload.sub as string;
  } catch (_e) {
    // Fall through to the Auth server check (legacy HS256 tokens).
  }

  // 2) Legacy tokens: ask the Auth server.
  try {
    const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (!error && data?.user) return data.user.id;
    console.error("auth verification failed", error?.message ?? "no user");
  } catch (e) {
    console.error("auth verification threw", e instanceof Error ? e.message : String(e));
  }

  return null;
};
