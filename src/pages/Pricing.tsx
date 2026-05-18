import { Check, Crown, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    name: "Carraco GO",
    price: "Grátis",
    period: "",
    description: "Para começar agora",
    cta: "Seu plano atual",
    highlight: false,
    features: [
      "Redações com correção básica",
      "Acesso à comunidade",
      "Streaks e XP diário",
      "Customização básica do mascote",
    ],
  },
  {
    name: "Carraco PLUS",
    price: "R$ 24,90",
    period: "/mês",
    description: "Para evoluir mais rápido",
    cta: "Assinar PLUS",
    highlight: true,
    features: [
      "Redações ilimitadas",
      "Feedback IA avançado",
      "Análise gramatical detalhada",
      "Mais itens do mascote",
      "Estatísticas avançadas",
      "Suporte prioritário",
    ],
  },
  {
    name: "Carraco PRO",
    price: "R$ 49,90",
    period: "/mês",
    description: "Experiência premium completa",
    cta: "Virar PRO",
    highlight: false,
    features: [
      "Mentor IA personalizado",
      "Análise de nota com previsão",
      "Cosméticos exclusivos",
      "Temas premium",
      "Tudo ilimitado",
      "Plano de estudos personalizado",
      "Acesso antecipado a features",
    ],
  },
];

const Pricing = () => {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <p className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Planos</p>
        <h1 className="text-3xl md:text-5xl font-display font-bold mb-3">
          Escolha como <span className="gradient-text">evoluir</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Todos os planos incluem gamificação, mascote e ranking. Faça upgrade para destravar IA avançada e cosméticos exclusivos.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-3xl p-6 transition-all hover:scale-[1.02] ${
              p.highlight
                ? "gradient-primary text-primary-foreground glow shadow-2xl"
                : "bg-card border border-border"
            }`}
          >
            {p.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-[10px] uppercase tracking-widest font-mono-score font-bold text-accent-foreground glow-pink">
                Recomendado
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              {p.name.includes("PRO") ? <Crown className="h-5 w-5" /> :
               p.name.includes("PLUS") ? <Sparkles className="h-5 w-5" /> :
               <Zap className="h-5 w-5" />}
              <h3 className="font-display font-bold text-lg">{p.name}</h3>
            </div>
            <p className={`text-sm mb-5 ${p.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {p.description}
            </p>
            <div className="mb-6">
              <span className="font-display text-4xl font-bold">{p.price}</span>
              <span className={`text-sm ${p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.period}</span>
            </div>
            <button
              className={`w-full rounded-full py-3 text-sm font-medium transition-all ${
                p.highlight
                  ? "bg-white text-primary hover:bg-white/90"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {p.cta}
            </button>
            <ul className="mt-6 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? "text-primary-foreground" : "text-success"}`} />
                  <span className={p.highlight ? "text-primary-foreground/95" : ""}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        Pagamento ainda não está ativo — interface de pré-visualização.
      </p>
    </div>
  );
};

export default Pricing;
