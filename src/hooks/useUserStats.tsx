import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserStats {
  user_id: string;
  xp: number;
  level: number;
  points: number;
  current_streak: number;
  longest_streak: number;
  essays_completed: number;
  last_activity_date: string | null;
}

export const xpForLevel = (level: number) => level * level * 100;

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      // Bootstrap
      const { data: created } = await supabase
        .from("user_stats")
        .insert({ user_id: user.id })
        .select()
        .maybeSingle();
      setStats(created as UserStats);
    } else {
      setStats(data as UserStats);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchStats();
  }, [user?.id]);

  return { stats, loading, refetch: fetchStats };
};
