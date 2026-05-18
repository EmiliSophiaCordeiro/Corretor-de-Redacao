import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  const [selected, setSelected] = useState<Item | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("correction_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as Item[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleDelete = async (id: string) => {
    await supabase.from("correction_history").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Redação removida");
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-display font-bold mb-1">Histórico</h1>
      <p className="text-sm text-muted-foreground mb-6">Todas as redações que você enviou.</p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Você ainda não enviou nenhuma redação.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((item) => {
            const score = item.result_json?.total_score ?? 0;
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-card transition-all group"
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
                <h3 className="font-medium text-sm line-clamp-2 mb-2">{item.theme}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[80vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display font-bold text-lg mb-2">{selected.theme}</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {selected.mode_name} · {new Date(selected.created_at).toLocaleString("pt-BR")}
            </p>
            <pre className="whitespace-pre-wrap font-mono-score text-sm leading-relaxed bg-muted/40 rounded-lg p-4">
              {selected.essay_text}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
