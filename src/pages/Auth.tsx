import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import CarracoLogo from "@/components/CarracoLogo";
import Mascot from "@/components/Mascot";
import { toast } from "sonner";
import Seo from "@/components/Seo";

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, signUp } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!isLogin && displayName.trim().length < 2) next.displayName = "Informe seu nome (mínimo 2 caracteres).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = "Digite um email válido, como nome@email.com.";
    if (password.length < 6) next.password = "A senha precisa ter pelo menos 6 caracteres.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const friendlyError = (message: string) => {
    if (message === "Invalid login credentials") return "Email ou senha incorretos.";
    if (message.includes("Email not confirmed")) return "Confirme seu email antes de entrar. Verifique sua caixa de entrada.";
    if (message.includes("already registered")) return "Já existe uma conta com este email. Tente entrar.";
    if (message.toLowerCase().includes("rate limit")) return "Muitas tentativas seguidas. Aguarde alguns instantes e tente de novo.";
    return "Não conseguimos concluir agora. Tente novamente em instantes.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) toast.error(friendlyError(error.message));
        else toast.success("Bem-vindo de volta!");
      } else {
        const { error } = await signUp(email.trim(), password, displayName.trim());
        if (error) {
          toast.error(friendlyError(error.message));
        } else {
          toast.success("Conta criada! Verifique seu email para confirmar.");
        }
      }
    } catch {
      toast.error("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full bg-transparent border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      hasError ? "border-destructive" : "border-border"
    }`;

  return (
    <main className="min-h-dvh gradient-hero flex items-center justify-center px-4 py-8">

      <Seo title='Entrar ou Criar Conta | Carraco' description='Acesse sua conta Carraco para escrever redações, corrigir com IA e evoluir no ranking.' path="/auth" />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="animate-float mb-3"><Mascot size={100} mood="wink" /></div>
          <CarracoLogo size={42} />
          <h1 className="font-mono-score text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-3">
            {isLogin ? "Entrar na sua conta" : "Crie sua conta gratuita"}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="rounded-3xl glass p-6 space-y-4 shadow-card">
          {!isLogin && (
            <div>
              <label htmlFor="auth-name" className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">
                Nome
              </label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                aria-invalid={!!errors.displayName}
                aria-describedby={errors.displayName ? "auth-name-error" : undefined}
                className={fieldClass(!!errors.displayName)}
              />
              {errors.displayName && <p id="auth-name-error" role="alert" className="mt-1 text-xs text-destructive">{errors.displayName}</p>}
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "auth-email-error" : undefined}
              className={fieldClass(!!errors.email)}
            />
            {errors.email && <p id="auth-email-error" role="alert" className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="auth-password" className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "auth-password-error" : "auth-password-hint"}
                className={`${fieldClass(!!errors.password)} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {errors.password ? (
              <p id="auth-password-error" role="alert" className="mt-1 text-xs text-destructive">{errors.password}</p>
            ) : (
              !isLogin && <p id="auth-password-hint" className="mt-1 text-xs text-muted-foreground">Use pelo menos 6 caracteres.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full rounded-full gradient-primary px-6 py-2.5 font-mono-score text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {isLogin ? "Entrando…" : "Criando conta…"}
              </span>
            ) : isLogin ? (
              "Entrar"
            ) : (
              "Criar Conta"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
            className="text-primary hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isLogin ? "Criar conta" : "Fazer login"}
          </button>
        </p>
        {!isLogin && (
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            Ao criar uma conta você aceita nossos{" "}
            <a href="/terms" className="underline">Termos</a> e{" "}
            <a href="/privacy" className="underline">Política de Privacidade</a>.
          </p>
        )}
      </div>
    </main>

  );
};

export default Auth;
