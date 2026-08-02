import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Flame, Crown, Medal } from "lucide-react";
import Seo from "@/components/Seo";
import EmptyState from "@/components/EmptyState";
import { CardsSkeleton } from "@/components/LoadingState";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.rpc as any)("get_leaderboard", { _limit: 50 });
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <Seo title='Ranking | Carraco' description='Veja o ranking dos melhores redatores do Carraco por XP, nível e nota máxima ENEM.' path="/leaderboard" />
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center glow shrink-0">
          <Trophy className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Ranking Global</h1>
          <p className="text-sm text-muted-foreground">Top escritores Carraco por XP</p>
        </div>
      </div>

      {loading ? (
        <CardsSkeleton count={5} className="grid gap-2" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="O ranking ainda está vazio"
          description="Envie uma redação para ganhar XP e ser o primeiro a aparecer no pódio."
          actionLabel="Escrever redação"
          actionTo="/studio"
        />
      ) : (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">

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
      )}
    </div>
  );
};

export default Leaderboard;
