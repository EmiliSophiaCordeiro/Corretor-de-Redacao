import Seo from "@/components/Seo";
import { Link } from "react-router-dom";

const Terms = () => (
  <main className="container max-w-3xl mx-auto px-4 py-10">
    <Seo title="Termos de Uso | Carraco" description="Regras de uso da plataforma Carraco para correção e prática de redação." path="/terms" />
    <h1 className="text-3xl font-display font-bold mb-2">Termos de Uso</h1>
    <p className="text-sm text-muted-foreground mb-6">Última atualização: 19 de julho de 2026</p>

    <section className="space-y-4 text-sm leading-relaxed">
      <h2 className="text-xl font-semibold mt-4">1. Aceitação</h2>
      <p>Ao criar uma conta ou usar o Carraco, você concorda com estes Termos e com a <Link to="/privacy" className="text-primary underline">Política de Privacidade</Link>.</p>

      <h2 className="text-xl font-semibold mt-6">2. Serviço</h2>
      <p>O Carraco oferece ferramentas de escrita, correção automatizada por IA (baseada nos critérios do ENEM/INEP), gamificação e comunidade. As correções são orientativas e não substituem uma banca oficial.</p>

      <h2 className="text-xl font-semibold mt-6">3. Conta do usuário</h2>
      <ul className="list-disc pl-6">
        <li>Você é responsável por manter suas credenciais em sigilo.</li>
        <li>Cada usuário deve criar apenas uma conta.</li>
        <li>Podemos suspender contas que violem estes Termos.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">4. Conduta</h2>
      <p>É proibido: publicar conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de terceiros; automatizar acessos abusivos; tentar burlar mecanismos de segurança; usar o serviço para spam ou fraude.</p>

      <h2 className="text-xl font-semibold mt-6">5. Conteúdo do usuário</h2>
      <p>Você mantém a titularidade das redações que envia. Concede ao Carraco licença limitada para processar o texto exclusivamente para fornecer o serviço (correção, OCR, histórico).</p>

      <h2 className="text-xl font-semibold mt-6">6. Inteligência Artificial</h2>
      <p>As notas e comentários são gerados por modelos de IA e podem conter imprecisões. Não devem ser usados como avaliação oficial. Use com senso crítico.</p>

      <h2 className="text-xl font-semibold mt-6">7. Planos e cobrança</h2>
      <p>Recursos premium podem ser oferecidos mediante assinatura. Preços, formas de pagamento e cancelamento serão exibidos na página de planos.</p>

      <h2 className="text-xl font-semibold mt-6">8. Encerramento</h2>
      <p>Você pode encerrar sua conta a qualquer momento em Configurações → Dados. Podemos encerrar o serviço mediante aviso prévio razoável.</p>

      <h2 className="text-xl font-semibold mt-6">9. Limitação de responsabilidade</h2>
      <p>O serviço é fornecido "no estado em que se encontra". Na máxima extensão permitida pela lei, não respondemos por danos indiretos, lucros cessantes ou perda de dados.</p>

      <h2 className="text-xl font-semibold mt-6">10. Alterações e foro</h2>
      <p>Podemos atualizar estes Termos; alterações relevantes serão comunicadas no app. Fica eleito o foro do domicílio do usuário (CDC), quando aplicável.</p>

      <p className="text-xs text-muted-foreground pt-6">Contato: <a className="text-primary underline" href="mailto:contato@carraco.app">contato@carraco.app</a></p>
    </section>
  </main>
);

export default Terms;
