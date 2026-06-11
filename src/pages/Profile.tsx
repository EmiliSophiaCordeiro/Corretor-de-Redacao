import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import { supabase } from "@/integrations/supabase/client";
import Mascot from "@/components/Mascot";
import { toast } from "sonner";
import { Camera } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const { stats } = useUserStats();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, bio, avatar_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || "");
        setBio((data as any)?.bio || "");
        setAvatarUrl((data as any)?.avatar_url || null);
      });
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: displayName, bio } as any).eq("user_id", user.id);
    await supabase.rpc("check_and_unlock_achievements" as any, { _user_id: user.id });
    setSaving(false);
    toast.success("Perfil atualizado");
  };

  const upload = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = data?.signedUrl;
    if (url) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      setAvatarUrl(url);
    }
    toast.success("Foto atualizada");
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="rounded-3xl gradient-hero border border-border p-6 mb-6 flex items-center gap-6 flex-wrap">
        <div className="relative">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="h-28 w-28 rounded-full object-cover ring-4 ring-primary/30" />
            : <Mascot size={120} hat="graduation" glasses="round" />}
          <label className="absolute bottom-0 right-0 h-9 w-9 rounded-full gradient-primary text-primary-foreground flex items-center justify-center cursor-pointer glow">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono-score text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Perfil</p>
          <h1 className="text-2xl font-display font-bold">{displayName || "Estudante Carraco"}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {bio && <p className="text-sm mt-2 max-w-md">{bio}</p>}
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
          <label className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Nome de exibição</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300}
            placeholder="Conte um pouco sobre você..."
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <button onClick={save} disabled={saving}
          className="rounded-full gradient-primary text-primary-foreground px-5 py-2 text-sm font-medium glow disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
};

export default Profile;
