import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats, xpForLevel } from "@/hooks/useUserStats";
import { supabase } from "@/integrations/supabase/client";
import Mascot from "@/components/Mascot";
import { PenLine, Flame, Trophy, Target, ArrowRight, Sparkles, TrendingUp } from "lucide-react";

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  points_reward: number;
}

const Home = () => {
  const { user } = useAuth();
  const { stats } = useUserStats();
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    supabase.from("daily_challenges").select("*").eq("is_active", true).limit(3)
      .then(({ data }) => setChallenges(data || []));
    supabase.from("correction_history").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .then(({ count }) => setRecentCount(count || 0));
  }, [user?.id]);

  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const xpThisLevel = xpForLevel(level - 1);
  const xpNextLevel = xpForLevel(level);
  const xpProgress = ((xp - xpThisLevel) / Math.max(1, xpNextLevel - xpThisLevel)) * 100;

  const name = profile?.display_name || user?.email?.split("@")[0] || "Estudante";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl gradient-hero border border-border p-6 md:p-8">
        <div className="grid md:grid-cols-[1fr_auto] items-center gap-6">
          <div>
            <p className="font-mono-score text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Painel Carraco
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {greet}, <span className="gradient-text">{name}</span>
            </h1>
            <p className="text-muted-foreground max-w-md">
              Continue sua jornada. Cada redação te aproxima de uma nota 1000 e desbloqueia recompensas.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/studio"
                className="inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-medium glow hover:scale-105 transition-transform"
              >
                <PenLine className="h-4 w-4" /> Escrever agora <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/challenges"
                className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Target className="h-4 w-4" /> Desafios diários
              </Link>
            </div>
          </div>
          <div className="hidden md:block animate-float">
            <Mascot size={150} mood="happy" />
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Flame} label="Sequência" value={stats?.current_streak ?? 0} hint="dias" color="text-orange-500" />
        <StatCard icon={Sparkles} label="Nível" value={level} hint={`${xp} XP`} color="text-primary" />
        <StatCard icon={TrendingUp} label="Redações" value={stats?.essays_completed ?? 0} hint="enviadas" color="text-accent" />
        <StatCard icon={Trophy} label="Recorde" value={stats?.longest_streak ?? 0} hint="dias seguidos" color="text-amber-500" />
      </section>

      {/* XP bar */}
      <section className="rounded-2xl glass p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-display font-semibold">Nível {level}</p>
            <p className="text-xs text-muted-foreground">{xp - xpThisLevel} / {xpNextLevel - xpThisLevel} XP para o nível {level + 1}</p>
          </div>
          <span className="font-mono-score text-xs gradient-text font-bold">{Math.round(xpProgress)}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, xpProgress)}%` }}
          />
        </div>
      </section>

      {/* Daily challenges + recent */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" /> Desafios de hoje
            </h2>
            <Link to="/challenges" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {challenges.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">Carregando desafios...</p>
            )}
            {challenges.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-muted/50 hover:bg-muted transition-colors p-3">
                <div>
                  <p className="font-medium text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-mono-score text-xs font-bold gradient-text">+{c.xp_reward} XP</p>
                  <p className="font-mono-score text-[10px] text-muted-foreground">+{c.points_reward} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold mb-2">Esta semana</h2>
          <p className="text-5xl font-display font-bold gradient-text">{recentCount}</p>
          <p className="text-sm text-muted-foreground mt-1">redações enviadas nos últimos 7 dias</p>
          <Link to="/history" className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Ver histórico <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, hint, color }: any) => (
  <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-card transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono-score">{label}</span>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <p className="text-2xl md:text-3xl font-display font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{hint}</p>
  </div>
);

export default Home;
