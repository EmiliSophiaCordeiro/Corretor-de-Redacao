import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User as UserIcon, Palette, Bell, Lock, Accessibility, Database, HelpCircle, Moon, Sun, Monitor, Download, Trash2, Mail, MessageSquare, Bug, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

type TabId = "conta" | "aparencia" | "notificacoes" | "privacidade" | "acessibilidade" | "dados" | "suporte";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "conta",          label: "Conta",          icon: UserIcon },
  { id: "aparencia",      label: "Aparência",      icon: Palette },
  { id: "notificacoes",   label: "Notificações",   icon: Bell },
  { id: "privacidade",    label: "Privacidade",    icon: Lock },
  { id: "acessibilidade", label: "Acessibilidade", icon: Accessibility },
  { id: "dados",          label: "Dados",          icon: Database },
  { id: "suporte",        label: "Suporte",        icon: HelpCircle },
];

const defaultPrefs = {
  notifications: { achievements: true, community: true, corrections: true, email: false },
  privacy: { show_stats: true, show_achievements: true },
  accessibility: { font_scale: 1, high_contrast: false, reduce_motion: false },
};

const SettingsPage = () => {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<TabId>("conta");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [prefs, setPrefs] = useState<any>(defaultPrefs);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setDisplayName(data.display_name || "");
        setBio((data as any).bio || "");
        setIsPublic((data as any).is_public ?? true);
        setPrefs({ ...defaultPrefs, ...((data as any).preferences || {}) });
        setAvatarUrl(data.avatar_url || null);
      });
    setNewEmail(user.email || "");
  }, [user?.id]);

  // Apply accessibility preferences live
  useEffect(() => {
    document.documentElement.style.fontSize = `${(prefs.accessibility?.font_scale || 1) * 16}px`;
    document.documentElement.classList.toggle("reduce-motion", !!prefs.accessibility?.reduce_motion);
    document.documentElement.classList.toggle("high-contrast", !!prefs.accessibility?.high_contrast);
  }, [prefs.accessibility]);

  const savePrefs = async (next: any) => {
    setPrefs(next);
    if (!user) return;
    await supabase.from("profiles").update({ preferences: next } as any).eq("user_id", user.id);
  };

  const saveAccount = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ display_name: displayName, bio, is_public: isPublic } as any).eq("user_id", user.id);
    await supabase.rpc("check_and_unlock_achievements" as any, { _user_id: user.id });
    toast.success("Perfil atualizado");
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return toast.error("Senha precisa ter pelo menos 6 caracteres");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message); else { toast.success("Senha alterada"); setNewPassword(""); }
  };

  const changeEmail = async () => {
    if (!newEmail || newEmail === user?.email) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) toast.error(error.message); else toast.success("Confirmação enviada para o novo email");
  };

  const uploadAvatar = async (file: File) => {
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

  const exportData = async () => {
    if (!user) return;
    const [{ data: profile }, { data: stats }, { data: history }, { data: ach }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("correction_history").select("*").eq("user_id", user.id),
      supabase.from("user_achievements").select("*").eq("user_id", user.id),
    ]);
    const blob = new Blob([JSON.stringify({ profile, stats, history, achievements: ach }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `carraco-dados-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    toast.success("Dados exportados");
  };

  const resetOnboarding = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_completed: false } as any).eq("user_id", user.id);
    toast.success("Tutorial será exibido novamente. Recarregue a página.");
  };

  const deleteAccount = async () => {
    if (!confirm("Tem certeza? Esta ação é irreversível.")) return;
    if (prompt("Digite EXCLUIR para confirmar:") !== "EXCLUIR") return;
    toast.error("Para excluir sua conta, entre em contato com o suporte.");
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-display font-bold mb-1">Configurações</h1>
      <p className="text-sm text-muted-foreground mb-6">Personalize sua experiência no Carraco</p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <nav className="md:w-56 shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  tab===t.id ? "gradient-primary text-primary-foreground glow" : "hover:bg-muted"
                }`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab==="conta" && (
            <Section title="Informações da conta">
              <div className="flex items-center gap-4 mb-4">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/40" />
                  : <div className="h-20 w-20 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                      {(displayName||"?").charAt(0).toUpperCase()}
                    </div>}
                <label className="cursor-pointer">
                  <span className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm">Trocar foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                </label>
              </div>
              <Field label="Nome de exibição">
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </Field>
              <Field label="Bio">
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} placeholder="Conte um pouco sobre você..." />
              </Field>
              <Button onClick={saveAccount} className="gradient-primary text-primary-foreground border-0">Salvar perfil</Button>

              <Divider />
              <Field label="Email">
                <div className="flex gap-2">
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  <Button variant="outline" onClick={changeEmail}>Alterar</Button>
                </div>
              </Field>
              <Field label="Nova senha">
                <div className="flex gap-2">
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                  <Button variant="outline" onClick={changePassword}>Alterar</Button>
                </div>
              </Field>
              <Divider />
              <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" /> Sair da conta</Button>
            </Section>
          )}

          {tab==="aparencia" && (
            <Section title="Aparência">
              <div className="grid grid-cols-3 gap-3">
                <ThemeCard active={theme==="light"} onClick={() => theme!=="light" && toggle()} icon={Sun} label="Claro" />
                <ThemeCard active={theme==="dark"}  onClick={() => theme!=="dark" && toggle()} icon={Moon} label="Escuro" />
                <ThemeCard active={false} onClick={() => toast("Tema automático em breve")} icon={Monitor} label="Sistema" />
              </div>
            </Section>
          )}

          {tab==="notificacoes" && (
            <Section title="Notificações">
              <SwitchRow label="Conquistas desbloqueadas" desc="Avisar quando você ganhar uma conquista"
                checked={prefs.notifications.achievements} onChange={(v) => savePrefs({ ...prefs, notifications: {...prefs.notifications, achievements: v} })} />
              <SwitchRow label="Atividade da comunidade" desc="Curtidas, comentários e respostas"
                checked={prefs.notifications.community} onChange={(v) => savePrefs({ ...prefs, notifications: {...prefs.notifications, community: v} })} />
              <SwitchRow label="Correções concluídas" desc="Quando sua redação terminar de ser corrigida"
                checked={prefs.notifications.corrections} onChange={(v) => savePrefs({ ...prefs, notifications: {...prefs.notifications, corrections: v} })} />
              <SwitchRow label="Receber por email" desc="Resumo semanal e novidades"
                checked={prefs.notifications.email} onChange={(v) => savePrefs({ ...prefs, notifications: {...prefs.notifications, email: v} })} />
            </Section>
          )}

          {tab==="privacidade" && (
            <Section title="Privacidade">
              <SwitchRow label="Perfil público" desc="Outros estudantes podem ver seu perfil na comunidade"
                checked={isPublic} onChange={async (v) => { setIsPublic(v); if (user) await supabase.from("profiles").update({ is_public: v } as any).eq("user_id", user.id); }} />
              <SwitchRow label="Mostrar estatísticas" desc="Exibir XP, nível e sequência no perfil público"
                checked={prefs.privacy.show_stats} onChange={(v) => savePrefs({ ...prefs, privacy: {...prefs.privacy, show_stats: v} })} />
              <SwitchRow label="Mostrar conquistas" desc="Exibir suas conquistas no perfil público"
                checked={prefs.privacy.show_achievements} onChange={(v) => savePrefs({ ...prefs, privacy: {...prefs.privacy, show_achievements: v} })} />
            </Section>
          )}

          {tab==="acessibilidade" && (
            <Section title="Acessibilidade">
              <Field label={`Tamanho da fonte: ${Math.round(prefs.accessibility.font_scale * 100)}%`}>
                <Slider min={0.8} max={1.4} step={0.05} value={[prefs.accessibility.font_scale]}
                  onValueChange={([v]) => savePrefs({ ...prefs, accessibility: {...prefs.accessibility, font_scale: v} })} />
              </Field>
              <SwitchRow label="Alto contraste" desc="Aumenta o contraste de cores"
                checked={prefs.accessibility.high_contrast} onChange={(v) => savePrefs({ ...prefs, accessibility: {...prefs.accessibility, high_contrast: v} })} />
              <SwitchRow label="Reduzir animações" desc="Desativa transições e movimentos"
                checked={prefs.accessibility.reduce_motion} onChange={(v) => savePrefs({ ...prefs, accessibility: {...prefs.accessibility, reduce_motion: v} })} />
            </Section>
          )}

          {tab==="dados" && (
            <Section title="Seus dados">
              <ActionRow icon={Download} label="Exportar meus dados" desc="Baixe um JSON com perfil, estatísticas, histórico e conquistas">
                <Button variant="outline" onClick={exportData}>Baixar</Button>
              </ActionRow>
              <ActionRow icon={HelpCircle} label="Rever tutorial" desc="Exibir novamente o tutorial inicial">
                <Button variant="outline" onClick={resetOnboarding}>Rever</Button>
              </ActionRow>
              <ActionRow icon={Trash2} label="Excluir conta" desc="Remove permanentemente sua conta e dados">
                <Button variant="destructive" onClick={deleteAccount}>Excluir</Button>
              </ActionRow>
            </Section>
          )}

          {tab==="suporte" && (
            <Section title="Suporte">
              <ActionRow icon={HelpCircle} label="Central de ajuda" desc="Tutoriais e perguntas frequentes">
                <Button variant="outline" onClick={() => toast("Central de ajuda em breve")}>Abrir</Button>
              </ActionRow>
              <ActionRow icon={Bug} label="Reportar bug" desc="Encontrou um problema? Conte para a gente">
                <Button variant="outline" onClick={() => window.open("mailto:suporte@carraco.app?subject=Bug%20report")}>Reportar</Button>
              </ActionRow>
              <ActionRow icon={MessageSquare} label="Enviar feedback" desc="Sugestões e melhorias">
                <Button variant="outline" onClick={() => window.open("mailto:feedback@carraco.app")}>Enviar</Button>
              </ActionRow>
              <ActionRow icon={Mail} label="Contato" desc="Fale com nossa equipe">
                <Button variant="outline" onClick={() => window.open("mailto:contato@carraco.app")}>Email</Button>
              </ActionRow>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: any) => (
  <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
    <h2 className="font-display font-semibold text-lg">{title}</h2>
    {children}
  </div>
);
const Field = ({ label, children }: any) => (
  <div>
    <label className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
    {children}
  </div>
);
const Divider = () => <div className="h-px bg-border my-2" />;
const SwitchRow = ({ label, desc, checked, onChange }: any) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);
const ActionRow = ({ icon: Icon, label, desc, children }: any) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
    {children}
  </div>
);
const ThemeCard = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick}
    className={`p-4 rounded-xl border-2 transition-all ${active ? "border-primary gradient-primary text-primary-foreground glow" : "border-border hover:border-primary/40"}`}>
    <Icon className="h-6 w-6 mx-auto mb-1" />
    <p className="text-xs font-medium">{label}</p>
  </button>
);

export default SettingsPage;
