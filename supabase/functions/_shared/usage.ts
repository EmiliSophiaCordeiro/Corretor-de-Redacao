import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/** Number of AI calls of this kind the user made in the last 24h. */
export const countUsageLast24h = async (userId: string, kind: "correction" | "ocr"): Promise<number> => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", since);
  if (error) {
    console.error("ai_usage count failed", error.message);
    throw new Error("usage check failed");
  }
  return count ?? 0;
};

export const recordUsage = async (userId: string, kind: "correction" | "ocr"): Promise<void> => {
  const { error } = await admin().from("ai_usage").insert({ user_id: userId, kind });
  if (error) console.error("ai_usage insert failed", error.message);
};
