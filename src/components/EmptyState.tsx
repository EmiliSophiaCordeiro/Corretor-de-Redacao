import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

/** Estado vazio elegante e consistente em toda a aplicação. */
export const EmptyState = ({ icon: Icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) => (
  <div className="text-center py-14 px-6 rounded-2xl border border-dashed border-border bg-card/40 animate-fade-in">
    <div className="mx-auto mb-4 h-14 w-14 rounded-2xl gradient-primary/10 flex items-center justify-center bg-muted">
      <Icon className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
    </div>
    <h2 className="font-display font-semibold text-base mb-1">{title}</h2>
    {description && <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>}
    {actionLabel && actionTo && (
      <Link
        to={actionTo}
        className="mt-5 inline-block rounded-full gradient-primary px-5 py-2 font-mono-score text-[11px] font-semibold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {actionLabel}
      </Link>
    )}
    {actionLabel && !actionTo && onAction && (
      <button
        onClick={onAction}
        className="mt-5 inline-block rounded-full gradient-primary px-5 py-2 font-mono-score text-[11px] font-semibold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
