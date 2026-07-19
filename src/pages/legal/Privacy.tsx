import Seo from "@/components/Seo";
import { Link } from "react-router-dom";

const Privacy = () => (
  <div className="container max-w-3xl mx-auto px-4 py-10 prose prose-invert dark:prose-invert">
    <Seo title="Política de Privacidade | Carraco" description="Como o Carraco coleta, usa e protege seus dados pessoais em conformidade com a LGPD." path="/privacy" />
    <h1 className="text-3xl font-display font-bold mb-2">Política de Privacidade</h1>
    <p className="text-sm text-muted-foreground mb-6">Última atualização: 19 de julho de 2026</p>

    <section className="space-y-4 text-sm leading-relaxed">
      <p>Esta Política descreve como o <strong>Carraco</strong> ("nós") trata seus dados pessoais em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>.</p>

      <h2 className="text-xl font-semibold mt-6">1. Dados que coletamos</h2>
      <ul className="list-disc pl-6">
        <li><strong>Cadastro:</strong> nome de exibição, email, senha (armazenada com hash).</li>
        <li><strong>Uso:</strong> redações enviadas, correções geradas, XP, conquistas, histórico.</li>
        <li><strong>Conteúdo:</strong> imagens de redação enviadas para OCR e o texto extraído.</li>
        <li><strong>Técnicos:</strong> logs de acesso, endereço IP e cookies estritamente necessários.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">2. Finalidades</h2>
      <ul className="list-disc pl-6">
        <li>Autenticar o usuário e manter a sessão.</li>
        <li>Executar correções de redação por Inteligência Artificial.</li>
        <li>Registrar progresso, ranking e comunidade.</li>
        <li>Prevenir fraude e cumprir obrigações legais.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">3. Bases legais (art. 7º LGPD)</h2>
      <p>Execução de contrato, consentimento, legítimo interesse e cumprimento de obrigação legal.</p>

      <h2 className="text-xl font-semibold mt-6">4. Compartilhamento</h2>
      <p>Utilizamos operadores para infraestrutura e IA: <strong>Supabase</strong> (banco/armazenamento), <strong>Lovable AI Gateway</strong> (Google Gemini) para correção e OCR. Não vendemos dados a terceiros.</p>

      <h2 className="text-xl font-semibold mt-6">5. Armazenamento e segurança</h2>
      <ul className="list-disc pl-6">
        <li>Dados criptografados em trânsito (TLS) e em repouso.</li>
        <li>Row Level Security no banco: cada usuário só acessa os próprios dados.</li>
        <li>Avatares em bucket privado com URLs assinadas de curta duração.</li>
        <li>Senhas verificadas contra base de vazamentos (HIBP).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">6. Retenção</h2>
      <p>Mantemos seus dados enquanto a conta estiver ativa. Ao solicitar a exclusão, todos os dados pessoais são apagados em até 30 dias, salvo obrigação legal de retenção.</p>

      <h2 className="text-xl font-semibold mt-6">7. Seus direitos (art. 18 LGPD)</h2>
      <p>Você pode a qualquer momento:</p>
      <ul className="list-disc pl-6">
        <li>Acessar e corrigir seus dados em <Link to="/settings" className="text-primary underline">Configurações</Link>.</li>
        <li>Exportar seus dados em formato JSON (Configurações → Dados).</li>
        <li>Excluir sua conta e todos os dados associados (Configurações → Dados).</li>
        <li>Revogar consentimento e solicitar informações sobre o tratamento.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">8. Menores de idade</h2>
      <p>O serviço é destinado a maiores de 13 anos. Menores de 18 anos devem ter consentimento dos responsáveis.</p>

      <h2 className="text-xl font-semibold mt-6">9. Encarregado (DPO)</h2>
      <p>Contato: <a className="text-primary underline" href="mailto:privacidade@carraco.app">privacidade@carraco.app</a></p>

      <p className="text-xs text-muted-foreground pt-6">Ver também: <Link to="/terms" className="underline">Termos de Uso</Link> · <Link to="/cookies" className="underline">Política de Cookies</Link></p>
    </section>
  </div>
);

export default Privacy;
