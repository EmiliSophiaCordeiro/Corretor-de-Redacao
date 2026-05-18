import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import { supabase } from "@/integrations/supabase/client";
import Mascot from "@/components/Mascot";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const { stats } = useUserStats();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name || ""));
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user.id);
    setSaving(false);
    toast.success("Perfil atualizado");
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="rounded-3xl gradient-hero border border-border p-6 mb-6 flex items-center gap-6 flex-wrap">
        <Mascot size={120} hat="graduation" glasses="round" />
        <div className="flex-1 min-w-0">
          <p className="font-mono-score text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Perfil</p>
          <h1 className="text-2xl font-display font-bold">{displayName || "Estudante Carraco"}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-3 flex gap-2 flex-wrap text-xs">
            <span className="rounded-full glass px-3 py-1">Nível {stats?.level ?? 1}</span>
            <span className="rounded-full glass px-3 py-1">{stats?.xp ?? 0} XP</span>
            <span className="rounded-full glass px-3 py-1">🔥 {stats?.current_streak ?? 0} dias</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-display font-semibold">Editar perfil</h2>
        <div>
          <label className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">
            Nome de exibição
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full gradient-primary text-primary-foreground px-5 py-2 text-sm font-medium glow disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
};

export default Profile;
