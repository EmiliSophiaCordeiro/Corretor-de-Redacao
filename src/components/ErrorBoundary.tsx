import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

/** Tela de erro amigável para falhas inesperadas de renderização. */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md w-full text-center rounded-3xl border border-border bg-card p-8">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="font-display text-xl font-bold mb-2">Algo deu errado por aqui</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Tivemos um problema inesperado ao carregar esta tela. Seus dados estão salvos — tente recarregar.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2 font-mono-score text-[11px] font-semibold uppercase tracking-widest text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Recarregar
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 font-mono-score text-[11px] font-semibold uppercase tracking-widest text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" /> Início
            </a>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
