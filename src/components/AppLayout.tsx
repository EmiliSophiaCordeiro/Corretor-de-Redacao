import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              {stats && (
                <>
                  <Stat icon={Flame} value={stats.current_streak} label="streak" color="text-orange-500" />
                  <Stat icon={Zap} value={`Lv ${stats.level}`} label="nível" color="text-primary" />
                  <Stat icon={Coins} value={stats.points} label="pontos" color="text-accent" />
                </>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
