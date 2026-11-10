import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TERMS_VERSION } from "@/lib/terms";
import TermsConsentFields from "./TermsConsentFields";

/** Blocks the app until the signed-in user has accepted the terms. */
const TermsGate = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "needed">("loading");
  const [terms, setTerms] = useState(false);
  const [age, setAge] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("terms_accepted_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setStatus("ok"); return; } // não trava o app por falha de rede
        setStatus(data?.terms_accepted_at ? "ok" : "needed");
      });
    return () => { active = false; };
  }, [user]);

  const accept = async () => {
    if (!terms || !age) {
      setError("Marque as duas opções para continuar.");
      return;
    }
    if (!user) return;
    setSaving(true);
    setError("");
    const payload = { terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION };
    const { data, error } = await supabase.from("profiles").update(payload).eq("user_id", user.id).select("id");
    let failed = !!error;
    if (!error && (!data || data.length === 0)) {
      const ins = await supabase.from("profiles").insert({ user_id: user.id, ...payload });
      failed = !!ins.error;
    }
    setSaving(false);
    if (failed) {
      toast.error("Não conseguimos salvar seu aceite. Tente novamente.");
      return;
    }
    setStatus("ok");
  };

  if (status === "ok") return <>{children}</>;
  if (status === "loading") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="terms-gate-title" className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl glass p-6 shadow-card space-y-4">
        <h2 id="terms-gate-title" className="font-display text-lg font-bold">Atualizamos nossos termos</h2>
        <p className="text-sm text-muted-foreground">Para continuar usando o Carraco, confirme os itens abaixo.</p>
        <TermsConsentFields terms={terms} age={age} onTerms={(v) => { setTerms(v); setError(""); }} onAge={(v) => { setAge(v); setError(""); }} error={error} idPrefix="gate" />
        <button
          type="button"
          onClick={accept}
          disabled={saving || !terms || !age}
          aria-busy={saving}
          className="w-full rounded-full gradient-primary px-6 py-2.5 font-mono-score text-xs font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {saving ? "Salvando…" : "Aceitar e continuar"}
        </button>
        <button type="button" onClick={() => signOut()} className="w-full text-xs text-muted-foreground hover:underline">
          Sair da conta
        </button>
      </div>
    </div>
  );
};

export default TermsGate;
