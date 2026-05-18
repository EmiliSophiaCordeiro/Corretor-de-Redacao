import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Flame, Crown, Medal } from "lucide-react";

interface Row {
  user_id: string;
  xp: number;
  level: number;
  current_streak: number;
  essays_completed: number;
  display_name?: string | null;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data: stats } = await supabase
        .from("user_stats")
        .select("user_id, xp, level, current_streak, essays_completed")
        .order("xp", { ascending: false })
        .limit(50);

      if (!stats) return;
      const ids = stats.map((s) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);

      const map = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);
      setRows(stats.map((s) => ({ ...s, display_name: map.get(s.user_id) })));
    })();
  }, []);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center glow">
          <Trophy className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Ranking Global</h1>
          <p className="text-sm text-muted-foreground">Top escritores Carraco por XP</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {rows.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">Nenhum dado ainda.</p>
        )}
        {rows.map((row, i) => {
          const isMe = row.user_id === user?.id;
          const rankColor = i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-600" : "text-muted-foreground";
          return (
            <div
              key={row.user_id}
              className={`flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 transition-colors ${
                isMe ? "bg-primary/10" : "hover:bg-muted/40"
              }`}
            >
              <div className={`w-8 text-center font-display font-bold ${rankColor}`}>
                {i < 3 ? <Crown className="h-5 w-5 mx-auto" /> : `#${i + 1}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {row.display_name || "Estudante"} {isMe && <span className="text-xs text-primary">(você)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  Nível {row.level} · {row.essays_completed} redações
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-xs text-orange-500">
                  <Flame className="h-3.5 w-3.5" /> {row.current_streak}
                </span>
                <span className="font-mono-score font-bold gradient-text">{row.xp} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
