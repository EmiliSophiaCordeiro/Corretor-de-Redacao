import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

/** Skeleton de lista/cards, usado enquanto dados carregam. */
export const CardsSkeleton = ({ count = 4, className = "grid md:grid-cols-2 gap-3" }: { count?: number; className?: string }) => (
  <div className={className} role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Carregando conteúdo…</span>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-12" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
);

/** Tela de carregamento centralizada. */
export const PageLoader = ({ label = "Carregando…" }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3" role="status" aria-live="polite">
    <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
    <p className="font-mono-score text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
  </div>
);

export default PageLoader;
