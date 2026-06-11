import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

/**
 * Subscribes to realtime inserts on user_achievements for the current user
 * and shows a celebratory toast when a new achievement is unlocked.
 */
export const useAchievementNotifier = () => {
  const { user } = useAuth();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Prime seen set so we don't toast existing unlocks on mount
    supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        data?.forEach((r: any) => seen.current.add(r.achievement_id));
      });

    const channel = supabase
      .channel(`ach-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const achId = (payload.new as any).achievement_id;
          if (seen.current.has(achId)) return;
          seen.current.add(achId);

          const { data: ach } = await supabase
            .from("achievements")
            .select("name, description, icon, xp_reward, rarity")
            .eq("id", achId)
            .maybeSingle();
          if (!ach) return;

          toast.success(`🏆 Conquista desbloqueada!`, {
            description: `${ach.icon || "🏅"} ${ach.name} · +${ach.xp_reward} XP`,
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
};
