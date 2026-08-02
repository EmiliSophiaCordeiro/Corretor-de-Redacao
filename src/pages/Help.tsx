import { Helmet } from "react-helmet-async";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LifeBuoy, PlayCircle, MessageSquarePlus, PenLine, Camera, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import Mascot from "@/components/Mascot";

const FAQS = [
  {
    q: "Como o Carraco corrige minha redação?",
    a: "A correção segue as cinco competências do ENEM (INEP). Você recebe nota por competência, justificativa técnica, trechos problemáticos e sugestões de reescrita. A nota final é a soma das cinco competências, de 0 a 1000.",
  },
  {
    q: "Posso enviar a redação escrita à mão?",
    a: "Sim. No Estúdio, use o envio por foto. A imagem passa por uma transcrição literal (sem correção automática de erros) e você revisa o texto antes de mandar corrigir. Fotografe com boa luz, a folha reta e sem sombras.",
  },
  {
    q: "A contagem de linhas é a mesma da folha oficial?",
    a: "O editor conta as linhas visuais, considerando a quebra do texto. Ao colar de Word, Docs ou PDF, o Carraco limpa quebras extras automaticamente para que a contagem fique fiel.",
  },
  {
    q: "Como funcionam XP, níveis e moedas?",
    a: "Cada correção concluída gera XP e moedas proporcionais à sua nota. XP aumenta seu nível e sua posição no ranking; moedas são usadas na loja para personalizar o mascote.",
  },
  {
    q: "O que é a ofensiva (streak)?",
    a: "É a sua sequência de dias com atividade. Enviar uma redação ou completar um desafio diário mantém a sequência viva. Um dia sem atividade zera a contagem.",
  },
  {
    q: "Posso mudar o estilo de correção?",
    a: "Sim. No Estúdio você escolhe o modo de correção e pode calibrar o corretor no painel de calibração, definindo tom e critérios extras que a IA deve considerar.",
  },
  {
    q: "Meus dados estão seguros? Como excluo minha conta?",
    a: "Suas redações são privadas e visíveis apenas para você. Em Configurações você pode baixar todos os seus dados (portabilidade LGPD) e excluir a conta definitivamente, o que apaga redações, estatísticas e arquivos enviados.",
  },
  {
    q: "Encontrei um erro. O que faço?",
    a: "Use o botão de Feedback, sempre disponível no canto inferior direito. Descreva o que aconteceu e em qual tela — isso entra direto na nossa fila de correções.",
  },
];

const QUICK = [
  { icon: PenLine, title: "Escrever uma redação", body: "Vá ao Estúdio, informe o tema, escreva ou cole o texto e clique em corrigir.", to: "/studio" },
  { icon: Camera, title: "Enviar por foto", body: "No Estúdio, envie a foto da folha, revise a transcrição e confirme.", to: "/studio" },
  { icon: Trophy, title: "Acompanhar evolução", body: "Veja notas por competência e a curva de desempenho no Histórico.", to: "/history" },
];

const Help = () => {
  const restartTour = () => window.dispatchEvent(new CustomEvent("carraco:restart-tour"));

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-8">
      <Seo
        title="Central de Ajuda e FAQ | Carraco"
        description="Tire dúvidas sobre correção ENEM por IA, envio por foto, XP, ofensiva e privacidade no Carraco. Perguntas frequentes e suporte."
        path="/help"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          })}
        </script>
      </Helmet>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center glow shrink-0">
            <LifeBuoy className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">Guias rápidos, perguntas frequentes e suporte.</p>
          </div>
        </div>
        <div className="hidden sm:block"><Mascot size={72} mood="happy" /></div>
      </header>

      <section aria-labelledby="guias-rapidos">
        <h2 id="guias-rapidos" className="font-display font-semibold mb-3">Guias rápidos</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {QUICK.map((q) => (
            <Link
              key={q.title}
              to={q.to}
              className="rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <q.icon className="h-5 w-5 text-primary mb-2" aria-hidden="true" />
              <h3 className="font-medium text-sm mb-1">{q.title}</h3>
              <p className="text-xs text-muted-foreground">{q.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="faq">
        <h2 id="faq" className="font-display font-semibold mb-3">Perguntas frequentes</h2>
        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-4">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section aria-labelledby="suporte" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="suporte" className="font-display font-semibold mb-1">Ainda com dúvida?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Reveja o tutorial inicial ou envie sua mensagem direto para a equipe.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={restartTour} variant="outline" className="gap-2">
            <PlayCircle className="h-4 w-4" aria-hidden="true" /> Rever tutorial
          </Button>
          <Button
            onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="Enviar feedback sobre o Carraco"]')?.click()}
            className="gap-2 gradient-primary text-primary-foreground border-0"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" /> Enviar feedback
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Help;
