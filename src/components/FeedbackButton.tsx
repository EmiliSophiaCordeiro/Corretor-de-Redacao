import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "bug", label: "Problema / bug" },
  { value: "ideia", label: "Sugestão de melhoria" },
  { value: "correcao", label: "Sobre a correção da IA" },
  { value: "geral", label: "Outro assunto" },
];

const MAX = 1000;

/** Botão flutuante de feedback disponível em todas as telas autenticadas. */
export const FeedbackButton = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("ideia");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setError("Escreva pelo menos 10 caracteres para entendermos seu feedback.");
      return;
    }
    if (trimmed.length > MAX) {
      setError(`O texto deve ter no máximo ${MAX} caracteres.`);
      return;
    }
    setError(null);
    setSending(true);
    const { error: dbError } = await supabase.from("user_feedback").insert({
      user_id: user!.id,
      category,
      message: trimmed,
      page_path: pathname,
    });
    setSending(false);
    if (dbError) {
      toast.error("Não conseguimos enviar seu feedback agora. Tente novamente em instantes.");
      return;
    }
    toast.success("Feedback enviado. Obrigado por ajudar o Carraco a melhorar!");
    setMessage("");
    setOpen(false);
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Enviar feedback sobre o Carraco"
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-card glow transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-auto md:w-auto md:px-4 md:py-2.5 md:gap-2"
      >
        <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
        <span className="hidden md:inline font-mono-score text-[11px] font-semibold uppercase tracking-widest">Feedback</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar feedback</DialogTitle>
            <DialogDescription>
              Conte o que travou, o que faltou ou o que você gostaria de ver no Carraco.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="feedback-category">Assunto</Label>
              <select
                id="feedback-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="feedback-message">Sua mensagem</Label>
              <Textarea
                id="feedback-message"
                value={message}
                maxLength={MAX}
                onChange={(e) => { setMessage(e.target.value); if (error) setError(null); }}
                placeholder="Ex.: a correção por foto ignorou a última linha da minha redação…"
                rows={5}
                aria-invalid={!!error}
                aria-describedby={error ? "feedback-error" : "feedback-count"}
              />
              <div className="flex items-center justify-between">
                <p id="feedback-error" role="alert" className="text-xs text-destructive min-h-4">{error}</p>
                <span id="feedback-count" className="text-xs text-muted-foreground">{message.length}/{MAX}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={sending} className="gradient-primary text-primary-foreground border-0">
                {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> Enviando…</> : "Enviar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackButton;
