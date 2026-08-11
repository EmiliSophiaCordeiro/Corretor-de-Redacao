import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useResolvedAvatar } from "@/lib/avatar";

/** Resolves the signed URL of the current user's avatar, kept in sync across pages. */
export function useMyAvatar() {
  const { user } = useAuth();
  const [path, setPath] = useState<string | null>(null);

  const load = async () => {
    if (!user) { setPath(null); return; }
    const { data } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle();
    setPath(data?.avatar_url ?? null);
  };

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("carraco:avatar-changed", onChange);
    return () => window.removeEventListener("carraco:avatar-changed", onChange);
  }, [user?.id]);

  return useResolvedAvatar(path);
}

export const notifyAvatarChanged = () =>
  window.dispatchEvent(new CustomEvent("carraco:avatar-changed"));
