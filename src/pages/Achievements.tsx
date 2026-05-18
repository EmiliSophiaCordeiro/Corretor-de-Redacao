import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Lock } from "lucide-react";

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string | null;
  xp_reward: number;
  points_reward: number;
  rarity: string;
}

const rarityClass: Record<string, string> = {
  common: "ring-rarity-common",
  rare: "ring-rarity-rare",
  epic: "ring-rarity-epic",
  legendary: "ring-rarity-legendary",
};

const Achievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("achievements").select("*").order("rarity");
      setAchievements(data || []);
      if (!user) return;
      const { data: ua } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);
      setUnlocked(new Set(ua?.map((u: any) => u.achievement_id) || []));
    })();
  }, [user?.id]);

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center glow">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Conquistas</h1>
          <p className="text-sm text-muted-foreground">
            {unlocked.size} / {achievements.length} desbloqueadas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((a) => {
          const isUnlocked = unlocked.has(a.id);
          return (
            <div
              key={a.id}
              className={`rounded-2xl bg-card p-5 text-center transition-all hover:scale-105 ${
                isUnlocked ? rarityClass[a.rarity] : "border border-border opacity-60"
              }`}
            >
              <div className="relative mx-auto h-16 w-16 mb-3 flex items-center justify-center rounded-2xl bg-muted">
                {isUnlocked ? (
                  <span className="text-3xl">{a.icon || "🏅"}</span>
                ) : (
                  <Lock className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-display font-semibold text-sm">{a.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
              <div className="mt-2 font-mono-score text-[10px] uppercase tracking-widest">
                <span className={`rarity-${a.rarity}`}>{a.rarity}</span>
                <span className="text-muted-foreground"> · +{a.xp_reward} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
