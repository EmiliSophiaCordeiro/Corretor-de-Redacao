import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Target, Zap, Coins } from "lucide-react";

interface Challenge {
  id: string;
  code: string;
  title: string;
  description: string;
  goal_type: string;
  goal_value: number;
  xp_reward: number;
  points_reward: number;
}

const Challenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, { progress: number; completed: boolean }>>({});

  useEffect(() => {
    (async () => {
      const { data: ch } = await supabase.from("daily_challenges").select("*").eq("is_active", true);
      setChallenges(ch || []);
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      const { data: udc } = await supabase
        .from("user_daily_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("day", today);
      const map: any = {};
      udc?.forEach((u: any) => (map[u.challenge_id] = { progress: u.progress, completed: u.completed }));
      setProgress(map);
    })();
  }, [user?.id]);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center glow">
          <Target className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Desafios diários</h1>
          <p className="text-sm text-muted-foreground">Complete missões e ganhe recompensas extras todo dia.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {challenges.map((c) => {
          const p = progress[c.id];
          const pct = p ? Math.min(100, (p.progress / c.goal_value) * 100) : 0;
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5 hover:shadow-card transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-display font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-primary font-mono-score text-sm font-bold">
                    <Zap className="h-3.5 w-3.5" /> +{c.xp_reward}
                  </div>
                  <div className="flex items-center gap-1 text-accent font-mono-score text-xs">
                    <Coins className="h-3 w-3" /> +{c.points_reward}
                  </div>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${p?.completed ? "bg-success" : "gradient-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {p?.completed ? "✓ Concluído" : `${p?.progress || 0} / ${c.goal_value}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Challenges;
