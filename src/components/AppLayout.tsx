import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import { useMyAvatar } from "@/hooks/useMyAvatar";
import { Link } from "react-router-dom";
import { useAchievementNotifier } from "@/hooks/useAchievementNotifier";
import OnboardingTour from "./OnboardingTour";
import FeedbackButton from "./FeedbackButton";
import { Flame, Zap, Coins } from "lucide-react";

const Stat = ({ icon: Icon, value, label, color }: { icon: any; value: number | string; label: string; color: string }) => (
  <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5">
    <Icon className={`h-4 w-4 ${color}`} />
    <span className="font-display font-bold text-sm">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:inline">{label}</span>
  </div>
);

const AppLayout = () => {
  const { user, loading } = useAuth();
  const { stats } = useUserStats();
  const avatarUrl = useMyAvatar();
  useAchievementNotifier();


  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-background" role="status" aria-live="polite">
        <div className="h-3 w-3 rounded-full bg-primary animate-pulse" aria-hidden="true" />
        <p className="font-mono-score text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Carregando sua conta…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-dvh flex w-full bg-background">
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Pular para o conteúdo
        </a>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-3 sm:px-4">
            <SidebarTrigger aria-label="Abrir ou fechar menu de navegação" />
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
              {stats && (
                <>
                  <Stat icon={Flame} value={stats.current_streak} label="streak" color="text-orange-500" />
                  <Stat icon={Zap} value={`Lv ${stats.level}`} label="nível" color="text-primary" />
                  <Stat icon={Coins} value={stats.points} label="pontos" color="text-accent" />
                </>
              )}
            </div>
          </header>
          <main id="conteudo-principal" tabIndex={-1} className="flex-1 overflow-auto focus:outline-none">
            <Outlet />
          </main>
          <OnboardingTour />
          <FeedbackButton />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
