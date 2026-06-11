import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PenLine, BarChart3, Users, Sparkles, Rocket, Target, PartyPopper } from "lucide-react";
import Mascot from "./Mascot";

const STEPS = [
  { icon: Rocket,      title: "Bem-vindo ao Carraco!",       body: "Sua plataforma de redação ENEM com correção por IA, gamificação e comunidade. Vamos te mostrar o essencial em 30 segundos." },
  { icon: PenLine,     title: "Estúdio de Redação",          body: "Envie sua redação digitando, colando o texto ou tirando foto. O Carraco corrige nas 5 competências do ENEM com feedback técnico." },
  { icon: Target,      title: "Desafios Diários",            body: "Temas novos todo dia. Complete para manter sua sequência e acelerar o ganho de XP." },
  { icon: BarChart3,   title: "Histórico e Desempenho",      body: "Acompanhe a evolução das suas notas, identifique pontos fracos e revise correções anteriores." },
  { icon: Users,       title: "Comunidade",                  body: "Compartilhe dúvidas, redações e dicas com outros estudantes. Curta, comente e cresça junto." },
  { icon: Sparkles,    title: "Conquistas e Mascote",        body: "Ganhe XP, desbloqueie conquistas e personalize seu mascote na loja com moedas." },
  { icon: PartyPopper, title: "Pronto!",                     body: "Você pode rever este tutorial em Configurações. Bom estudo!" },
];

export const OnboardingTour = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data && !(data as any).onboarding_completed) setOpen(true);
      });
  }, [user?.id]);

  const finish = async () => {
    setOpen(false);
    if (user) {
      await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("user_id", user.id);
    }
  };

  const skip = () => finish();
  const next = () => (step === STEPS.length - 1 ? finish() : setStep(s => s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const Current = STEPS[step];
  const Icon = Current.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && finish()}>
      <DialogContent className="max-w-md">
        <div className="text-center pt-2">
          <div className="mx-auto mb-3 inline-block animate-float">
            <Mascot size={100} mood="happy" hat="graduation" />
          </div>
          <div className="mx-auto h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center glow mb-3">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold mb-2">{Current.title}</h2>
          <p className="text-sm text-muted-foreground px-2">{Current.body}</p>

          <div className="flex justify-center gap-1.5 my-5">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 gradient-primary" : i < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted"
              }`} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={skip}>Pular</Button>
            <div className="flex gap-2">
              {step > 0 && <Button variant="outline" size="sm" onClick={back}>Voltar</Button>}
              <Button size="sm" onClick={next} className="gradient-primary text-primary-foreground border-0">
                {step === STEPS.length - 1 ? "Começar 🚀" : "Avançar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
