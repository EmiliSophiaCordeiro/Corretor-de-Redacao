import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Short-lived signed URL cache. Storing only the storage PATH in
// profiles.avatar_url lets us re-sign per view instead of persisting
// a long-lived URL that would bypass the private avatars bucket.
const TTL_SECONDS = 60 * 60; // 1 hour
const cache = new Map<string, { url: string; exp: number }>();

const isHttpUrl = (v: string) => /^https?:\/\//i.test(v);

/**
 * Extracts the storage path from a legacy long-lived signed URL, so old
 * profile rows (that stored a full URL) can still be re-signed short-term
 * instead of continuing to leak the year-long token.
 */
const extractLegacyPath = (url: string): string | null => {
  try {
    const u = new URL(url);
    const marker = "/object/sign/avatars/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
};

export async function resolveAvatarUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const path = isHttpUrl(value) ? extractLegacyPath(value) : value;
  if (!path) return null;

  const now = Math.floor(Date.now() / 1000);
  const cached = cache.get(path);
  if (cached && cached.exp > now + 60) return cached.url;

  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, TTL_SECONDS);
  if (!data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, exp: now + TTL_SECONDS });
  return data.signedUrl;
}

export function useResolvedAvatar(value: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    resolveAvatarUrl(value).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [value]);
  return url;
}

/** Upload a new avatar and return the storage path to persist in profiles.avatar_url. */
export async function uploadAvatarFile(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Remove every stored avatar file for the user and clear the cached signed URLs. */
export async function removeAvatarFiles(userId: string): Promise<void> {
  const { data: list } = await supabase.storage.from("avatars").list(userId);
  if (list?.length) {
    const paths = list.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from("avatars").remove(paths);
    paths.forEach((p) => cache.delete(p));
  }
}

