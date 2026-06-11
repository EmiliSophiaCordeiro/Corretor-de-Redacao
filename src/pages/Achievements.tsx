import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import { Sparkles, Lock, Check, Trophy, Zap, Target } from "lucide-react";

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string | null;
  xp_reward: number;
  points_reward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: string;
  target_value: number | null;
  metric_key: string | null;
}

const rarityRing: Record<string, string> = {
  common: "ring-rarity-common",
  rare: "ring-rarity-rare",
  epic: "ring-rarity-epic",
  legendary: "ring-rarity-legendary",
};

const rarityBorder: Record<string, string> = {
  common: "border-rarity-common/60",
  rare: "border-rarity-rare/60",
  epic: "border-rarity-epic/60",
  legendary: "border-rarity-legendary/60",
};

const categoryLabels: Record<string, string> = {
  iniciante: "Iniciante",
  consistencia: "Consistência",
  redacao: "Redação",
  estudos: "Estudos",
  comunidade: "Comunidade",
  geral: "Geral",
};

type Filter = "all" | "unlocked" | "progress";

const Achievements = () => {
  const { user } = useAuth();
  const { stats } = useUserStats();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Map<string, string>>(new Map()); // id -> date
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<string>("all");
  const [communityMetrics, setCommunityMetrics] = useState({ posts: 0, comments: 0, likes: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("achievements").select("*").order("category").order("target_value");
      setAchievements((data as any) || []);
      if (!user) return;
      const { data: ua } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);
      const m = new Map<string, string>();
      ua?.forEach((u: any) => m.set(u.achievement_id, u.unlocked_at));
      setUnlocked(m);

      // Trigger auto-unlock check
      await supabase.rpc("check_and_unlock_achievements" as any, { _user_id: user.id });
      // Re-fetch unlocks after the check
      const { data: ua2 } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);
      const m2 = new Map<string, string>();
      ua2?.forEach((u: any) => m2.set(u.achievement_id, u.unlocked_at));
      setUnlocked(m2);

      // Load community metrics for progress display
      const [{ count: pc }, { count: cc }, { data: posts }] = await Promise.all([
        supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("community_comments").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("community_posts").select("likes_count").eq("user_id", user.id),
      ]);
      setCommunityMetrics({
        posts: pc || 0,
        comments: cc || 0,
        likes: (posts || []).reduce((s: number, p: any) => s + (p.likes_count || 0), 0),
      });
    })();
  }, [user?.id]);

  const getMetric = (key: string | null): number => {
    if (!key || !stats) return 0;
    switch (key) {
      case "xp": return stats.xp;
      case "level": return stats.level;
      case "essays_completed": return stats.essays_completed;
      case "longest_streak": return stats.longest_streak;
      case "max_score": return (stats as any).max_score || 0;
      case "logins": return 1;
      case "posts_count": return communityMetrics.posts;
      case "comments_count": return communityMetrics.comments;
      case "likes_received": return communityMetrics.likes;
      default: return 0;
    }
  };

  const categories = useMemo(() => {
    const set = new Set(achievements.map((a) => a.category));
    return ["all", ...Array.from(set)];
  }, [achievements]);

  const filtered = useMemo(() => {
    return achievements.filter((a) => {
      const isUnlocked = unlocked.has(a.id);
      if (filter === "unlocked" && !isUnlocked) return false;
      if (filter === "progress" && isUnlocked) return false;
      if (category !== "all" && a.category !== category) return false;
      return true;
    });
  }, [achievements, unlocked, filter, category]);

  const xpEarned = achievements
    .filter((a) => unlocked.has(a.id))
    .reduce((s, a) => s + a.xp_reward, 0);

  const progressPct = achievements.length ? Math.round((unlocked.size / achievements.length) * 100) : 0;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Header stats */}
      <div className="rounded-3xl gradient-hero border border-border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center glow">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Conquistas</h1>
            <p className="text-sm text-muted-foreground">Sua jornada no Carraco</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox icon={Trophy} label="Desbloqueadas" value={`${unlocked.size}/${achievements.length}`} />
          <StatBox icon={Target} label="Progresso" value={`${progressPct}%`} />
          <StatBox icon={Zap} label="XP de conquistas" value={xpEarned.toLocaleString()} />
          <StatBox icon={Sparkles} label="Lendárias" value={achievements.filter(a=>a.rarity==="legendary"&&unlocked.has(a.id)).length} />
        </div>

        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["all","unlocked","progress"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter===f ? "gradient-primary text-primary-foreground glow" : "glass hover:bg-muted"
            }`}>
            {f==="all"?"Todas":f==="unlocked"?"Desbloqueadas":"Em progresso"}
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
              category===c ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
            }`}>
            {c==="all"?"Todas as categorias":categoryLabels[c]||c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((a) => {
          const isUnlocked = unlocked.has(a.id);
          const unlockDate = unlocked.get(a.id);
          const currentVal = getMetric(a.metric_key);
          const target = a.target_value || 1;
          const pct = Math.min(100, Math.round((currentVal / target) * 100));

          return (
            <div
              key={a.id}
              className={`relative rounded-2xl p-5 transition-all hover:scale-[1.02] animate-fade-in border-2 ${
                isUnlocked
                  ? `bg-card ${rarityBorder[a.rarity]} ${rarityRing[a.rarity]}`
                  : "bg-card/50 border-border opacity-80"
              }`}
            >
              {isUnlocked && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="flex items-center gap-1 rounded-full gradient-primary text-primary-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg">
                    <Check className="h-3 w-3" /> Conquistada
                  </div>
                </div>
              )}

              <div className={`relative mx-auto h-16 w-16 mb-3 flex items-center justify-center rounded-2xl ${
                isUnlocked ? "gradient-primary glow" : "bg-muted"
              }`}>
                {isUnlocked ? (
                  <span className="text-3xl drop-shadow-lg">{a.icon || "🏅"}</span>
                ) : (
                  <Lock className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              <h3 className={`font-display font-semibold text-sm text-center ${!isUnlocked && "text-muted-foreground"}`}>
                {a.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 text-center line-clamp-2">{a.description}</p>

              {!isUnlocked && a.target_value && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-mono-score text-muted-foreground mb-1">
                    <span>{currentVal.toLocaleString()}</span>
                    <span>{target.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-center gap-2 font-mono-score text-[10px] uppercase tracking-widest">
                <span className={`rarity-${a.rarity} font-bold`}>{a.rarity}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">+{a.xp_reward} XP</span>
              </div>

              {isUnlocked && unlockDate && (
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  ✓ {new Date(unlockDate).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          Nenhuma conquista nesse filtro.
        </div>
      )}
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value }: any) => (
  <div className="rounded-xl glass p-3">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono-score">{label}</p>
    </div>
    <p className="text-lg font-display font-bold">{value}</p>
  </div>
);

export default Achievements;
