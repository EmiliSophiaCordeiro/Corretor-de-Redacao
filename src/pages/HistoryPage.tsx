import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Calendar, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Seo from "@/components/Seo";
import EmptyState from "@/components/EmptyState";
import { CardsSkeleton } from "@/components/LoadingState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Item {
  id: string;
  theme: string;
  essay_text: string;
  mode_name: string;
  created_at: string;
  result_json: any;
}

const HistoryPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("correction_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) setLoadError(true);
    setItems((data as Item[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const id = pendingDelete.id;
    const { error } = await supabase.from("correction_history").delete().eq("id", id);
    setDeleting(false);
    if (error) {
      toast.error("Não foi possível excluir esta redação. Tente novamente.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
    setPendingDelete(null);
    toast.success("Redação removida do seu histórico.");
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <Seo title='Histórico de Redações | Carraco' description='Reveja todas as suas redações corrigidas, notas por competência e evolução ao longo do tempo.' path="/history" />
      <h1 className="text-2xl font-display font-bold mb-1">Histórico</h1>
      <p className="text-sm text-muted-foreground mb-6">Todas as redações que você enviou.</p>

      {loading ? (
        <CardsSkeleton count={4} />
      ) : loadError ? (
        <EmptyState
          icon={FileText}
          title="Não conseguimos carregar seu histórico"
          description="Verifique sua conexão e tente novamente em alguns segundos."
          actionLabel="Tentar de novo"
          onAction={load}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma redação por aqui ainda"
          description="Quando você enviar sua primeira redação, ela aparece aqui com nota, competências e comentários."
          actionLabel="Escrever agora"
          actionTo="/studio"
        />
      ) : (
        <ul className="grid md:grid-cols-2 gap-3 list-none p-0">
          {items.map((item) => {
            const score = item.result_json?.total_score ?? 0;
            return (
              <li key={item.id} className="relative group">
                <button
                  onClick={() => setSelected(item)}
                  aria-label={`Abrir redação sobre ${item.theme}, nota ${score}`}
                  className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground">
                      {item.mode_name}
                    </span>
                    <span className={`font-display text-2xl font-bold ${
                      score >= 800 ? "score-high" : score >= 500 ? "score-mid" : "score-low"
                    }`}>
                      {score}
                    </span>
                  </div>
                  <h2 className="font-medium text-sm line-clamp-2 mb-2">{item.theme}</h2>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </button>
                <button
                  onClick={() => setPendingDelete(item)}
                  aria-label={`Excluir redação sobre ${item.theme}`}
                  className="absolute bottom-3 right-3 rounded-md p-2 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 hover:text-destructive transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-left">{selected?.theme}</DialogTitle>
            <DialogDescription className="text-left">
              {selected?.mode_name} · {selected && new Date(selected.created_at).toLocaleString("pt-BR")}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="correcao">
            <TabsList className="w-full">
              <TabsTrigger value="correcao" className="flex-1">Correção</TabsTrigger>
              <TabsTrigger value="redacao" className="flex-1">Redação</TabsTrigger>
            </TabsList>

            <TabsContent value="correcao" className="mt-4">
              {selected?.result_json && typeof selected.result_json.total_score === "number" ? (
                <GradingResults result={selected.result_json as GradingResult} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Esta correção foi salva antes da nova análise detalhada, então só o texto está disponível.
                </p>
              )}
            </TabsContent>

            <TabsContent value="redacao" className="mt-4">
              <pre className="whitespace-pre-wrap font-mono-score text-sm leading-relaxed bg-muted/40 rounded-lg p-4">
                {selected?.essay_text}
              </pre>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>


      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta redação?</AlertDialogTitle>
            <AlertDialogDescription>
              A redação e a correção serão apagadas definitivamente do seu histórico. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> Excluindo…</> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HistoryPage;
