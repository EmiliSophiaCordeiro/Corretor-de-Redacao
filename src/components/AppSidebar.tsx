import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  PenLine,
  History,
  Users,
  User,
  Trophy,
  Target,
  Sparkles,
  ShoppingBag,
  Crown,
  Settings,
  LogOut,
  Moon,
  Sun,
  LifeBuoy,
} from "lucide-react";
import CarracoLogo from "./CarracoLogo";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const main = [
  { title: "Início", url: "/", icon: Home },
  { title: "Estúdio", url: "/studio", icon: PenLine },
  { title: "Histórico", url: "/history", icon: History },
];

const progress = [
  { title: "Desafios diários", url: "/challenges", icon: Target },
  { title: "Conquistas", url: "/achievements", icon: Sparkles },
  { title: "Ranking", url: "/leaderboard", icon: Trophy },
];

const social = [
  { title: "Comunidade", url: "/community", icon: Users },
  { title: "Mascote", url: "/shop", icon: ShoppingBag },
  { title: "Planos", url: "/pricing", icon: Crown },
];

const account = [
  { title: "Perfil", url: "/profile", icon: User },
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Ajuda", url: "/help", icon: LifeBuoy },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const isActive = (path: string) => pathname === path;

  const renderGroup = (label: string, items: typeof main) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="font-mono-score text-[10px] uppercase tracking-widest text-sidebar-foreground/75">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink
                  to={item.url}
                  end
                  className={`flex items-center gap-3 rounded-lg transition-all ${
                    isActive(item.url) ? "active-nav gradient-primary font-semibold glow" : ""
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <CarracoLogo withText={!collapsed} size={collapsed ? 32 : 36} />
      </SidebarHeader>

      <SidebarContent className="px-2" role="navigation" aria-label="Navegação principal">
        {renderGroup("Principal", main)}
        {renderGroup("Progresso", progress)}
        {renderGroup("Social", social)}
        {renderGroup("Conta", account)}
      </SidebarContent>

      <SidebarFooter className="p-3 gap-2">
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          {!collapsed && <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              aria-label="Sair da conta"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {!collapsed && <span>Sair</span>}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sair da sua conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Você precisará entrar novamente para continuar escrevendo. Rascunhos não enviados podem ser perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar escrevendo</AlertDialogCancel>
              <AlertDialogAction onClick={() => signOut()}>Sair</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
