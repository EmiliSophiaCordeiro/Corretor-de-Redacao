import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      navigate("/");
    }
    setSubmitting(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Link inválido ou expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Shield className="h-8 w-8 text-destructive mb-4" />
          <h1 className="text-xl font-semibold text-foreground">Nova Senha</h1>
        </div>
        <form onSubmit={handleReset} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha (mín. 6 caracteres)"
            required
            minLength={6}
            className="w-full bg-transparent border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-6 py-2.5 font-mono-score text-xs font-semibold uppercase tracking-widest text-primary-foreground hover:brightness-110 disabled:opacity-50 glow-blue"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Atualizar Senha"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
