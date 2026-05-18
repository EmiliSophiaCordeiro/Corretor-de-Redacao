import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

const Settings = () => {
  const { theme, toggle } = useTheme();
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-display font-bold mb-1">Configurações</h1>
      <p className="text-sm text-muted-foreground mb-6">Preferências da plataforma.</p>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium text-sm">Aparência</p>
            <p className="text-xs text-muted-foreground">Tema {theme === "dark" ? "escuro" : "claro"}</p>
          </div>
          <button
            onClick={toggle}
            className="rounded-full glass p-2.5 hover:bg-muted transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
