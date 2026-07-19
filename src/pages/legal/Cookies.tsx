import Seo from "@/components/Seo";

const Cookies = () => (
  <div className="container max-w-3xl mx-auto px-4 py-10">
    <Seo title="Política de Cookies | Carraco" description="Como o Carraco utiliza cookies e armazenamento local no seu navegador." path="/cookies" />
    <h1 className="text-3xl font-display font-bold mb-2">Política de Cookies</h1>
    <p className="text-sm text-muted-foreground mb-6">Última atualização: 19 de julho de 2026</p>

    <section className="space-y-4 text-sm leading-relaxed">
      <p>O Carraco utiliza <strong>cookies e armazenamento local (localStorage)</strong> estritamente necessários para o funcionamento do serviço.</p>

      <h2 className="text-xl font-semibold mt-4">1. Categorias de cookies</h2>
      <ul className="list-disc pl-6">
        <li><strong>Essenciais:</strong> autenticação, sessão Supabase, preferência de tema. Sem estes o app não funciona.</li>
        <li><strong>Funcionais:</strong> preferências de acessibilidade e notificações.</li>
        <li><strong>Analíticos:</strong> apenas se explicitamente ativados por você no futuro.</li>
      </ul>
      <p>Não utilizamos cookies de publicidade nem compartilhamos dados com redes de anúncios.</p>

      <h2 className="text-xl font-semibold mt-6">2. Como gerenciar</h2>
      <p>Você pode limpar cookies e localStorage nas configurações do seu navegador. Ao fazer isso, sua sessão será encerrada e as preferências resetadas.</p>

      <h2 className="text-xl font-semibold mt-6">3. Contato</h2>
      <p>Dúvidas: <a className="text-primary underline" href="mailto:privacidade@carraco.app">privacidade@carraco.app</a></p>
    </section>
  </div>
);

export default Cookies;
